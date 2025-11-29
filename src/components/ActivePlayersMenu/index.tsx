import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Maximize2, Minus, X, GripHorizontal, Play, Pause, Volume2, Search } from 'lucide-react';
import { Players, ActiveArea, Audios } from '@/interfaces/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import AudioPlayerList from '../player-list';

interface ActivePlayersMenuProps {
    activePlayers: Players[]; // Keep for compatibility if needed, or remove
    activeAreas?: ActiveArea[]; // New prop
    savedAudios?: Audios[]; // New prop
    onClose: () => void;
    onDock?: () => void;
    isDocked?: boolean;
    onInteraction?: () => void;
    onLocatePlayer?: (player: Players | ActiveArea) => void;
    onDeletePlayer?: (id: string, type: 'player' | 'area') => void;
}

const ActivePlayersMenu: React.FC<ActivePlayersMenuProps> = ({
    activePlayers,
    activeAreas = [],
    savedAudios = [],
    onClose,
    onDock,
    isDocked = false,
    onInteraction,
    onLocatePlayer,
    onDeletePlayer
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dragControls = useDragControls();
    const [searchTerm, setSearchTerm] = useState('');

    const { size, setSize, position, onDragEnd } = useViewportResize({
        initialSize: { width: 300, height: 400 },
        initialPosition: { x: window.innerWidth - 320, y: 100 },
        minWidth: 250,
        minHeight: 200
    });

    const [isResizing, setIsResizing] = useState(false);
    const [constraints, setConstraints] = useState({ left: 0, top: 0, right: 0, bottom: 0 });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const updateConstraints = () => {
                setConstraints({
                    left: 0,
                    top: 0,
                    right: window.innerWidth - size.width,
                    bottom: window.innerHeight - size.height
                });
            };
            updateConstraints();
            window.addEventListener('resize', updateConstraints);
            return () => window.removeEventListener('resize', updateConstraints);
        }
    }, [size]);

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(250, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));
            setSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
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
                                forcePlay={false}
                                proximityFactor={1}
                                highlightedAudioId={null}
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

    if (isDocked) {
        return (
            <div className="h-full w-full bg-white dark:bg-neutral-900 overflow-hidden flex flex-col">
                {renderContent()}
            </div>
        );
    }

    return (
        <motion.div
            drag={!isResizing}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={constraints}
            dragElastic={0}
            onDragEnd={onDragEnd}
            layout={false}
            initial={position}
            style={{
                width: isCollapsed ? 'auto' : size.width,
                height: isCollapsed ? 'auto' : size.height,
                maxHeight: isCollapsed ? 'auto' : '80vh',
                x: position.x,
                y: position.y,
                zIndex: 50
            }}
            className={`absolute flex flex-col bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow-xl overflow-hidden pointer-events-auto ${isCollapsed ? 'p-2' : 'p-0'}`}
            onPointerDownCapture={onInteraction}
        >
            {isCollapsed ? (
                <div
                    className="cursor-move flex items-center justify-center"
                    onPointerDown={(e) => { e.preventDefault(); dragControls.start(e); }}
                >
                    <button onClick={() => setIsCollapsed(false)} className="text-gray-500 hover:text-blue-500">
                        <Maximize2 size={20} />
                    </button>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 cursor-move"
                        onPointerDown={(e) => { e.preventDefault(); dragControls.start(e); }}
                        onDoubleClick={() => setIsCollapsed(true)}
                    >
                        <div className="flex items-center gap-2">
                            <Volume2 size={16} className="text-blue-500" />
                            <span className="font-medium text-sm text-gray-700 dark:text-neutral-200">Players Ativos</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {onDock && (
                                <button onClick={onDock} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 rounded">
                                    <Minus size={14} className="rotate-90" />
                                </button>
                            )}
                            <button onClick={() => setIsCollapsed(true)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 rounded">
                                <Minus size={14} />
                            </button>
                            <button onClick={onClose} className="p-1 text-gray-400 hover:text-red-500 rounded">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
                        {renderContent()}
                    </div>

                    {/* Resize Handle */}
                    <div
                        className="absolute bottom-0 right-0 p-1 cursor-nwse-resize hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-tl z-50"
                        onMouseDown={handleResizeStart}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <path d="M21 15v6" />
                            <path d="M15 21h6" />
                        </svg>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default ActivePlayersMenu;
