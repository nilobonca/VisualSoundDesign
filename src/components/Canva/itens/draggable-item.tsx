'use client';

import React, { useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '@/utils/canva-state';
import { useCanvasGlobalStore } from '@/store/canvasStore';
import { useCanvas } from '../canva-teste';
import { cn } from '@/lib/utils';
import { handleDeepSelectCycle } from '@/utils/deep-select';

// State for deep selection cycle
const lastDeepSelect = {
    time: 0,
    items: [] as string[],
    sortedStr: '',
    currentIndex: -1
};

interface DraggableItemProps {
    id: string;
    x: number;
    y: number;
    zIndex?: number;
    isSelected: boolean;
    children: React.ReactNode;
    className?: string;
    onPositionChange?: (id: string, x: number, y: number) => void;
    onDrag?: (id: string, x: number, y: number, dx?: number, dy?: number) => void;

    onDragStart?: (id: string) => void;
    rotation?: number;
    onSelect?: (e: React.MouseEvent | React.PointerEvent | React.TouchEvent) => void;
}

export default function DraggableItem({ id, x, y, zIndex, isSelected, children, className, onPositionChange, onDrag, onDragStart, rotation = 0, onSelect }: DraggableItemProps) {
    const { selectItem, bringToFront, setIsDragging } = useCanvasStore();
    const setIsDraggingItem = useCanvasGlobalStore(state => state.setIsDraggingItem);
    const { transform } = useCanvas();

    const [position, setPosition] = useState({ x, y });

    const prevPos = React.useRef({ x, y });
    const isLocalDragging = React.useRef(false);
    const selectedAtMouseDown = React.useRef(isSelected);

    // Sync local position with props when not dragging (e.g. on load or external update)
    useEffect(() => {
        if (!isLocalDragging.current) {
            setPosition({ x, y });
            prevPos.current = { x, y };
        }
    }, [x, y]);

    // Listen to edge pan to move the item with the canvas
    useEffect(() => {
        const handlePan = (e: any) => {
            if (!isLocalDragging.current) return;
            const { dx, dy, scale } = e.detail;
            const worldDx = -dx / scale;
            const worldDy = -dy / scale;

            setPosition(prev => {
                const newX = prev.x + worldDx;
                const newY = prev.y + worldDy;
                prevPos.current = { x: newX, y: newY };
                if (onPositionChange) onPositionChange(id, newX, newY);
                if (onDrag) onDrag(id, newX, newY, worldDx, worldDy);
                return { x: newX, y: newY };
            });
        };
        window.addEventListener('canvasEdgePan', handlePan);
        return () => window.removeEventListener('canvasEdgePan', handlePan);
    }, [id, onPositionChange, onDrag]);

    const itemRef = React.useRef<HTMLDivElement>(null);

    const bind = useGesture({
        onDragStart: ({ event, cancel }) => {
            if ((event.target as HTMLElement).closest('.prevent-item-drag')) {
                cancel();
                return;
            }
            event.stopPropagation();

            setIsDragging(true);
            setIsDraggingItem(true);
            isLocalDragging.current = true;
            selectItem(id);
            bringToFront(id);
            // Ensure prevPos is up to date with current state at start of drag
            prevPos.current = position;

            if (onDragStart) {
                onDragStart(id);
            }
            selectedAtMouseDown.current = isSelected;
            if (onSelect && !isSelected) {
                onSelect(event as any);
            }
        },
        onDrag: ({ delta: [dx, dy], event }) => {
            event.stopPropagation();

            const scaledDx = dx / transform.k;
            const scaledDy = dy / transform.k;

            const newX = Math.max(0, prevPos.current.x + scaledDx);
            const newY = Math.max(0, prevPos.current.y + scaledDy);

            setPosition({ x: newX, y: newY });
            prevPos.current = { x: newX, y: newY };

            if (onDrag) {
                onDrag(id, newX, newY, scaledDx, scaledDy);
            }
        },
        onDragEnd: ({ event }) => {
            event.stopPropagation();
            setIsDragging(false);
            setIsDraggingItem(false);
            isLocalDragging.current = false;
            if (onPositionChange) {
                onPositionChange(id, position.x, position.y);
            }
        },
    }, {
        drag: {
            pointer: { buttons: 1 },
            filterTaps: true // Crucial: This tells useGesture to differentiate taps from drags and fire onClick!
        }
    });

    return (
        <div
            ref={itemRef}
            {...bind()}
            onClick={(e) => {
                if ((e.target as HTMLElement).closest('.prevent-item-drag')) {
                    return;
                }
                e.stopPropagation();

                const isCtrlPressed = e.ctrlKey || e.metaKey;

                if (selectedAtMouseDown.current) {
                    if (isCtrlPressed) {
                        if (onSelect) onSelect(e);
                    } else {
                        const wasDeepSelected = handleDeepSelectCycle(e.clientX, e.clientY, id, isSelected);
                        if (!wasDeepSelected && onSelect) {
                            onSelect(e);
                        }
                    }
                } else {
                    // It was NOT selected at mousedown, so it was already selected/added in onDragStart
                    // Do nothing here to prevent double toggle!
                }
            }}
            className={cn(
                "absolute touch-none select-none transition-shadow duration-200 draggable-item prevent-canvas-pan no-drag",
                isSelected ? "z-50" : "",
                className
            )}
            data-item-id={id}
            data-original-zindex={zIndex ?? 'auto'}
            style={{
                left: position.x,
                top: position.y,
                zIndex: isSelected ? 50 : zIndex,
                position: 'absolute',
                transform: `rotate(${rotation}deg)`,
            }}
        >
            <div
                id={`item-${id}`}
                className={cn(
                    "relative",
                    isSelected && "after:absolute after:-inset-1 after:border-2  after:rounded-xl after:shadow-[0_0_15px_rgba(59,130,246,0.5)] after:pointer-events-none"
                )}
            >
                {children}
            </div>
        </div>
    );
}
