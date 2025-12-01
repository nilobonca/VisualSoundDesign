import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, GripVertical, ChevronRight, ChevronDown, Folder, Image as ImageIcon, Map, Pin, Settings, CornerDownRight, CornerLeftUp, Box } from 'lucide-react';
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
    onToggleLock,
    onToggleExpand,
    onSelect,
    onContextMenu,
    onIndent,
    onOutdent,
    onAction,
    onDoubleClick,
    draggingLayerId,
    dropTargetId,
    setDraggingLayerId,
    setDropTargetId,

    onNestLayer,
    onActivate
}) => {
        const controls = useDragControls();

        const getIcon = () => {
            if (layer.isProject) return <Box size={16} className="text-purple-600" />;
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
        React.useEffect(() => {
            if (!isDragging) return;

            const handlePointerMove = (e: PointerEvent) => {
                const elements = document.elementsFromPoint(e.clientX, e.clientY);
                let foundTargetId: string | null = null;

                for (const el of elements) {
                    if (el instanceof HTMLElement) {
                        const targetId = el.dataset.folderId;
                        if (targetId && targetId !== layer.id) {
                            foundTargetId = targetId;
                            break;
                        }
                    }
                }

                if (foundTargetId !== dropTargetId) {
                    setDropTargetId(foundTargetId);
                }
            };

            window.addEventListener('pointermove', handlePointerMove);
            return () => window.removeEventListener('pointermove', handlePointerMove);
        }, [isDragging, dropTargetId, layer.id, setDropTargetId]);

        const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            // Check for Outdent (Drag Left)
            if (info.offset.x < -35) { // Threshold for outdent
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
            if (layer.type === 'group') return null; // No lines for folders themselves
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
                ${isSelected ? 'bg-blue-600 text-white' : layer.isProject ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 dark:text-purple-100 dark:bg-purple-900/20 dark:border-purple-800 mb-1 rounded-md border border-purple-200' : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200'}
                ${isDragging ? 'opacity-50' : ''}
                ${isDropTarget ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 z-10' : ''}
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
                <div className="flex-shrink-0 relative p-0.5 rounded">
                    {!layer.isProject && getIcon()}
                    {isActiveProject && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-neutral-900" title="Projeto Ativo" />
                    )}
                </div>

                {/* Name */}
                <span className={`flex-1 text-sm truncate ${layer.isProject ? 'font-medium pl-1' : ''} ${isActiveProject ? 'text-green-600 dark:text-green-400 font-semibold' : ''}`}>
                    {layer.name}
                </span>

                {/* Actions (Hover only) */}
                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'text-white' : 'text-gray-500'} z-10`}>
                    {layer.isProject && !isActiveProject && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onActivate && onActivate(layer.id);
                            }}
                            className="p-1 hover:bg-black/10 rounded"
                            title="Abrir Página"
                        >
                            <CornerDownRight size={12} />
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
