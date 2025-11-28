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
    onHover?: (audioId: number | null) => void;
    onDrag?: (id: string, totalDx: number, totalDy: number) => void;
    onDragStart?: (id: string) => void;
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
    const dot = atop.x * atob.x + atop.y * atob.y;
    const t = Math.min(1, Math.max(0, dot / len));
    return {
        x: a.x + atob.x * t,
        y: a.y + atob.y * t
    };
}

export default function EditableArea({ area, onUpdate, onDelete, isSelected, onSelect, onRightClick, isActive, onHover, onDrag, onDragStart }: EditableAreaProps) {
    const { transform } = useCanvas();
    const [points, setPoints] = useState(area.points);
    const pointsRef = useRef(area.points);
    const [liveVolumeSource, setLiveVolumeSource] = useState<{ x: number; y: number } | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(area.name);
    const [showTooltip, setShowTooltip] = useState(false);

    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [ghostPoint, setGhostPoint] = useState<{ x: number; y: number; index: number } | null>(null);

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
        onDrag: ({ offset: [ox, oy], delta: [dx, dy], event }) => {
            event.stopPropagation();
            const scaledDx = dx / transform.k;
            const scaledDy = dy / transform.k;
            const totalDx = ox / transform.k;
            const totalDy = oy / transform.k;

            if (onDrag) {
                onDrag(area.id, totalDx, totalDy);
            }

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
            if (onDragStart) {
                onDragStart(area.id);
            }
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

    const handleNameDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditingName(true);
        setTempName(area.name);
    };

    const handleNameSubmit = () => {
        setIsEditingName(false);
        if (tempName !== area.name) {
            onUpdate({ ...area, name: tempName });
        }
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setIsEditingName(false);
            setTempName(area.name);
        }
    };

    const handleMouseEnter = () => {
        onHover?.(area.linkedAudioId || null);
        if (!isEditingName) {
            tooltipTimeoutRef.current = setTimeout(() => {
                setShowTooltip(true);
                // Auto hide after 2 seconds
                setTimeout(() => {
                    setShowTooltip(false);
                }, 2000);
            }, 1000); // 1 second delay
        }
    };

    const handleMouseLeave = () => {
        onHover?.(null);
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
            tooltipTimeoutRef.current = null;
        }
        setShowTooltip(false);
        setGhostPoint(null);
    };

    const handleAreaMouseMove = (e: React.MouseEvent) => {
        if (isEditingName) return;

        // If hovering over the ghost point itself, don't recalculate/remove it
        if ((e.target as Element).getAttribute('data-type') === 'ghost-point') {
            return;
        }

        const clickP = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        const threshold = 15 / transform.k;

        let minDist = Infinity;
        let insertIndex = -1;
        let closestP = { x: 0, y: 0 };

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const d = distToSegment(clickP, p1, p2);

            if (d < minDist) {
                minDist = d;
                insertIndex = i;
                closestP = getClosestPointOnSegment(clickP, p1, p2);
            }
        }

        if (minDist < threshold) {
            setGhostPoint({ x: closestP.x, y: closestP.y, index: insertIndex });
        } else {
            setGhostPoint(null);
        }
    };

    const handleGhostPointClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (ghostPoint) {
            const newPoints = [...points];
            newPoints.splice(ghostPoint.index + 1, 0, { x: ghostPoint.x, y: ghostPoint.y });

            setPoints(newPoints);
            pointsRef.current = newPoints;
            onUpdate({ ...area, points: newPoints });
            setGhostPoint(null);
        }
    };

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
    const volumeSource = liveVolumeSource || area.volumeSourcePoint || (area.volumeMode === 'proximity' ? getPolygonCentroid(area.points) : null);
    const centroid = getPolygonCentroid(points);
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

                <g
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleAreaMouseMove}
                    style={{ cursor: ghostPoint ? 'none' : 'auto' }}
                >
                    <polygon
                        points={pointsString}
                        className={cn(
                            "transition-all no-drag",
                            isActive || isSelected ? "fill-green-500/20 stroke-green-500 stroke-2" : "fill-blue-500/10 stroke-blue-500 stroke-2",
                            "hover:fill-blue-500/20 pointer-events-auto",
                            ghostPoint ? "cursor-none" : "cursor-move"
                        )}
                        id={`area-${area.id}`}
                        {...bindPoly()}
                        onContextMenu={handleContextMenu}
                    />

                    {ghostPoint && (
                        <circle
                            cx={ghostPoint.x}
                            cy={ghostPoint.y}
                            r={6 / transform.k}
                            className="fill-transparent stroke-white stroke-2 cursor-none pointer-events-auto hover:fill-white/50 transition-colors no-drag"
                            onClick={handleGhostPointClick}
                            style={{ strokeDasharray: "4 2" }}
                            data-type="ghost-point"
                        />
                    )}
                </g>

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

                {/* Area Name */}
                <foreignObject
                    x={centroid.x - 100}
                    y={centroid.y - 15}
                    width="200"
                    height="30"
                    className="overflow-visible pointer-events-none"
                >
                    <div className="flex justify-center items-center w-full h-full">
                        {isEditingName ? (
                            <input
                                autoFocus
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleNameSubmit}
                                onKeyDown={handleNameKeyDown}
                                className="bg-white/90 text-black text-sm px-1 rounded border border-blue-500 outline-none pointer-events-auto shadow-sm text-center min-w-[50px]"
                                style={{ transform: `scale(${1 / transform.k})` }}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span
                                onDoubleClick={handleNameDoubleClick}
                                className={cn(
                                    "text-white text-xs font-medium px-2 py-0.5 rounded pointer-events-auto cursor-text select-none whitespace-nowrap transition-all duration-300",
                                    showTooltip
                                        ? "bg-black/80 shadow-sm backdrop-blur-[1px] opacity-100"
                                        : "bg-transparent opacity-30 hover:opacity-100"
                                )}
                                style={{ transform: `scale(${1 / transform.k})` }}
                            >
                                {area.name}
                            </span>
                        )}
                    </div>
                </foreignObject>
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
            className={cn("fill-blue-500 stroke-white stroke-2 cursor-pointer pointer-events-auto hover:fill-blue-600 no-drag", className)}
            {...bind()}
        />
    );
}
