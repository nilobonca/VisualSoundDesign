const fs = require('fs');

let content = fs.readFileSync('src/components/GlobalAudioMenu/index.tsx', 'utf8');

const additionalControls = `
                                    <div key={track.id} className="group flex flex-col mb-4">
                                        <AudioPlayerList
                                            audio={audio}
                                            onDelete={() => deleteGlobalTrackPersisted(track.id)}
                                            onDuplicate={() => {}}
                                            forcePlay={track.isPlaying}
                                            proximityFactor={1}
                                            spatialPan={0}
                                            filterType="none"
                                            highlightedAudioId={null}
                                            pitch={1.0}
                                            onPitchChange={() => {}}
                                            volume={track.volume}
                                            onVolumeChange={(newVolume) => {
                                                updateGlobalTrackPersisted({ ...track, volume: newVolume });
                                            }}
                                            onPlayStateChange={(playing) => {
                                                updateGlobalTrackPersisted({ ...track, isPlaying: playing });
                                            }}
                                        />
                                        <div className="flex flex-col gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-b border-x border-b border-neutral-200 dark:border-neutral-700/50 mt-[-2px]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium w-16">Esq/Dir</span>
                                                <input
                                                    type="range" min="-1" max="1" step="0.05"
                                                    value={track.spatialPan || 0}
                                                    onChange={(e) => updateGlobalTrackPersisted({ ...track, spatialPan: parseFloat(e.target.value) })}
                                                    className="w-full accent-emerald-500"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium w-16">Frente/Trás</span>
                                                <input
                                                    type="range" min="-1" max="1" step="0.05"
                                                    value={track.spatialFade || 0}
                                                    onChange={(e) => updateGlobalTrackPersisted({ ...track, spatialFade: parseFloat(e.target.value) })}
                                                    className="w-full accent-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
`;

// Replace the block returning <div key={track.id} className="group"> ... </div>
const oldBlock = `                                    <div key={track.id} className="group">
                                        <AudioPlayerList
                                            audio={audio}
                                            onDelete={() => deleteGlobalTrackPersisted(track.id)}
                                            onDuplicate={() => {}}
                                            forcePlay={track.isPlaying}
                                            proximityFactor={1}
                                            spatialPan={0}
                                            filterType="none"
                                            highlightedAudioId={null}
                                            pitch={1.0}
                                            onPitchChange={() => {}}
                                            volume={track.volume}
                                            onVolumeChange={(newVolume) => {
                                                updateGlobalTrackPersisted({ ...track, volume: newVolume });
                                            }}
                                            onPlayStateChange={(playing) => {
                                                updateGlobalTrackPersisted({ ...track, isPlaying: playing });
                                            }}
                                        />
                                    </div>`;

content = content.replace(oldBlock, additionalControls.trim());

fs.writeFileSync('src/components/GlobalAudioMenu/index.tsx', content, 'utf8');
console.log('Updated GlobalAudioMenu!');
