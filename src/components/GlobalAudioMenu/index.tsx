import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Plus, X, GripHorizontal, Globe } from 'lucide-react';
import { useIDB } from '@/utils/indexedDB';
import { ActiveGlobalTrack } from '@/interfaces/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import AudioPlayerList from '../player-list';

interface GlobalAudioMenuProps {
    projectId: number;
    onClose: () => void;
    onInteraction?: () => void;
    zIndex?: number;
}

export default function GlobalAudioMenu({ projectId, onClose, onInteraction, zIndex = 50 }: GlobalAudioMenuProps) {
    const { savedAudios, activeGlobalTracks, addGlobalTrackPersisted, updateGlobalTrackPersisted, deleteGlobalTrackPersisted } = useIDB();
    const [isAdding, setIsAdding] = useState(false);
    
    const dragControls = useDragControls();
    const menuRef = useRef<HTMLDivElement>(null);
    const { size, setSize, position, setPosition, onDragEnd } = useViewportResize({
        initialSize: { width: 320, height: 400 },
        initialPosition: { x: typeof window !== 'undefined' && window.innerWidth >= 340 ? window.innerWidth - 340 : 20, y: 80 },
        minWidth: 300,
        minHeight: 200,
        margin: 20
    });

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            requestAnimationFrame(() => {
                setSize({
                    width: Math.max(300, startWidth + (moveEvent.clientX - startX)),
                    height: Math.max(200, startHeight + (moveEvent.clientY - startY))
                });
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleAddTrack = (audioId: number) => {
        const audio = savedAudios.find(a => a.id === audioId);
        if (!audio) return;

        addGlobalTrackPersisted({
            id: crypto.randomUUID(),
            type: 'globalTrack',
            linkedAudioId: audioId,
            volume: 0.5,
            isPlaying: true,
            order: activeGlobalTracks.length,
            filterType: 'none',
        } as ActiveGlobalTrack, projectId.toString());

        setIsAdding(false);
    };

    return (
        <motion.div
            ref={menuRef}
            layout={false}
            initial={false}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
                width: size.width,
                height: size.height,
                maxHeight: '80vh',
                zIndex: zIndex
            }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            className={`absolute flex flex-col bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-sm drop-shadow-xl overflow-hidden pointer-events-auto p-5`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDownCapture={onInteraction}
        >
            <div className={`flex flex-col h-full block`}>
                <div
                    className="w-full flex justify-between items-center mb-1 relative flex-shrink-0 touch-none cursor-move"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <span className="font-semibold text-gray-700 dark:text-neutral-200 flex items-center gap-2">
                        <Globe size={16} className="text-gray-700 dark:text-neutral-200" />
                        Áudio Global
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-blue-500 dark:text-neutral-400"
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Adicionar Áudio Global"
                        >
                            <Plus size={16} />
                        </button>
                        <GripHorizontal className="text-gray-400" />
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Fechar"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col h-full overflow-hidden mt-2">
                    {isAdding && (
                        <div className="p-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 mb-2 rounded max-h-40 overflow-y-auto">
                            <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Selecione um áudio</h3>
                            <div className="space-y-1">
                                {savedAudios.map(audio => (
                                    <button
                                        key={audio.id}
                                        onClick={() => handleAddTrack(audio.id)}
                                        className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded truncate transition-colors"
                                    >
                                        {audio.name}
                                    </button>
                                ))}
                                {savedAudios.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">Nenhum áudio salvo.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-1 space-y-2">
                        {activeGlobalTracks.length === 0 ? (
                            <div className="text-center text-gray-400 dark:text-neutral-500 text-sm mt-8">
                                Nenhuma trilha global adicionada.<br/>
                                Clique no + para adicionar.
                            </div>
                        ) : (
                            activeGlobalTracks.map(track => {
                                const audio = savedAudios.find(a => a.id === track.linkedAudioId);
                                if (!audio) return null;
                                return (
                                    <div key={track.id} className="group">
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
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 p-1 cursor-nwse-resize hover:bg-neutral-800 rounded-tl z-50 hidden md:block"
                    onMouseDown={handleResizeStart}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                        <path d="M21 15v6" />
                        <path d="M15 21h6" />
                        <path d="M21 3v6" opacity="0" />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
}
