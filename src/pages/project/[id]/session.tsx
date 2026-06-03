import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Jungle } from '@/utils/audio/jungle';
import { getSharedAudioContext, resumeAudioContext } from '@/utils/audio/audioContext';
import { Volume2, VolumeX, Wifi, Users, Activity, LogOut, ArrowLeft } from 'lucide-react';
import Head from 'next/head';

interface ActiveAudioUpdate {
    audioId: number;
    url: string;
    volume: number;
    pan: number;
    filterType: 'none' | 'lowpass' | 'wall' | 'telephone';
    pitch: number;
    loop: boolean;
}

interface AudioInstance {
    audioId: number;
    sound: HTMLAudioElement;
    sourceNode: MediaElementAudioSourceNode;
    filterNode: BiquadFilterNode;
    jungle: Jungle;
    pannerNode: StereoPannerNode | null;
}

export default function ListenerSession() {
    const router = useRouter();
    const { id: projectId } = router.query;

    const [username, setUsername] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [listenerId, setListenerId] = useState('');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
    const [ping, setPing] = useState<number | null>(null);
    const [showSpectrogram, setShowSpectrogram] = useState(true);
    const [activeCount, setActiveCount] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const activeLoopsRef = useRef<Map<number, AudioInstance>>(new Map());
    const activeSoundboardRef = useRef<Map<string, { sound: HTMLAudioElement; jungle?: Jungle }[]>>(new Map());
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const channelRef = useRef<any>(null);

    // Generate a unique listenerId on mount
    useEffect(() => {
        setListenerId(Math.random().toString(36).substring(2, 11));
    }, []);

    // Setup Web Audio Analyser
    const initAudioGraph = useCallback(() => {
        if (audioContextRef.current) return;
        
        resumeAudioContext();
        const ctx = getSharedAudioContext();
        if (!ctx) return;
        
        audioContextRef.current = ctx;
        
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
    }, []);

    // Scroll spectrogram drawing loop
    const drawSpectrogram = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Scroll left by copying canvas and drawing offset
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.drawImage(canvas, 0, 0);
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(tempCanvas, -1.0, 0);
        }

        // Draw new column at x = width - 1
        const x = width - 1;
        const barHeight = height / bufferLength;

        for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i]; // 0-255
            let r = 0, g = 0, b = 0;
            
            if (value > 0) {
                // Beautiful retro-futuristic purple-orange heat map gradient
                const percent = value / 255;
                r = Math.floor(Math.max(0, (percent - 0.25) / 0.75) * 255);
                g = Math.floor(Math.max(0, (percent - 0.5) / 0.5) * 200);
                b = Math.floor(Math.min(1.0, (1.0 - percent) * 1.5) * 180 + percent * 50);
            }

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            // Low frequencies at the bottom
            ctx.fillRect(x, height - (i * barHeight), 1, barHeight);
        }

        animationRef.current = requestAnimationFrame(drawSpectrogram);
    }, []);

    // Start/Stop Spectrogram drawing based on visibility and status
    useEffect(() => {
        if (isJoined && showSpectrogram && status === 'connected') {
            animationRef.current = requestAnimationFrame(drawSpectrogram);
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isJoined, showSpectrogram, status, drawSpectrogram]);

    // Apply filters and acoustic effects smooth transitions
    const applyAudioParameters = (instance: AudioInstance, update: ActiveAudioUpdate) => {
        const ctx = audioContextRef.current;
        if (!ctx) return;

        // Smooth volume update
        instance.sound.volume = update.volume;

        // Smooth panning update
        if (instance.pannerNode) {
            instance.pannerNode.pan.setTargetAtTime(update.pan, ctx.currentTime, 0.1);
        }

        // Apply filters
        const filter = instance.filterNode;
        if (update.filterType === 'telephone') {
            filter.type = 'bandpass';
            filter.frequency.setTargetAtTime(1500, ctx.currentTime, 0.05);
        } else if (update.filterType === 'wall') {
            filter.type = 'lowpass';
            filter.frequency.setTargetAtTime(450, ctx.currentTime, 0.05);
        } else if (update.filterType === 'lowpass') {
            filter.type = 'lowpass';
            filter.frequency.setTargetAtTime(1000, ctx.currentTime, 0.05);
        } else {
            filter.type = 'lowpass';
            filter.frequency.setTargetAtTime(20000, ctx.currentTime, 0.1);
        }

        // Apply pitch transposer
        instance.jungle.setPitchOffset(update.pitch - 1.0);
    };

    // Clean up single audio loop instance
    const destroyAudioInstance = (instance: AudioInstance) => {
        try {
            instance.sound.pause();
            instance.sound.src = '';
            instance.sound.load();
        } catch (e) {}

        try {
            instance.jungle.disconnect();
            if (instance.pannerNode) instance.pannerNode.disconnect();
            instance.filterNode.disconnect();
            instance.sourceNode.disconnect();
        } catch (e) {}
    };

    // Sync active loop plays dynamically
    const syncAudioLoops = useCallback((updates: ActiveAudioUpdate[]) => {
        initAudioGraph();
        const ctx = audioContextRef.current;
        const analyser = analyserRef.current;
        if (!ctx || !analyser) return;

        const currentLoops = activeLoopsRef.current;
        const updatedIds = new Set(updates.map(u => u.audioId));

        // 1. Remove loops not in updates
        for (const [audioId, instance] of currentLoops.entries()) {
            if (!updatedIds.has(audioId)) {
                destroyAudioInstance(instance);
                currentLoops.delete(audioId);
            }
        }

        // 2. Add or update loops
        updates.forEach(update => {
            let instance = currentLoops.get(update.audioId);

            if (instance) {
                // Update parameters
                applyAudioParameters(instance, update);
            } else {
                // Create new playing loop
                try {
                    const sound = new Audio(update.url);
                    sound.loop = true;
                    sound.crossOrigin = 'anonymous';

                    const sourceNode = ctx.createMediaElementSource(sound);
                    const filterNode = ctx.createBiquadFilter();
                    const jungle = new Jungle(ctx);
                    let pannerNode: StereoPannerNode | null = null;

                    sourceNode.connect(filterNode);
                    filterNode.connect(jungle.input);

                    if (ctx.createStereoPanner) {
                        pannerNode = ctx.createStereoPanner();
                        jungle.output.connect(pannerNode);
                        pannerNode.connect(analyser);
                    } else {
                        jungle.output.connect(analyser);
                    }

                    const newInstance: AudioInstance = {
                        audioId: update.audioId,
                        sound,
                        sourceNode,
                        filterNode,
                        jungle,
                        pannerNode
                    };

                    applyAudioParameters(newInstance, update);
                    currentLoops.set(update.audioId, newInstance);

                    sound.play().catch(err => console.error("Loop autoplay blocked:", err));
                } catch (e) {
                    console.error("Failed to create loop audio nodes:", e);
                }
            }
        });

        setActiveCount(currentLoops.size);
    }, [initAudioGraph]);

    // Handle single soundboard play/stop events
    const handleSoundboardPlay = useCallback((payload: { soundboardItemId: string; audioId: number; url: string; mode: 'restart' | 'overlap'; pitch: number; volume: number }) => {
        initAudioGraph();
        const ctx = audioContextRef.current;
        const analyser = analyserRef.current;
        if (!ctx || !analyser) return;

        const { soundboardItemId, url, mode, pitch, volume } = payload;

        // If restart mode, stop existing plays for this soundboard item
        if (mode === 'restart') {
            const activeList = activeSoundboardRef.current.get(soundboardItemId);
            if (activeList) {
                activeList.forEach(item => {
                    try {
                        item.sound.pause();
                        if (item.jungle) item.jungle.disconnect();
                    } catch (e) {}
                });
                activeSoundboardRef.current.delete(soundboardItemId);
            }
        }

        try {
            const sound = new Audio(url);
            sound.crossOrigin = 'anonymous';
            sound.volume = volume;

            let jungleNode: Jungle | undefined;

            // Connect Web Audio API graph
            const sourceNode = ctx.createMediaElementSource(sound);
            if (pitch !== 1.0) {
                jungleNode = new Jungle(ctx);
                jungleNode.setPitchOffset(pitch - 1.0);
                sourceNode.connect(jungleNode.input);
                jungleNode.output.connect(analyser);
            } else {
                sourceNode.connect(analyser);
            }

            const playItem = { sound, jungle: jungleNode };
            const currentList = activeSoundboardRef.current.get(soundboardItemId) || [];
            activeSoundboardRef.current.set(soundboardItemId, [...currentList, playItem]);

            sound.onended = () => {
                if (playItem.jungle) {
                    try {
                        playItem.jungle.disconnect();
                    } catch (e) {}
                }
                const updated = (activeSoundboardRef.current.get(soundboardItemId) || []).filter(i => i !== playItem);
                if (updated.length === 0) {
                    activeSoundboardRef.current.delete(soundboardItemId);
                } else {
                    activeSoundboardRef.current.set(soundboardItemId, updated);
                }
            };

            sound.play().catch(e => console.error("Soundboard play blocked:", e));
        } catch (e) {
            console.error("Failed to play soundboard audio:", e);
        }
    }, [initAudioGraph]);

    const handleSoundboardStop = useCallback((soundboardItemId: string) => {
        const list = activeSoundboardRef.current.get(soundboardItemId);
        if (list) {
            list.forEach(item => {
                try {
                    item.sound.pause();
                    if (item.jungle) item.jungle.disconnect();
                } catch (e) {}
            });
            activeSoundboardRef.current.delete(soundboardItemId);
        }
    }, []);

    // Join Session
    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !projectId) return;

        setStatus('connecting');
        initAudioGraph();

        // 1. Setup Supabase Channel
        const channelName = `session:${projectId}`;
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        // 2. Event Listeners
        channel
            .on('presence', { event: 'sync' }, () => {
                setStatus('connected');
                setIsJoined(true);
            })
            .on('broadcast', { event: 'audio_state' }, (payload: any) => {
                if (payload.payload.listenerId === listenerId) {
                    syncAudioLoops(payload.payload.activeAudios);
                }
            })
            .on('broadcast', { event: 'soundboard_play' }, (payload: any) => {
                handleSoundboardPlay(payload.payload);
            })
            .on('broadcast', { event: 'soundboard_stop' }, (payload: any) => {
                handleSoundboardStop(payload.payload.soundboardItemId);
            })
            .on('broadcast', { event: 'ping' }, (payload: any) => {
                // Reply immediately with pong containing latency trigger
                channel.send({
                    type: 'broadcast',
                    event: 'pong',
                    payload: {
                        listenerId,
                        timestamp: payload.payload.timestamp
                    }
                });
            })
            .on('broadcast', { event: 'ping_response' }, (payload: any) => {
                // Targeted latency ping feedback if GM replies directly
                if (payload.payload.listenerId === listenerId) {
                    setPing(payload.payload.ping);
                }
            })
            .on('broadcast', { event: 'kick_listener' }, (payload: any) => {
                if (payload.payload.listenerId === listenerId) {
                    alert("Você foi desconectado da sessão pelo Narrador.");
                    handleLeave();
                }
            });

        // 3. Subscribe & Track Presence
        channel.subscribe(async (subStatus) => {
            if (subStatus === 'SUBSCRIBED') {
                await channel.track({
                    listenerId,
                    name: username,
                    onlineAt: new Date().toISOString()
                });
            } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
                setStatus('disconnected');
            }
        });
    };

    // Leave Session Cleanly
    const handleLeave = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }

        // Clear active loop audios
        activeLoopsRef.current.forEach(instance => destroyAudioInstance(instance));
        activeLoopsRef.current.clear();

        // Clear soundboard audios
        activeSoundboardRef.current.forEach(list => {
            list.forEach(item => {
                try {
                    item.sound.pause();
                    if (item.jungle) item.jungle.disconnect();
                } catch (e) {}
            });
        });
        activeSoundboardRef.current.clear();

        setIsJoined(false);
        setStatus('idle');
        setPing(null);
        setActiveCount(0);
    }, []);

    // Unmount Cleanup
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
            activeLoopsRef.current.forEach(instance => destroyAudioInstance(instance));
        };
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans relative overflow-hidden">
            <Head>
                <title>Sessão de Áudio Compartilhada</title>
                <meta name="description" content="Conecte-se para ouvir áudios espaciais 3D em tempo real do Narrador." />
            </Head>

            {/* Glowing background gradient elements for dark fantasy design */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none" />

            {!isJoined ? (
                // 1. Name Input Login Screen
                <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                    <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl p-8 shadow-2xl relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                        
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                                <Users size={32} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-center mb-2 tracking-tight text-white">Entrar na Sessão</h2>
                        <p className="text-sm text-neutral-400 text-center mb-8">
                            Digite seu nome de aventureiro para ouvir trilhas e efeitos sonoros 3D transmitidos em tempo real pelo Narrador.
                        </p>

                        <form onSubmit={handleJoin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Seu Nome</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={30}
                                    placeholder="Ex: Legolas, GM..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'connecting'}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg hover:shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {status === 'connecting' ? 'Conectando...' : 'Entrar na Aventura'}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                // 2. Fully Connected Minimal Screen
                <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full relative z-10">
                    {/* Top status bar */}
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                            <span className="flex h-3.5 w-3.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                            </span>
                            <div>
                                <h3 className="font-semibold text-white tracking-tight leading-none text-sm">{username}</h3>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1 block">Ouvinte Conectado</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Latency Indicator */}
                            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 text-xs">
                                <Wifi size={12} className={ping && ping < 150 ? 'text-emerald-400' : 'text-yellow-500'} />
                                <span className="text-neutral-300 font-mono">{ping !== null ? `${ping}ms` : 'calculando...'}</span>
                            </div>

                            {/* Active Audio Count */}
                            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 text-xs">
                                <Activity size={12} className="text-indigo-400" />
                                <span className="text-neutral-300 font-mono">{activeCount} canais</span>
                            </div>

                            {/* Disconnect Button */}
                            <button
                                onClick={handleLeave}
                                className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 p-2 rounded-full transition-colors cursor-pointer"
                                title="Sair da Sessão"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Immersive Center Content */}
                    <div className="flex-1 flex flex-col justify-center items-center py-8">
                        <div className="text-center max-w-md mb-8">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-pulse">
                                <Volume2 size={36} />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight mb-2">Transmissão Sintonizada</h2>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                Você está ouvindo o áudio posicional configurado pelo Narrador. Ajuste o balanço de seus fones de ouvido para imersão total.
                            </p>
                        </div>

                        {/* Spectrogram Canvas Section */}
                        <div className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                                    <Activity size={14} className="text-indigo-400" />
                                    Espectrograma Acústico
                                </span>
                                <button
                                    onClick={() => setShowSpectrogram(!showSpectrogram)}
                                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1 rounded transition-colors cursor-pointer font-medium"
                                >
                                    {showSpectrogram ? 'Ocultar Visualizador' : 'Mostrar Visualizador'}
                                </button>
                            </div>

                            {showSpectrogram ? (
                                <div className="bg-black/60 rounded-lg overflow-hidden border border-neutral-800/50 relative h-[180px] w-full">
                                    <canvas
                                        ref={canvasRef}
                                        width={800}
                                        height={180}
                                        className="w-full h-full block bg-black"
                                    />
                                    {activeCount === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] text-neutral-600 font-mono uppercase tracking-widest">
                                            Silêncio no Canvas
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="border border-dashed border-neutral-800 rounded-lg py-8 text-center text-xs text-neutral-500 font-medium">
                                    Visualizador desativado para economia de recursos.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-[10px] text-neutral-600 text-center pt-4 select-none">
                        ID Ouvinte: {listenerId} • Visual Sound Design Multiplayer Engine v1.0
                    </div>
                </div>
            )}
        </div>
    );
}
