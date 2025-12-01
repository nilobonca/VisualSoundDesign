import React, { useState, useEffect } from 'react';
import { Reorder, motion, useDragControls } from 'framer-motion';
import { Layers, Plus, FolderPlus, X, GripHorizontal, Minus, Box } from 'lucide-react';
import { useIDB } from '@/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import { Layer } from '@/interfaces/utils/indexedDB';
import { LayerItem } from './LayerItem';
import ContextMenu from '@/components/ContextMenu';

interface LayerManagerProps {
    onLayerAction?: (layer: Layer) => void;
    onInteraction?: () => void;
    isDocked?: boolean;
    onDock?: () => void;
    onClose?: () => void;
    activeProjectId: string | null; // This is the Active PAGE ID
    onSelectProject: (id: string | null) => void; // Select Page
    projectGroupId: string | null; // The Project (File) ID
    addToHistory?: (description: string) => void;
    onExport?: () => void;
    onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function LayerManager({ onLayerAction, onInteraction, isDocked = false, onDock, onClose, activeProjectId, onSelectProject, projectGroupId, addToHistory, onExport, onImport }: LayerManagerProps) {
    const { activeLayers, reorderLayers, addLayer, deleteLayer, updateLayer } = useIDB();
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layer: Layer; options?: Array<{ label: string; icon: string; onClick?: () => void; subMenu?: Array<{ label: string; icon: string; onClick: () => void }> }> } | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dragControls = useDragControls();

    // Local state for drag performance
    const [items, setItems] = useState<Layer[]>(activeLayers);
    const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // Helper to sort layers hierarchically
    const sortLayersHierarchically = (layers: Layer[]): Layer[] => {
        // Filter layers:
        // 1. If it's a Page Root (isProject=true):
        //    - Must match projectGroupId (if set).
        //    - Or if projectGroupId is not set (legacy), show all? Or just legacy ones?
        //    - Let's show only those belonging to the current Project Group.
        // 2. If it's a child:
        //    - Must belong to a visible Page Root.

        const relevantLayers = layers.filter(l => {
            if (l.isProject) {
                if (projectGroupId) {
                    // Match if it belongs to the project group
                    if (l.projectId === projectGroupId) return true;
                    // Match if it IS the project/page itself (Legacy or Direct Link)
                    if (l.id === projectGroupId) return true;
                    return false;
                }
                // Legacy mode: Show all projects if no group ID
                return true;
            }
            // Children will be filtered by parent existence in the map build below
            return true;
        });

        const layerMap = new Map<string, Layer>();
        const childrenMap = new Map<string, Layer[]>();
        const roots: Layer[] = [];

        // 1. Build maps
        relevantLayers.forEach(layer => {
            layerMap.set(layer.id, layer);
            if (layer.parentId) {
                if (!childrenMap.has(layer.parentId)) {
                    childrenMap.set(layer.parentId, []);
                }
                childrenMap.get(layer.parentId)!.push(layer);
            } else {
                roots.push(layer);
            }
        });

        // 2. Recursive build
        const result: Layer[] = [];
        const processLayer = (layer: Layer) => {
            result.push(layer);
            const children = childrenMap.get(layer.id);
            if (children) {
                children.forEach(child => processLayer(child));
            }
        };

        roots.forEach(root => processLayer(root));
        return result;
    };

    useEffect(() => {
        setItems(sortLayersHierarchically(activeLayers));
    }, [activeLayers, projectGroupId]);

    // Helper to check if a layer should be visible in the list (based on parent expansion)
    const isLayerVisibleInList = (layer: Layer, allLayers: Layer[]) => {
        // Always show roots (Projects or orphaned items)
        if (!layer.parentId) return true;

        // Find parent
        const parent = allLayers.find(l => l.id === layer.parentId);
        if (!parent) return false; // Orphaned child

        // If parent is collapsed, hide child
        if (!parent.expanded) return false;

        // Recursively check if parent is visible
        return isLayerVisibleInList(parent, allLayers);
    };

    const visibleItems = items.filter(l => isLayerVisibleInList(l, items));

    const handleReorder = (newVisibleOrder: Layer[]) => {
        // We need to merge the new order of visible items with the existing non-visible items
        // while trying to maintain the relative order as much as possible.
        // For this MVP, we'll append non-visible items to the end, which might reorder them globally
        // but preserves the local reordering of visible items.

        const visibleIds = new Set(newVisibleOrder.map(l => l.id));
        const nonVisibleItems = items.filter(l => !visibleIds.has(l.id));

        const newFullList = [...nonVisibleItems, ...newVisibleOrder];
        setItems(newFullList);
        reorderLayers(newFullList);
    };

    const indentLayer = (id: string) => {
        const index = items.findIndex(l => l.id === id);
        if (index <= 0) return; // Can't indent first item

        const layer = items[index];
        const prevLayer = items[index - 1];

        // Can only indent if previous layer is a group
        if (prevLayer.type !== 'group') return;

        // If they are siblings (or if visual order allows), make layer a child of prevLayer
        const newParentId = prevLayer.id;
        const newDepth = (prevLayer.depth || 0) + 1;

        updateLayer({ ...layer, parentId: newParentId, depth: newDepth });
    };

    const outdentLayer = (id: string) => {
        const layer = items.find(l => l.id === id);
        if (!layer || !layer.parentId) return; // Can't outdent if no parent

        // Find current parent
        const parent = items.find(l => l.id === layer.parentId);
        if (parent) {
            // New parent is the parent's parent
            const newParentId = parent.parentId;
            const newDepth = (parent.depth || 0); // Same depth as current parent

            updateLayer({ ...layer, parentId: newParentId, depth: newDepth });
        }
    };

    const handleCreatePage = () => {
        const newPage: Layer = {
            id: crypto.randomUUID(),
            type: 'group',
            name: 'Nova Página',
            visible: true,
            locked: false,
            expanded: true,
            parentId: null,
            depth: 0,
            isProject: true,
            projectId: projectGroupId || undefined
        };
        addLayer(newPage);
    };

    const handleCreateLayer = () => {
        if (!activeProjectId) return;

        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'group',
            name: 'Nova Pasta',
            visible: true,
            locked: false,
            expanded: true,
            parentId: activeProjectId,
            depth: 1 // Inside project
        };
        addLayer(newLayer);
    };

    const handleContextMenu = (e: React.MouseEvent, layer: Layer) => {
        e.preventDefault();

        // Check if we can delete this layer
        let canDelete = true;
        if (layer.isProject) {
            // Count pages in this project group
            const pages = activeLayers.filter(l => l.isProject && l.projectId === projectGroupId);
            if (pages.length <= 1) {
                canDelete = false;
            }
        }

        const baseOptions = [
            {
                label: 'Renomear',
                icon: '✏️',
                onClick: () => {
                    const newName = window.prompt('Novo nome:', layer.name);
                    if (newName) updateLayer({ ...layer, name: newName });
                    setContextMenu(null);
                }
            },
            {
                label: 'Deletar',
                icon: '🗑️',
                disabled: !canDelete,
                onClick: () => {
                    if (window.confirm(`Tem certeza que deseja deletar "${layer.name}"?`)) {
                        if (addToHistory) addToHistory(`Excluir ${layer.name}`);
                        deleteLayer(layer.id);
                    }
                    setContextMenu(null);
                }
            },
            {
                label: 'Mover para dentro',
                icon: '➡️',
                onClick: () => {
                    indentLayer(layer.id);
                    setContextMenu(null);
                }
            },
            {
                label: 'Mover para fora',
                icon: '⬅️',
                onClick: () => {
                    outdentLayer(layer.id);
                    setContextMenu(null);
                }
            },
            {
                label: 'Duplicar',
                icon: '📄',
                onClick: () => {
                    console.log('Duplicar', layer);
                    setContextMenu(null);
                }
            }
        ];

        const specificOptions: { label: string; icon: string; onClick: () => void }[] = [];

        // Specific options for Projects
        if (layer.isProject) {
            specificOptions.push({
                label: 'Abrir Página',
                icon: '📂',
                onClick: () => {
                    onSelectProject(layer.id);
                    setContextMenu(null);
                }
            });
        }

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            layer,
            options: [...specificOptions, ...baseOptions]
        });
    };

    const { size, setSize, position, onDragEnd, isDesktop } = useViewportResize({
        initialSize: { width: 300, height: 400 },
        initialPosition: { x: 20, y: 80 },
        minWidth: 260,
        minHeight: 200
    });

    const [isResizing, setIsResizing] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        // Get actual position from ref
        const rect = menuRef.current?.getBoundingClientRect();
        const startLeft = rect?.left || position.x;
        const startTop = rect?.top || position.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(260, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));

            const maxWidth = window.innerWidth - startLeft - 30;
            const maxHeight = window.innerHeight - startTop - 30;

            setSize({
                width: Math.min(newWidth, maxWidth),
                height: Math.min(newHeight, maxHeight)
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const [constraints, setConstraints] = useState({ left: 0, top: 0, right: Number.MAX_SAFE_INTEGER, bottom: Number.MAX_SAFE_INTEGER });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateConstraints = () => {
            const rightLimit = window.innerWidth - size.width;
            const bottomLimit = window.innerHeight - size.height;

            setConstraints({
                left: 0,
                top: 0,
                right: rightLimit,
                bottom: bottomLimit
            });
        };

        updateConstraints();
        window.addEventListener('resize', updateConstraints);
        return () => window.removeEventListener('resize', updateConstraints);
    }, [size]);

    const handleNestLayer = (draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;

        const draggedLayer = items.find(l => l.id === draggedId);
        const targetLayer = items.find(l => l.id === targetId);

        if (!draggedLayer || !targetLayer) return;

        // Only nest into groups or projects
        if (targetLayer.type !== 'group' && !targetLayer.isProject) return;

        // Update parentId and depth
        const newDepth = (targetLayer.depth || 0) + 1;
        updateLayer({ ...draggedLayer, parentId: targetLayer.id, depth: newDepth });

        // Expand target
        if (!targetLayer.expanded) {
            updateLayer({ ...targetLayer, expanded: true });
        }
    };

    const renderContent = () => (
        <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0 p-1">
                <div className="mt-3 mb-4 grid grid-cols-2 gap-2">
                    <button
                        onClick={handleCreatePage}
                        className="py-2 flex items-center justify-center gap-2 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded text-sm text-gray-600 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors"
                        title="Nova Página"
                    >
                        <Box size={14} />
                        <span className="truncate">Página</span>
                    </button>
                    <button
                        onClick={handleCreateLayer}
                        disabled={!activeProjectId}
                        className={`py-2 flex items-center justify-center gap-2 border rounded text-sm transition-colors ${activeProjectId
                            ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        title={activeProjectId ? "Nova Pasta" : "Selecione um projeto"}
                    >
                        <Plus size={14} />
                        <span className="truncate">Pasta</span>
                    </button>
                </div>
                <div className="bg-gray-100 dark:bg-neutral-800 w-full rounded flex flex-col min-h-[150px] p-1">
                    <Reorder.Group values={visibleItems} onReorder={handleReorder} className="space-y-1" layoutScroll>
                        {visibleItems.map((layer) => (
                            <LayerItem
                                key={layer.id}
                                layer={layer}
                                isSelected={selectedLayerId === layer.id}
                                isActiveProject={layer.id === activeProjectId}
                                onSelect={(id) => {
                                    setSelectedLayerId(id);
                                    // Removed auto-activation on select to prevent unwanted page switching
                                }}
                                onDoubleClick={(l) => {
                                    if (l.isProject) {
                                        onSelectProject(l.id);
                                    } else if (l.type === 'group') {
                                        updateLayer({ ...l, expanded: !l.expanded });
                                    }
                                }}
                                onToggleVisibility={(id) => {
                                    const l = items.find(i => i.id === id);
                                    if (l) updateLayer({ ...l, visible: !l.visible });
                                }}
                                onToggleLock={(id) => {
                                    const l = items.find(i => i.id === id);
                                    if (l) updateLayer({ ...l, locked: !l.locked });
                                }}
                                onToggleExpand={(id) => {
                                    const l = items.find(i => i.id === id);
                                    if (l) updateLayer({ ...l, expanded: !l.expanded });
                                }}
                                onContextMenu={handleContextMenu}
                                onIndent={indentLayer}
                                onOutdent={outdentLayer}
                                onAction={(l) => onLayerAction && onLayerAction(l)}
                                draggingLayerId={draggingLayerId}
                                dropTargetId={dropTargetId}
                                setDraggingLayerId={setDraggingLayerId}
                                setDropTargetId={setDropTargetId}

                                onNestLayer={handleNestLayer}
                                onActivate={onSelectProject}
                            />
                        ))}
                    </Reorder.Group>

                    {visibleItems.length === 0 && (
                        <p className="text-center text-gray-400 dark:text-neutral-500 py-4 text-sm">
                            Nenhum item
                        </p>
                    )}


                </div>
            </div>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    options={(contextMenu.options || []).map(opt => ({
                        ...opt,
                        onClick: opt.onClick || (() => { })
                    }))}
                />
            )}
        </div>
    );

    if (isDocked) {
        return renderContent();
    }

    return (
        <motion.div
            ref={menuRef}
            layout={false}
            initial={{ ...position }}
            style={{
                width: isCollapsed ? 'auto' : size.width,
                height: isCollapsed ? 'auto' : size.height,
                maxHeight: isCollapsed ? 'auto' : '80vh',
                x: position.x,
                y: position.y,
                zIndex: 50
            }}
            className={`absolute flex flex-col bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-sm drop-shadow-xl overflow-hidden pointer-events-auto ${isCollapsed ? 'p-2' : 'p-5'}`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDownCapture={onInteraction}
        >
            {/* Collapsed View */}
            <div
                className={`${isCollapsed ? 'flex' : 'hidden'} cursor-move items-center justify-center`}
                onPointerDown={(e) => dragControls.start(e)}
                title="Gerenciador de Projetos"
            >
                <button onClick={() => setIsCollapsed(false)} className="text-gray-700 hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-400">
                    <Layers size={24} />
                </button>
            </div>

            {/* Expanded View */}
            <div className={`flex flex-col h-full ${isCollapsed ? 'hidden' : 'block'}`}>
                <div
                    className="w-full flex justify-between items-center mb-1 relative flex-shrink-0 touch-none"
                >
                    <span className="font-semibold text-gray-700 dark:text-neutral-200">
                        Estrutura
                    </span>
                    <div className="flex items-center gap-1">
                        {onExport && (
                            <button
                                onClick={onExport}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
                                title="Exportar"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <span className="text-xs">💾</span>
                            </button>
                        )}
                        {onImport && (
                            <label
                                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-green-600 dark:text-neutral-400 dark:hover:text-green-400 cursor-pointer"
                                title="Importar"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <span className="text-xs">📂</span>
                                <input
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={onImport}
                                    className="hidden"
                                />
                            </label>
                        )
                        }
                        <div className="flex items-center gap-2">
                            {onDock && (
                                <button
                                    onClick={onDock}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-neutral-200"
                                    title="Acoplar"
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 14h6v6" />
                                        <path d="M20 10V4h-6" />
                                        <path d="M14 10l7-7" />
                                        <path d="M3 21l7-7" />
                                    </svg>
                                </button>
                            )}
                            <GripHorizontal className="text-gray-400" />
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    title="Fechar"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-neutral-200"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <Minus size={16} />
                            </button>
                        </div>
                    </div >
                </div >

                <div onPointerDown={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto min-h-0">
                    {renderContent()}
                </div>

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 p-1 cursor-nwse-resize hover:bg-neutral-800 rounded-tl z-50 hidden md:block"
                    onMouseDown={handleResizeStart}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                        <path d="M21 15v6" />
                        <path d="M15 21h6" />
                        <path d="M21 3v6" opacity="0" /> {/* Spacer */}
                    </svg>
                </div>
            </div >
        </motion.div >
    );
}
