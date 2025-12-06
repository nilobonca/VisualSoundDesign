
import React, { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Edit2, Trash2, User, Ear, MapPin } from 'lucide-react';
import { ActivePin } from '@/interfaces/utils/indexedDB';

interface PinItemProps {
    pin: ActivePin;
    onToggle: (pin: ActivePin) => void;
    onRename: (pin: ActivePin, newName: string) => void;
    onUpdate: (pin: ActivePin) => void;
    onDelete: (id: string) => void;
}

export const PinItem: React.FC<PinItemProps> = ({ pin, onToggle, onRename, onUpdate, onDelete }) => {
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

    const cycleIcon = () => {
        const nextIcon = (pin.icon === 'pin' || !pin.icon) ? 'person' : pin.icon === 'person' ? 'ear' : 'pin';
        onUpdate({ ...pin, icon: nextIcon });
    };

    const Icon = pin.icon === 'person' ? User : pin.icon === 'ear' ? Ear : MapPin;

    return (
        <Reorder.Item
            value={pin}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex items - center justify - between p - 2 rounded - md border transition - all ${pin.enabled ? 'bg-white dark:bg-neutral-700 border-gray-200 dark:border-neutral-600' : 'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 opacity-75'} `}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 flex-shrink-0">
                    <GripVertical size={16} />
                </div>

                {/* Icon Toggle */}
                <button
                    onClick={cycleIcon}
                    className="p-1 text-gray-500 hover:text-blue-500 rounded hover:bg-gray-100 dark:hover:bg-neutral-600 mr-1"
                    title="Mudar Ícone"
                >
                    <Icon size={16} />
                </button>

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
                        className="flex-1 bg-white dark:bg-neutral-900 border border-blue-500 rounded px-1 min-w-0 h-6 text-sm"
                    />
                ) : (
                    <span
                        className="text-sm font-medium flex-1 truncate cursor-pointer"
                        onDoubleClick={() => setIsEditing(true)}
                        title={pin.name}
                    >
                        {pin.name}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 ml-2">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 rounded hover:bg-gray-100 dark:hover:bg-neutral-600"
                    title="Renomear"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => onToggle(pin)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 rounded hover:bg-gray-100 dark:hover:bg-neutral-600"
                    title={pin.enabled ? "Ocultar" : "Mostrar"}
                >
                    {pin.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                    onClick={() => onDelete(pin.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 dark:hover:bg-neutral-600"
                    title="Excluir"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </Reorder.Item>
    );
};

