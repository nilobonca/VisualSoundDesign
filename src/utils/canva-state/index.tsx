import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ItemType = 'image' | 'audio' | 'area' | 'pin';

export interface BaseItem {
    id: string;
    type: ItemType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    zIndex: number;
}

export interface ImageItem extends BaseItem {
    type: 'image';
    src: string;
    name: string;
    rotation?: number;
    flipX?: boolean;
    flipY?: boolean;
    brightness?: number; // 0-200, default 100
    contrast?: number;   // 0-200, default 100
    opacity?: number;    // 0-1, default 1
}

export interface AudioItem extends BaseItem {
    type: 'audio';
    src: string;
    name: string;
    loopStart: number; // seconds
    loopEnd: number;   // seconds
    duration: number;
    volume: number;    // 0 to 1
    isPlaying: boolean;
}

export interface AreaItem extends BaseItem {
    type: 'area';
    points: { x: number; y: number }[];
    linkedAudioId: string | null;
    color: string;
}

export interface PinItem extends BaseItem {
    type: 'pin';
    color: string;
}

export type CanvasItem = ImageItem | AudioItem | AreaItem | PinItem;

export type CanvasItemInput =
    | Omit<ImageItem, 'id' | 'zIndex'>
    | Omit<AudioItem, 'id' | 'zIndex'>
    | Omit<AreaItem, 'id' | 'zIndex'>
    | Omit<PinItem, 'id' | 'zIndex'>;

interface CanvasState {
    items: CanvasItem[];
    scale: number;
    offset: { x: number; y: number };
    selectedId: string | null;
    isDragging: boolean;

    addItem: (item: CanvasItemInput) => void;
    updateItem: (id: string, updates: Partial<CanvasItem>) => void;
    removeItem: (id: string) => void;
    setViewport: (scale: number, offset: { x: number; y: number }) => void;
    selectItem: (id: string | null) => void;
    bringToFront: (id: string) => void;
    setIsDragging: (isDragging: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
    items: [],
    scale: 1,
    offset: { x: 0, y: 0 },
    selectedId: null,
    isDragging: false,

    addItem: (item) => set((state) => {
        const maxZ = state.items.length > 0 ? Math.max(...state.items.map(i => i.zIndex)) : 0;
        const newItem = { ...item, id: uuidv4(), zIndex: maxZ + 1 } as CanvasItem;
        return { items: [...state.items, newItem] };
    }),

    updateItem: (id, updates) => set((state) => ({
        items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } as CanvasItem : item
        ),
    })),

    removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
    })),

    setViewport: (scale, offset) => set({ scale, offset }),

    selectItem: (id) => set({ selectedId: id }),

    bringToFront: (id) => set((state) => {
        const maxZ = Math.max(...state.items.map((i) => i.zIndex));
        return {
            items: state.items.map((item) =>
                item.id === id ? { ...item, zIndex: maxZ + 1 } : item
            ),
        };
    }),

    setIsDragging: (isDragging) => set({ isDragging }),
}));
