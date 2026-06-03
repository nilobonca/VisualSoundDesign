import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';


interface TrackingContextProps {
    trackEvent: (type: string, metadata?: any) => void;
    heatmapEnabled: boolean;
    toggleHeatmap: (enabled: boolean) => void;
}

const TrackingContext = createContext<TrackingContextProps | undefined>(undefined);

// Batch config
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 5000; // 5 seconds

import { TrackingConsentModal } from '@/components/TrackingConsentModal';

// ... imports

export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
    const [sessionId] = useState(() => uuidv4());
    const [heatmapEnabled, setHeatmapEnabled] = useState(true);
    const [userName, setUserName] = useState<string | null>(null);

    // Check initial user state on mount (client-side only to avoid hydration mismatch)
    useEffect(() => {
        const storedName = localStorage.getItem('tracking_user_name');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    const eventQueue = useRef<{ session_id: string; event_type: string; metadata: any; created_at: string }[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ... (flushEvents logic remains same)

    const flushEvents = useCallback(async () => {
        if (eventQueue.current.length === 0) return;

        const eventsToPush = [...eventQueue.current];
        eventQueue.current = [];

        const { error } = await supabase
            .from('analytics_events')
            .insert(eventsToPush);

        if (error) {
            console.error('Failed to push analytics events:', error);
        }
    }, []);

    // Set up timer (remains same)
    useEffect(() => {
        timerRef.current = setInterval(() => {
            flushEvents();
        }, BATCH_INTERVAL);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            flushEvents();
        };
    }, [flushEvents]);


    const trackEvent = useCallback((type: string, metadata: any = {}) => {
        // Append user name if identified
        const enhancedMetadata = {
            ...metadata,
            user_name: userName // Will be null if anonymous
        };

        const event = {
            session_id: sessionId,
            event_type: type,
            metadata: enhancedMetadata,
            created_at: new Date().toISOString()
        };

        eventQueue.current.push(event);

        if (eventQueue.current.length >= BATCH_SIZE) {
            flushEvents();
        }
    }, [sessionId, flushEvents, userName]);

    // ... (heatmap logic remains same)
    useEffect(() => {
        if (!heatmapEnabled) return;

        const handleClick = (e: MouseEvent) => {
            const x = e.clientX;
            const y = e.clientY;
            const relX = x / window.innerWidth;
            const relY = y / window.innerHeight;
            const path = window.location.pathname;

            trackEvent('click', {
                x,
                y,
                relX,
                relY,
                path,
                w: window.innerWidth,
                h: window.innerHeight
            });
        };

        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, [heatmapEnabled, trackEvent]);

    const toggleHeatmap = (enabled: boolean) => {
        setHeatmapEnabled(enabled);
    };

    const handleConsentComplete = (name: string | null) => {
        setUserName(name);
    };

    return (
        <TrackingContext.Provider value={{ trackEvent, heatmapEnabled, toggleHeatmap }}>
            {children}
            <TrackingConsentModal onComplete={handleConsentComplete} />
        </TrackingContext.Provider>
    );
};

export const useTracking = () => {
    const context = useContext(TrackingContext);
    if (context === undefined) {
        throw new Error('useTracking must be used within a TrackingProvider');
    }
    return context;
};
