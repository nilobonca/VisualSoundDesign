import React from 'react';

import { Eye, EyeOff, Lock, Unlock, GripVertical, ChevronRight, ChevronDown, Folder, Image as ImageIcon, Map, Pin, Settings, CornerDownRight, CornerLeftUp } from 'lucide-react';
import { Layer } from '@/interfaces/utils/indexedDB';
import { Reorder, useDragControls } from 'framer-motion';

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
}

export const LayerItem: React.FC<LayerItemProps & {
    draggingLayerId: string | null;
    dropTargetId: string | null;
    setDraggingLayerId: (id: string | null) => void;
    setDropTargetId: (id: string | null) => void;
}> = ({
    layer,
    isSelected,
    onToggleVisibility,
    onToggleLock,
    onToggleExpand,
    onSelect,
    onContextMenu,
    onIndent,
    onOutdent,
    onAction,
    draggingLayerId,
    dropTargetId,
    setDraggingLayerId,
    setDropTargetId
}) => {
        const controls = useDragControls();

        const getIcon = () => {
            if (layer.type === 'group') return <Folder size={14} className="text-yellow-500" />;
            switch (layer.itemType) {
                case 'image': return <ImageIcon size={14} className="text-blue-400" />;
                case 'area': return <Map size={14} className="text-green-400" />;
                case 'pin': return <Pin size={14} className="text-red-400" />;
                default: return <div className="w-3.5 h-3.5 bg-gray-500 rounded-sm" />;
            }
        };

        const isDropTarget = dropTargetId === layer.id && layer.type === 'group' && draggingLayerId !== layer.id;

        return (
            <Reorder.Item
                value={layer}
                dragListener={false}
                dragControls={controls}
                className={`relative flex items-center h-8 px-2 border-b border-neutral-800 select-none group 
                ${isSelected ? 'bg-blue-900/50' : 'hover:bg-neutral-800'}
                ${isDropTarget ? 'bg-yellow-900/30 border-yellow-500/50' : ''}
            `}
                style={{ paddingLeft: `${(layer.depth || 0) * 12 + 8}px` }}
                onContextMenu={(e) => onContextMenu(e, layer)}
                onClick={() => onSelect(layer.id)}
                onDoubleClick={() => onAction(layer)}
                onDragStart={() => setDraggingLayerId(layer.id)}
                onDragEnd={() => {
                    setDraggingLayerId(null);
                    setDropTargetId(null);
                }}
                onPointerUp={(e) => {
                    // If we are dragging something else, and we release over this group
                    if (draggingLayerId && draggingLayerId !== layer.id && layer.type === 'group') {
                        // The actual logic will be handled by the parent's reorder or a specific drop handler
                        // But since Reorder captures pointer events, we might need a custom event or rely on the parent checking the dropTargetId
                        // Actually, Reorder's onReorder triggers on drop. We just need to know WHERE we dropped.
                        // But onReorder gives us the new LIST order. It doesn't tell us "dropped ON item X".
                        // So we need to track "hovering over" manually.
                    }
                }}
                onPointerEnter={() => {
                    if (draggingLayerId && draggingLayerId !== layer.id && layer.type === 'group') {
                        setDropTargetId(layer.id);
                    }
                }}
                onPointerLeave={() => {
                    if (dropTargetId === layer.id) {
                        setDropTargetId(null);
                    }
                }}
            >
                {/* Drag Handle */}
                <div
                    className="cursor-grab active:cursor-grabbing p-1 text-neutral-500 hover:text-neutral-300 mr-1"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        controls.start(e);
                    }}
                >
                    <GripVertical size={12} />
                </div>

                {/* Expand/Collapse (for groups) */}
                {layer.type === 'group' ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(layer.id);
                        }}
                        className="p-0.5 text-neutral-400 hover:text-white mr-1"
                    >
                        {layer.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                ) : (
                    <div className="w-4 mr-1" />
                )}

                {/* Icon */}
                <div className="mr-2">
                    {getIcon()}
                </div>

                {/* Name */}
                <span className="flex-1 text-xs text-neutral-200 truncate font-medium">
                    {layer.name}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/80 rounded px-1 absolute right-2">
                    {/* Indent/Outdent */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOutdent(layer.id);
                        }}
                        className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-white"
                        title="Diminuir Nível"
                    >
                        <CornerLeftUp size={12} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onIndent(layer.id);
                        }}
                        className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-white"
                        title="Aumentar Nível"
                    >
                        <CornerDownRight size={12} />
                    </button>

                    {/* Settings Action */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction(layer);
                        }}
                        className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-white"
                        title="Configurações"
                    >
                        <Settings size={12} />
                    </button>

                    <div className="w-px h-3 bg-neutral-700 mx-1" />

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock(layer.id);
                        }}
                        className={`p-1 rounded hover:bg-neutral-700 ${layer.locked ? 'text-red-400 opacity-100' : 'text-neutral-500'}`}
                    >
                        {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(layer.id);
                        }}
                        className={`p-1 rounded hover:bg-neutral-700 ${!layer.visible ? 'text-neutral-500' : 'text-neutral-300'}`}
                    >
                        {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                </div>
            </Reorder.Item>
        );
    };
