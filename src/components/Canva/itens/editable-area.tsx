'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '../canva-teste';
import { cn } from '@/lib/utils';
import { useGesture } from '@use-gesture/react';

import { ActiveArea, Audios } from '@/interfaces/utils/indexedDB';
import AudioPlayerList from '@/components/player-list';

interface EditableAreaProps {
    area: ActiveArea;
    onUpdate: (area: ActiveArea) => void;

    isSelected?: boolean;
    onSelect?: () => void;
    onRightClick?: (e: React.MouseEvent) => void;
    isActive?: boolean;
    onHover?: (audioId: number | null) => void;
    onDrag?: (id: string, totalDx: number, totalDy: number) => void;
    onDragStart?: (id: string) => void;
    isRenaming?: boolean;
    onRenameEnd?: () => void;
    zIndex?: number;
    savedAudios?: Audios[];
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

export default function EditableArea({ area, onUpdate, isSelected, onSelect, onRightClick, isActive, onHover, onDrag, onDragStart, isRenaming, onRenameEnd, zIndex, savedAudios = [] }: EditableAreaProps) {
    const { transform } = useCanvas();
    const [points, setPoints] = useState(area.points);
    const pointsRef = useRef(area.points);
    const [liveVolumeSource, setLiveVolumeSource] = useState<{ x: number; y: number } | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(area.name);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [ghostPoint, setGhostPoint] = useState<{ x: number; y: number; index: number } | null>(null);

    // State for resizing
    const [isResizing, setIsResizing] = useState(false);
    const initialPointsRef = useRef<{ x: number, y: number }[]>([]);
    const initialCentroidRef = useRef<{ x: number, y: number } | null>(null);
    const initialResizeMovementRef = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        setPoints(area.points);
        pointsRef.current = area.points;
        setLiveVolumeSource(null);
    }, [area.points]);

    useEffect(() => {
        if (isRenaming) {
            setIsEditingName(true);
            setTempName(area.name);
        }
    }, [isRenaming, area.name]);

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

    const handlePointDragEnd = () => {
        const newArea = { ...area, points: pointsRef.current };
        onUpdate(newArea);
    };

    const bindPoly = useGesture({
        onDrag: ({ offset: [ox, oy], movement: [mx, my], delta: [dx, dy], event, ctrlKey, metaKey }) => {
            event.stopPropagation();
            const scaledDx = dx / transform.k;
            const scaledDy = dy / transform.k;

            // Check for Resize Mode (Ctrl or Meta key)
            if (isResizing || ((ctrlKey || metaKey) && !isResizing)) {
                if (!isResizing) {
                    // Start Resizing
                    setIsResizing(true);
                    initialPointsRef.current = [...points];
                    initialCentroidRef.current = getPolygonCentroid(points);
                    initialResizeMovementRef.current = { x: mx, y: my };
                }

                if (initialCentroidRef.current && initialPointsRef.current.length > 0 && initialResizeMovementRef.current) {
                    const centroid = initialCentroidRef.current;
                    const startM = initialResizeMovementRef.current;

                    // Calculate accumulated drag since resize started
                    const resizeDx = (mx - startM.x) / transform.k;
                    const resizeDy = (my - startM.y) / transform.k;

                    // Calculate scale factor based on drag distance
                    // Moving right/down increases scale, left/up decreases
                    // Sensitivity: 200px = 100% change (double size) -> 1 + 1 = 2
                    // Let's try 1 + delta / 200
                    const scaleFactor = Math.max(0.1, 1 + (resizeDx + resizeDy) / 200);

                    const newPoints = initialPointsRef.current.map(p => ({
                        x: centroid.x + (p.x - centroid.x) * scaleFactor,
                        y: centroid.y + (p.y - centroid.y) * scaleFactor
                    }));

                    setPoints(newPoints);
                    pointsRef.current = newPoints;

                    // Update volume source if present
                    if (area.volumeSourcePoint && area.volumeMode === 'proximity') {
                        const source = area.volumeSourcePoint;
                        const newSource = {
                            x: centroid.x + (source.x - centroid.x) * scaleFactor,
                            y: centroid.y + (source.y - centroid.y) * scaleFactor
                        };
                        setLiveVolumeSource(newSource);
                    }
                }
                return;
            }

            // Normal Move Logic
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
        onDragEnd: ({ event, tap }) => {
            event.stopPropagation();

            if (tap && onSelect) {
                onSelect();
                return;
            }

            if (isResizing) {
                setIsResizing(false);
                initialPointsRef.current = [];
                initialCentroidRef.current = null;
                initialResizeMovementRef.current = null;

                // Commit resize changes
                const updatedArea = { ...area, points: pointsRef.current };
                if (liveVolumeSource) {
                    updatedArea.volumeSourcePoint = liveVolumeSource;
                }
                onUpdate(updatedArea);
                setLiveVolumeSource(null);
                return;
            }

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
        // Disabled double click editing
    };

    const handleNameSubmit = () => {
        setIsEditingName(false);
        if (tempName !== area.name) {
            onUpdate({ ...area, name: tempName });
        }
        onRenameEnd?.();
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setIsEditingName(false);
            setTempName(area.name);
            onRenameEnd?.();
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
        setTooltipPos(null);
    };

    const handleAreaMouseMove = (e: React.MouseEvent) => {
        if (isEditingName) return;

        // Update tooltip position
        setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });

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

    const linkedAudio = area.linkedAudioId ? savedAudios?.find(a => a.id === area.linkedAudioId) : null;

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: (zIndex || 0) + (isSelected ? 10 : 0) }}>
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
                            // Remove default fill/stroke classes when custom color is present, efficiently handled inline style below for fill
                            "stroke-2",
                            "hover:opacity-80 pointer-events-auto",
                            ghostPoint ? "cursor-none" : isResizing ? "cursor-nwse-resize" : "cursor-move"
                        )}
                        style={{
                            fill: area.color ? area.color : (isActive || isSelected ? '#22c55e' : '#3b82f6'),
                            fillOpacity: area.opacity !== undefined ? area.opacity : (isActive || isSelected ? 0.2 : 0.1),
                            // Improved selection stroke logic:
                            // If selected and has custom color, use the complementary color (opposite on color wheel)
                            stroke: isSelected
                                ? (area.color
                                    ? (() => {
                                        // Complementary color logic (Hue shift 180deg)
                                        const hex = area.color.replace('#', '');
                                        const r = parseInt(hex.substr(0, 2), 16) / 255;
                                        const g = parseInt(hex.substr(2, 2), 16) / 255;
                                        const b = parseInt(hex.substr(4, 2), 16) / 255;

                                        const max = Math.max(r, g, b), min = Math.min(r, g, b);
                                        const l = (max + min) / 2;
                                        let h = 0, s = 0;

                                        if (max !== min) {
                                            const d = max - min;
                                            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                                            switch (max) {
                                                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                                                case g: h = (b - r) / d + 2; break;
                                                case b: h = (r - g) / d + 4; break;
                                            }
                                            h /= 6;
                                        }

                                        // Rotate Hue by 180 degrees (0.5 in 0-1 range)
                                        h = (h + 0.5) % 1;

                                        // Convert back to RGB
                                        const hue2rgb = (p: number, q: number, t: number) => {
                                            if (t < 0) t += 1;
                                            if (t > 1) t -= 1;
                                            if (t < 1 / 6) return p + (q - p) * 6 * t;
                                            if (t < 1 / 2) return q;
                                            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                                            return p;
                                        };

                                        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                                        const p = 2 * l - q;
                                        const newR = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
                                        const newG = Math.round(hue2rgb(p, q, h) * 255);
                                        const newB = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

                                        return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
                                    })()
                                    : '#22c55e') // Default selected color
                                : (area.color ? area.color : '#3b82f6'), // Not selected
                            strokeOpacity: 1,
                            strokeWidth: isSelected ? 3 : 2
                        }}
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
                        onDragEnd={() => handlePointDragEnd()}
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

                {/* Tooltip following mouse */}
                {showTooltip && tooltipPos && !isEditingName && (
                    <foreignObject
                        x={tooltipPos.x}
                        y={tooltipPos.y - 40}
                        width="200"
                        height="40"
                        className="overflow-visible pointer-events-none"
                    >
                        <div
                            className="px-2 py-1 bg-black/80 text-white text-xs rounded shadow-sm backdrop-blur-[1px] w-max pointer-events-none"
                            style={{ transform: `scale(${1 / transform.k})`, transformOrigin: 'top left' }}
                        >
                            {area.name}
                        </div>
                    </foreignObject>
                )}

                {/* Area Name (Central) */}
                {(area.showName || isEditingName) && (
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
                                        "bg-black/50 shadow-sm backdrop-blur-[1px]"
                                    )}
                                    style={{ transform: `scale(${1 / transform.k})` }}
                                >
                                    {area.name}
                                </span>
                            )}
                        </div>
                    </foreignObject>
                )}

            </svg>

            {/* Floating Audio Player and Controls */}
            {isSelected && (
                <div
                    className="absolute pointer-events-auto flex flex-col gap-2 items-center"
                    style={{
                        left: centroid.x - 150,
                        top: centroid.y - 180, // Moved up to accommodate toolbar
                        width: 300,
                        transform: `scale(${1 / transform.k})`,
                        transformOrigin: 'bottom center',
                        zIndex: 100 // Ensure it's on top
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >


                    {linkedAudio && (
                        <div className="w-full h-[100px]">
                            <AudioPlayerList
                                audio={linkedAudio}
                                onDelete={() => { }} // No-op for delete in this context
                                onDuplicate={() => { }} // No-op for duplicate
                            />
                        </div>
                    )}
                </div>
            )}
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

    const size = 4.8 / scale;

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
