import React, { useRef, useState, useEffect } from 'react';
import { SoundboardItem, Audios } from '@/interfaces/utils/indexedDB';
import { RotateCcw, Square, Play, Repeat, Settings, X } from 'lucide-react';
import { playSoundboardAudio, stopSoundboardAudio, activeSoundboardAudios } from './activeAudios';

interface SoundboardButtonProps {
    item: SoundboardItem;
    audio?: Audios;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDropAudio: (audioId: number) => void;
    onUpdate?: (updated: Partial<SoundboardItem>) => void;
    isRenaming?: boolean;
    onRename?: (newName: string) => void;
}

const FILTER_OPTIONS: { value: SoundboardItem['filterType']; label: string }[] = [
    { value: 'none', label: 'Nenhum' },
    { value: 'lowpass', label: 'Passa-Baixas' },
    { value: 'wall', label: 'Parede' },
    { value: 'telephone', label: 'Telefone' },
];

export const SoundboardButton: React.FC<SoundboardButtonProps> = ({
    item, audio, onClick, onContextMenu, onDropAudio, onUpdate, isRenaming, onRename
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(item.name);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Poll playing state from the global map
    useEffect(() => {
        const check = () => {
            const active = activeSoundboardAudios.get(item.id);
            setIsPlaying(!!active && active.length > 0);
        };
        check();
        const interval = setInterval(check, 150);
        return () => clearInterval(interval);
    }, [item.id]);

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

    const handleClick = () => {
        if (isRenaming || showSettings) return;

        if (audio && audio.url) {
            playSoundboardAudio(item.id, audio.url, item.playbackMode || 'overlap', item.pitch || 1.0, item.volume, audio.id, item.filterType);
        }
        onClick();
    };

    const handleStop = (e: React.MouseEvent) => {
        e.stopPropagation();
        stopSoundboardAudio(item.id);
    };

    const handleRestart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audio && audio.url) {
            stopSoundboardAudio(item.id);
            playSoundboardAudio(item.id, audio.url, 'restart', item.pitch || 1.0, item.volume, audio.id, item.filterType);
        }
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
        if (onRename) onRename(inputValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSubmit();
    };

    const volumePercent = Math.round((item.volume ?? 1.0) * 100);
    const filterLabel = FILTER_OPTIONS.find(f => f.value === (item.filterType ?? 'none'))?.label ?? 'Nenhum';

    return (
        <div className="relative flex flex-col" style={{ width: 112 }}>
            {/* Main button */}
            <div
                className={`
                    relative rounded-lg shadow-md flex flex-col items-center justify-center p-2 cursor-pointer transition-all select-none
                    ${isPlaying
                        ? 'bg-green-100 dark:bg-green-900/60 border-green-400 dark:border-green-600 ring-2 ring-green-400/60'
                        : audio
                            ? 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 border-blue-300 dark:border-blue-700'
                            : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 border-dashed border-gray-300 dark:border-neutral-600'}
                    border-2
                    ${isRenaming ? 'ring-2 ring-yellow-400' : ''}
                `}
                style={{ width: 112, height: 112 }}
                onClick={handleClick}
                onContextMenu={onContextMenu}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                draggable={!isRenaming}
                onDragStart={(e) => {
                    if (isRenaming) { e.preventDefault(); return; }
                    e.dataTransfer.setData('itemType', 'soundboardItem');
                    e.dataTransfer.setData('itemId', item.id);
                    e.dataTransfer.effectAllowed = 'copy';
                }}
                title={audio ? `${audio.name} — clique para tocar` : 'Arraste um áudio aqui'}
            >
                {/* Playing dot */}
                {isPlaying && (
                    <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                )}

                {/* Settings button */}
                {audio && !isRenaming && (
                    <button
                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-500 dark:text-neutral-300 shadow transition-colors z-10"
                        onClick={(e) => { e.stopPropagation(); setShowSettings(v => !v); }}
                        title="Configurações"
                    >
                        {showSettings ? <X size={12} /> : <Settings size={12} />}
                    </button>
                )}

                {/* Label */}
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full text-center text-xs font-medium bg-white dark:bg-neutral-900 text-black dark:text-white border border-blue-500 rounded px-1 py-0.5 outline-none mt-4"
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className={`text-xs text-center font-semibold break-words w-full overflow-hidden px-1 mt-3 ${isPlaying ? 'text-green-800 dark:text-green-200' : 'text-gray-700 dark:text-gray-200'}`}>
                        {item.name || (audio ? audio.name : 'Vazio')}
                    </span>
                )}

                {/* Bottom controls */}
                {!isRenaming && (
                    <div
                        className="absolute bottom-1.5 right-1.5 flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isPlaying ? (
                            <>
                                <button
                                    onClick={handleRestart}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-neutral-700 hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-300 transition-colors shadow"
                                    title="Tocar do início"
                                >
                                    <RotateCcw size={13} />
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-neutral-700 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors shadow"
                                    title="Parar"
                                >
                                    <Square size={13} />
                                </button>
                            </>
                        ) : audio ? (
                            <span className="w-6 h-6 flex items-center justify-center opacity-50">
                                {item.playbackMode === 'restart'
                                    ? <Repeat size={13} className="text-blue-500" />
                                    : <Play size={13} className="text-blue-500" />}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Settings panel */}
            {showSettings && audio && !isRenaming && (
                <div
                    className="absolute top-[116px] left-0 z-50 w-48 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl p-3 flex flex-col gap-3"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* Volume */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-600 dark:text-neutral-300">Volume</span>
                            <span className="text-[11px] font-mono text-gray-500 dark:text-neutral-400">{volumePercent}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.01"
                            value={item.volume ?? 1.0}
                            onChange={(e) => onUpdate?.({ volume: parseFloat(e.target.value) })}
                            className="w-full accent-blue-500 h-1.5"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-neutral-300">Efeito</span>
                        <div className="grid grid-cols-2 gap-1">
                            {FILTER_OPTIONS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => onUpdate?.({ filterType: f.value })}
                                    className={`text-[11px] px-2 py-1 rounded border transition-colors font-medium
                                        ${(item.filterType ?? 'none') === f.value
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-neutral-300 hover:border-blue-400'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-neutral-300">Modo de Reprodução</span>
                        <div className="grid grid-cols-2 gap-1">
                            {[{ value: 'overlap', label: 'Sobrepor' }, { value: 'restart', label: 'Reiniciar' }].map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => onUpdate?.({ playbackMode: m.value as 'overlap' | 'restart' })}
                                    className={`text-[11px] px-2 py-1 rounded border transition-colors font-medium
                                        ${(item.playbackMode ?? 'overlap') === m.value
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-neutral-300 hover:border-blue-400'
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
