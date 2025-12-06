import React from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { motion, useDragControls, Reorder } from 'framer-motion';
import { useIDB } from '@/utils/indexedDB';
import { ActivePin } from '@/interfaces/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import { PinItem } from './PinItem';

interface PinManagerProps {
    pins: ActivePin[];
    onToggle: (pin: ActivePin) => void;
    onRename: (pin: ActivePin, newName: string) => void;
    onUpdate: (pin: ActivePin) => void;
    onDelete: (id: string) => void;
    onInteraction?: () => void;
    onClose?: () => void;
}

export const PinManager: React.FC<PinManagerProps> = ({ pins, onToggle, onRename, onUpdate, onDelete, onInteraction, onClose }) => {
    const dragControls = useDragControls();
    const { reorderPins } = useIDB();

    const { size, position, setPosition } = useViewportResize({
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

    const menuRef = React.useRef<HTMLDivElement>(null);

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
                                        onUpdate={onUpdate}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </Reorder.Group>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
