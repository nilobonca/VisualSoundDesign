import React, { useState } from 'react';
import { X, Edit2, Trash2, Eye, EyeOff, MapPin, GripVertical } from 'lucide-react';
import { motion, useDragControls, Reorder } from 'framer-motion';
import { useIDB } from '@/utils/indexedDB';
import { ActivePin } from '@/interfaces/utils/indexedDB';

interface PinManagerProps {
    pins: ActivePin[];
    onToggle: (pin: ActivePin) => void;
    onRename: (pin: ActivePin, newName: string) => void;
    onDelete: (id: string) => void;
}

export const PinManager: React.FC<PinManagerProps> = ({ pins, onToggle, onRename, onDelete }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const dragControls = useDragControls();
    const { reorderPins } = useIDB();

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            layout
            initial={{ x: typeof window !== 'undefined' ? window.innerWidth - 320 : 100, y: 100 }}
            className={`absolute z-50 flex flex-col bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden ${isOpen ? 'w-72 max-h-[70vh]' : 'w-auto h-auto'}`}
        >
            {!isOpen ? (
                <div
                    className="p-2 cursor-move flex items-center justify-center bg-white"
                    onPointerDown={(e) => dragControls.start(e)}
                    title="Gerenciar Pins"
                >
                    <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                        <MapPin size={24} />
                    </button>
                </div>
            ) : (
                <>
                    <div
                        className="flex justify-between items-center p-4 border-b border-gray-100 cursor-move bg-gray-50"
                        onPointerDown={(e) => dragControls.start(e)}
                        onDoubleClick={() => setIsOpen(false)}
                    >
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <MapPin size={18} />
                            <span>Pins Ativos</span>
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto" onPointerDown={(e) => e.stopPropagation()}>
                        {pins.length > 0 ? (
                            <Reorder.Group axis="y" values={pins} onReorder={reorderPins} className="space-y-2">
                                {pins.map(pin => (
                                    <Reorder.Item key={pin.id} value={pin} className={`flex items-center justify-between p-2 rounded-md border transition-all ${pin.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <GripVertical size={16} className="text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                                            {editingId === pin.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onBlur={() => {
                                                        if (editName.trim()) onRename(pin, editName);
                                                        setEditingId(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            if (editName.trim()) onRename(pin, editName);
                                                            setEditingId(null);
                                                        }
                                                    }}
                                                    autoFocus
                                                    className="border border-blue-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                />
                                            ) : (
                                                <span
                                                    className="truncate font-medium text-gray-700 text-sm cursor-pointer"
                                                    onClick={() => {
                                                        setEditingId(pin.id);
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
                                                className={`p-1.5 rounded-md transition-colors ${pin.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`}
                                                title={pin.enabled ? "Desativar" : "Ativar"}
                                            >
                                                {pin.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(pin.id);
                                                    setEditName(pin.name);
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                title="Renomear"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(pin.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        ) : (
                            <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                                <span className="text-2xl">📭</span>
                                <p className="text-sm">Nenhum pin criado.</p>
                                <p className="text-xs">Clique com o botão direito no mapa para criar.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
};
