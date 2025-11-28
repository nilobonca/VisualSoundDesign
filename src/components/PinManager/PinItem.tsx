import React, { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { ActivePin } from '@/interfaces/utils/indexedDB';

interface PinItemProps {
    pin: ActivePin;
    onToggle: (pin: ActivePin) => void;
    onRename: (pin: ActivePin, newName: string) => void;
    onDelete: (id: string) => void;
}

export const PinItem: React.FC<PinItemProps> = ({ pin, onToggle, onRename, onDelete }) => {
    const controls = useDragControls();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(pin.name);

    const handleRename = () => {
        if (editName.trim()) {
            onRename(pin, editName);
        } else {
            setEditName(pin.name); // Revert if empty
        }
        setIsEditing(false);
    };

    return (
        <Reorder.Item
            value={pin}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex items-center justify-between p-2 rounded-md border transition-all ${pin.enabled ? 'bg-white dark:bg-neutral-700 border-gray-200 dark:border-neutral-600' : 'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 opacity-75'}`}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 flex-shrink-0">
                    <GripVertical size={16} />
                </div>

                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') {
                                setEditName(pin.name);
                                setIsEditing(false);
                            }
                        }}
                        autoFocus
                        className="border border-blue-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600"
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on input click (redundant with dragListener=false but safe)
                    />
                ) : (
                    <span
                        className="truncate font-medium text-gray-700 dark:text-neutral-200 text-sm cursor-pointer"
                        onClick={() => {
                            setIsEditing(true);
                            setEditName(pin.name);
                        }}
                        title={pin.name}
                    >
                        {pin.name}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <button
                    onClick={() => onToggle(pin)}
                    className={`p-1.5 rounded-md transition-colors ${pin.enabled ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-600'}`}
                    title={pin.enabled ? "Desativar" : "Ativar"}
                >
                    {pin.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                    onClick={() => {
                        setIsEditing(true);
                        setEditName(pin.name);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                    title="Renomear"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onDelete(pin.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    title="Excluir"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </Reorder.Item>
    );
};
