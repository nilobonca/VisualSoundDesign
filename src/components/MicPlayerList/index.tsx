import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Trash2, Sliders, Settings } from 'lucide-react';
import { getSharedAudioContext, resumeAudioContext } from "@/utils/audio/audioContext";
import { useCanvasGlobalStore } from '@/store/canvasStore';
import { Jungle } from "@/utils/audio/jungle";

interface MicPlayerListProps {
    trackId: string;
    onDelete: (id: string) => void;
    spatialPan?: number;
    filterType?: 'none' | 'lowpass' | 'wall' | 'telephone';
    pitch?: number;
    volume?: number;
    onVolumeChange?: (volume: number) => void;
    onPitchChange?: (pitch: number) => void;
    onFilterChange?: (filter: 'none' | 'lowpass' | 'wall' | 'telephone') => void;
    onPlayStateChange?: (playing: boolean) => void;
    isActive: boolean; // mapped to track.isPlaying
}

const MicPlayerList: React.FC<MicPlayerListProps> = ({
    trackId,
    onDelete,
    spatialPan = 0,
    filterType = 'none',
    pitch = 1.0,
    volume = 1.0,
    onVolumeChange,
    onPitchChange,
    onFilterChange,
    onPlayStateChange,
    isActive
}) => {
    const streamRef = useRef<MediaStream | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const filterNodeRef = useRef<BiquadFilterNode | null>(null);
    const jungleRef = useRef<Jungle | null>(null);
    const pannerNodeRef = useRef<StereoPannerNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    const [localVolume, setLocalVolume] = useState(volume);
    const [localPitch, setLocalPitch] = useState(pitch);
    const [isMuted, setIsMuted] = useState(!isActive);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const isUnmounted = useRef(false);

    const masterVolume = useCanvasGlobalStore(state => state.masterVolume);

    const initMicrophone = useCallback(async () => {
        if (streamRef.current) return; // Already initialized

        try {
            await resumeAudioContext();
            const ctx = getSharedAudioContext();
            if (!ctx) return;

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("Microphone API not supported (or insecure context).");
                setHasPermission(false);
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                }
            });
            
            streamRef.current = stream;
            setHasPermission(true);

            const sourceNode = ctx.createMediaStreamSource(stream);
            sourceNodeRef.current = sourceNode;

            const filterNode = ctx.createBiquadFilter();
            switch (filterType) {
                case 'lowpass':
                    filterNode.type = 'lowpass';
                    filterNode.frequency.value = 1000;
                    break;
                case 'wall':
                    filterNode.type = 'lowpass';
                    filterNode.frequency.value = 300;
                    break;
                case 'telephone':
                    filterNode.type = 'bandpass';
                    filterNode.frequency.value = 1500;
                    filterNode.Q.value = 2.0;
                    break;
                default:
                    filterNode.type = 'allpass';
                    break;
            }
            filterNodeRef.current = filterNode;

            const jungle = new Jungle(ctx);
            jungle.setPitchOffset(pitch - 1);
            jungleRef.current = jungle;

            const gainNode = ctx.createGain();
            gainNode.gain.value = isMuted ? 0 : localVolume;
            gainNodeRef.current = gainNode;

            if (ctx.createStereoPanner) {
                const pannerNode = ctx.createStereoPanner();
                pannerNode.pan.value = spatialPan;
                pannerNodeRef.current = pannerNode;

                sourceNode.connect(filterNode);
                filterNode.connect(jungle.input);
                jungle.output.connect(pannerNode);
                pannerNode.connect(gainNode);
                gainNode.connect(ctx.destination);
            } else {
                sourceNode.connect(filterNode);
                filterNode.connect(jungle.input);
                jungle.output.connect(gainNode);
                gainNode.connect(ctx.destination);
            }

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setHasPermission(false);
        }
    }, [localVolume, spatialPan, isMuted]);

    const stopMicrophone = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (jungleRef.current) {
            try { jungleRef.current.disconnect(); } catch (e) {}
            jungleRef.current = null;
        }
        if (gainNodeRef.current) {
            try { gainNodeRef.current.disconnect(); } catch (e) {}
            gainNodeRef.current = null;
        }
        if (filterNodeRef.current) {
            try { filterNodeRef.current.disconnect(); } catch (e) {}
            filterNodeRef.current = null;
        }
        if (pannerNodeRef.current) {
            try { pannerNodeRef.current.disconnect(); } catch (e) {}
            pannerNodeRef.current = null;
        }
    }, []);

    useEffect(() => {
        // Start automatically if isActive
        if (isActive && hasPermission !== false) {
            initMicrophone();
            setIsMuted(false);
        } else if (!isActive) {
            stopMicrophone();
            setIsMuted(true);
        }
    }, [isActive, initMicrophone, hasPermission]);

    useEffect(() => {
        return () => {
            isUnmounted.current = true;
            stopMicrophone();
        };
    }, [stopMicrophone]);

    // Volume effect
    useEffect(() => {
        setLocalVolume(volume);
        const ctx = getSharedAudioContext();
        if (gainNodeRef.current && ctx) {
            gainNodeRef.current.gain.setTargetAtTime(isMuted ? 0 : volume * masterVolume, ctx.currentTime, 0.05);
        }
    }, [volume, isMuted, masterVolume]);

    // Pitch effect
    useEffect(() => {
        setLocalPitch(pitch);
        if (jungleRef.current) {
            jungleRef.current.setPitchOffset(pitch - 1);
        }
    }, [pitch]);

    // Filter effect
    useEffect(() => {
        if (!filterNodeRef.current) return;
        const filterNode = filterNodeRef.current;
        const ctx = getSharedAudioContext();
        if (!ctx) return;

        switch (filterType) {
            case 'lowpass':
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(1000, ctx.currentTime);
                filterNode.Q.setValueAtTime(1, ctx.currentTime);
                break;
            case 'wall':
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(400, ctx.currentTime);
                filterNode.Q.setValueAtTime(0, ctx.currentTime);
                break;
            case 'telephone':
                filterNode.type = 'bandpass';
                filterNode.frequency.setValueAtTime(1500, ctx.currentTime);
                filterNode.Q.setValueAtTime(2.0, ctx.currentTime);
                break;
            case 'none':
            default:
                filterNode.type = 'allpass';
                break;
        }
    }, [filterType]);

    // Panning effect
    useEffect(() => {
        const ctx = getSharedAudioContext();
        if (pannerNodeRef.current && ctx) {
            pannerNodeRef.current.pan.setTargetAtTime(spatialPan, ctx.currentTime, 0.05);
        }
    }, [spatialPan]);

    const toggleMute = () => {
        if (!streamRef.current && !isMuted) {
            initMicrophone();
        }
        
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        
        if (onPlayStateChange) {
            onPlayStateChange(!newMuted);
        }
    };

    return (
        <div className="flex flex-col bg-neutral-100 dark:bg-neutral-800 rounded shadow-sm border border-neutral-200 dark:border-neutral-700/50 relative overflow-hidden group">
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMute}
                        className={`p-2 rounded-full transition-colors ${
                            isMuted ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                        title={isMuted ? "Ligar Microfone" : "Desligar Microfone"}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            Microfone Ao Vivo
                        </span>
                        {hasPermission === false && (
                            <span className="text-xs text-red-500 font-medium">Permissão Negada</span>
                        )}
                        {hasPermission && !isMuted && (
                            <span className="text-xs text-green-500 font-medium animate-pulse">Captando Áudio...</span>
                        )}
                        {hasPermission && isMuted && (
                            <span className="text-xs text-neutral-500 font-medium">Desativado</span>
                        )}
                    </div>
                </div>

                <div className="flex gap-1">
                    <button
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                        onClick={() => onDelete(trackId)}
                        title="Remover Microfone"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MicPlayerList;
