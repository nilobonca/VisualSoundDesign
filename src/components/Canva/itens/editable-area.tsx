'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '../canva-teste';
import { cn } from '@/lib/utils';
import { useGesture } from '@use-gesture/react';

interface ActiveArea {
    id: string;
    points: { x: number; y: number }[];
    linkedPlayerId: string | null;
    linkedAudioId: number | null;
    name: string;
    volumeMode?: 'standard' | 'proximity';
    volumeSourcePoint?: { x: number; y: number };
}

interface EditableAreaProps {
    area: ActiveArea;
    onUpdate: (area: ActiveArea) => void;
    onDelete: (id: string) => void;
    isSelected?: boolean;
    onSelect?: () => void;
    onRightClick?: (e: React.MouseEvent) => void;
    isActive?: boolean;
}

// Helpers
function distToSegment(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function getClosestPointOnSegment(p: { x: number, y: number }, a: { x: number, y: number }, b: { x: number, y: number }) {
    const atob = { x: b.x - a.x, y: b.y - a.y };
    const atop = { x: p.x - a.x, y: p.y - a.y };
    const len = atob.x * atob.x + atob.y * atob.y;
    let dot = atop.x * atob.x + atop.y * atob.y;
    const t = Math.min(1, Math.max(0, dot / len));
    return {
        x: a.x + atob.x * t,
        y: a.y + atob.y * t
    };
}

export default function EditableArea({ area, onUpdate, onDelete, isSelected, onSelect, onRightClick, isActive }: EditableAreaProps) {
    const { transform } = useCanvas();
    const [points, setPoints] = useState(area.points);
    const pointsRef = useRef(area.points);
    const [liveVolumeSource, setLiveVolumeSource] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        setPoints(area.points);
        pointsRef.current = area.points;
        setLiveVolumeSource(null);
    }, [area.points]);

    const handlePointDrag = (index: number, dx: number, dy: number) => {
        setPoints(prevPoints => {
            const newPoints = [...prevPoints];
            newPoints[index] = {
                x: newPoints[index].x + dx,
                y: newPoints[index].y + dy
            };
            pointsRef.current = newPoints;
            return newPoints;
        });
    };

    const handlePointDragEnd = (index: number) => {
        const newArea = { ...area, points: pointsRef.current };
        onUpdate(newArea);
    };

    const bindPoly = useGesture({
        onDrag: ({ delta: [dx, dy], event }) => {
            event.stopPropagation();
            const scaledDx = dx / transform.k;
            const scaledDy = dy / transform.k;

            setPoints(prev => {
                const newPoints = prev.map(p => ({
                    x: p.x + scaledDx,
                    y: p.y + scaledDy
                }));
                pointsRef.current = newPoints;
                return newPoints;
            });

            if (area.volumeSourcePoint) {
                setLiveVolumeSource(prev => {
                    const currentSource = prev || area.volumeSourcePoint!;
                    return {
                        x: currentSource.x + scaledDx,
                        y: currentSource.y + scaledDy
                    };
                });
            }
        },
        onDragEnd: ({ event }) => {
            event.stopPropagation();
            const updatedArea = { ...area, points: pointsRef.current };
            if (area.volumeSourcePoint) {
                const totalDx = pointsRef.current[0].x - area.points[0].x;
                const totalDy = pointsRef.current[0].y - area.points[0].y;
                updatedArea.volumeSourcePoint = {
                    x: area.volumeSourcePoint.x + totalDx,
                    y: area.volumeSourcePoint.y + totalDy
                };
            }
            setLiveVolumeSource(null);
            onUpdate(updatedArea);
        },
        onDragStart: ({ event }) => {
            event.stopPropagation();
        }
    });

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const clickP = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        const threshold = 10 / transform.k;

        let minDist = Infinity;
        let insertIndex = -1;

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const d = distToSegment(clickP, p1, p2);

            if (d < minDist) {
                minDist = d;
                insertIndex = i;
            }
        }

        if (minDist < threshold) {
            const p1 = points[insertIndex];
            const p2 = points[(insertIndex + 1) % points.length];
            const newPoint = getClosestPointOnSegment(clickP, p1, p2);

            const newPoints = [...points];
            newPoints.splice(insertIndex + 1, 0, newPoint);

            setPoints(newPoints);
            pointsRef.current = newPoints;
            onUpdate({ ...area, points: newPoints });
        } else {
            onRightClick?.(e);
        }
    };

    const handleVolumeSourceDrag = (dx: number, dy: number) => {
        const currentSource = area.volumeSourcePoint || getPolygonCentroid(area.points);
        const newSource = {
            x: currentSource.x + dx,
            y: currentSource.y + dy
        };

        if (isPointInPolygon(newSource, points)) {
            onUpdate({ ...area, volumeSourcePoint: newSource });
        }
    };

    function isPointInPolygon(point: { x: number, y: number }, vs: { x: number, y: number }[]) {
        const x = point.x, y = point.y;
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].x, yi = vs[i].y;
            const xj = vs[j].x, yj = vs[j].y;
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function getPolygonCentroid(points: { x: number, y: number }[]) {
        let x = 0, y = 0;
        points.forEach(p => { x += p.x; y += p.y; });
        return { x: x / points.length, y: y / points.length };
    }

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
    const volumeSource = liveVolumeSource || area.volumeSourcePoint || (area.volumeMode === 'proximity' ? getPolygonCentroid(area.points) : null);
    const maxDist = 2000;

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[8]">
            <svg className="w-full h-full overflow-visible pointer-events-none">
                <defs>
                    <clipPath id={`clip-${area.id}`}>
                        <polygon points={pointsString} />
                    </clipPath>
                </defs>

                {area.volumeMode === 'proximity' && volumeSource && (
                    <g clipPath={`url(#clip-${area.id})`}>
                        <circle cx={volumeSource.x} cy={volumeSource.y} r={100} className="fill-none stroke-green-500/30 stroke-1" />
                        <circle cx={volumeSource.x} cy={volumeSource.y} r={200} className="fill-none stroke-green-500/20 stroke-1" />
                        <circle cx={volumeSource.x} cy={volumeSource.y} r={300} className="fill-none stroke-green-500/10 stroke-1" />
                    </g>
                )}

                <polygon
                    points={pointsString}
                    className={cn(
                        "transition-all cursor-move",
                        isActive ? "fill-green-500/20 stroke-green-500 stroke-2" : "fill-blue-500/10 stroke-blue-500 stroke-2",
                        "hover:fill-blue-500/20 pointer-events-auto"
                    )}
                    {...bindPoly()}
                    onContextMenu={handleContextMenu}
                />

                {points.map((point, index) => (
                    <PointHandle
                        key={index}
                        x={point.x}
                        y={point.y}
                        scale={transform.k}
                        onDrag={(dx, dy) => handlePointDrag(index, dx, dy)}
                        onDragEnd={() => handlePointDragEnd(index)}
                    />
                ))}

                {area.volumeMode === 'proximity' && volumeSource && (
                    <PointHandle
                        x={volumeSource.x}
                        y={volumeSource.y}
                        scale={transform.k}
                        onDrag={handleVolumeSourceDrag}
                        onDragEnd={() => { }}
                        className="fill-green-500 stroke-green-700"
                    />
                )}
            </svg>
        </div>
    );
}

interface PointHandleProps {
    x: number;
    y: number;
    scale: number;
    onDrag: (dx: number, dy: number) => void;
    onDragEnd: () => void;
    className?: string;
}

function PointHandle({ x, y, scale, onDrag, onDragEnd, className }: PointHandleProps) {
    const bind = useGesture({
        onDrag: ({ delta: [dx, dy], event }) => {
            event.stopPropagation();
            onDrag(dx / scale, dy / scale);
        },
        onDragEnd: ({ event }) => {
            event.stopPropagation();
            onDragEnd();
        },
        onDragStart: ({ event }) => {
            event.stopPropagation();
        }
    });

    const size = 8 / scale;

    return (
        <circle
            cx={x}
            cy={y}
            r={size}
            className={cn("fill-blue-500 stroke-white stroke-2 cursor-pointer pointer-events-auto hover:fill-blue-600", className)}
            {...bind()}
        />
    );
}
