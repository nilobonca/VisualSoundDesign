'use client';

import React, { useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '@/utils/canva-state';
import { motion } from 'framer-motion';

interface CanvasContainerProps {
    children: React.ReactNode;
}

export default function CanvasContainer({ children }: CanvasContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scale, offset, setViewport, isDragging } = useCanvasStore();

    useGesture(
        {
            onDrag: ({ offset: [x, y] }) => {
                if (!isDragging) {
                    setViewport(scale, { x, y });
                }
            },
            onPinch: ({ offset: [s], memo }) => {
                setViewport(s, offset);
                return memo; 
            },
            onWheel: ({ delta: [, dy], ctrlKey }) => {
                if (ctrlKey) {
                    const newScale = Math.min(Math.max(0.1, scale - dy * 0.01), 5);
                    setViewport(newScale, offset);
                }
            },
        },
        {
            target: containerRef,
            drag: {
                from: () => [offset.x, offset.y],
                filterTaps: true,
                filter: (event: any) => {
                    const target = event.target as HTMLElement;
                    // Prevent pan if target has 'prevent-canvas-pan' or is inside such an element
                    return !target.closest('.prevent-canvas-pan');
                }
            },
            pinch: {
                scaleBounds: { min: 0.1, max: 5 },
                modifierKey: null,
            },
            wheel: {
                eventOptions: { passive: false },
            }
        }
    );

    useEffect(() => {
        const preventDefault = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        };
        const current = containerRef.current;
        if (current) {
            current.addEventListener('wheel', preventDefault, { passive: false });
        }
        return () => {
            if (current) {
                current.removeEventListener('wheel', preventDefault);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef} 
            className="w-full h-screen overflow-hidden border-white border-10  relative cursor-grab active:cursor-grabbing touch-none "
        >
            {/* Dynamic Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30 bg-grid-pattern bg-white"
                style={{
                    backgroundPosition: `${offset.x}px ${offset.y}px`,
                    transform: `scale(${scale})`, // Scale the grid pattern itself? Or just size? 
                    // Actually scaling the div might be better for the grid to zoom with content
                    // But usually infinite canvas grids just pan. Let's try to make it zoomable.
                    transformOrigin: '0 0',
                }}
            />

            <motion.div
                style={{
                    x: offset.x,
                    y: offset.y,
                    scale: scale,
                    originX: 0,
                    originY: 0,
                }}
                className="absolute top-0 left-0 w-full h-full"
            >
                {children}
            </motion.div>

            {/* Vignette Effect */}
            <div className="absolute inset-0 pointer-events-none" />
        </div>
    );
}