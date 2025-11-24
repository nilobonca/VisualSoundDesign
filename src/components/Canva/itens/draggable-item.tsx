'use client';

import React, { useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '@/utils/canva-state';
import { useCanvas, CANVAS_SIZE } from '../canva-teste';
import { cn } from '@/lib/utils';

interface DraggableItemProps {
    id: string;
    x: number;
    y: number;
    zIndex: number;
    isSelected: boolean;
    children: React.ReactNode;
    className?: string;
    onPositionChange?: (id: string, x: number, y: number) => void;
    onDrag?: (id: string, x: number, y: number) => void;
}

export default function DraggableItem({ id, x, y, zIndex, isSelected, children, className, onPositionChange, onDrag }: DraggableItemProps) {
    const { selectItem, bringToFront, setIsDragging } = useCanvasStore();
    const { transform } = useCanvas();

    const [position, setPosition] = useState({ x, y });

    // Sync local position with props when not dragging (e.g. on load or external update)
    useEffect(() => {
        setPosition({ x, y });
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
        },
        onDrag: ({ offset: [dx, dy], event }) => {
            event.stopPropagation();

            let clampedX = dx;
            let clampedY = dy;

            if (itemRef.current) {
                const width = itemRef.current.offsetWidth;
                const height = itemRef.current.offsetHeight;
                const maxX = CANVAS_SIZE - width;
                const maxY = CANVAS_SIZE - height;

                clampedX = Math.max(0, Math.min(dx, maxX));
                clampedY = Math.max(0, Math.min(dy, maxY));
            }

            setPosition({ x: clampedX, y: clampedY });

            if (onDrag) {
                onDrag(id, clampedX, clampedY);
            }
        },
        onDragEnd: ({ offset: [dx, dy] }) => {
            setIsDragging(false);

            let finalX = dx;
            let finalY = dy;

            if (itemRef.current) {
                const width = itemRef.current.offsetWidth;
                const height = itemRef.current.offsetHeight;
                const maxX = CANVAS_SIZE - width;
                const maxY = CANVAS_SIZE - height;

                finalX = Math.max(0, Math.min(dx, maxX));
                finalY = Math.max(0, Math.min(dy, maxY));
            }

            if (onPositionChange) {
                onPositionChange(id, finalX, finalY);
            }
        }
    }, {
        drag: {
            from: () => [position.x, position.y],
            transform: ([x, y]) => [x / transform.k, y / transform.k],
            bounds: (state) => {
                if (!itemRef.current) return {};
                const width = itemRef.current.offsetWidth;
                const height = itemRef.current.offsetHeight;
                return { left: 0, top: 0, right: CANVAS_SIZE - width, bottom: CANVAS_SIZE - height };
            }
        }
    });

    return (
        <div
            ref={itemRef}
            {...bind()}
            className={cn(
                "absolute touch-none select-none transition-shadow duration-200 draggable-item prevent-canvas-pan no-drag",
                isSelected ? "z-50" : "",
                className
            )}
            style={{
                left: position.x,
                top: position.y,
                zIndex: zIndex,
                position: 'absolute',
            }}
            onClick={(e) => {
                e.stopPropagation();
                selectItem(id);
            }}
        >
            <div className={cn(
                "relative",
                isSelected && "after:absolute after:-inset-1 after:border-2  after:rounded-xl after:shadow-[0_0_15px_rgba(59,130,246,0.5)] after:pointer-events-none"
            )}>
                {children}
            </div>
        </div>
    );
}
