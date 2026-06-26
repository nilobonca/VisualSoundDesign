import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Maximize2, X, GripHorizontal, Search } from 'lucide-react';
import { Players, ActiveArea, Audios } from '@/interfaces/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import AudioPlayerList from '../player-list';

interface ActivePlayersMenuProps {
    activePlayers: Players[];
    activeAreas?: ActiveArea[];
    savedAudios?: Audios[];
    activeAudioIds?: Set<number>;
    activeAreaIds?: Set<string>;
    onClose: () => void;
    onInteraction?: () => void;
    onLocatePlayer?: (player: Players | ActiveArea) => void;
    onDeletePlayer?: (id: string, type: 'player' | 'area') => void;
    proximityVolumes?: Map<number, number>;
    spatialPans?: Map<number, number>;
  spatial3D?: Map<number, {x: number, y: number}>;
  is3DEnabled?: boolean;
    audioFilters?: Map<number, 'none' | 'lowpass' | 'wall' | 'telephone'>;
    onUpdateArea?: (area: ActiveArea) => void;
}

const ActivePlayersMenu: React.FC<ActivePlayersMenuProps> = ({
    activePlayers,
    activeAreas = [],
    savedAudios = [],
    activeAudioIds = new Set(),
    activeAreaIds = new Set(),
    onClose,
    onInteraction,
    onLocatePlayer,
    onDeletePlayer,
    proximityVolumes = new Map(),
    spatialPans = new Map(),
    audioFilters = new Map(),
    onUpdateArea
}) => {
    const dragControls = useDragControls();
    const [searchTerm, setSearchTerm] = useState('');

    // Fix Hydration Mismatch: Use safe server defaults
    const { size, setSize, position, setPosition } = useViewportResize({
        initialSize: { width: 360, height: 400 },
        initialPosition: { x: 0, y: 100 }, // Safe default
        minWidth: 360,
        minHeight: 200
    });

    useEffect(() => {
        // Set actual position on client side only once mounted
        if (typeof window !== 'undefined') {
            setPosition((prev) => ({
                ...prev,
                x: window.innerWidth - 380
            }));
        }
    }, [setPosition]);



    // Constraints effect removed as it was unused

    const menuRef = React.useRef<HTMLDivElement>(null);

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        // Get actual position from ref
        const rect = menuRef.current?.getBoundingClientRect();
        const startLeft = rect?.left || position.x;
        const startTop = rect?.top || position.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(360, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));

            const maxWidth = window.innerWidth - startLeft - 30;
            const maxHeight = window.innerHeight - startTop - 30;

            setSize({
                width: Math.min(newWidth, maxWidth),
                height: Math.min(newHeight, maxHeight)
            });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Combine activePlayers and activeAreas (converted to player-like structure)
    const allPlayableItems = [
        ...activePlayers.map(p => ({ ...p, type: 'player' as const })),
        ...activeAreas
            .filter(a => a.linkedAudioId !== null)
            .map(a => {
                const audio = savedAudios.find(audio => audio.id === a.linkedAudioId);
                if (!audio) return null;

                // Calculate position (centroid or volume source)
                let x = 0, y = 0;
                if (a.volumeSourcePoint) {
                    x = a.volumeSourcePoint.x;
                    y = a.volumeSourcePoint.y;
                } else if (a.points && a.points.length > 0) {
                    a.points.forEach(p => { x += p.x; y += p.y; });
                    x /= a.points.length;
                    y /= a.points.length;
                }

                return {
                    id: a.id,
                    audio: audio,
                    position: { x, y },
                    type: 'area' as const,
                    original: a
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
    ];

    const filteredPlayers = allPlayableItems.filter(player =>
        player.audio.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderContent = () => (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-neutral-800">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-sm bg-gray-100 dark:bg-neutral-800 rounded border-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-neutral-200"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredPlayers.length > 0 ? (
                    filteredPlayers.map(player => (
                        <div key={player.id} className="group">
                            <AudioPlayerList
                                audio={player.audio}
                                onDelete={() => onDeletePlayer && onDeletePlayer(player.id, player.type)}
                                onDuplicate={() => { }} // Duplication not implemented for active players yet
                                forcePlay={player.type === 'area' ? activeAreaIds.has(player.id) : false}
                                proximityFactor={proximityVolumes.get(player.audio.id) ?? 1}
                                spatialPan={spatialPans.get(player.audio.id) ?? 0}
                                filterType={audioFilters.get(player.audio.id) ?? 'none'}
                                highlightedAudioId={null}
                                pitch={player.type === 'area' && 'original' in player ? ((player.original as ActiveArea).pitch ?? 1.0) : 1.0}
                                onPitchChange={(newPitch) => {
                                    if (player.type === 'area' && 'original' in player && onUpdateArea) {
                                        onUpdateArea({ ...(player.original as ActiveArea), pitch: newPitch });
                                    }
                                }}
                                volume={player.type === 'area' && 'original' in player ? ((player.original as ActiveArea).volume ?? 1.0) : 1.0}
                                audioRotation={player.type === 'area' && 'original' in player ? (player.original as any).audioRotation : undefined}
                                onRotationChange={(rotation) => {
                                    if (player.type === 'area' && 'original' in player && onUpdateArea) {
                                        onUpdateArea({ ...(player.original as any), audioRotation: rotation });
                                    }
                                }}
onVolumeChange={(newVolume) => {
                                    if (player.type === 'area' && 'original' in player && onUpdateArea) {
                                        onUpdateArea({ ...(player.original as ActiveArea), volume: newVolume });
                                    }
                                }}
                            />
                            
                            <div className="flex justify-between text-[10px] text-gray-500 dark:text-neutral-500 px-1 mt-1">
                                <div className="flex gap-2">
                                    <span>{player.type === 'area' ? 'Área' : 'Player'}</span>
                                    <span>X: {Math.round(player.position.x)}, Y: {Math.round(player.position.y)}</span>
                                </div>
                                {onLocatePlayer && (
                                    <button
                                        onClick={() => onLocatePlayer(player.type === 'area' ? player.original : player)}
                                        className="hover:text-blue-500 flex items-center gap-1"
                                    >
                                        <Maximize2 size={10} /> Localizar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-neutral-500 text-sm">
                        {searchTerm ? 'Nenhum player encontrado.' : 'Nenhum player ativo no canvas.'}
                    </div>
                )}
            </div>

            <div className="p-2 border-t border-gray-200 dark:border-neutral-800 text-xs text-gray-500 dark:text-neutral-500 text-center">
                {activePlayers.length} players ativos
            </div>
        </div>
    );



    return (
        <motion.div
            ref={menuRef}
            layout={false}
            initial={{ ...position }}
            style={{
                width: size.width,
                height: size.height,
                maxHeight: '80vh',
                x: position.x,
                y: position.y,
                zIndex: 50
            }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            className={`absolute flex flex-col bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-sm drop-shadow-xl overflow-hidden pointer-events-auto p-5`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDownCapture={onInteraction}
        >
            {/* Expanded View */}
            <div className={`flex flex-col h-full block`}>
                <div
                    className="w-full flex justify-between items-center mb-1 relative flex-shrink-0 touch-none cursor-move"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <span className="font-semibold text-gray-700 dark:text-neutral-200">Players Ativos</span>
                    <div className="flex items-center gap-2">

                        <GripHorizontal className="text-gray-400" />
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
                                onPointerDown={(e) => e.stopPropagation()}
                                title="Fechar"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {renderContent()}

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 p-1 cursor-nwse-resize hover:bg-neutral-800 rounded-tl z-50 hidden md:block"
                    onMouseDown={handleResizeStart}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                        <path d="M21 15v6" />
                        <path d="M15 21h6" />
                        <path d="M21 3v6" opacity="0" /> {/* Spacer */}
                    </svg>
                </div>
            </div>
        </motion.div>
    );
};

export default ActivePlayersMenu;
