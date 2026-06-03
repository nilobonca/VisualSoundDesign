import { create } from 'zustand';

interface CanvasUIState {
  headerOpen: boolean;
  layerManagerOpen: boolean;
  pinManagerOpen: boolean;
  historyOpen: boolean;
  soundboardOpen: boolean;
  activePlayersOpen: boolean;
  globalTracksOpen: boolean;
  mobileMenuOpen: boolean;
  listenersOpen: boolean;
  setListenersOpen: (open: boolean) => void;
  menuZIndices: Record<string, number>;
  setHeaderOpen: (open: boolean) => void;
  setLayerManagerOpen: (open: boolean) => void;
  setPinManagerOpen: (open: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
  setSoundboardOpen: (open: boolean) => void;
  setActivePlayersOpen: (open: boolean) => void;
  setGlobalTracksOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  bringToFront: (menuId: string) => void;
}

interface CanvasSelectionState {
  activeAreaIds: Set<string>;
  proximityVolumes: Map<number, number>;
  spatialPans: Map<number, number>;
  audioFilters: Map<number, 'none' | 'lowpass' | 'wall' | 'telephone'>;
  selectedItemIds: Set<string>;
  editingImageId: string | null;
  croppingImageId: string | null;
  editingSoundboardItemId: string | null;
  renamingAreaId: string | null;
  highlightedAudioId: number | null;
  activeAudioIds: Set<number>;
  
  setActiveAreaIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setProximityVolumes: (volumes: Map<number, number> | ((prev: Map<number, number>) => Map<number, number>)) => void;
  setSpatialPans: (pans: Map<number, number> | ((prev: Map<number, number>) => Map<number, number>)) => void;
  setAudioFilters: (filters: Map<number, 'none' | 'lowpass' | 'wall' | 'telephone'> | ((prev: Map<number, 'none' | 'lowpass' | 'wall' | 'telephone'>) => Map<number, 'none' | 'lowpass' | 'wall' | 'telephone'>)) => void;
  setSelectedItemIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setEditingImageId: (id: string | null) => void;
  setCroppingImageId: (id: string | null) => void;
  setEditingSoundboardItemId: (id: string | null) => void;
  setRenamingAreaId: (id: string | null) => void;
  setHighlightedAudioId: (id: number | null) => void;
  setActiveAudioIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  clearSelection: () => void;
}

export type CanvasGlobalStore = CanvasUIState & CanvasSelectionState;

export const useCanvasGlobalStore = create<CanvasGlobalStore>((set) => ({
  // UI Initial States
  headerOpen: true,
  layerManagerOpen: false,
  pinManagerOpen: false,
  historyOpen: false,
  soundboardOpen: false,
  activePlayersOpen: false,
  globalTracksOpen: false,
  mobileMenuOpen: false,
    listenersOpen: false,
  menuZIndices: {
    header: 50,
    layer: 50,
    pin: 50,
    history: 50,
    listeners: 50,
    soundboard: 50,
    activePlayers: 50,
    globalTracks: 50
  },
  
  setHeaderOpen: (open) => { set({ headerOpen: open }); if(open) useCanvasGlobalStore.getState().bringToFront('header'); },
  setLayerManagerOpen: (open) => { set({ layerManagerOpen: open }); if(open) useCanvasGlobalStore.getState().bringToFront('layer'); },
  setPinManagerOpen: (open) => { set({ pinManagerOpen: open }); if(open) useCanvasGlobalStore.getState().bringToFront('pin'); },
  setHistoryOpen: (open) => { set({ historyOpen: open }); if(open) useCanvasGlobalStore.getState().bringToFront('history'); },
  setSoundboardOpen: (open) => { set({ soundboardOpen: open }); if(open) useCanvasGlobalStore.getState().bringToFront('soundboard'); },
  setActivePlayersOpen: (open) => { set({ activePlayersOpen: open }); if(open) useCanvasGlobalStore.getState().bringToFront('activePlayers'); },
  setGlobalTracksOpen: (open) => { set({ globalTracksOpen: open }); if(open) useCanvasGlobalStore.getState().bringToFront('globalTracks'); },
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    setListenersOpen: (open) => set({ listenersOpen: open }),
  
  bringToFront: (menuId) => set((state) => {
    const maxZ = Math.max(...Object.values(state.menuZIndices));
    return {
      menuZIndices: {
        ...state.menuZIndices,
        [menuId]: maxZ + 1
      }
    };
  }),

  // Selection Initial States
  activeAreaIds: new Set(),
  proximityVolumes: new Map(),
  spatialPans: new Map(),
  audioFilters: new Map(),
  selectedItemIds: new Set(),
  editingImageId: null,
  croppingImageId: null,
  editingSoundboardItemId: null,
  renamingAreaId: null,
  highlightedAudioId: null,
  activeAudioIds: new Set(),

  setActiveAreaIds: (ids) => set((state) => ({
    activeAreaIds: typeof ids === 'function' ? ids(state.activeAreaIds) : ids
  })),
  setProximityVolumes: (volumes) => set((state) => ({
    proximityVolumes: typeof volumes === 'function' ? volumes(state.proximityVolumes) : volumes
  })),
  setSpatialPans: (pans) => set((state) => ({
    spatialPans: typeof pans === 'function' ? pans(state.spatialPans) : pans
  })),
  setAudioFilters: (filters) => set((state) => ({
    audioFilters: typeof filters === 'function' ? filters(state.audioFilters) : filters
  })),
  setSelectedItemIds: (ids) => set((state) => ({
    selectedItemIds: typeof ids === 'function' ? ids(state.selectedItemIds) : ids
  })),
  setEditingImageId: (id) => set({ editingImageId: id }),
  setCroppingImageId: (id) => set({ croppingImageId: id }),
  setEditingSoundboardItemId: (id) => set({ editingSoundboardItemId: id }),
  setRenamingAreaId: (id) => set({ renamingAreaId: id }),
  setHighlightedAudioId: (id) => set({ highlightedAudioId: id }),
  setActiveAudioIds: (ids) => set((state) => ({
    activeAudioIds: typeof ids === 'function' ? ids(state.activeAudioIds) : ids
  })),

  clearSelection: () => set({
    selectedItemIds: new Set(),
    editingImageId: null,
    croppingImageId: null,
    editingSoundboardItemId: null,
    renamingAreaId: null
  })
}));
