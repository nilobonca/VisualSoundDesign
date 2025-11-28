import { useState, useEffect, useCallback, useRef } from 'react';
import { PanInfo } from 'framer-motion';

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

export const useViewportResize = ({ initialSize, initialPosition, minWidth, minHeight, margin = 20 }: UseViewportResizeProps) => {
    const [size, setSize] = useState<Size>(initialSize);
    const [position, setPosition] = useState<Position>(initialPosition);
    const [isDesktop, setIsDesktop] = useState(false);

    // Refs to track latest state without triggering effect re-runs
    const sizeRef = useRef(size);
    const positionRef = useRef(position);
    const relativePosRef = useRef({ x: 0, y: 0 });

    // Helper to calculate ratio from absolute position
    const calculateRatio = useCallback((pos: Position, currentSize: Size) => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };

        const availableWidth = window.innerWidth - currentSize.width - margin * 2;
        const availableHeight = window.innerHeight - currentSize.height - margin * 2;

        const x = availableWidth > 0 ? (pos.x - margin) / availableWidth : 0;
        const y = availableHeight > 0 ? (pos.y - margin) / availableHeight : 0;

        return {
            x: Math.min(Math.max(x, 0), 1),
            y: Math.min(Math.max(y, 0), 1)
        };
    }, [margin]);

    // Helper to calculate absolute position from ratio
    const calculateAbsolute = useCallback((ratio: { x: number, y: number }, currentSize: Size) => {
        if (typeof window === 'undefined') return { x: margin, y: margin };

        const availableWidth = window.innerWidth - currentSize.width - margin * 2;
        const availableHeight = window.innerHeight - currentSize.height - margin * 2;

        const x = margin + (availableWidth > 0 ? ratio.x * availableWidth : 0);
        const y = margin + (availableHeight > 0 ? ratio.y * availableHeight : 0);

        return { x, y };
    }, [margin]);

    // Clamp position to be within viewport
    const clampPosition = useCallback((pos: Position, currentSize: Size) => {
        if (typeof window === 'undefined') return pos;

        const maxX = window.innerWidth - currentSize.width - margin;
        const maxY = window.innerHeight - currentSize.height - margin;

        return {
            x: Math.min(Math.max(margin, pos.x), Math.max(margin, maxX)),
            y: Math.min(Math.max(margin, pos.y), Math.max(margin, maxY))
        };
    }, [margin]);

    // Sync refs and relative position when state changes
    useEffect(() => {
        sizeRef.current = size;
        positionRef.current = position;

        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            relativePosRef.current = calculateRatio(position, size);
        }
    }, [size, position, calculateRatio]);

    useEffect(() => {
        const handleResize = () => {
            const isNowDesktop = window.innerWidth >= 768;
            setIsDesktop(isNowDesktop);

            if (isNowDesktop) {
                const currentSize = sizeRef.current;

                // 1. Clamp Size
                const newWidth = Math.min(Math.max(currentSize.width, minWidth), window.innerWidth - margin * 2);
                const newHeight = Math.min(Math.max(currentSize.height, minHeight), window.innerHeight - margin * 2);

                const newSize = { width: newWidth, height: newHeight };

                if (newWidth !== currentSize.width || newHeight !== currentSize.height) {
                    setSize(newSize);
                }

                // 2. Recalculate Position based on RELATIVE ratio
                const newPos = calculateAbsolute(relativePosRef.current, newSize);

                // 3. Clamp just in case
                setPosition(clampPosition(newPos, newSize));
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [minWidth, minHeight, margin, clampPosition, calculateAbsolute]);

    const onDragEnd = (event: any, info: PanInfo) => {
        const newX = position.x + info.offset.x;
        const newY = position.y + info.offset.y;
        const clampedPos = clampPosition({ x: newX, y: newY }, size);

        setPosition(clampedPos);
        // relativePosRef is updated by the useEffect
    };

    return { size, setSize, position, setPosition, onDragEnd, isDesktop };
};
