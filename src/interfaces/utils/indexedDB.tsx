
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
    type: 'player';
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
    type: 'image';
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
    type: 'area';
    name: string;
    points: { x: number; y: number }[];
    linkedPlayerId: string | null;
    linkedAudioId: number | null;
    volumeMode: 'standard' | 'proximity';
    volumeSourcePoint?: { x: number; y: number };
    showName?: boolean;
    color?: string;
    opacity?: number;
}

export interface ActivePin {
    id: string;
    type: 'pin';
    position: { x: number; y: number };
    name: string;
    enabled: boolean;
    order?: number;
    color?: string;
    opacity?: number;
    icon?: 'pin' | 'person' | 'ear';
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
    itemType?: 'image' | 'area' | 'pin' | 'soundboard' | 'note';
    order?: number;
    isProject?: boolean;
    projectId?: string; // Grouping for Pages (formerly Projects)
    isProjectMetadata?: boolean; // Identifies the Project Root Layer
}

export interface SoundboardItem {
    id: string;
    name: string;
    audioId: number | null;
    color?: string;
    order: number;
    playbackMode?: 'restart' | 'overlap'; // default: 'overlap'
}

export interface ActiveSoundboardItem {
    id: string;
    type: 'soundboard';
    soundboardItemId: string; // Reference to the original item definition
    position: { x: number; y: number };
    // We might want to override some properties per instance, but for now let's keep it simple
}

export interface ActiveNote {
    id: string;
    type: 'note';
    content: string;
    position: { x: number; y: number };
    width: number;
    height: number;
    color: string; // Background color (required as per usage implying default)
    fontSize: number;
    fontColor: string;
    transparentBg: boolean;
    textAlign: 'left' | 'center' | 'right';
    borderColor?: string;
    borderWidth?: number;
    fillMode?: 'filled' | 'transparent' | 'outlined';
}