import React, { useState, useEffect } from 'react';
import { Reorder, motion, useDragControls } from 'framer-motion';
import { Layers, Plus, FolderPlus, X } from 'lucide-react';
import { useIDB } from '@/utils/indexedDB';
import { Layer } from '@/interfaces/utils/indexedDB';
import { LayerItem } from './LayerItem';
import ContextMenu from '@/components/ContextMenu';

interface LayerManagerProps {
    onLayerAction?: (layer: Layer) => void;
}

export default function LayerManager({ onLayerAction }: LayerManagerProps) {
    const { activeLayers, reorderLayers, addLayer, deleteLayer, updateLayer } = useIDB();
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layer: Layer; options?: any[] } | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const dragControls = useDragControls();

    // Local state for drag performance
    const [items, setItems] = useState<Layer[]>(activeLayers);
    const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    useEffect(() => {
        setItems(activeLayers);
    }, [activeLayers]);

    // Helper to check if a layer should be visible in the list (based on parent expansion)
    const isLayerVisibleInList = (layer: Layer, allLayers: Layer[]) => {
        if (!layer.parentId) return true;
        const parent = allLayers.find(l => l.id === layer.parentId);
        if (!parent) return true; // Orphaned? Show it.
        if (!parent.expanded) return false; // Parent collapsed? Hide it.

        // Recursively check if grandparent is collapsed
        return isLayerVisibleInList(parent, allLayers);
    };

    const visibleItems = items.filter(l => isLayerVisibleInList(l, items));

    const handleReorder = (newVisibleOrder: Layer[]) => {
        // We need to reconstruct the full list based on the reordered visible items
        // while preserving the position of hidden items (children of collapsed groups).

        // Check if we dropped ONTO a folder
        if (dropTargetId && draggingLayerId) {
            const draggedLayer = items.find(l => l.id === draggingLayerId);
            const targetFolder = items.find(l => l.id === dropTargetId);

            if (draggedLayer && targetFolder && targetFolder.type === 'group') {
                // Prevent circular dependency (can't drop parent into child)
                // Simple check: is targetFolder a descendant of draggedLayer?
                let current = targetFolder;
                let isDescendant = false;
                while (current.parentId) {
                    if (current.parentId === draggedLayer.id) {
                        isDescendant = true;
                        break;
                    }
                    const parent = items.find(l => l.id === current.parentId);
                    if (!parent) break;
                    current = parent;
                }

                if (!isDescendant) {
                    // Update parentId and depth
                    const newDepth = (targetFolder.depth || 0) + 1;
                    const updatedDraggedLayer = {
                        ...draggedLayer,
                        parentId: targetFolder.id,
                        depth: newDepth
                    };

                    // Remove from old position
                    const newItems = items.filter(l => l.id !== draggedLayer.id);

                    // Find index of target folder in the new list
                    const targetIndex = newItems.findIndex(l => l.id === targetFolder.id);

                    // Insert after target folder
                    if (targetIndex !== -1) {
                        newItems.splice(targetIndex + 1, 0, updatedDraggedLayer);
                    } else {
                        // Fallback (shouldn't happen if targetFolder exists)
                        newItems.push(updatedDraggedLayer);
                    }

                    // Expand the target folder so we can see the item
                    if (!targetFolder.expanded) {
                        const folderIndex = newItems.findIndex(l => l.id === targetFolder.id);
                        if (folderIndex !== -1) {
                            newItems[folderIndex] = { ...newItems[folderIndex], expanded: true };
                            updateLayer({ ...newItems[folderIndex], expanded: true });
                        }
                    }

                    // Update state and persist
                    setItems(newItems);
                    reorderLayers(newItems);
                    updateLayer(updatedDraggedLayer);

                    // Reset drag state
                    setDraggingLayerId(null);
                    setDropTargetId(null);
                    return; // Stop here, we handled the move
                }
            }
        }

        const newItems: Layer[] = [];
        const visibleSet = new Set(newVisibleOrder.map(i => i.id));

        newVisibleOrder.forEach((layer, index) => {
            // Logic to determine new parent/depth based on position
            // If we moved an item, we need to check its new neighbors to infer hierarchy

            let updatedLayer = { ...layer };

            // Only infer new parent if we are NOT dropping onto a folder (which is handled above)
            // and if the layer was actually moved (draggingLayerId is set)
            if (draggingLayerId === layer.id) {
                const prevItem = index > 0 ? newVisibleOrder[index - 1] : null;

                if (!prevItem) {
                    // Moved to top -> No parent
                    updatedLayer.parentId = null;
                    updatedLayer.depth = 0;
                } else {
                    // Moved after prevItem
                    // If prevItem is an expanded group, become its first child
                    if (prevItem.type === 'group' && prevItem.expanded) {
                        updatedLayer.parentId = prevItem.id;
                        updatedLayer.depth = (prevItem.depth || 0) + 1;
                    } else {
                        // Otherwise, adopt prevItem's parent (become sibling)
                        updatedLayer.parentId = prevItem.parentId;
                        updatedLayer.depth = prevItem.depth || 0;
                    }
                }

                // Update DB if changed
                if (updatedLayer.parentId !== layer.parentId || updatedLayer.depth !== layer.depth) {
                    updateLayer(updatedLayer);
                }
            }

            newItems.push(updatedLayer);

            // If this layer is a group, check if it has hidden children that need to move with it
            const appendHiddenChildren = (parentId: string, parentDepth: number) => {
                const children = items.filter(i => i.parentId === parentId);
                children.forEach(child => {
                    if (!visibleSet.has(child.id)) {
                        // Update depth of hidden children if parent moved
                        const childNewDepth = parentDepth + 1;
                        const updatedChild = { ...child, depth: childNewDepth };

                        if (updatedChild.depth !== child.depth) {
                            updateLayer(updatedChild);
                        }

                        newItems.push(updatedChild);
                        appendHiddenChildren(child.id, childNewDepth);
                    }
                });
            };

            appendHiddenChildren(updatedLayer.id, updatedLayer.depth || 0);
        });

        setItems(newItems);
        reorderLayers(newItems);

        // Reset drag state
        if (draggingLayerId) {
            setDraggingLayerId(null);
            setDropTargetId(null);
        }
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

    const handleCreateGroup = () => {
        const newGroup: Layer = {
            id: crypto.randomUUID(),
            type: 'group',
            name: 'Novo Grupo',
            visible: true,
            locked: false,
            expanded: true,
            parentId: null,
            depth: 0
        };
        addLayer(newGroup);
    };

    const handleContextMenu = (e: React.MouseEvent, layer: Layer) => {
        e.preventDefault();

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
                onClick: () => {
                    if (window.confirm(`Tem certeza que deseja deletar "${layer.name}"?`)) {
                        deleteLayer(layer.id);
                    }
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

        const groupOptions = items.filter(i => i.type === 'group' && i.id !== layer.id).map(g => ({
            label: `Mover para: ${g.name}`,
            icon: '📂',
            onClick: () => {
                updateLayer({ ...layer, parentId: g.id, depth: g.depth + 1 });
                setContextMenu(null);
            }
        }));

        if (layer.parentId) {
            groupOptions.unshift({
                label: 'Remover do Grupo',
                icon: '⬆️',
                onClick: () => {
                    updateLayer({ ...layer, parentId: null, depth: 0 });
                    setContextMenu(null);
                }
            });
        }

        const moveToGroupOption = groupOptions.length > 0 ? [{
            label: 'Mover para Grupo...',
            icon: '➡️',
            subMenu: groupOptions
        }] : [];

        let specificOptions: any[] = [];

        if (layer.itemType === 'image') {
            specificOptions = [
                {
                    label: 'Editar Imagem',
                    icon: '🎨',
                    onClick: () => {
                        if (onLayerAction) onLayerAction(layer);
                        setContextMenu(null);
                    }
                }
            ];
        } else if (layer.type === 'group') {
            specificOptions = [
                {
                    label: 'Desagrupar',
                    icon: '🔓',
                    onClick: () => {
                        // Move children to root
                        items.filter(i => i.parentId === layer.id).forEach(child => {
                            updateLayer({ ...child, parentId: null, depth: 0 });
                        });
                        deleteLayer(layer.id);
                        setContextMenu(null);
                    }
                }
            ];
        } else if (layer.itemType === 'area') {
            specificOptions = [
                {
                    label: 'Focar Área',
                    icon: '🎯',
                    onClick: () => {
                        if (onLayerAction) onLayerAction(layer);
                        setContextMenu(null);
                    }
                }
            ];
        } else if (layer.itemType === 'pin') {
            specificOptions = [
                {
                    label: 'Editar Pin',
                    icon: '📍',
                    onClick: () => {
                        if (onLayerAction) onLayerAction(layer);
                        setContextMenu(null);
                    }
                }
            ];
        }

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            layer,
            options: [...specificOptions, ...baseOptions, ...moveToGroupOption]
        });
    };

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            layout
            initial={{ x: 20, y: 80 }}
            className={`absolute z-50 flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden ${isVisible ? 'w-64 h-96' : 'w-auto h-auto'}`}
        >
            {!isVisible ? (
                <div
                    className="p-2 cursor-move flex items-center justify-center"
                    onPointerDown={(e) => dragControls.start(e)}
                    title="Mostrar Camadas"
                >
                    <button onClick={() => setIsVisible(true)} className="text-white hover:text-neutral-300">
                        <Layers size={24} />
                    </button>
                </div>
            ) : (
                <>
                    {/* Header - Drag Handle */}
                    <div
                        className="flex items-center justify-between p-3 border-b border-neutral-800 cursor-move bg-neutral-950/50"
                        onPointerDown={(e) => dragControls.start(e)}
                        onDoubleClick={() => setIsVisible(false)}
                    >
                        <div className="flex items-center gap-2 text-neutral-200 font-medium">
                            <Layers size={16} />
                            <span>Camadas</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <button
                                onClick={handleCreateGroup}
                                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                                title="Novo Grupo"
                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag
                            >
                                <FolderPlus size={16} />
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white ml-1"
                                title="Minimizar"
                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Layer List - Prevent drag propagation */}
                    <div
                        className="flex-1 overflow-y-auto"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Reorder.Group axis="y" values={visibleItems} onReorder={handleReorder} className="flex flex-col">
                            {visibleItems.map((layer) => (
                                <LayerItem
                                    key={layer.id}
                                    layer={layer}
                                    isSelected={selectedLayerId === layer.id}
                                    onSelect={setSelectedLayerId}
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
                                />
                            ))}
                        </Reorder.Group>
                    </div>

                    {/* Context Menu */}
                    {contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            onClose={() => setContextMenu(null)}
                            options={contextMenu.options || []}
                        />
                    )}
                </>
            )}
        </motion.div>
    );
}
