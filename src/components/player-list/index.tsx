import React, { useState, useRef, useEffect, useCallback } from "react";
import { PlayIcon, PauseIcon, Copy, SquareX, Repeat, Volume2, VolumeX, Filter } from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import { Audios } from "@/interfaces/utils/indexedDB";

import { getSharedAudioContext, resumeAudioContext } from "@/utils/audio/audioContext";
import { Jungle } from "@/utils/audio/jungle";

interface AudioPlayerListProps {
    audio: Audios;
    onDelete: (id: number) => void;
    onDuplicate: (audio: Audios) => void;
    forcePlay?: boolean; // Control playback externally (from pin interactions)
    proximityFactor?: number; // Volume control based on proximity
    spatialPan?: number; // Added! Panning from -1 (left) to 1 (right)
  
  
    filterType?: 'none' | 'lowpass' | 'wall' | 'telephone';
    highlightedAudioId?: number | null;
    onDragStart?: (e: React.DragEvent) => void;
    pitch?: number;
    onPitchChange?: (pitch: number) => void;
    volume?: number;
    onVolumeChange?: (volume: number) => void;
    audioRotation?: number;
    onRotationChange?: (rotation: number) => void;
    onFilterChange?: (filter: 'none' | 'lowpass' | 'wall' | 'telephone') => void;
    onPlayStateChange?: (playing: boolean) => void;
}

const AudioPlayerList: React.FC<AudioPlayerListProps> = ({
    audio,
    onDelete,
    onDuplicate,
    forcePlay,
    proximityFactor = 1,
    spatialPan = 0,
    filterType = 'none',
    highlightedAudioId,
    onDragStart,
    pitch = 1.0,
    onPitchChange,
    volume = 1.0,
    onVolumeChange,
    audioRotation = 0,
    onRotationChange,
    onFilterChange,
    onPlayStateChange
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const pannerNodeRef = useRef<StereoPannerNode | PannerNode | null>(null);
    const filterNodeRef = useRef<BiquadFilterNode | null>(null);
    const jungleRef = useRef<Jungle | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isCustomLooping, setCustomLoop] = useState<boolean>(false);
    const draggingHandleRef = useRef<'start' | 'end' | null>(null);
    const loopStartTimeRef = useRef(0);
    const loopEndTimeRef = useRef(0);
    const [loopUi, setLoopUi] = useState({ start: 0, end: 0 });

    const [localVolume, setLocalVolume] = useState(volume);
    const [localRotation, setLocalRotation] = useState(audioRotation);
    const [localPitch, setLocalPitch] = useState(pitch);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { setLocalVolume(volume);
        setLocalRotation(audioRotation); }, [volume]);
    useEffect(() => { setLocalPitch(pitch); }, [pitch]);

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

    // Connect HTMLAudioElement to Web Audio API StereoPannerNode once
    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement) return;

        const el = audioElement as any;
        if (el.__webAudioConnected) {
            pannerNodeRef.current = el.__pannerNode || null;
            filterNodeRef.current = el.__filterNode || null;
            jungleRef.current = el.__jungle || null;
            return;
        }

        const ctx = getSharedAudioContext();
        if (!ctx) return;

        try {
            const sourceNode = ctx.createMediaElementSource(audioElement);
            el.__sourceNode = sourceNode;
            const filterNode = ctx.createBiquadFilter();
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 20000;

            const jungle = new Jungle(ctx);
            jungleRef.current = jungle;
            el.__jungle = jungle;

            const gainNode = ctx.createGain();
            gainNodeRef.current = gainNode;
            el.__gainNode = gainNode;

            if (ctx.createStereoPanner) {
                const pannerNode = ctx.createStereoPanner();
                sourceNode.connect(filterNode);
                filterNode.connect(jungle.input);
                jungle.output.connect(pannerNode);
                pannerNode.connect(gainNode);
                gainNode.connect(ctx.destination);
                pannerNodeRef.current = pannerNode;
                el.__pannerNode = pannerNode;
            } else {
                sourceNode.connect(filterNode);
                filterNode.connect(jungle.input);
                jungle.output.connect(gainNode);
                gainNode.connect(ctx.destination);
            }
            filterNodeRef.current = filterNode;
            el.__filterNode = filterNode;
            el.__webAudioConnected = true;
        } catch (error) {
            console.error("Error creating Web Audio source node:", error);
        }
    }, [audio.url]);

    // Unmount cleanup
    useEffect(() => {
        return () => {
            const el = audioRef.current as any;
            if (el && el.__jungle) {
                try {
                    el.__jungle.disconnect();
                } catch (e) {}
                el.__jungle = null;
            }
            if (el && el.__gainNode) {
                try {
                    el.__gainNode.disconnect();
                } catch (e) {}
                el.__gainNode = null;
            }
            if (el) {
                el.__webAudioConnected = false;
            }
            jungleRef.current = null;
            gainNodeRef.current = null;
        };
    }, []);

    // Update filter type and cutoff frequency based on proximity factor and filter type
    useEffect(() => {
        if (filterNodeRef.current) {
            const ctx = getSharedAudioContext();
            
            if (filterType === 'telephone') {
                filterNodeRef.current.type = 'bandpass';
                if (ctx) {
                    filterNodeRef.current.frequency.setTargetAtTime(1500, ctx.currentTime, 0.05);
                } else {
                    filterNodeRef.current.frequency.value = 1500;
                }
            } else if (filterType === 'wall') {
                filterNodeRef.current.type = 'lowpass';
                if (ctx) {
                    filterNodeRef.current.frequency.setTargetAtTime(450, ctx.currentTime, 0.05);
                } else {
                    filterNodeRef.current.frequency.value = 450;
                }
            } else if (filterType === 'lowpass') {
                filterNodeRef.current.type = 'lowpass';
                // Quadratic roll-off for natural air absorption:
                const targetFreq = 800 + 19200 * Math.pow(proximityFactor, 2);
                if (ctx) {
                    filterNodeRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
                } else {
                    filterNodeRef.current.frequency.value = targetFreq;
                }
            } else { // 'none'
                filterNodeRef.current.type = 'lowpass';
                if (ctx) {
                    filterNodeRef.current.frequency.setTargetAtTime(20000, ctx.currentTime, 0.1);
                } else {
                    filterNodeRef.current.frequency.value = 20000;
                }
            }
        }
    }, [proximityFactor, filterType]);

    // Update pan value dynamically
    useEffect(() => {
        const ctx = getSharedAudioContext();
        if (pannerNodeRef.current) {
            const p2D = pannerNodeRef.current as StereoPannerNode;
            if (ctx) {
                p2D.pan.setTargetAtTime(spatialPan, ctx.currentTime, 0.1);
            } else {
                p2D.pan.value = spatialPan;
            }
        }
    }, [spatialPan]);

    // Handle external forcePlay control
    useEffect(() => {
        if (forcePlay !== undefined) {
            setIsPlaying(forcePlay);
            if (forcePlay) {
                resumeAudioContext();
                audioRef.current?.play();
            } else {
                audioRef.current?.pause();
            }
        }
    }, [forcePlay]);

    // Handle volume with proximity factor and mute state using GainNode
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 1.0; // Let the GainNode handle the actual volume amplification
        }
        if (gainNodeRef.current) {
            const ctx = getSharedAudioContext();
            const targetGain = (isMuted ? 0 : localVolume) * proximityFactor;
            if (ctx) {
                gainNodeRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
            } else {
                gainNodeRef.current.gain.value = targetGain;
            }
        }
    }, [localVolume, proximityFactor, isMuted]);

    // Handle pitch control (shifting without speed change)
    useEffect(() => {
        const jungle = jungleRef.current || (audioRef.current as any)?.__jungle;
        if (jungle) {
            jungle.setPitchOffset(localPitch - 1.0);
        }
        if (audioRef.current) {
            audioRef.current.playbackRate = 1.0; // Playback speed remains normal
        }
    }, [localPitch, audio.url]);

    const { trackEvent } = useTracking();

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        resumeAudioContext();
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            if (onPlayStateChange) onPlayStateChange(false);
        } else {
            if (audioRef.current) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    if (onPlayStateChange) onPlayStateChange(true);
                }).catch(e => console.error("Error playing audio:", e));
            }
            trackEvent('audio_play', {
                file_name: audio.name,
                duration: duration
            });
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
                            if (onFilterChange) {
                                const nextFilter = filterType === 'none' ? 'lowpass' : filterType === 'lowpass' ? 'wall' : filterType === 'wall' ? 'telephone' : 'none';
                                onFilterChange(nextFilter);
                            }
                        }}
                        className={`p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors ${filterType !== 'none' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                        title={`Filtro: ${filterType === 'none' ? 'Nenhum' : filterType === 'lowpass' ? 'Passa-Baixas' : filterType === 'wall' ? 'Parede' : 'Telefone'}`}
                    >
                        <Filter size={14} className={filterType !== 'none' ? "text-blue-500" : "text-gray-500 dark:text-neutral-400"} />
                    </button>
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

            {/* Controls Section (Volume & Pitch) */}
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-neutral-700/50">
                {/* Volume Control Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 prevent-item-drag flex-grow">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors text-gray-500 dark:text-neutral-400 flex-shrink-0"
                            title={isMuted ? "Ativar som" : "Mudar para mudo"}
                        >
                            {isMuted ? <VolumeX size={14} className="text-red-500" /> : <Volume2 size={14} />}
                        </button>
                        <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-semibold select-none w-8">Vol:</span>
                        <input
                            type="range"
                            min="0.0"
                            max="5.0"
                            step="0.05"
                            value={isMuted ? 0 : localVolume}
                            disabled={isMuted}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setLocalVolume(val);
                                
                                if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
                                debounceTimeoutRef.current = setTimeout(() => {
                                    if (onVolumeChange) onVolumeChange(val);
                                }, 100);
                            }}
                            className="flex-1 h-1 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                            title="Ajustar volume"
                        />
                        <span className="text-[10px] text-gray-400 dark:text-neutral-400 w-8 text-right font-mono font-medium select-none">{Math.round((isMuted ? 0 : localVolume) * 100)}%</span>
                    </div>
                </div>

                {/* Pitch Control Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 prevent-item-drag flex-grow">
                        {/* Empty space matching the volume button width for alignment */}
                        <div className="w-6 flex-shrink-0" />
                        <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-semibold select-none w-8">Pitch:</span>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={localPitch}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setLocalPitch(val);

                                if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
                                debounceTimeoutRef.current = setTimeout(() => {
                                    if (onPitchChange) onPitchChange(val);
                                }, 100);
                            }}
                            className="flex-1 h-1 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            title="Ajustar pitch (afinação)"
                        />
                        <span className="text-[10px] text-gray-400 dark:text-neutral-400 w-8 text-right font-mono font-medium select-none">{Math.round(localPitch * 100)}%</span>
                    </div>
                    
                    {pitch !== 1.0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onPitchChange) {
                                    onPitchChange(1.0);
                                }
                            }}
                            className="ml-2 text-[9px] bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-600 dark:text-neutral-300 font-bold px-1.5 py-0.5 rounded transition-colors flex-shrink-0"
                            title="Resetar para normal (1.0x)"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Rotation Control Row */}
                {onRotationChange !== undefined && (
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 prevent-item-drag flex-grow">
                        <div className="w-6 flex-shrink-0" />
                        <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-semibold select-none w-8">Dir:</span>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={localRotation || 0}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setLocalRotation(val);

                                if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
                                debounceTimeoutRef.current = setTimeout(() => {
                                    if (onRotationChange) onRotationChange(val);
                                }, 100);
                            }}
                            className="flex-1 h-1 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            title="Ajustar direção"
                        />
                        <span className="text-[10px] text-gray-400 dark:text-neutral-400 w-8 text-right font-mono font-medium select-none">{localRotation || 0}°</span>
                    </div>
                </div>
                )}
            </div>

            <audio
                id={`gm-audio-${audio.id}`}
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
