import React, { useEffect, useState } from 'react';
import { useTracking } from '@/contexts/TrackingContext';
import { supabase } from '@/lib/supabase';
import { HeatmapVisualizer } from './HeatmapVisualizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Activity, Map, RefreshCcw, User } from 'lucide-react';

export const AnalyticsDashboard = () => {
    const { heatmapEnabled, toggleHeatmap, trackEvent } = useTracking();
    const [startCount, setStartCount] = React.useState(0);
    const [stats, setStats] = useState<{ [key: string]: number }>({});
    const [assetStats, setAssetStats] = useState<{
        audioUploads: number;
        imageUploads: number;
        topImages: { name: string; count: number }[];
        topAudios: { name: string; plays: number; totalDuration: number }[];
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);

        let query = supabase.from('analytics_events').select('event_type, metadata');

        if (selectedUser) {
            query = query.eq('metadata->>user_name', selectedUser);
        }

        const { data, error } = await query;

        if (error) {
            console.error(error);
            if (error.code === '42P01') {
                setError("Table 'analytics_events' not found. Did you run the setup SQL?");
            } else {
                setError(error.message);
            }
        } else if (data) {
            const counts: { [key: string]: number } = {};

            // Asset tracking aggregators
            let audioUp = 0;
            let imageUp = 0;
            const imageUsage: { [name: string]: number } = {};
            const audioUsage: { [name: string]: { plays: number; duration: number } } = {};

            data.forEach(d => {
                // Event Counts
                counts[d.event_type] = (counts[d.event_type] || 0) + 1;

                // Asset Stats
                const meta = d.metadata || {};

                if (d.event_type === 'file_upload') {
                    if (meta.file_type === 'audio') audioUp++;
                    if (meta.file_type === 'image') imageUp++;
                }

                if (d.event_type === 'image_use') {
                    if (meta.file_name) {
                        imageUsage[meta.file_name] = (imageUsage[meta.file_name] || 0) + 1;
                    }
                }

                if (d.event_type === 'audio_play') {
                    if (meta.file_name) {
                        if (!audioUsage[meta.file_name]) audioUsage[meta.file_name] = { plays: 0, duration: 0 };
                        audioUsage[meta.file_name].plays++;
                        // Accumulate duration if available (meta.duration is in seconds)
                        if (meta.duration) {
                            audioUsage[meta.file_name].duration += Number(meta.duration);
                        }
                    }
                }
            });

            // Process Top Lists
            const topImages = Object.entries(imageUsage)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const topAudios = Object.entries(audioUsage)
                .map(([name, stats]) => ({ name, plays: stats.plays, totalDuration: stats.duration }))
                .sort((a, b) => b.plays - a.plays)
                .slice(0, 5);

            setStats(counts);
            setAssetStats({
                audioUploads: audioUp,
                imageUploads: imageUp,
                topImages,
                topAudios
            });
        }
        setLoading(false);
    };

    // ... (useEffect for users remains same)

    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase
                .from('analytics_events')
                .select('metadata')
                .not('metadata->>user_name', 'is', null);

            if (data) {
                const uniqueUsers = Array.from(new Set(data.map(d => d.metadata.user_name))).filter(Boolean) as string[];
                setUsers(uniqueUsers);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchStats();
    }, [selectedUser]);

    return (
        <div className="p-6 space-y-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm max-w-4xl mx-auto my-10">
            {/* Header ... */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-2">
                    <BarChart className="w-8 h-8" />
                    Analytics Dashboard
                </h2>
                <div className="flex items-center gap-2">
                    <Select value={selectedUser || "all"} onValueChange={(v) => setSelectedUser(v === "all" ? null : v)}>
                        <SelectTrigger className="w-[180px]">
                            <User className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {users.map(u => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/20">
                    <h3 className="font-bold">Error Loading Analytics</h3>
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Global Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Global Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(stats).length === 0 ? (
                            <p className="text-muted-foreground">No events recorded yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {Object.entries(stats).map(([type, count]) => (
                                    <li key={type} className="flex justify-between items-center border-b pb-2">
                                        <span className="capitalize">{type.replace('_', ' ')}</span>
                                        <span className="font-mono font-bold">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Asset Stats Card */}
                {assetStats && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Asset Usage (FileStats)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded">
                                    <div className="text-sm text-muted-foreground">Audio Uploads</div>
                                    <div className="text-xl font-bold">{assetStats.audioUploads}</div>
                                </div>
                                <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded">
                                    <div className="text-sm text-muted-foreground">Image Uploads</div>
                                    <div className="text-xl font-bold">{assetStats.imageUploads}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-sm mb-2">Top Images Used</h4>
                                <ul className="text-sm space-y-1">
                                    {assetStats.topImages.length === 0 && <li className="text-muted-foreground italic">No image usage tracked.</li>}
                                    {assetStats.topImages.map(img => (
                                        <li key={img.name} className="flex justify-between">
                                            <span className="truncate w-32" title={img.name}>{img.name}</span>
                                            <span className="font-mono">{img.count}x</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-sm mb-2">Top Audios Played</h4>
                                <ul className="text-sm space-y-1">
                                    {assetStats.topAudios.length === 0 && <li className="text-muted-foreground italic">No audio plays tracked.</li>}
                                    {assetStats.topAudios.map(audio => (
                                        <li key={audio.name} className="flex justify-between items-center">
                                            <span className="truncate w-32" title={audio.name}>{audio.name}</span>
                                            <div className="text-right">
                                                <div className="font-mono">{audio.plays} plays</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {(audio.totalDuration / 60).toFixed(1)} mins listened
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Map className="w-5 h-5" />
                            Heatmap Visualization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <HeatmapVisualizer className="w-full" filterUser={selectedUser} />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="heatmap-mode"
                                checked={heatmapEnabled}
                                onCheckedChange={toggleHeatmap}
                            />
                            <Label htmlFor="heatmap-mode">Enable Click Tracking</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            When enabled, user clicks will be recorded for the heatmap.
                            <br />
                            <strong>Note:</strong> Disabling this stops data collection.
                        </p>
                        <div className="pt-4 border-t flex justify-end">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    trackEvent('test_event_admin', { source: 'dashboard' });
                                    setTimeout(fetchStats, 2000);
                                }}
                            >
                                Send Test Event & Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
