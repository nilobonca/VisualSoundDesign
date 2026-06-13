import React, { useEffect, useRef } from 'react';
import { useIDB } from '@/utils/indexedDB';
import { getSharedAudioContext } from '@/utils/audio/audioContext';

export default function GlobalAudioPlayer() {
    const { activeGlobalTracks, savedAudios } = useIDB();
    const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
    const audioNodes = useRef<{ [id: string]: { source: MediaElementAudioSourceNode, gain: GainNode } }>({});

    useEffect(() => {
        // Sync volume, loop, and play state
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
                            // If it fails (e.g. already connected but we lost the ref), we fallback
                        }
                    }
                } else {
                     audioNodes.current[track.id] = nodes; // restore ref if needed
                }

                const trackNodes = audioNodes.current[track.id];
                if (trackNodes) {
                    audioElement.volume = 1; // Native volume should be 1, gain node handles it
                    trackNodes.gain.gain.value = track.volume;
                    console.log(`[GlobalAudioPlayer] Web Audio Gain applied for track ${track.id}:`, track.volume);
                } else {
                    // Fallback if audio context failed
                    audioElement.volume = Math.max(0, Math.min(1, track.volume));
                    console.log(`[GlobalAudioPlayer] Fallback volume applied for track ${track.id}:`, audioElement.volume);
                }

                audioElement.loop = true; // For now, all global tracks loop

                if (track.isPlaying) {
                    // Only play if paused to avoid DOMException
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

    return (
        <div style={{ display: 'none' }}>
            {activeGlobalTracks.map(track => {
                const audioData = savedAudios.find(a => a.id === track.linkedAudioId);
                if (!audioData) return null;

                return (
                    <audio
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
