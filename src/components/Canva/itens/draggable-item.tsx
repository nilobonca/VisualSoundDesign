'use client';

import React, { useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '@/utils/canva-state';
import { useCanvas } from '../canva-teste';
import { cn } from '@/lib/utils';

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
    onSelect?: () => void;
}

export default function DraggableItem({ id, x, y, zIndex, isSelected, children, className, onPositionChange, onDrag, onDragStart, rotation = 0, onSelect }: DraggableItemProps) {
    const { selectItem, bringToFront, setIsDragging } = useCanvasStore();
    const { transform } = useCanvas();

    const [position, setPosition] = useState({ x, y });

    const prevPos = React.useRef({ x, y });

    // Sync local position with props when not dragging (e.g. on load or external update)
    useEffect(() => {
        setPosition({ x, y });
        prevPos.current = { x, y };
    }, [x, y]);

    const itemRef = React.useRef<HTMLDivElement>(null);

    const bind = useGesture({
        onDragStart: ({ event, cancel }) => {
            if ((event.target as HTMLElement).closest('.prevent-item-drag')) {
                cancel();
                return;
            }
            event.stopPropagation();
            setIsDragging(true);
            selectItem(id);
            bringToFront(id);
            // Ensure prevPos is up to date with current state at start of drag
            prevPos.current = position;

            if (onDragStart) {
                onDragStart(id);
            }
            if (onSelect) {
                onSelect();
            }
        },
        onDrag: ({ offset: [ox, oy], event }) => {
            event.stopPropagation();

            // Removed Canvas Limits Clamping
            const clampedX = Math.max(0, ox); // Keep only min (0) to avoid negative world? Or allow negative?
            // User requested infinite. Usually infinite includes negative but let's stick to positive expansion for now to simplify.
            // Actually, existing logic for canvas expansion seemed to rely on 0,0 being top-left.
            const clampedY = Math.max(0, oy);

            const dx = clampedX - prevPos.current.x;
            const dy = clampedY - prevPos.current.y;

            setPosition({ x: clampedX, y: clampedY });
            prevPos.current = { x: clampedX, y: clampedY };

            if (onDrag) {
                onDrag(id, clampedX, clampedY, dx, dy);
            }
        },
        onDragEnd: ({ offset: [dx, dy] }) => {
            setIsDragging(false);

            const finalX = Math.max(0, dx);
            const finalY = Math.max(0, dy);

            if (onPositionChange) {
                onPositionChange(id, finalX, finalY);
            }
        }
    }, {
        drag: {
            from: () => [position.x, position.y],
            transform: ([x, y]) => [x / transform.k, y / transform.k],
            // Removed bounds
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
                if (onSelect) {
                    onSelect();
                }
            }}
            className={cn(
                "absolute touch-none select-none transition-shadow duration-200 draggable-item prevent-canvas-pan no-drag",
                isSelected ? "z-50" : "",
                className
            )}
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
