import React, { useState, useEffect, useCallback } from 'react';
import { Reorder, motion, useDragControls } from 'framer-motion';
import { Plus, X, GripHorizontal, Box, Edit2, Trash2, ArrowRight, ArrowLeft, Copy, FolderOpen, Eraser, Download, Upload } from 'lucide-react';
import { useIDB } from '@/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import { Layer } from '@/interfaces/utils/indexedDB';
import { LayerItem } from './LayerItem';
import ContextMenu from '@/components/ContextMenu';

interface LayerManagerProps {
    onLayerAction?: (layer: Layer) => void;
    onInteraction?: () => void;
    onClose?: () => void;
    activeProjectId: string | null;
    onSelectProject: (id: string | null) => void;
    projectGroupId: string | null;
    addToHistory?: (description: string) => void;
    onExport?: () => void;
    onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearCanvas?: (e: React.MouseEvent, pageId?: string) => void;
}

export default function LayerManager({ onLayerAction, onInteraction, onClose, activeProjectId, onSelectProject, projectGroupId, addToHistory, onExport, onImport, onClearCanvas }: LayerManagerProps) {
    const { activeLayers, reorderLayers, addLayer, deleteLayer, updateLayer } = useIDB();
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layer: Layer; options?: Array<{ label: string; icon: string; onClick?: () => void; subMenu?: Array<{ label: string; icon: string; onClick: () => void }> }> } | null>(null);
    const dragControls = useDragControls();

    // Local state for drag performance
    const [items, setItems] = useState<Layer[]>(activeLayers);
    const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // Helper to sort layers hierarchically
    const sortLayersHierarchically = useCallback((layers: Layer[]): Layer[] => {
        const relevantLayers = layers.filter(l => {
            if (l.isProjectMetadata) return false;
            if (l.isProject) {
                if (projectGroupId) {
                    if (l.projectId === projectGroupId) return true;
                    if (l.id === projectGroupId) return true;
                    return false;
                }
                return true;
            }
            return true;
        });

        const layerMap = new Map<string, Layer>();
        const childrenMap = new Map<string, Layer[]>();
        const roots: Layer[] = [];

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
    }, [projectGroupId]);

    useEffect(() => {
        setItems(sortLayersHierarchically(activeLayers));
    }, [activeLayers, sortLayersHierarchically]);

    const isLayerVisibleInList = (layer: Layer, allLayers: Layer[]): boolean => {
        let currentId = layer.parentId;
        const visited = new Set<string>();
        visited.add(layer.id);

        while (currentId) {
            if (visited.has(currentId)) {
                console.warn('Cycle detected in layer hierarchy:', currentId);
                return false;
            }
            visited.add(currentId);

            const parent = allLayers.find(l => l.id === currentId);
            if (!parent) return false;
            if (!parent.expanded) return false;
            currentId = parent.parentId;
        }
        return true;
    };

    const visibleItems = items.filter(l => isLayerVisibleInList(l, items));

    const handleReorder = (newVisibleOrder: Layer[]) => {
        const visibleIds = new Set(newVisibleOrder.map(l => l.id));
        const nonVisibleItems = items.filter(l => !visibleIds.has(l.id));

        // Use a loop to build the new order sequentially
        const inferredOrder: Layer[] = [];
        let previousUpdatedItem: Layer | null = null;

        for (let i = 0; i < newVisibleOrder.length; i++) {
            const currentItem = newVisibleOrder[i];

            if (i === 0) {
                // First item keeps its state (or stays at top)
                // If it was nested, it stays nested under whatever parent unless it moved to root?
                // For simplicity in this specific "drag to reorder" context, let's assume 
                // if it moved to top of list, it might become root or stay in parent if parent is above (but parent is not in visible list if we are inside it?)
                // Actually, Reorder.Group contains ALL visible items.
                // If it's the very first item, it likely has no parent in this view context OR it is the first child.
                // We keep it as is, but we need to track it for the next one.
                inferredOrder.push(currentItem);
                previousUpdatedItem = currentItem;
                continue;
            }

            // Use previousUpdatedItem instead of newVisibleOrder[index-1]
            // This ensures we are using the STATE we just calculated for the neighbor
            const prevItem: Layer = previousUpdatedItem!;

            // Logic:
            // 1. If prevItem is an OPEN GROUP/PROJECT -> Nest inside (First Child)
            // 2. Otherwise -> Become Sibling of prevItem

            let newParentId = currentItem.parentId;
            let newDepth = currentItem.depth;

            // Cycle Check Helper
            const isDescendant = (potentialParentId: string, targetId: string): boolean => {
                if (potentialParentId === targetId) return true;
                const parent = items.find(l => l.id === potentialParentId);
                if (parent && parent.parentId) {
                    return isDescendant(parent.parentId, targetId);
                }
                return false;
            };

            if ((prevItem.type === 'group' || prevItem.isProject) && prevItem.expanded) {
                // Nesting behavior
                // Check if prevItem is a descendant of layer
                if (!isDescendant(prevItem.id, currentItem.id)) {
                    newParentId = prevItem.id;
                    newDepth = (prevItem.depth || 0) + 1;
                }
            } else {
                // Sibling behavior
                // Check if prevItem.parentId is a descendant of layer
                if (prevItem.parentId && !isDescendant(prevItem.parentId, currentItem.id)) {
                    newParentId = prevItem.parentId;
                    newDepth = prevItem.depth;
                } else if (!prevItem.parentId) {
                    newParentId = null;
                    newDepth = prevItem.depth;
                }
            }

            // Always update to potentially new state
            // Optimization: Only if changed technically needed, but for "inferredOrder" list we need the new object
            const updated: Layer = { ...currentItem, parentId: newParentId, depth: newDepth };

            // Only fire async update if something actually changed
            if (newParentId !== currentItem.parentId || newDepth !== currentItem.depth) {
                updateLayer(updated);
            }

            inferredOrder.push(updated);
            previousUpdatedItem = updated;
        }

        const newFullList = [...nonVisibleItems, ...inferredOrder];
        setItems(newFullList);
        reorderLayers(newFullList);
    };

    const indentLayer = (id: string) => {
        const index = items.findIndex(l => l.id === id);
        if (index <= 0) return;
        const layer = items[index];
        const prevLayer = items[index - 1];
        if (prevLayer.type !== 'group') return;
        const newParentId = prevLayer.id;
        const newDepth = (prevLayer.depth || 0) + 1;
        updateLayer({ ...layer, parentId: newParentId, depth: newDepth });
    };

    const outdentLayer = (id: string) => {
        const layer = items.find(l => l.id === id);
        if (!layer || !layer.parentId) return;

        // Find parent in activeLayers (in case items is partial, though items should contain it)
        const parent = activeLayers.find(l => l.id === layer.parentId);
        if (parent) {
            // If parent is a Project/Page, we cannot outdent further (it would become an orphaned root)
            if (parent.isProject) return;

            const newParentId = parent.parentId;
            const newDepth = (parent.depth || 0);
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
        console.log('Criar Pasta check:', { activeProjectId, projectGroupId });
        if (!activeProjectId) return;

        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'group',
            name: 'Nova Pasta',
            visible: true,
            locked: false,
            expanded: true,
            parentId: activeProjectId,
            depth: 1,
            projectId: projectGroupId || undefined // Add projectId for consistency
        };
        console.log('Adicionando nova pasta:', newLayer);
        addLayer(newLayer);
    };

    const handleContextMenu = (e: React.MouseEvent, layer: Layer) => {
        e.preventDefault();
        let canDelete = true;
        if (layer.isProject) {
            const pages = activeLayers.filter(l => l.isProject && l.projectId === projectGroupId);
            if (pages.length <= 1) canDelete = false;
        }

        const baseOptions = [
            {
                label: 'Renomear',
                icon: <Edit2 size={16} />,
                onClick: () => {
                    const newName = window.prompt('Novo nome:', layer.name);
                    if (newName) updateLayer({ ...layer, name: newName });
                    setContextMenu(null);
                }
            },
            {
                label: 'Mover para dentro',
                icon: <ArrowRight size={16} />,
                onClick: () => {
                    indentLayer(layer.id);
                    setContextMenu(null);
                }
            },
            {
                label: 'Mover para fora',
                icon: <ArrowLeft size={16} />,
                onClick: () => {
                    outdentLayer(layer.id);
                    setContextMenu(null);
                }
            },
            {
                label: 'Duplicar',
                icon: <Copy size={16} />,
                onClick: () => {
                    console.log('Duplicar', layer);
                    setContextMenu(null);
                }
            },
            {
                label: 'Deletar',
                icon: <Trash2 size={16} />,
                disabled: !canDelete,
                onClick: () => {
                    if (window.confirm(`Tem certeza que deseja deletar "${layer.name}"?`)) {
                        if (addToHistory) addToHistory(`Excluir ${layer.name}`);
                        deleteLayer(layer.id);
                    }
                    setContextMenu(null);
                }
            }
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const specificOptions: any[] = [];
        if (layer.isProject) {
            specificOptions.push({
                label: 'Abrir Página',
                icon: <FolderOpen size={16} />,
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: [...specificOptions, ...baseOptions] as any
        });
    };

    const { size, position } = useViewportResize({
        initialSize: { width: 300, height: 400 },
        initialPosition: { x: 20, y: 80 },
        minWidth: 260,
        minHeight: 200
    });

    const menuRef = React.useRef<HTMLDivElement>(null);

    const handleNestLayer = (draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        const draggedLayer = items.find(l => l.id === draggedId);
        const targetLayer = items.find(l => l.id === targetId);
        if (!draggedLayer || !targetLayer) return;
        if (targetLayer.type !== 'group' && !targetLayer.isProject) return;
        const newDepth = (targetLayer.depth || 0) + 1;
        updateLayer({ ...draggedLayer, parentId: targetLayer.id, depth: newDepth });
        if (!targetLayer.expanded) {
            updateLayer({ ...targetLayer, expanded: true });
        }
    };

    const renderContent = () => (
        <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-900 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto min-h-0 p-1 relative">
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
                                onSelect={(id) => setSelectedLayerId(id)}
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
                                onClear={onClearCanvas}
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

    return (
        <motion.div
            ref={menuRef}
            layout={false}
            initial={{ ...position }}
            style={{
                width: size.width,
                height: size.height,
                maxHeight: '80vh',
                x: position.x,
                y: position.y,
                zIndex: 50
            }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            className={`absolute flex flex-col bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-sm drop-shadow-xl overflow-hidden pointer-events-auto p-5`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDownCapture={onInteraction}
        >
            <div className={`flex flex-col h-full block`}>
                <div
                    className="w-full flex justify-between items-center mb-1 relative flex-shrink-0 touch-none cursor-move"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <span className="font-semibold text-gray-700 dark:text-neutral-200">
                        Estrutura
                    </span>
                    <div className="flex items-center gap-1">
                        {onExport && (
                            <button
                                onClick={onExport}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
                                title="Exportar"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <Download size={16} />
                            </button>
                        )}
                        {onImport && (
                            <label
                                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white cursor-pointer transition-colors"
                                title="Importar"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <Upload size={16} />
                                <input
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={onImport}
                                    className="hidden"
                                />
                            </label>
                        )}
                        {onClearCanvas && (
                            // Removed from header
                            <></>
                        )}
                        <div className="flex items-center gap-2">
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
                        </div>
                    </div>
                </div>

                <div onPointerDown={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto min-h-0">
                    {renderContent()}
                </div>
            </div>
        </motion.div>
    );
}
