import React, { createContext, useContext, useCallback } from 'react';

interface TrackingContextProps {
    trackEvent: (type: string, metadata?: any) => void;
    heatmapEnabled: boolean;
    toggleHeatmap: (enabled: boolean) => void;
}

const TrackingContext = createContext<TrackingContextProps | undefined>(undefined);

export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
    const trackEvent = useCallback((type: string, metadata: any = {}) => {
        // Analytics disabled (Supabase removed)
    }, []);

    const toggleHeatmap = (enabled: boolean) => {
        // Heatmap disabled
    };

    return (
        <TrackingContext.Provider value={{ trackEvent, heatmapEnabled: false, toggleHeatmap }}>
            {children}
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
