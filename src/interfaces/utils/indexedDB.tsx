export interface Audios {
    id: number;
    name: string;
    file: File;
    url: string;
    createdAt: Date;
    order?: number;
}

export interface Players {
    id: string;
    audio: Audios;
    position: {
        x: number;
        y: number;
    };
}

export interface Images {
    id: number;
    name: string;
    file: File;
    url: string;
    createdAt: Date;
    order?: number;
}

export interface ActiveImage {
    id: string;
    image: Images;
    position: { x: number; y: number };
    // Image editing properties
    rotation?: number;        // 0-360 degrees
    scale?: number;           // 0.1-3x (default 1)
    flipH?: boolean;          // flip horizontal
    flipV?: boolean;          // flip vertical
    brightness?: number;      // -100 to 100 (default 0)
    contrast?: number;        // -100 to 100 (default 0)
    opacity?: number;         // 0-100 (default 100)
    crop?: {                  // crop area (percentage values)
        x: number;            // 0-100 (left position %)
        y: number;            // 0-100 (top position %)
        width: number;        // 0-100 (width %)
        height: number;       // 0-100 (height %)
    };
}

export interface ActiveArea {
    id: string;
    points: { x: number; y: number }[];
    linkedPlayerId: string | null; // Legacy - kept for backward compatibility
    linkedAudioId: number | null; // New - direct audio reference
    name: string;
    volumeMode?: 'standard' | 'proximity';
    volumeSourcePoint?: { x: number; y: number };
}

export interface ActivePin {
    id: string;
    position: { x: number; y: number };
    name: string;
    enabled: boolean;
    order?: number;
}

export interface Layer {
    id: string;
    type: 'group' | 'item';
    name: string;
    visible: boolean;
    locked: boolean;
    expanded?: boolean; // For UI state (groups)
    parentId: string | null; // For hierarchy
    depth: number; // For indentation
    // Item reference
    itemId?: string;
    itemType?: 'image' | 'area' | 'pin';
    order?: number;
}