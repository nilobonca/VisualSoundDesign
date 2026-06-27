import { useState, useEffect, useCallback, useRef } from 'react';
import { PanInfo, useMotionValue } from 'framer-motion';

interface Size {
    width: number;
    height: number;
}

interface Position {
    x: number;
    y: number;
}

interface UseViewportResizeProps {
    initialSize: Size;
    initialPosition: Position;
    minWidth: number;
    minHeight: number;
    margin?: number;
}

// Removed singleton viewport element as we now use exact calculated bounds

export const useViewportResize = ({ initialSize, initialPosition, minWidth, minHeight, margin = 20 }: UseViewportResizeProps) => {
    const [size, setSize] = useState<Size>(initialSize);
    const [position, setPosition] = useState<Position>(initialPosition);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const x = useMotionValue(0);
    const y = useMotionValue(0);



    // Refs to always have latest values inside event handlers
    const sizeRef = useRef(size);
    const positionRef = useRef(position);
    const relativePosRef = useRef({ x: 0, y: 0 });

    // Helper to calculate ratio from absolute position
    const calculateRatio = useCallback((pos: Position, currentSize: Size) => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        const availableWidth = window.innerWidth - currentSize.width - margin * 2;
        const availableHeight = window.innerHeight - currentSize.height - margin * 2;
        return {
            x: availableWidth > 0 ? Math.min(Math.max((pos.x - margin) / availableWidth, 0), 1) : 0,
            y: availableHeight > 0 ? Math.min(Math.max((pos.y - margin) / availableHeight, 0), 1) : 0,
        };
    }, [margin]);

    // Helper to calculate absolute position from ratio
    const calculateAbsolute = useCallback((ratio: { x: number, y: number }, currentSize: Size) => {
        if (typeof window === 'undefined') return { x: margin, y: margin };
        const availableWidth = window.innerWidth - currentSize.width - margin * 2;
        const availableHeight = window.innerHeight - currentSize.height - margin * 2;
        return {
            x: margin + (availableWidth > 0 ? ratio.x * availableWidth : 0),
            y: margin + (availableHeight > 0 ? ratio.y * availableHeight : 0),
        };
    }, [margin]);

    // Clamp position so menu never leaves the viewport
    const clampPosition = useCallback((pos: Position, currentSize: Size) => {
        if (typeof window === 'undefined') return pos;
        const maxX = window.innerWidth - currentSize.width - margin;
        const maxY = window.innerHeight - currentSize.height - margin;
        return {
            x: Math.min(Math.max(margin, pos.x), Math.max(margin, maxX)),
            y: Math.min(Math.max(margin, pos.y), Math.max(margin, maxY)),
        };
    }, [margin]);

    // Sync refs and relative position
    useEffect(() => {
        setIsMounted(true);
        // Guarantee the menu is fully within bounds on initial mount
        const clamped = clampPosition(positionRef.current, sizeRef.current);
        if (clamped.x !== positionRef.current.x || clamped.y !== positionRef.current.y) {
            setPosition(clamped);
            positionRef.current = clamped;
        }
    }, [clampPosition]);

    useEffect(() => {
        sizeRef.current = size;
        positionRef.current = position;
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            relativePosRef.current = calculateRatio(position, size);
        }
    }, [size, position, calculateRatio]);

    // Re-clamp on window resize
    useEffect(() => {
        if (!isMounted) return;
        const handleResize = () => {
            const isNowDesktop = window.innerWidth >= 768;
            setIsDesktop(isNowDesktop);
            if (isNowDesktop) {
                const currentSize = sizeRef.current;
                const newWidth = Math.min(Math.max(currentSize.width, minWidth), window.innerWidth - margin * 2);
                const newHeight = Math.min(Math.max(currentSize.height, minHeight), window.innerHeight - margin * 2);
                const newSize = { width: newWidth, height: newHeight };
                if (newWidth !== currentSize.width || newHeight !== currentSize.height) {
                    setSize(newSize);
                }
                const newPos = calculateAbsolute(relativePosRef.current, newSize);
                setPosition(clampPosition(newPos, newSize));
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMounted, minWidth, minHeight, margin, clampPosition, calculateAbsolute]);

    // After drag ends, sync React state with where framer-motion left the element
    const onDragEnd = (event: unknown, info: PanInfo) => {
        const newX = positionRef.current.x + x.get();
        const newY = positionRef.current.y + y.get();
        setPosition(clampPosition({ x: newX, y: newY }, sizeRef.current));
        x.set(0);
        y.set(0);
    };

    // Centralised resize handler — enforces minWidth/minHeight AND viewport bounds
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = sizeRef.current.width;
        const startHeight = sizeRef.current.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            requestAnimationFrame(() => {
                const pos = positionRef.current;
                const maxWidth = typeof window !== 'undefined'
                    ? window.innerWidth - pos.x - margin
                    : Infinity;
                const maxHeight = typeof window !== 'undefined'
                    ? window.innerHeight - pos.y - margin
                    : Infinity;
                setSize({
                    width: Math.min(maxWidth, Math.max(minWidth, startWidth + (moveEvent.clientX - startX))),
                    height: Math.min(maxHeight, Math.max(minHeight, startHeight + (moveEvent.clientY - startY))),
                });
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [margin, minWidth, minHeight]);

    // Calculate exact constraints based on current position and size
    const constraintRef = {
        left: typeof window !== 'undefined' ? margin - position.x : 0,
        right: typeof window !== 'undefined' ? window.innerWidth - size.width - margin - position.x : 0,
        top: typeof window !== 'undefined' ? margin - position.y : 0,
        bottom: typeof window !== 'undefined' ? window.innerHeight - size.height - margin - position.y : 0
    };

    return { size, setSize, position, setPosition, onDragEnd, isDesktop, handleResizeStart, constraintRef, x, y };
};
