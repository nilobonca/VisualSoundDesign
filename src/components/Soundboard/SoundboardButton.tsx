import React, { useRef, useState, useEffect } from 'react';
import { SoundboardItem, Audios } from '@/interfaces/utils/indexedDB';
// The project uses native drag and drop based on previous files (e.g. CanvasContainer).
// I will use native onDrop.
import { Repeat, Play } from 'lucide-react';

interface SoundboardButtonProps {
    item: SoundboardItem;
    audio?: Audios;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDropAudio: (audioId: number) => void;
    isRenaming?: boolean;
    onRename?: (newName: string) => void;
}

export const SoundboardButton: React.FC<SoundboardButtonProps> = ({ item, audio, onClick, onContextMenu, onDropAudio, isRenaming, onRename }) => {
    const audioInstanceRef = useRef<HTMLAudioElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(item.name);

    // Sync input value when item name changes or renaming starts
    useEffect(() => {
        setInputValue(item.name);
    }, [item.name, isRenaming]);

    // Focus input when renaming starts
    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioInstanceRef.current) {
                audioInstanceRef.current.pause();
                audioInstanceRef.current.currentTime = 0;
            }
        };
    }, []);

    const handleClick = () => {
        if (isRenaming) return;

        if (audio && audio.url) {
            if (item.playbackMode === 'restart') {
                // Restart mode: Stop existing, play new (or reset)
                if (audioInstanceRef.current) {
                    audioInstanceRef.current.pause();
                    audioInstanceRef.current.currentTime = 0;
                } else {
                    audioInstanceRef.current = new Audio(audio.url);
                }
                audioInstanceRef.current.play().catch(e => console.error("Error playing sound:", e));
            } else {
                // Overlap mode: Always create new instance
                const sound = new Audio(audio.url);
                sound.play().catch(e => console.error("Error playing sound:", e));
            }
        }
        onClick();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const itemType = e.dataTransfer.getData('itemType');
        const itemId = e.dataTransfer.getData('itemId');

        if (itemType === 'audio' && itemId) {
            onDropAudio(Number(itemId));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleRenameSubmit = () => {
        if (onRename) {
            onRename(inputValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        }
    };

    return (
        <div
            className={`
                relative w-24 h-24 rounded-lg shadow-md flex flex-col items-center justify-center p-2 cursor-pointer transition-all
                ${audio ? 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800' : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700'}
                border-2 ${audio ? 'border-blue-300 dark:border-blue-700' : 'border-dashed border-gray-300 dark:border-neutral-600'}
                ${isRenaming ? 'ring-2 ring-yellow-400' : ''}
            `}
            onClick={handleClick}
            onContextMenu={onContextMenu}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            draggable={!isRenaming}
            onDragStart={(e) => {
                if (isRenaming) {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.setData('itemType', 'soundboardItem');
                e.dataTransfer.setData('itemId', item.id);
                e.dataTransfer.effectAllowed = 'copy';
            }}
            title={audio ? `Play ${audio.name} (${item.playbackMode === 'restart' ? 'Restart' : 'Overlap'})` : 'Drop audio here'}
        >
            {isRenaming ? (
                <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full text-center text-xs font-medium bg-white dark:bg-neutral-900 text-black dark:text-white border border-blue-500 rounded px-1 py-0.5 outline-none"
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="text-xs text-center font-medium text-gray-700 dark:text-gray-200 break-words w-full overflow-hidden max-h-full">
                    {item.name || (audio ? audio.name : 'Empty')}
                </span>
            )}

            {audio && !isRenaming && (
                <div className="absolute bottom-1 right-1 flex gap-1">
                    {item.playbackMode === 'restart' ? (
                        <Repeat size={12} className="text-blue-500" />
                    ) : (
                        <Play size={12} className="text-blue-500" />
                    )}
                </div>
            )}
        </div>
    );
};
