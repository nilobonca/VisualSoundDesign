import React, { useState, useEffect, useCallback } from 'react';
import { Reorder, motion, useDragControls } from 'framer-motion';
import { Plus, X, GripHorizontal, Box } from 'lucide-react';
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
}

export default function LayerManager({ onLayerAction, onInteraction, onClose, activeProjectId, onSelectProject, projectGroupId, addToHistory, onExport, onImport }: LayerManagerProps) {
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
        if (!layer.parentId) return true;
        const parent = allLayers.find(l => l.id === layer.parentId);
        if (!parent) return false;
        if (!parent.expanded) return false;
        return isLayerVisibleInList(parent, allLayers);
    };

    const visibleItems = items.filter(l => isLayerVisibleInList(l, items));

    const handleReorder = (newVisibleOrder: Layer[]) => {
        const visibleIds = new Set(newVisibleOrder.map(l => l.id));
        const nonVisibleItems = items.filter(l => !visibleIds.has(l.id));
        const newFullList = [...nonVisibleItems, ...newVisibleOrder];
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
        const parent = items.find(l => l.id === layer.parentId);
        if (parent) {
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
        if (!activeProjectId) return;
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'group',
            name: 'Nova Pasta',
            visible: true,
            locked: false,
            expanded: true,
            parentId: activeProjectId,
            depth: 1
        };
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
