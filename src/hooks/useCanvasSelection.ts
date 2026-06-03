import { useCanvasGlobalStore } from '@/store/canvasStore';

export const useCanvasSelection = () => {
  const activeAreaIds = useCanvasGlobalStore(state => state.activeAreaIds);
  const setActiveAreaIds = useCanvasGlobalStore(state => state.setActiveAreaIds);
  
  const proximityVolumes = useCanvasGlobalStore(state => state.proximityVolumes);
  const setProximityVolumes = useCanvasGlobalStore(state => state.setProximityVolumes);
  
  const selectedItemIds = useCanvasGlobalStore(state => state.selectedItemIds);
  const setSelectedItemIds = useCanvasGlobalStore(state => state.setSelectedItemIds);
  
  const editingImageId = useCanvasGlobalStore(state => state.editingImageId);
  const setEditingImageId = useCanvasGlobalStore(state => state.setEditingImageId);
  
  const croppingImageId = useCanvasGlobalStore(state => state.croppingImageId);
  const setCroppingImageId = useCanvasGlobalStore(state => state.setCroppingImageId);
  
  const editingSoundboardItemId = useCanvasGlobalStore(state => state.editingSoundboardItemId);
  const setEditingSoundboardItemId = useCanvasGlobalStore(state => state.setEditingSoundboardItemId);
  
  const renamingAreaId = useCanvasGlobalStore(state => state.renamingAreaId);
  const setRenamingAreaId = useCanvasGlobalStore(state => state.setRenamingAreaId);
  
  const highlightedAudioId = useCanvasGlobalStore(state => state.highlightedAudioId);
  const setHighlightedAudioId = useCanvasGlobalStore(state => state.setHighlightedAudioId);
  
  const activeAudioIds = useCanvasGlobalStore(state => state.activeAudioIds);
  const setActiveAudioIds = useCanvasGlobalStore(state => state.setActiveAudioIds);
  
  const spatialPans = useCanvasGlobalStore(state => state.spatialPans);
  const setSpatialPans = useCanvasGlobalStore(state => state.setSpatialPans);
  
  const audioFilters = useCanvasGlobalStore(state => state.audioFilters);
  const setAudioFilters = useCanvasGlobalStore(state => state.setAudioFilters);
  
  const clearSelection = useCanvasGlobalStore(state => state.clearSelection);

  return {
    activeAreaIds, setActiveAreaIds,
    proximityVolumes, setProximityVolumes,
    selectedItemIds, setSelectedItemIds,
    editingImageId, setEditingImageId,
    croppingImageId, setCroppingImageId,
    editingSoundboardItemId, setEditingSoundboardItemId,
    renamingAreaId, setRenamingAreaId,
    highlightedAudioId, setHighlightedAudioId,
    activeAudioIds, setActiveAudioIds,
    spatialPans, setSpatialPans,
    audioFilters, setAudioFilters,
    clearSelection
  };
};
