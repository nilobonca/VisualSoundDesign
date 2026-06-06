import React, { useEffect, useRef } from 'react';
import { useIDB } from '@/utils/indexedDB';

export default function GlobalAudioPlayer() {
    const { activeGlobalTracks, savedAudios } = useIDB();
    const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});

    useEffect(() => {
        // Sync volume, loop, and play state
        activeGlobalTracks.forEach((track) => {
            const audioElement = audioRefs.current[track.id];
            if (audioElement) {
                audioElement.volume = track.volume;
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
