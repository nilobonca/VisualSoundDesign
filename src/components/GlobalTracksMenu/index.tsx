import React from 'react';
import { useIDB } from '@/utils/indexedDB';
import { ActiveGlobalTrack } from '@/interfaces/utils/indexedDB';
import AudioPlayerList from '@/components/player-list';
import { Plus } from 'lucide-react';

export const GlobalTracksMenu: React.FC = () => {
    const { activeGlobalTracks, addGlobalTrackPersisted, updateGlobalTrackPersisted, deleteGlobalTrackPersisted, savedAudios } = useIDB();

    const handleDropOnMenu = (e: React.DragEvent) => {
        e.preventDefault();
        const itemType = e.dataTransfer.getData('itemType');
        const itemId = e.dataTransfer.getData('itemId');

        if (itemType === 'audio' && itemId) {
            const audioId = Number(itemId);
            const audio = savedAudios.find(a => a.id === audioId);
            if (audio) {
                const newTrack: ActiveGlobalTrack = {
                    id: crypto.randomUUID(),
                    type: 'globalTrack',
                    linkedAudioId: audioId,
                    volume: 1.0,
                    pitch: 1.0,
                    isPlaying: true,
                    order: activeGlobalTracks.length
                };
                addGlobalTrackPersisted(newTrack);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    return (
        <div
            className="w-full h-full p-4 flex flex-col gap-4 overflow-y-auto"
            onDrop={handleDropOnMenu}
            onDragOver={handleDragOver}
        >
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Música de Fundo</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">Arraste áudios de Assets</div>
            </div>

            {activeGlobalTracks.length === 0 && (
                <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-8">
                    <p className="text-sm mb-2">Nenhuma trilha ativa</p>
                    <p className="text-xs text-center">Arraste áudios da aba Assets para adicionar uma música global.</p>
                </div>
            )}

            {activeGlobalTracks.map(track => {
                const audio = savedAudios.find(a => a.id === track.linkedAudioId || a.id === Number(track.linkedAudioId));
                if (!audio) return null;

                return (
                    <div key={track.id} className="relative group rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2">
                        <AudioPlayerList
                            audio={audio}
                            onDelete={() => deleteGlobalTrackPersisted(track.id)}
                            onDuplicate={() => {
                                const newTrack = { ...track, id: crypto.randomUUID() };
                                addGlobalTrackPersisted(newTrack);
                            }}
                            volume={track.volume}
                            onVolumeChange={(v) => updateGlobalTrackPersisted({ ...track, volume: v })}
                            pitch={track.pitch}
                            onPitchChange={(p) => updateGlobalTrackPersisted({ ...track, pitch: p })}
                            filterType={track.filterType}
                            onFilterChange={(f) => updateGlobalTrackPersisted({ ...track, filterType: f })}
                            forcePlay={track.isPlaying}
                            onPlayStateChange={(playing) => updateGlobalTrackPersisted({ ...track, isPlaying: playing })}
                        />
                    </div>
                );
            })}
        </div>
    );
};
