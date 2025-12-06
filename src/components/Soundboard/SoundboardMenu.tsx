import React, { useState } from 'react';
import { useIDB } from '@/utils/indexedDB';
import { SoundboardButton } from './SoundboardButton';
import ContextMenu from '@/components/ContextMenu';
import { SoundboardItem } from '@/interfaces/utils/indexedDB';
import { Plus } from 'lucide-react';

interface SoundboardMenuProps {
    onItemContextMenu?: (e: React.MouseEvent, itemId: string) => void;
    editingItemId?: string | null;
    onRename?: (id: string, newName: string) => void;
}

export const SoundboardMenu: React.FC<SoundboardMenuProps> = ({ onItemContextMenu, editingItemId, onRename }) => {
    const { soundboardItems, addSoundboardItem, updateSoundboardItem, deleteSoundboardItem, savedAudios } = useIDB();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: SoundboardItem } | null>(null);

    const handleDropOnMenu = (e: React.DragEvent) => {
        e.preventDefault();
        const itemType = e.dataTransfer.getData('itemType');
        const itemId = e.dataTransfer.getData('itemId');

        if (itemType === 'audio' && itemId) {
            const audioId = Number(itemId);
            const audio = savedAudios.find(a => a.id === audioId);
            if (audio) {
                const newItem: SoundboardItem = {
                    id: crypto.randomUUID(),
                    name: audio.name,
                    audioId: audioId,
                    order: soundboardItems.length,
                    playbackMode: 'overlap'
                };
                addSoundboardItem(newItem);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleAddButton = () => {
        const newItem: SoundboardItem = {
            id: crypto.randomUUID(),
            name: 'Novo Botão',
            audioId: null,
            order: soundboardItems.length,
            playbackMode: 'overlap'
        };
        addSoundboardItem(newItem);
    };

    return (
        <div
            className="w-full h-full min-h-[200px] p-4 grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-4 auto-rows-min content-start"
            onDrop={handleDropOnMenu}
            onDragOver={handleDragOver}
            onContextMenu={(e) => e.stopPropagation()}
        >
            {soundboardItems.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-8">
                    <p className="text-sm mb-2">Soundboard vazio</p>
                    <p className="text-xs text-center">Arraste áudios para cá ou clique em +</p>
                </div>
            )}

            {soundboardItems.map(item => {
                const audio = savedAudios.find(a => a.id === item.audioId || a.id === Number(item.audioId));
                return (
                    <SoundboardButton
                        key={item.id}
                        item={item}
                        audio={audio}
                        onClick={() => { }}
                        isRenaming={editingItemId === item.id}
                        onRename={(newName) => onRename && onRename(item.id, newName)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onItemContextMenu) {
                                onItemContextMenu(e, item.id);
                            } else {
                                setContextMenu({ x: e.clientX, y: e.clientY, item });
                            }
                        }}
                        onDropAudio={(audioId) => {
                            const audio = savedAudios.find(a => a.id === audioId);
                            if (audio) {
                                updateSoundboardItem({ ...item, name: audio.name, audioId: audioId });
                            }
                        }}
                    />
                );
            })}

            <button
                onClick={handleAddButton}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-600 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                title="Adicionar Botão"
            >
                <Plus size={24} />
            </button>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    options={[
                        {
                            label: 'Renomear',
                            icon: '✏️',
                            onClick: () => {
                                const newName = window.prompt('Novo nome:', contextMenu.item.name);
                                if (newName) {
                                    updateSoundboardItem({ ...contextMenu.item, name: newName });
                                }
                                setContextMenu(null);
                            }
                        },
                        {
                            label: contextMenu.item.playbackMode === 'restart' ? 'Modo: Reiniciar' : 'Modo: Sobrepor',
                            icon: contextMenu.item.playbackMode === 'restart' ? '🔄' : '▶️',
                            onClick: () => {
                                const newMode = contextMenu.item.playbackMode === 'restart' ? 'overlap' : 'restart';
                                updateSoundboardItem({ ...contextMenu.item, playbackMode: newMode });
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Excluir',
                            icon: '🗑️',
                            onClick: () => {
                                if (window.confirm('Excluir botão?')) {
                                    deleteSoundboardItem(contextMenu.item.id);
                                }
                                setContextMenu(null);
                            }
                        }
                    ]}
                />
            )}
        </div>
    );
};
