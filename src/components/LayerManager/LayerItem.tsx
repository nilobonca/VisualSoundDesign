import React, { useEffect } from 'react';
import { Eye, EyeOff, GripVertical, ChevronRight, ChevronDown, Folder, Image as ImageIcon, Map, Pin, Box, CornerDownRight, ArrowLeft, Eraser } from 'lucide-react';
import { Layer } from '@/interfaces/utils/indexedDB';
import { Reorder, useDragControls, PanInfo } from 'framer-motion';

interface LayerItemProps {
    layer: Layer;
    isSelected: boolean;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onSelect: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, layer: Layer) => void;
    onIndent: (id: string) => void;
    onOutdent: (id: string) => void;
    onAction: (layer: Layer) => void;
    onDoubleClick?: (layer: Layer) => void;
    onNestLayer?: (draggedId: string, targetId: string) => void;
    isActiveProject?: boolean;
    onActivate?: (id: string) => void;
    onClear?: (e: React.MouseEvent, pageId?: string) => void;
    isDraggingPage?: boolean;
}

export const LayerItem: React.FC<LayerItemProps & {
    draggingLayerId: string | null;
    dropTargetId: string | null;
    setDraggingLayerId: (id: string | null) => void;
    setDropTargetId: (id: string | null) => void;
}> = ({
    layer,
    isSelected,
    isActiveProject,
    onToggleVisibility,
    // onToggleLock, // Unused
    onToggleExpand,
    onSelect,
    onContextMenu,
    // onIndent, // Unused
    onOutdent,
    // onAction, // Unused
    onDoubleClick,
    draggingLayerId,
    dropTargetId,
    setDraggingLayerId,
    setDropTargetId,

    onNestLayer,
    onActivate,
    onClear,
    isDraggingPage
}) => {
        const controls = useDragControls();

        const getIcon = () => {
            if (layer.isProject) return <Box size={14} className="text-neutral-700 dark:text-neutral-300" />;
            if (layer.type === 'group') return <Folder size={14} className="text-yellow-500" />;
            switch (layer.itemType) {
                case 'image': return <ImageIcon size={14} className="text-blue-400" />;
                case 'area': return <Map size={14} className="text-green-400" />;
                case 'pin': return <Pin size={14} className="text-red-400" />;
                default: return <div className="w-3.5 h-3.5 bg-gray-500 rounded-sm" />;
            }
        };

        const isDragging = draggingLayerId === layer.id;
        const isDropTarget = dropTargetId === layer.id;

        const handleDragStart = () => {
            setDraggingLayerId(layer.id);
        };

        // Use a global pointer move listener for more reliable detection during drag
        useEffect(() => {
            if (!isDragging) return;
            // Disable nesting feedback validation if dragging a page
            if (isDraggingPage) return;

            const handlePointerMove = (e: PointerEvent) => {
                const elements = document.elementsFromPoint(e.clientX, e.clientY);
                let foundTargetId: string | null = null;

                for (const el of elements) {
                    if (el instanceof HTMLElement) {
                        const targetId = el.dataset.folderId;
                        if (targetId && targetId !== layer.id) {
                            // Check if cursor is in the "nesting zone" (middle 60% of the item)
                            // This prevents accidental nesting when just trying to reorder above/below
                            const rect = el.getBoundingClientRect();
                            const relativeY = e.clientY - rect.top;
                            const percentageY = relativeY / rect.height;

                            // Only consider it a drop target if we are in the middle 60% (20% to 80%)
                            if (percentageY > 0.2 && percentageY < 0.8) {
                                foundTargetId = targetId;
                                break;
                            }
                        }
                    }
                }

                if (foundTargetId !== dropTargetId) {
                    setDropTargetId(foundTargetId);
                }
            };

            window.addEventListener('pointermove', handlePointerMove);
            return () => window.removeEventListener('pointermove', handlePointerMove);
        }, [isDragging, dropTargetId, layer.id, setDropTargetId, isDraggingPage]);

        const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            // Check for Outdent (Drag Left)
            // Use the calculated depth logic if possible, or fallback to visual threshold
            if (info.offset.x < -15) { // Threshold for outdent
                onOutdent(layer.id);
            }

            // Check for Nesting (Drop on Folder)
            if (draggingLayerId && dropTargetId && onNestLayer) {
                onNestLayer(draggingLayerId, dropTargetId);
            }

            setDraggingLayerId(null);
            setDropTargetId(null);
        };

        // Render hierarchy lines
        const renderHierarchyLines = () => {
            if (layer.isProject) return null;
            if (layer.depth <= 1) return null; // No lines for items directly in project root

            // Render only ONE line for items inside folders
            return (
                <div
                    className="absolute w-px h-full bg-gray-200 dark:bg-neutral-700"
                    style={{ left: `${((layer.depth - 1) * 12) + 12}px` }}
                />
            );
        };

        return (
            <Reorder.Item
                value={layer}
                id={layer.id}
                drag // Enable free dragging to allow horizontal movement for outdent
                dragListener={false}
                dragControls={controls}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                whileDrag={{ cursor: 'grabbing', scale: 1.02, opacity: 0.8 }}
                // Add data-folder-id to the main container to make the whole row a drop target
                data-folder-id={(layer.type === 'group' || layer.isProject) ? layer.id : undefined}
                className={`
                group relative flex items-center gap-2 px-2 py-1.5 select-none transition-colors
                ${isSelected ? 'bg-blue-600 text-white' : layer.isProject ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:text-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 mb-1 rounded-md border border-neutral-200 font-medium' : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200'}
                ${isDragging ? 'opacity-50' : ''}
                ${(isDropTarget && !isDraggingPage) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 z-10' : ''}
            `}
                style={{ paddingLeft: layer.isProject ? '8px' : `${(layer.depth * 12) + 8}px` }}
                onClick={() => onSelect(layer.id)}
                onDoubleClick={() => onDoubleClick && onDoubleClick(layer)}
                onContextMenu={(e) => onContextMenu(e, layer)}
            >
                {renderHierarchyLines()}

                {/* Drag Handle */}
                <div
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/5 rounded z-10"
                    onPointerDown={(e) => controls.start(e)}
                >
                    <GripVertical size={12} className={isSelected ? 'text-white/50' : 'text-gray-400'} />
                </div>

                {/* Expand/Collapse (Only for groups/projects) */}
                {(layer.type === 'group') ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(layer.id);
                        }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className="p-0.5 hover:bg-black/5 rounded z-10"
                    >
                        {layer.expanded ? (
                            <ChevronDown size={12} className={isSelected ? 'text-white' : 'text-gray-500'} />
                        ) : (
                            <ChevronRight size={12} className={isSelected ? 'text-white' : 'text-gray-500'} />
                        )}
                    </button>
                ) : (
                    <div className="w-4" /> // Spacer
                )}

                {/* Icon */}
                <div className="flex-shrink-0 relative rounded">
                    {getIcon()}
                    {isActiveProject && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-neutral-900" title="Projeto Ativo" />
                    )}
                </div>

                {/* Name */}
                <span className={`flex-1 text-sm truncate ${layer.isProject ? 'pl-1' : ''} ${isActiveProject ? 'font-bold' : ''}`}>
                    {layer.name}
                </span>

                {/* Actions (Hover only) */}
                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'text-white' : 'text-gray-500'} z-10`}>
                    {layer.depth > 1 && !layer.isProject && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOutdent(layer.id);
                            }}
                            className="p-1 hover:bg-black/10 rounded"
                            title="Mover para fora"
                        >
                            <ArrowLeft size={12} />
                        </button>
                    )}
                    {layer.isProject && !isActiveProject && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onActivate) onActivate(layer.id);
                            }}
                            className="p-1 hover:bg-black/10 rounded"
                            title="Abrir Página"
                        >
                            <CornerDownRight size={12} />
                        </button>
                    )}
                    {layer.isProject && onClear && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear(e, layer.id);
                            }}
                            className="p-1 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded"
                            title="Limpar Itens da Página (Vassoura)"
                        >
                            <Eraser size={12} />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(layer.id);
                        }}
                        className="p-1 hover:bg-black/10 rounded"
                        title={layer.visible ? "Ocultar" : "Mostrar"}
                    >
                        {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                </div>
            </Reorder.Item>
        );
    };
