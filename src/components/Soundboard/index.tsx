import React from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, GripHorizontal } from 'lucide-react';
import { useViewportResize } from '@/hooks/useViewportResize';
import { SoundboardMenu } from './SoundboardMenu';

interface SoundboardProps {
    onInteraction?: () => void;
    onClose?: () => void;
    onItemContextMenu?: (e: React.MouseEvent, itemId: string) => void;
    editingItemId?: string | null;
    onRename?: (id: string, newName: string) => void;
}

export default function Soundboard({ onInteraction, onClose, onItemContextMenu, editingItemId, onRename }: SoundboardProps) {
    const dragControls = useDragControls();

    const { size, setSize, position, onDragEnd, handleResizeStart, constraintRef, x, y } = useViewportResize({
        initialSize: { width: 320, height: 400 },
        initialPosition: { x: typeof window !== 'undefined' ? window.innerWidth - 340 : 800, y: 100 },
        minWidth: 280,
        minHeight: 200
    });






    return (
        <motion.div
            layout={false}
            initial={false}
            style={{ x, y,
                width: size.width,
                height: size.height,
                maxHeight: '80vh',
                left: position.x,
                top: position.y,
                zIndex: 50
            }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={onDragEnd}
            dragConstraints={constraintRef}
            className={`absolute flex flex-col bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-sm drop-shadow-xl overflow-hidden pointer-events-auto p-5`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDownCapture={onInteraction}
        >
            <div className={`flex flex-col h-full block`}>
                <div
                    className="w-full flex justify-between items-center mb-2 relative flex-shrink-0 touch-none cursor-move"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <span className="font-semibold text-gray-700 dark:text-neutral-200">Soundboard</span>
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
                    <SoundboardMenu onItemContextMenu={onItemContextMenu} editingItemId={editingItemId} onRename={onRename} />
                </div>
            </div>
            {/* Resize handle */}
            <div
                className="absolute bottom-0 right-0 p-1.5 cursor-nwse-resize text-gray-300 hover:text-gray-500 dark:hover:text-neutral-400 transition-colors"
                onMouseDown={handleResizeStart}
                onPointerDown={(e) => e.stopPropagation()}
                title="Redimensionar"
            >
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M 10 0 L 10 10 L 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
        </motion.div>
    );
}
