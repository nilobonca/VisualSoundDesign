import React, { useRef } from 'react';
import { ActiveSoundboardItem, SoundboardItem, Audios } from '@/interfaces/utils/indexedDB';
import { Repeat, Play, Trash2 } from 'lucide-react';

interface CanvasSoundboardItemProps {
    item: ActiveSoundboardItem;
    soundboardItem: SoundboardItem;
    audio?: Audios;
    onDelete: () => void;
    isEditing?: boolean;
    onContextMenu?: (e: React.MouseEvent) => void;
}

export const CanvasSoundboardItem: React.FC<CanvasSoundboardItemProps> = ({
    item,
    soundboardItem,
    audio,
    onDelete,
    isEditing,
    onContextMenu
}) => {
    const audioInstanceRef = useRef<HTMLAudioElement | null>(null);

    const dragStartPos = useRef<{ x: number; y: number } | null>(null);

    const playingInstancesRef = useRef<HTMLAudioElement[]>([]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (audioInstanceRef.current) {
                audioInstanceRef.current.pause();
                audioInstanceRef.current.currentTime = 0;
            }
            // Stop all overlapping instances
            playingInstancesRef.current.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
            playingInstancesRef.current = [];
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e: React.MouseEvent) => {
        // Check if it was a drag
        if (dragStartPos.current) {
            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 5) {
                // It was a drag, don't play
                return;
            }
        }

        if (audio && audio.url) {
            if (soundboardItem.playbackMode === 'restart') {
                if (audioInstanceRef.current) {
                    audioInstanceRef.current.pause();
                    audioInstanceRef.current.currentTime = 0;
                } else {
                    audioInstanceRef.current = new Audio(audio.url);
                }
                audioInstanceRef.current.play().catch(e => console.error("Error playing sound:", e));
            } else {
                const sound = new Audio(audio.url);
                playingInstancesRef.current.push(sound);
                sound.onended = () => {
                    // Remove from tracking when done
                    playingInstancesRef.current = playingInstancesRef.current.filter(s => s !== sound);
                };
                sound.play().catch(e => console.error("Error playing sound:", e));
            }
        }
    };

    return (
        <div
            className={`
                relative w-32 h-32 rounded-xl shadow-lg flex flex-col items-center justify-center p-3 cursor-pointer transition-all group
                ${audio ? 'bg-blue-100 dark:bg-blue-900/80 hover:bg-blue-200 dark:hover:bg-blue-800/80' : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700'}
                border-2 ${audio ? 'border-blue-400 dark:border-blue-600' : 'border-dashed border-gray-300 dark:border-neutral-600'}
                ${isEditing ? 'ring-2 ring-yellow-400' : ''}
            `}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            title={audio ? `Play ${audio.name}` : 'Empty Soundboard Button'}
        >
            <span className="text-sm text-center font-bold text-gray-800 dark:text-gray-100 break-words w-full overflow-hidden line-clamp-3">
                {soundboardItem.name || (audio ? audio.name : 'Empty')}
            </span>

            {/* Playback Mode Icon */}
            {audio && (
                <div className="absolute bottom-2 right-2 opacity-70">
                    {soundboardItem.playbackMode === 'restart' ? (
                        <Repeat size={16} className="text-blue-600 dark:text-blue-400" />
                    ) : (
                        <Play size={16} className="text-blue-600 dark:text-blue-400" />
                    )}
                </div>
            )}

            {/* Delete Button (visible on hover) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                title="Remove from Canvas"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};
