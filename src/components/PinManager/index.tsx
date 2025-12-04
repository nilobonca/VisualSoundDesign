import React, { useState } from 'react';
import { X, Edit2, Trash2, Eye, EyeOff, MapPin, GripVertical, GripHorizontal } from 'lucide-react';
import { motion, useDragControls, Reorder } from 'framer-motion';
import { useIDB } from '@/utils/indexedDB';
import { ActivePin } from '@/interfaces/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import { PinItem } from './PinItem';

interface PinManagerProps {
    pins: ActivePin[];
    onToggle: (pin: ActivePin) => void;
    onRename: (pin: ActivePin, newName: string) => void;
    onDelete: (id: string) => void;
    onInteraction?: () => void;
    onClose?: () => void;
}

export const PinManager: React.FC<PinManagerProps> = ({ pins, onToggle, onRename, onDelete, onInteraction, onClose }) => {
    const dragControls = useDragControls();
    const { reorderPins } = useIDB();

    const { size, setSize, position, setPosition, onDragEnd, isDesktop } = useViewportResize({
        initialSize: { width: 300, height: 400 },
        initialPosition: { x: 800, y: 100 },
        minWidth: 280,
        minHeight: 200
    });

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setPosition({ x: window.innerWidth - 320, y: 100 });
        }
    }, [setPosition]);

    const [isResizing, setIsResizing] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

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
            const newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));

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

    const [constraints, setConstraints] = useState({ left: 0, top: 0, right: Number.MAX_SAFE_INTEGER, bottom: Number.MAX_SAFE_INTEGER });

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateConstraints = () => {
            const rightLimit = window.innerWidth - size.width;
            const bottomLimit = window.innerHeight - size.height;

            setConstraints({
                left: 0,
                top: 0,
                right: rightLimit,
                bottom: bottomLimit
            });
        };

        updateConstraints();
        window.addEventListener('resize', updateConstraints);
        return () => window.removeEventListener('resize', updateConstraints);
    }, [size]);


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
                    <span className="font-semibold text-gray-700 dark:text-neutral-200">Pins</span>
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
                    <div className="bg-gray-100 dark:bg-neutral-800 w-full rounded flex flex-col min-h-0 p-2">

                        {pins.length === 0 ? (
                            <p className="text-center text-gray-400 dark:text-neutral-500 py-4 text-sm">Nenhum pin criado</p>
                        ) : (
                            <Reorder.Group axis="y" values={pins} onReorder={reorderPins} className="space-y-2" layoutScroll>
                                {pins.map(pin => (
                                    <PinItem
                                        key={pin.id}
                                        pin={pin}
                                        onToggle={onToggle}
                                        onRename={onRename}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </Reorder.Group>
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
                        <path d="M21 3v6" opacity="0" /> {/* Spacer */}
                    </svg>
                </div>
            </div>
        </motion.div>
    );
};
