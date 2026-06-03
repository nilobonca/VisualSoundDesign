import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Layers, MapPin, Music, LayoutGrid, Plus, MousePointer2 } from 'lucide-react';

interface HeatmapVisualizerProps {
    className?: string;
    filterUser?: string | null;
}

interface Point {
    x: number;
    y: number;
    relX?: number;
    relY?: number;
    value: number;
}

export const HeatmapVisualizer: React.FC<HeatmapVisualizerProps> = ({ className, filterUser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [points, setPoints] = useState<Point[]>([]);

    useEffect(() => {
        const fetchPoints = async () => {
            let query = supabase
                .from('analytics_events')
                .select('metadata')
                .eq('event_type', 'click')
                .limit(2000);

            if (filterUser) {
                query = query.eq('metadata->>user_name', filterUser);
            }

            const { data, error } = await query;

            if (data) {
                const parsedPoints = data.map(d => ({
                    x: d.metadata.x,
                    y: d.metadata.y,
                    relX: d.metadata.relX,
                    relY: d.metadata.relY,
                    value: 1
                }));
                setPoints(parsedPoints);
            }
        };

        fetchPoints();
    }, [filterUser]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw heat points
        points.forEach(point => {
            let x, y;
            if (point.relX !== undefined && point.relY !== undefined) {
                x = point.relX * width;
                y = point.relY * height;
            } else {
                x = point.x; // Fallback
                y = point.y;
            }

            // Draw soft glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
            gradient.addColorStop(0, 'rgba(255, 50, 50, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

            ctx.beginPath();
            ctx.arc(x, y, 25, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
        });

    }, [points]);

    return (
        <div
            className={`relative border border-neutral-800 rounded-lg overflow-hidden shadow-2xl bg-neutral-950 text-white ${className}`}
            ref={containerRef}
            style={{ aspectRatio: '16/9' }}
        >
            {/* Mock Project Editor UI */}
            <div className="absolute inset-0 flex flex-col pointer-events-none opacity-60">
                {/* Header */}
                <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <LayoutGrid size={16} className="text-white" />
                        </div>
                        <div className="h-4 w-32 bg-neutral-800 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded bg-neutral-800"></div>
                        <div className="w-8 h-8 rounded bg-neutral-800"></div>
                    </div>
                </header>

                <div className="flex flex-1 relative overflow-hidden">
                    {/* Floating Left Panel (Layer Manager) */}
                    <div className="absolute top-4 left-4 w-64 bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg z-10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-neutral-400 border-b border-neutral-800 pb-2">
                            <Layers size={16} />
                            <span className="text-xs font-semibold uppercase">Camadas</span>
                        </div>
                        <div className="h-8 bg-neutral-800/50 rounded w-full"></div>
                        <div className="h-8 bg-neutral-800/50 rounded w-full"></div>
                        <div className="h-8 bg-neutral-800/50 rounded w-full"></div>
                    </div>

                    {/* Canvas Area (Center) */}
                    <div className="flex-1 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px] opacity-30">
                        {/* Center content mock */}
                    </div>

                    {/* Floating Right Panel (Pin Manager) */}
                    <div className="absolute top-4 right-4 w-12 bg-neutral-900/90 border border-neutral-800 rounded-full py-4 flex flex-col items-center gap-4 shadow-lg z-10">
                        <MapPin size={20} className="text-neutral-500" />
                        <Music size={20} className="text-neutral-500" />
                    </div>

                    {/* Bottom Toolbar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-neutral-800 rounded-full px-6 py-3 flex items-center gap-6 shadow-xl z-10 backdrop-blur-sm">
                        <MousePointer2 size={20} className="text-blue-500" />
                        <MapPin size={20} className="text-neutral-400" />
                        <div className="w-px h-8 bg-neutral-700"></div>
                        <Plus size={24} className="text-neutral-400" />
                    </div>
                </div>
            </div>

            {/* Heatmap Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full z-20 mix-blend-screen"
            />

            <div className="absolute bottom-2 left-2 z-30 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/10">
                Live Heatmap • {points.length} clicks
            </div>
        </div>
    );
};
