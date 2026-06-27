import React, { useEffect, useRef } from 'react';
import { useIDB } from '@/utils/indexedDB';
import { getSharedAudioContext } from '@/utils/audio/audioContext';
import { ActiveGlobalTrack } from '@/interfaces/utils/indexedDB';
import { useCanvasGlobalStore } from '@/store/canvasStore';

interface GlobalAudioPlayerProps {
    activeGlobalTracks: ActiveGlobalTrack[];
}

export default function GlobalAudioPlayer({ activeGlobalTracks }: GlobalAudioPlayerProps) {
    const { savedAudios } = useIDB();
    const masterVolume = useCanvasGlobalStore(state => state.masterVolume);
    const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
    const audioNodes = useRef<{ [id: string]: { source: MediaElementAudioSourceNode, gain: GainNode } }>({});

    useEffect(() => {
        // Sync volume, loop, and play state (Reacts to DB changes)
        activeGlobalTracks.forEach((track) => {
            const audioElement = audioRefs.current[track.id];
            if (audioElement) {
                // Initialize Web Audio API nodes if not already done
                let nodes = (audioElement as any).__audioNodes;
                if (!nodes) {
                    const ctx = getSharedAudioContext();
                    if (ctx) {
                        try {
                            const source = ctx.createMediaElementSource(audioElement);
                            const gain = ctx.createGain();
                            source.connect(gain);
                            gain.connect(ctx.destination);
                            nodes = { source, gain };
                            (audioElement as any).__audioNodes = nodes;
                            audioNodes.current[track.id] = nodes;
                        } catch (e) {
                            console.error("Error creating audio nodes:", e);
                        }
                    }
                } else {
                     audioNodes.current[track.id] = nodes;
                }

                audioElement.loop = true;

                if (track.isPlaying) {
                    if (audioElement.paused) {
                        audioElement.play().catch(e => console.error("Error playing global track:", e));
                    }
                } else {
                    if (!audioElement.paused) {
                        audioElement.pause();
                    }
                }
            }
        });
    }, [activeGlobalTracks]);

    // Continuous sync for time and muting (Handles menu opening/closing without DB changes)
    useEffect(() => {
        const interval = setInterval(() => {
            activeGlobalTracks.forEach((track) => {
                const audioElement = audioRefs.current[track.id];
                if (audioElement) {
                    const trackNodes = audioNodes.current[track.id];
                    const uiAudioEl = document.getElementById(`gm-audio-${track.id}`) as HTMLAudioElement;
                    
                    // Enforce play state if it should be playing but is paused
                    if (track.isPlaying && audioElement.paused) {
                        audioElement.play().catch(e => {
                            // Ignore AbortError, it's common when interrupting play calls
                            if (e.name !== 'AbortError') console.error(e);
                        });
                    }

                    if (uiAudioEl) {
                        // Sync time if the UI player is scrubbed
                        if (Math.abs(audioElement.currentTime - uiAudioEl.currentTime) > 0.3) {
                            audioElement.currentTime = uiAudioEl.currentTime;
                        }
                        // Mute the background player so we don't get double audio when the menu is open
                        if (trackNodes) trackNodes.gain.gain.value = 0;
                        else audioElement.volume = 0;
                    } else {
                        // Restore volume when menu is closed
                        if (trackNodes) trackNodes.gain.gain.value = track.volume * masterVolume;
                        else audioElement.volume = Math.max(0, Math.min(1, track.volume * masterVolume));
                    }
                }
            });
        }, 100);

        return () => clearInterval(interval);
    }, [activeGlobalTracks, masterVolume]);

    return (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0.01, pointerEvents: 'none' }}>
            {activeGlobalTracks.map(track => {
                const audioData = savedAudios.find(a => a.id === track.linkedAudioId || a.id === Number(track.linkedAudioId));
                if (!audioData) return null;

                return (
                    <audio
                        id={`gm-audio-global-${track.id}`}
                        key={track.id}
                        ref={(el) => {
                            if (el) {
                                audioRefs.current[track.id] = el;
                            } else {
                                // Cleanup on unmount
                                const nodes = audioNodes.current[track.id];
                                if (nodes) {
                                    nodes.source.disconnect();
                                    nodes.gain.disconnect();
                                    delete audioNodes.current[track.id];
                                }
                                delete audioRefs.current[track.id];
                            }
                        }}
                        src={audioData.url}
                        preload="auto"
                    />
                );
            })}
        </div>
    );
}
