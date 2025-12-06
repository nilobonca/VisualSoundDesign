import React, { useRef, useState, useEffect } from 'react';
import { Players, ActiveImage, ActiveArea, ActivePin, Layer, ActiveSoundboardItem, ActiveNote } from '@/interfaces/utils/indexedDB';
import { Clock, X, GripHorizontal } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { useViewportResize } from '@/hooks/useViewportResize';

interface HistoryState {
    description: string;
    timestamp: number;
    state: {
        activePlayers: Players[];
        activeImages: ActiveImage[];
        activeAreas: ActiveArea[];
        activePins: ActivePin[];
        activeLayers: Layer[];
        activeSoundboardItems: ActiveSoundboardItem[];
        activeNotes: ActiveNote[];
    };
}

interface HistoryMenuProps {
    history: HistoryState[];
    future: HistoryState[];
    onRestore: (state: HistoryState['state'], index: number, type: 'history' | 'future') => void;
    onClose: () => void;
    onInteraction?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

export default function HistoryMenu({ history, future, onRestore, onClose, onInteraction }: HistoryMenuProps) {
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const dragControls = useDragControls();
    const constraintsRef = useRef(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const { size, setSize, position, onDragEnd } = useViewportResize({
        initialSize: { width: 320, height: 500 },
        initialPosition: { x: typeof window !== 'undefined' ? window.innerWidth - 340 : 100, y: 100 },
        minWidth: 280,
        minHeight: 300
    });

    const [isResizing, setIsResizing] = useState(false);
    const [constraints, setConstraints] = useState({ left: 0, top: 0, right: 0, bottom: 0 });

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        // Get actual position from ref
        const rect = menuRef.current?.getBoundingClientRect();
        const startLeft = rect?.left || position.x;
        const startTop = rect?.top || position.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(280, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(300, startHeight + (moveEvent.clientY - startY));

            const maxWidth = window.innerWidth - startLeft - 30;
            const maxHeight = window.innerHeight - startTop - 30;

            setSize({
                width: Math.min(newWidth, maxWidth),
                height: Math.min(newHeight, maxHeight)
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

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



    return (
        <motion.div
            ref={menuRef}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={constraints}
            dragElastic={0}
            onDragEnd={onDragEnd}
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
                    <span className="font-semibold text-gray-700 dark:text-neutral-200">Histórico</span>
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

                <div onPointerDown={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-1">
                        {/* Future (Redo) */}
                        {future.length > 0 && (
                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Refazer</div>
                                {[...future].reverse().map((entry, i) => (
                                    <button
                                        key={`future-${i}`}
                                        onClick={() => onRestore(entry.state, i, 'future')}
                                        className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors group relative border border-transparent hover:border-gray-200 dark:hover:border-neutral-600 opacity-60 hover:opacity-100"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{entry.description}</span>
                                            <span className="text-xs text-gray-400 font-mono">{formatTime(entry.timestamp)}</span>
                                        </div>
                                    </button>
                                ))}
                                <div className="border-b border-dashed border-gray-300 dark:border-neutral-600 my-2 mx-2"></div>
                            </div>
                        )}

                        {/* Current / History (Undo) */}
                        <div className="space-y-1">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Histórico</div>
                            {history.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm italic">
                                    Nenhuma alteração registrada
                                </div>
                            ) : (
                                [...history].reverse().map((entry, i) => {
                                    const actualIndex = history.length - 1 - i;
                                    return (
                                        <button
                                            key={`history-${actualIndex}`}
                                            onClick={() => onRestore(entry.state, actualIndex, 'history')}
                                            className={`w-full text-left p-3 rounded-lg transition-colors group relative border ${i === 0
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                : 'hover:bg-gray-100 dark:hover:bg-neutral-700 border-transparent hover:border-gray-200 dark:hover:border-neutral-600'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`font-medium text-sm ${i === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {entry.description}
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono">{formatTime(entry.timestamp)}</span>
                                            </div>
                                            {i === 0 && <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Atual</span>}
                                        </button>
                                    );
                                })
                            )}
                        </div>
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
                        <path d="M21 3v6" opacity="0" /> {/* Spacer */}
                    </svg>
                </div>
            </div>
        </motion.div>
    );
}
