import React, { useState, useRef, useEffect, useCallback } from "react";
import { PlayIcon, PauseIcon, Copy, SquareX, Repeat } from 'lucide-react';
import { Audios } from "@/interfaces/utils/indexedDB";

interface AudioPlayerListProps {
    audio: Audios;
    onDelete: (id: number) => void;
    onDuplicate: (audio: Audios) => void;
    forcePlay?: boolean; // Control playback externally (from pin interactions)
    proximityFactor?: number; // Volume control based on proximity
    highlightedAudioId?: number | null;
    onDragStart?: (e: React.DragEvent) => void;
}

const AudioPlayerList: React.FC<AudioPlayerListProps> = ({ audio, onDelete, onDuplicate, forcePlay, proximityFactor = 1, highlightedAudioId, onDragStart }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume] = useState<number>(1);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isCustomLooping, setCustomLoop] = useState<boolean>(false);
    const draggingHandleRef = useRef<'start' | 'end' | null>(null);
    const loopStartTimeRef = useRef(0);
    const loopEndTimeRef = useRef(0);
    const [loopUi, setLoopUi] = useState({ start: 0, end: 0 });

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const updateLoopRangeVisual = useCallback(() => {
        setLoopUi({ start: loopStartTimeRef.current, end: loopEndTimeRef.current });
    }, []);

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (draggingHandleRef.current === null || !progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        let clientX;
        if (window.TouchEvent && e instanceof TouchEvent) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as MouseEvent).clientX;
        }

        const positionX = clientX - rect.left;
        let percent = (positionX / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));

        const newTime = (percent / 100) * duration;

        if (draggingHandleRef.current === 'start') {
            loopStartTimeRef.current = Math.min(newTime, loopEndTimeRef.current);
        } else {
            loopEndTimeRef.current = Math.max(newTime, loopStartTimeRef.current);
        }
        updateLoopRangeVisual();
    }, [duration, updateLoopRangeVisual]);

    const handleDragEnd = useCallback(() => {
        draggingHandleRef.current = null;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [handleDragMove, handleDragEnd]);

    // Handle external forcePlay control
    useEffect(() => {
        if (forcePlay !== undefined) {
            setIsPlaying(forcePlay);
            if (forcePlay) {
                audioRef.current?.play();
            } else {
                audioRef.current?.pause();
            }
        }
    }, [forcePlay]);

    // Handle volume with proximity factor
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume * proximityFactor;
        }
    }, [volume, proximityFactor]);

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            audioRef.current?.play();
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            setCurrentTime(current);

            if (isCustomLooping && (current >= loopEndTimeRef.current || current < loopStartTimeRef.current)) {
                audioRef.current.currentTime = loopStartTimeRef.current;
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            loopEndTimeRef.current = audioRef.current.duration;
            setLoopUi({ start: 0, end: audioRef.current.duration });
        }
    };

    const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).classList.contains('loop-handle') || !progressBarRef.current || !audioRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickPositionX = event.clientX - rect.left;
        const seekTime = (clickPositionX / rect.width) * duration;
        audioRef.current.currentTime = seekTime;
    };

    const progressPercent = (currentTime / duration) * 100 || 0;
    const startHandlePercent = (loopUi.start / duration) * 100 || 0;
    const endHandlePercent = (loopUi.end / duration) * 100;

    const isHighlighted = highlightedAudioId === audio.id;

    return (
        <div
            draggable={!!onDragStart}
            onDragStart={onDragStart}
            className={`bg-white dark:bg-neutral-800 rounded shadow-sm p-2 animate-fade-in border transition-all duration-300 ${isHighlighted ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/30 z-10 scale-[1.02]' : 'border-transparent dark:border-neutral-700'}`}
        >
            <div className="flex items-center gap-2">
                {/* Play/Pause Button */}
                <button
                    onClick={handlePlayPause}
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors ${forcePlay ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                >
                    {isPlaying ? (
                        <PauseIcon className="w-4 h-4" />
                    ) : (
                        <PlayIcon className="w-4 h-4 ml-0.5" />
                    )}
                </button>

                {/* Info and Progress */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs truncate flex-1 text-gray-700 dark:text-neutral-200" title={audio.name}>
                            {audio.name}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-neutral-400 ml-2">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                        ref={progressBarRef}
                        onClick={handleProgressClick}
                        className="bg-gray-200 dark:bg-neutral-700 rounded-full h-1.5 cursor-pointer relative group prevent-item-drag"
                    >
                        {/* Loop Range Highlight */}
                        <div
                            className={`absolute h-full z-10 pointer-events-none rounded-full ${isCustomLooping ? 'bg-blue-500/50' : 'bg-blue-500/30'}`}
                            style={{ left: `${startHandlePercent}%`, width: `${endHandlePercent - startHandlePercent}%` }}
                        />
                        {/* Progress */}
                        <div
                            className="bg-blue-600 h-1.5 rounded-full relative"
                            style={{ width: `${progressPercent}%` }}
                        />
                        {/* Loop Start Handle */}
                        <div
                            onMouseDown={() => { draggingHandleRef.current = 'start' }}
                            onTouchStart={() => { draggingHandleRef.current = 'start' }}
                            className="loop-handle prevent-item-drag"
                            style={{ left: `${startHandlePercent}%` }}
                        >
                            <div className="loop-handle-line" />
                        </div>
                        {/* Loop End Handle */}
                        <div
                            onMouseDown={() => { draggingHandleRef.current = 'end' }}
                            onTouchStart={() => { draggingHandleRef.current = 'end' }}
                            className="loop-handle prevent-item-drag"
                            style={{ left: `${endHandlePercent}%` }}
                        >
                            <div className="loop-handle-line" />
                        </div>
                    </div>

                    {isCustomLooping && (
                        <div className="text-[9px] text-gray-500 dark:text-neutral-400 mt-0.5">
                            Loop: {formatTime(loopUi.start)} - {formatTime(loopUi.end)}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 flex-shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCustomLoop(!isCustomLooping);
                        }}
                        className={`p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors ${isCustomLooping ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                        title="Loop personalizado"
                    >
                        <Repeat size={14} className={isCustomLooping ? "text-green-500" : "text-gray-500 dark:text-neutral-400"} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(audio);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        title="Duplicar áudio"
                    >
                        <Copy size={14} className="text-blue-500" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(audio.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        title="Excluir áudio"
                    >
                        <SquareX size={14} className="text-red-400 hover:text-red-600" />
                    </button>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={audio.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                    if (isCustomLooping) {
                        if (audioRef.current) {
                            audioRef.current.currentTime = loopStartTimeRef.current;
                            audioRef.current.play();
                        }
                    } else {
                        setIsPlaying(false);
                    }
                }}
            />

            <style>{`
        .loop-handle {
          position: absolute;
          top: -3px;
          width: 8px;
          height: 20px;
          background-color: rgba(255, 255, 255, 0.9);
          border: 1.5px solid #4A90E2;
          border-radius: 3px;
          cursor: ew-resize;
          transform: translateX(-50%);
          z-index: 20;
          box-shadow: 0px 0px 4px rgba(0,0,0,0.3);
        }
        .loop-handle-line {
          width: 2px;
          height: 10px;
          background-color: #4A90E2;
          margin: 0 auto;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>
        </div>
    );
};

export default AudioPlayerList;
