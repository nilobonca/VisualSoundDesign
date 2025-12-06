import AudioPlayer from "@/components/player";
import HeaderCab from "@/components/header";
import { useEffect, useState, DragEvent, ChangeEvent, MouseEvent, useCallback, useRef } from "react";
import AudioPlayerList from '@/components/player-list';
import { getPolygonCentroid } from '@/utils/geometry';
import { useIDB } from '@/utils/indexedDB';
import { Players, Audios, Images, ActiveImage, ActiveArea, ActivePin, Layer, SoundboardItem, ActiveSoundboardItem, ActiveNote } from '@/interfaces/utils/indexedDB';
import { Layers, MapPin, Clock, LayoutGrid, ArrowLeft, History, Music, Plus, Hexagon, Type, Eye, EyeOff, Edit2, Trash2, Palette } from 'lucide-react';
import LayerManager from '@/components/LayerManager';
import CanvasContainer from "@/components/Canva/canva-teste";
import DraggableItem from "@/components/Canva/itens/draggable-item";
import ImageItem from "@/components/Canva/itens/image-item";
import EditableArea from "@/components/Canva/itens/editable-area";
import ContextMenu from "@/components/ContextMenu";
import PinItem from "@/components/Canva/itens/pin-item";
import { PinManager } from "@/components/PinManager";
import ImageEditor from "@/components/ImageEditor";
import HistoryMenu from "@/components/HistoryMenu";

import Soundboard from "@/components/Soundboard";
import { CanvasSoundboardItem } from "@/components/Soundboard/CanvasSoundboardItem";
import ActivePlayersMenu from "@/components/ActivePlayersMenu";
import { useRouter } from "next/router";
import BottomToolbar from "@/components/Canva/BottomToolbar";
import NoteItem from "@/components/Canva/itens/note-item";
import { createContext, useContext } from "react";

export const CanvasContext = createContext<{
  transform: { k: number; x: number; y: number };
  setTransform: (t: { k: number; x: number; y: number }) => void;
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
}>({
  transform: { k: 1, x: 0, y: 0 },
  setTransform: () => { },
  selectedItems: [],
  setSelectedItems: () => { },
});

export const useCanvas = () => useContext(CanvasContext);

export default function ProjectCanvas() {
  const router = useRouter();
  const { id: projectId } = router.query;

  // Helper for persistent state
  const usePersistentState = (key: string, defaultValue: boolean) => {
    const [state, setState] = useState(defaultValue);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          setState(stored === 'true');
        }
        setIsHydrated(true);
      }
    }, [key]);

    const setPersistentState = (newValue: boolean | ((prev: boolean) => boolean)) => {
      setState((prev) => {
        const next = typeof newValue === 'function' ? newValue(prev) : newValue;
        localStorage.setItem(key, String(next));
        return next;
      });
    };

    return [state, setPersistentState, isHydrated] as const;
  };

  const [headerOpen, setHeaderOpen] = usePersistentState('headerOpen', false);

  const {
    deleteAudio,
    // deleteAll, // Unused
    isLoading,
    savedAudios,
    saveAudio,
    activePlayers,
    findPlayer,
    addPlayerPersisted,
    updatePlayerPersisted,
    setMessage,
    // Images
    activeImages,
    addImagePersisted,
    updateImagePersisted,
    deleteImage,
    deleteImagePersisted,
    saveImage,
    savedImages,
    // Areas
    activeAreas,
    addAreaPersisted,
    updateAreaPersisted,
    deleteArea,
    deletePlayer,
    // Pins
    activePins,
    addPinPersisted,
    updatePinPersisted,
    deletePinPersisted,
    // Soundboard Items
    addSoundboardItem,
    updateSoundboardItem,
    deleteSoundboardItem,
    soundboardItems,
    addSoundboardItemPersisted,
    updateSoundboardItemPersisted,
    deleteSoundboardItemPersisted,
    activeSoundboardItems,
    // Layers
    activeLayers,
    addLayer,
    updateLayer,
    deleteLayer,
    reorderLayers,
    // Export/Import
    exportCanvasState,
    importCanvasState,
    restoreCanvasState,
    // Notes
    activeNotes,
    addNotePersisted,
    updateNotePersisted,
    deleteNotePersisted
  } = useIDB();

  const [contextMenu, setContextMenu] = useState<{ screenX: number; screenY: number; worldX: number; worldY: number; type?: 'canvas' | 'area' | 'pin' | 'image' | 'soundboard-def' | 'soundboard-active'; areaId?: string; pinId?: string; imageId?: string; soundboardItemId?: string; itemId?: string } | null>(null);

  // Project State
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null); // This is the Active PAGE ID

  // Enforce Active Page - Removed conflicting logic
  // The logic is now handled in the main sync effect below

  const getItemProjectId = useCallback((layer: Layer): string | null => {
    let current = layer;
    if (current.isProject) return current.id;

    while (current.parentId) {
      const parent = activeLayers.find(l => l.id === current.parentId);
      if (!parent) return null;
      if (parent.isProject) return parent.id;
      current = parent;
    }
    return null;
  }, [activeLayers]);



  const initializedProjectId = useRef<string | null>(null);

  // Sync activeProjectId with URL param (Project Group ID)
  useEffect(() => {
    if (projectId && typeof projectId === 'string' && !isLoading) {
      // Reset initialization if project ID changes
      if (initializedProjectId.current !== projectId) {
        initializedProjectId.current = null;
      }

      // Check if projectId is a Group ID (has pages)
      const pages = activeLayers.filter(l => l.isProject && l.projectId === projectId);

      if (pages.length > 0) {
        // If we are already initialized for this project and have an active page, skip
        if (initializedProjectId.current === projectId && activeProjectId) {
          return;
        }

        // It's a Project Group. Select the first page if no active page is set or if active page is not in this group.
        const currentActive = activeLayers.find(l => l.id === activeProjectId);

        if (!activeProjectId || !currentActive || currentActive.projectId !== projectId) {
          // Try to restore from localStorage FIRST
          const storedActiveId = localStorage.getItem(`activePage_${projectId}`);
          const storedPage = storedActiveId && pages.find(p => p.id === storedActiveId);

          if (storedPage) {
            setActiveProjectId(storedPage.id);
            initializedProjectId.current = projectId;
          } else {
            // Fallback to first page
            const firstPage = pages.sort((a, b) => (a.order || 0) - (b.order || 0))[0];
            if (firstPage) {
              setActiveProjectId(firstPage.id);
              initializedProjectId.current = projectId;
            }
          }
        } else {
          // Current active is valid, mark as initialized
          initializedProjectId.current = projectId;
        }
      } else {
        // No pages found with this projectId.
        // Check if the ID itself is a legacy Page ID.
        const legacyPage = activeLayers.find(l => l.id === projectId && l.isProject);
        if (legacyPage) {
          setActiveProjectId(legacyPage.id);
        } else {
          // No pages exist for this project group, and it's not a legacy page.
          // Create a default page.
          const newPageId = crypto.randomUUID();
          const newLayer: Layer = {
            id: newPageId,
            type: 'group',
            name: 'Página 1',
            visible: true,
            locked: false,
            parentId: null,
            depth: 0,
            isProject: true,
            projectId: projectId,
            order: 0
          };
          addLayer(newLayer);
          setActiveProjectId(newPageId);
          initializedProjectId.current = projectId;
        }
      }
    }
  }, [projectId, activeLayers, activeProjectId, isLoading, addLayer]);

  // Save to localStorage whenever activeProjectId changes
  useEffect(() => {
    if (activeProjectId && projectId) {
      localStorage.setItem(`activePage_${projectId}`, activeProjectId);
    }
  }, [activeProjectId, projectId]);

  // Pin State

  const [activeAreaIds, setActiveAreaIds] = useState<Set<string>>(new Set());
  const [proximityVolumes, setProximityVolumes] = useState<Map<number, number>>(new Map()); // Changed to audio IDs
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [renamingAreaId, setRenamingAreaId] = useState<string | null>(null);
  const [highlightedAudioId, setHighlightedAudioId] = useState<number | null>(null);

  // Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const dragStartPositions = useRef<Record<string, { x: number; y: number; points?: { x: number; y: number }[]; volumeSourcePoint?: { x: number; y: number } }>>({});

  // Undo/Redo State
  const [history, setHistory] = useState<{
    description: string;
    timestamp: number;
    state: {
      activePlayers: Players[];
      activeImages: ActiveImage[];
      activeAreas: ActiveArea[];
      activePins: ActivePin[];
      activeLayers: Layer[];
      activeSoundboardItems: ActiveSoundboardItem[];
      activeNotes: ActiveNote[];
    };
  }[]>([]);
  const [future, setFuture] = useState<{
    description: string;
    timestamp: number;
    state: {
      activePlayers: Players[];
      activeImages: ActiveImage[];
      activeAreas: ActiveArea[];
      activePins: ActivePin[];
      activeLayers: Layer[];
      activeSoundboardItems: ActiveSoundboardItem[];
      activeNotes: ActiveNote[];
    };
  }[]>([]);



  const addToHistory = useCallback((description: string = 'Alteração') => {
    const currentState = {
      description,
      timestamp: Date.now(),
      state: {
        activePlayers,
        activeImages,
        activeAreas,
        activePins,
        activeLayers,
        activeSoundboardItems,
        activeNotes
      }
    };
    setHistory(prev => {
      const newHistory = [...prev, currentState];
      if (newHistory.length > 50) newHistory.shift(); // Limit history size
      return newHistory;
    });
    setFuture([]);
  }, [activePlayers, activeImages, activeAreas, activePins, activeLayers]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousEntry = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    setFuture(prev => [previousEntry, ...prev]);
    setHistory(newHistory);

    // Restore the state BEFORE the last action. 
    // Actually, 'history' contains the state AFTER an action.
    // So if we undo, we want to go back to the state of history[length-2].
    // If history is empty after pop, we go to initial state (empty canvas)?
    // The current implementation of addToHistory saves the CURRENT state.
    // So history[last] IS the current state.
    // Wait, usually you save state BEFORE mutation.
    // Let's check usage: addToHistory() called at dragStart.
    // So it saves the state BEFORE the drag. Correct.
    // So history[last] is the state BEFORE the most recent action.
    // So restoring history[last] undoes the last action.

    restoreCanvasState(previousEntry.state);
  }, [history, restoreCanvasState]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const nextEntry = future[0];
    const newFuture = future.slice(1);

    setHistory(prev => [...prev, nextEntry]);
    setFuture(newFuture);

    restoreCanvasState(nextEntry.state);
  }, [future, restoreCanvasState]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRestoreHistory = (state: any, index: number, type: 'history' | 'future') => {
    restoreCanvasState(state);

    if (type === 'history') {
      // Restoring a past state
      // The new history should include everything up to that point
      // But wait, if we click an item in history, we want to revert TO that state.
      // And all subsequent states become "future" (redoable)? Or lost?
      // Standard behavior: Revert to state X. Future becomes (X+1 ... Current).

      // Let's simplify:
      // If we restore history[i], then history becomes history[0...i].
      // And future becomes history[i+1...end] + current + future.

      // Actually, let's just set the state and adjust arrays.
      const newHistory = history.slice(0, index + 1);
      const newFuture = [...history.slice(index + 1), ...future];

      setHistory(newHistory);
      setFuture(newFuture);
    } else {
      // Restoring a future state (Redo)
      // Future[j]
      // History becomes history + future[0...j]
      // Future becomes future[j+1...end]

      const newHistory = [...history, ...future.slice(0, index + 1)];
      const newFuture = future.slice(index + 1);

      setHistory(newHistory);
      setFuture(newFuture);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete Selection
      if (e.key === 'Delete') {
        if (selectedItemIds.size > 0) {
          addToHistory('Excluir Seleção');
          selectedItemIds.forEach(id => {
            if (activePlayers.find(p => p.id === id)) {
              deletePlayer(id);
            } else if (activeImages.find(i => i.id === id)) {
              deleteImagePersisted(id);
            } else if (activeAreas.find(a => a.id === id)) {
              deleteArea(id);
            } else if (activePins.find(p => p.id === id)) {
              deletePinPersisted(id);
            } else if (activeNotes.find(n => n.id === id)) {
              deleteNotePersisted(id);
            } else if (activeSoundboardItems.find(s => s.id === id)) {
              deleteSoundboardItemPersisted(id);
            }
          });
          setSelectedItemIds(new Set());
        }
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIds, activePlayers, activeImages, activeAreas, activePins, activeNotes, activeSoundboardItems, deletePlayer, deleteImagePersisted, deleteArea, deletePinPersisted, deleteNotePersisted, deleteSoundboardItemPersisted, addToHistory, handleUndo, handleRedo]);

  // Mobile responsive states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [layerManagerOpen, setLayerManagerOpen] = usePersistentState('layerManagerOpen', false);
  const [pinManagerOpen, setPinManagerOpen] = usePersistentState('pinManagerOpen', false);
  const [historyOpen, setHistoryOpen] = usePersistentState('historyOpen', false);
  const [soundboardOpen, setSoundboardOpen] = usePersistentState('soundboardOpen', false);
  const [activePlayersOpen, setActivePlayersOpen] = usePersistentState('activePlayersOpen', false);

  // Soundboard Renaming State
  const [editingSoundboardItemId, setEditingSoundboardItemId] = useState<string | null>(null);

  const handleRenameSoundboardItem = (id: string, newName: string) => {
    console.log('Renaming item:', id, 'to', newName);
    // Try finding as definition first (from Menu)
    const definition = soundboardItems.find(d => d.id === id);
    if (definition) {
      console.log('Found definition:', definition);
      updateSoundboardItem({ ...definition, name: newName });
    } else {
      // Try finding as active item (from Canvas)
      const activeItem = activeSoundboardItems.find(i => i.id === id);
      if (activeItem) {
        console.log('Found active item:', activeItem);
        const def = soundboardItems.find(d => d.id === activeItem.soundboardItemId);
        if (def) {
          console.log('Found definition from active item:', def);
          updateSoundboardItem({ ...def, name: newName });
        } else {
          console.error('Could not find definition for active item');
        }
      } else {
        console.error('Could not find item with id:', id);
      }
    }
    setEditingSoundboardItemId(null);
  };

  // Audio Linking Logic
  const linkSoundboardItemToAudio = (targetId: string, audioId: number) => {
    const audio = savedAudios.find(a => a.id === audioId);
    const audioName = audio ? audio.name : 'Botão';

    // Try finding as definition first (from Menu)
    const definition = soundboardItems.find(d => d.id === targetId);
    if (definition) {
      updateSoundboardItem({ ...definition, audioId, name: audioName });
    } else {
      // Try finding as active item (from Canvas)
      const activeItem = activeSoundboardItems.find(i => i.id === targetId);
      if (activeItem) {
        const def = soundboardItems.find(d => d.id === activeItem.soundboardItemId);
        if (def) {
          updateSoundboardItem({ ...def, audioId, name: audioName });
        }
      }
    }
  };



  // Z-Index Management
  const [menuZIndices, setMenuZIndices] = useState({
    header: 50,
    layer: 50,
    pin: 50,
    soundboard: 50
  });

  const bringToFront = (menu: 'header' | 'layer' | 'pin' | 'soundboard') => {
    setMenuZIndices(prev => {
      const values = Object.values(prev);
      const highest = Math.max(...values);
      // Check if current menu is the unique highest
      const isHighest = prev[menu] === highest;
      const isUnique = values.filter(v => v === highest).length === 1;

      if (isHighest && isUnique) return prev; // Already strictly on top

      return {
        ...prev,
        [menu]: highest + 1
      };
    });
  };

  const handleDragStart = (e: DragEvent, item: Audios | Images | string, type?: string) => {
    if (typeof item === 'string') {
      e.dataTransfer.setData('itemType', item);
      if (type) {
        e.dataTransfer.setData('itemId', type);
      }
    } else {
      e.dataTransfer.setData('itemId', item.id.toString());
      if (type) {
        e.dataTransfer.setData('itemType', type);
      }
    }
  };

  const handleGroupDragStart = (anchorId: string) => {
    addToHistory('Mover Itens');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const positions: Record<string, any> = {};
    selectedItemIds.forEach(id => {
      const img = activeImages.find(i => i.id === id);
      if (img) {
        positions[id] = { x: Number(img.position.x), y: Number(img.position.y) };
        return;
      }
      const pin = activePins.find(p => p.id === id);
      if (pin) {
        positions[id] = { x: pin.position.x, y: pin.position.y };
        return;
      }
      const area = activeAreas.find(a => a.id === id);
      if (area) {
        positions[id] = { points: area.points, volumeSourcePoint: area.volumeSourcePoint };
        return;
      }
      const sbItem = activeSoundboardItems.find(i => i.id === id);
      if (sbItem) {
        positions[id] = { x: sbItem.position.x, y: sbItem.position.y };
        return;
      }
    });
    // Also store anchor if not selected (should be selected though)
    if (!positions[anchorId]) {
      // ... logic to add anchor if needed, but usually it's selected
    }
    dragStartPositions.current = positions;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      saveAudio(file);
    }
  };

  const removePlayer = (id: string) => {
    deletePlayer(id)
  }

  const changePositionImage = (image: ActiveImage, position: { x: number, y: number }) => {
    // Only update the anchor image on drag end (or if single drag)
    // Group updates are handled by handleImageDrag during drag
    const foundImage = activeImages.find((i: ActiveImage) => i.id === image.id)
    if (foundImage) {
      const updatedImage = { ...foundImage, position: { x: position.x, y: position.y } };
      updateImagePersisted(updatedImage)
    }
  }

  const handleImageDrag = (id: string, x: number, y: number, dx?: number, dy?: number) => {
    // Group Drag Logic using Snapshot
    const startPos = dragStartPositions.current[id];
    if (selectedItemIds.has(id) && startPos) {
      const totalDx = x - startPos.x;
      const totalDy = y - startPos.y;

      selectedItemIds.forEach(itemId => {
        if (itemId === id) return; // Skip anchor

        const itemStartPos = dragStartPositions.current[itemId];
        if (!itemStartPos) return;

        // Try to find in images
        const img = activeImages.find(i => i.id === itemId);
        if (img) {
          updateImagePersisted({ ...img, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }

        // Try to find in pins
        const pin = activePins.find(p => p.id === itemId);
        if (pin) {
          updatePinPersisted({ ...pin, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }

        // Try to find in areas
        const area = activeAreas.find(a => a.id === itemId);
        if (area && itemStartPos.points) {
          const newPoints = itemStartPos.points.map(p => ({ x: p.x + totalDx, y: p.y + totalDy }));
          let newVolumeSource = area.volumeSourcePoint;
          if (itemStartPos.volumeSourcePoint) {
            newVolumeSource = { x: itemStartPos.volumeSourcePoint.x + totalDx, y: itemStartPos.volumeSourcePoint.y + totalDy };
          }
          updateAreaPersisted({ ...area, points: newPoints, volumeSourcePoint: newVolumeSource });
        }
      });
    }
  };


  const handleSoundboardItemDrag = (id: string, x: number, y: number, dx?: number, dy?: number) => {
    const startPos = dragStartPositions.current[id];
    if (selectedItemIds.has(id) && startPos) {
      const totalDx = x - startPos.x;
      const totalDy = y - startPos.y;

      selectedItemIds.forEach(itemId => {
        if (itemId === id) return;

        const itemStartPos = dragStartPositions.current[itemId];
        if (!itemStartPos) return;

        // Images
        const img = activeImages.find(i => i.id === itemId);
        if (img) {
          updateImagePersisted({ ...img, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }
        // Pins
        const pin = activePins.find(p => p.id === itemId);
        if (pin) {
          updatePinPersisted({ ...pin, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }
        // Soundboard Items
        const sbItem = activeSoundboardItems.find(i => i.id === itemId);
        if (sbItem) {
          updateSoundboardItemPersisted({ ...sbItem, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }
        // Areas
        const area = activeAreas.find(a => a.id === itemId);
        if (area && itemStartPos.points) {
          const newPoints = itemStartPos.points.map((p: { x: number, y: number }) => ({ x: p.x + totalDx, y: p.y + totalDy }));
          let newVolumeSource = area.volumeSourcePoint;
          if (itemStartPos.volumeSourcePoint) {
            newVolumeSource = { x: itemStartPos.volumeSourcePoint.x + totalDx, y: itemStartPos.volumeSourcePoint.y + totalDy };
          }
          updateAreaPersisted({ ...area, points: newPoints, volumeSourcePoint: newVolumeSource });
        }
      });
    }
  };

  const handleEditImage = (id: string) => {
    setEditingImageId(id);
  }

  const handleUpdateImage = (updatedImage: ActiveImage) => {
    // Update in real-time without closing the editor
    updateImagePersisted(updatedImage);
  }

  const createArea = (position?: { x: number; y: number }) => {
    addToHistory('Criar Área');
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newArea: ActiveArea = {
      id: crypto.randomUUID(),
      type: 'area',
      name: 'Nova Área',
      points: [
        { x: baseX, y: baseY },
        { x: baseX + 200, y: baseY },
        { x: baseX + 200, y: baseY + 200 },
        { x: baseX, y: baseY + 200 }
      ],
      linkedPlayerId: null,
      linkedAudioId: null
    };
    addAreaPersisted(newArea, activeProjectId);
  };

  const createPin = (position?: { x: number; y: number }) => {
    addToHistory('Criar Pin');
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newPin: ActivePin = {
      id: crypto.randomUUID(),
      type: 'pin',
      position: { x: baseX, y: baseY },
      name: 'Novo Pin',
      enabled: true,
      order: activePins.length
    };
    addPinPersisted(newPin, activeProjectId);
    setContextMenu(null);
  };

  const createNote = (position?: { x: number; y: number }) => {
    addToHistory('Criar Texto');
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newNote: ActiveNote = {
      id: crypto.randomUUID(),
      type: 'note',
      content: '',
      position: { x: baseX, y: baseY },
      width: 200,
      height: 100,
      color: '#ffffff',
      fontSize: 14,
      fontColor: '#000000',
      transparentBg: true,
      textAlign: 'left'
    };
    addNotePersisted(newNote, activeProjectId);
    setContextMenu(null);
  };

  const handleUpdateArea = (area: ActiveArea) => {
    updateAreaPersisted(area);
  };

  const handleAreaDrag = (areaId: string, totalDx: number, totalDy: number) => {
    if (selectedItemIds.has(areaId)) {
      selectedItemIds.forEach(id => {
        if (id === areaId) return; // Already updated by EditableArea internal state

        const itemStartPos = dragStartPositions.current[id];
        if (!itemStartPos) return;

        // Move Images
        const img = activeImages.find(i => i.id === id);
        if (img) {
          updateImagePersisted({ ...img, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }

        // Move Pins
        const pin = activePins.find(p => p.id === id);
        if (pin) {
          updatePinPersisted({ ...pin, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }

        // Move other Areas
        const area = activeAreas.find(a => a.id === id);
        if (area && itemStartPos.points) {
          const newPoints = itemStartPos.points.map(p => ({ x: p.x + totalDx, y: p.y + totalDy }));
          let newVolumeSource = area.volumeSourcePoint;
          if (itemStartPos.volumeSourcePoint) {
            newVolumeSource = { x: itemStartPos.volumeSourcePoint.x + totalDx, y: itemStartPos.volumeSourcePoint.y + totalDy };
          }
          updateAreaPersisted({ ...area, points: newPoints, volumeSourcePoint: newVolumeSource });
        }
      });
    }
  };

  const handleAreaContextMenu = (e: MouseEvent, areaId: string) => {
    setContextMenu({
      screenX: e.clientX,
      screenY: e.clientY,
      worldX: 0,
      worldY: 0,
      type: 'area',
      areaId: areaId
    });
  };

  const linkAreaToPlayer = (areaId: string, playerId: string) => {
    const area = activeAreas.find((a: ActiveArea) => a.id === areaId);
    if (area) {
      const updatedArea = { ...area, linkedPlayerId: playerId };
      handleUpdateArea(updatedArea);
    }
  };

  const linkAreaToAudio = (areaId: string, audioId: number) => {
    const area = activeAreas.find((a: ActiveArea) => a.id === areaId);
    const audio = savedAudios.find((a: Audios) => a.id === audioId);

    if (area && audio) {
      // Link the area directly to the audio (no player needed on canvas)
      const updatedArea = { ...area, linkedAudioId: audioId, linkedPlayerId: null };
      handleUpdateArea(updatedArea);
    }
  };

  // --- Pin Logic ---

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
  };

  function getPolygonCentroid(points: { x: number, y: number }[]) {
    let x = 0, y = 0;
    points.forEach(p => { x += p.x; y += p.y; });
    return { x: x / points.length, y: y / points.length };
  }

  function getRayIntersection(origin: { x: number, y: number }, target: { x: number, y: number }, points: { x: number, y: number }[]) {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return Infinity;

    let minT = Infinity;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      const v1 = origin;
      const v2 = target;
      const v3 = p1;
      const v4 = p2;

      const denom = (v1.x - v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x - v4.x);
      if (denom === 0) continue;

      const t = ((v1.x - v3.x) * (v3.y - v4.y) - (v1.y - v3.y) * (v3.x - v4.x)) / denom;
      const u = -((v1.x - v2.x) * (v1.y - v3.y) - (v1.y - v2.y) * (v1.x - v3.x)) / denom;

      if (t > 0 && u >= 0 && u <= 1) {
        if (t < minT) minT = t;
      }
    }
    return minT;
  }

  // Refactored interaction logic
  const [activeAudioIds, setActiveAudioIds] = useState<Set<number>>(new Set());

  const calculateInteractions = useCallback((pins: ActivePin[]) => {
    const newActiveIds = new Set<string>();
    const newProximityVolumes = new Map<number, number>(); // Changed to use audio IDs
    const newActiveAudioIds = new Set<number>();

    pins.forEach((pin: ActivePin) => {
      if (pin.enabled === false) return;

      // Pin hotspot (center bottom of 48px icon)
      const hotspot = { x: pin.position.x + 24, y: pin.position.y + 48 };

      activeAreas.forEach((area: ActiveArea) => {
        if (isPointInPolygon(hotspot, area.points)) {
          newActiveIds.add(area.id);

          if (area.linkedAudioId) {
            newActiveAudioIds.add(area.linkedAudioId);

            if (area.volumeMode === 'proximity') {
              const sourcePoint = area.volumeSourcePoint || getPolygonCentroid(area.points);
              const t = getRayIntersection(sourcePoint, hotspot, area.points);

              let factor = 1;
              if (t !== Infinity && t !== 0) {
                factor = Math.max(0, Math.min(1, 1 - (1 / t)));
              }
              newProximityVolumes.set(area.linkedAudioId, factor);
            } else {
              newProximityVolumes.set(area.linkedAudioId, 1);
            }
          }
        }
      });
    });

    setActiveAreaIds(newActiveIds);
    setProximityVolumes(newProximityVolumes);
    setActiveAudioIds(newActiveAudioIds);
  }, [activeAreas]); // Added dependency

  // Effect to recalculate when pins or areas change (e.g. toggle, delete, load)
  useEffect(() => {
    calculateInteractions(activePins);
  }, [activePins, activeAreas, calculateInteractions]);

  const handlePinDrag = (pinId: string, x: number, y: number, isDragging: boolean, dx?: number, dy?: number) => {
    // Group Drag Logic for Pins
    const startPos = dragStartPositions.current[pinId];
    if (isDragging && selectedItemIds.has(pinId) && startPos) {
      const totalDx = x - startPos.x;
      const totalDy = y - startPos.y;

      selectedItemIds.forEach(id => {
        if (id === pinId) return;

        const itemStartPos = dragStartPositions.current[id];
        if (!itemStartPos) return;

        const img = activeImages.find(i => i.id === id);
        if (img) {
          updateImagePersisted({ ...img, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }

        const p = activePins.find(p => p.id === id);
        if (p) {
          updatePinPersisted({ ...p, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }

        const area = activeAreas.find(a => a.id === id);
        if (area && itemStartPos.points) {
          const newPoints = itemStartPos.points.map(p => ({ x: p.x + totalDx, y: p.y + totalDy }));
          let newVolumeSource = area.volumeSourcePoint;
          if (itemStartPos.volumeSourcePoint) {
            newVolumeSource = { x: itemStartPos.volumeSourcePoint.x + totalDx, y: itemStartPos.volumeSourcePoint.y + totalDy };
          }
          updateAreaPersisted({ ...area, points: newPoints, volumeSourcePoint: newVolumeSource });
        }
      });
    }

    const tempPins = activePins.map((p: ActivePin) => p.id === pinId ? { ...p, position: { x, y } } : p);
    calculateInteractions(tempPins);

    if (!isDragging) {
      const pinToUpdate = activePins.find((p: ActivePin) => p.id === pinId);
      if (pinToUpdate) {
        updatePinPersisted({ ...pinToUpdate, position: { x, y } });
      }
    }
  };



  useEffect(() => {

    document.addEventListener('wheel', function (event) {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('keydown', (event) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      const isZoomKey = event.key === '+' || event.key === '=' || event.key === '-';
      if (isCtrlPressed && isZoomKey) {
        event.preventDefault();
      }
    });

  }, []);

  // Helper to check recursive visibility
  const isLayerVisible = (layer: Layer, allLayers: Layer[]): boolean => {
    if (!layer.visible) return false;
    if (layer.parentId) {
      const parent = allLayers.find(l => l.id === layer.parentId);
      if (parent) {
        return isLayerVisible(parent, allLayers);
      }
    }
    return true;
  };

  const handleLayerAction = (layer: Layer) => {
    if (layer.itemType === 'image' && layer.itemId) {
      handleEditImage(layer.itemId);
    } else if (layer.itemType === 'area' && layer.itemId) {
      // Trigger area context menu at center of screen or a default location
      // Since we don't have mouse coordinates here, we might need a different approach
      // or just select it. For now, let's select it.
      const area = activeAreas.find(a => a.id === layer.itemId);
      if (area) {
        // Just select/highlight for now, or maybe open a specific modal if we had one.
        // Simulating right click might be weird without coordinates.
        // Let's just set it as active/selected.
        setActiveAreaIds(new Set([area.id]));
      }
    } else if (layer.itemType === 'pin' && layer.itemId) {
      // Similar for pin
    }
  };

  // Export/Import handlers
  const handleExport = async () => {
    await exportCanvasState();
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      const confirmImport = window.confirm(
        'Importar um canvas irá substituir todos os dados atuais. Deseja continuar?'
      );
      if (confirmImport) {
        addToHistory('Importar Canvas');
        await importCanvasState(file);
      }
    } else {
      setMessage('Por favor, selecione um arquivo JSON válido.');
    }
    // Reset input
    e.target.value = '';
  };

  const handleSelectionChange = (rect: { x: number; y: number; width: number; height: number } | null) => {
    if (!rect) {
      setSelectedItemIds(new Set());
      return;
    }

    const newSelectedIds = new Set<string>();

    // Check intersection with Images
    activeImages.forEach(img => {
      const el = document.getElementById(`item-${img.id}`);
      if (el) {
        const itemRect = el.getBoundingClientRect();
        // We need to compare rects in the same coordinate space.
        // The selection rect passed from CanvasContainer is in screen coordinates relative to the container.
        // getBoundingClientRect returns screen coordinates relative to viewport.
        // CanvasContainer is relative, so we need to adjust.
        // Actually, let's look at how we implemented onSelectionChange in CanvasContainer.
        // We passed `rect` from `containerRef.current.getBoundingClientRect()`.
        // Wait, in CanvasContainer:
        // onSelectionChange({ x: left, y: top, width, height });
        // where left/top are relative to the container (clientX - rect.left).

        // So `rect` is relative to the container top-left.

        // `itemRect` is relative to viewport.
        // We need itemRect relative to container.
        const container = document.querySelector('.relative.flex-1.overflow-hidden.bg-neutral-900');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const itemLeft = itemRect.left - containerRect.left;
          const itemTop = itemRect.top - containerRect.top;

          if (
            itemLeft < rect.x + rect.width &&
            itemLeft + itemRect.width > rect.x &&
            itemTop < rect.y + rect.height &&
            itemTop + itemRect.height > rect.y
          ) {
            newSelectedIds.add(img.id);
          }
        }
      }
    });

    // Check intersection with Pins
    activePins.forEach(pin => {
      const el = document.getElementById(`item-${pin.id}`);
      if (el) {
        const container = document.querySelector('.relative.flex-1.overflow-hidden.bg-neutral-900');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const itemRect = el.getBoundingClientRect();
          const itemLeft = itemRect.left - containerRect.left;
          const itemTop = itemRect.top - containerRect.top;

          if (
            itemLeft < rect.x + rect.width &&
            itemLeft + itemRect.width > rect.x &&
            itemTop < rect.y + rect.height &&
            itemTop + itemRect.height > rect.y
          ) {
            newSelectedIds.add(pin.id);
          }
        }
      }
    });

    // Check intersection with Notes
    activeNotes.forEach(note => {
      const el = document.getElementById(`item-${note.id}`);
      if (el) {
        const container = document.querySelector('.relative.flex-1.overflow-hidden.bg-neutral-900');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const itemRect = el.getBoundingClientRect();
          const itemLeft = itemRect.left - containerRect.left;
          const itemTop = itemRect.top - containerRect.top;

          if (
            itemLeft < rect.x + rect.width &&
            itemLeft + itemRect.width > rect.x &&
            itemTop < rect.y + rect.height &&
            itemTop + itemRect.height > rect.y
          ) {
            newSelectedIds.add(note.id);
          }
        }
      }
    });

    // Check intersection with Areas
    activeAreas.forEach(area => {
      const el = document.getElementById(`area-${area.id}`);
      if (el) {
        const container = document.querySelector('.relative.flex-1.overflow-hidden.bg-neutral-900');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const itemRect = el.getBoundingClientRect();
          const itemLeft = itemRect.left - containerRect.left;
          const itemTop = itemRect.top - containerRect.top;

          if (
            itemLeft < rect.x + rect.width &&
            itemLeft + itemRect.width > rect.x &&
            itemTop < rect.y + rect.height &&
            itemTop + itemRect.height > rect.y
          ) {
            newSelectedIds.add(area.id);
          }
        }
      }
    });



    // Check intersection with Soundboard Items
    activeSoundboardItems.forEach(item => {
      const el = document.getElementById(`item-${item.id}`);
      if (el) {
        const container = document.querySelector('.relative.flex-1.overflow-hidden.bg-neutral-900');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const itemRect = el.getBoundingClientRect();
          const itemLeft = itemRect.left - containerRect.left;
          const itemTop = itemRect.top - containerRect.top;

          if (
            itemLeft < rect.x + rect.width &&
            itemLeft + itemRect.width > rect.x &&
            itemTop < rect.y + rect.height &&
            itemTop + itemRect.height > rect.y
          ) {
            newSelectedIds.add(item.id);
          }
        }
      }
    });

    setSelectedItemIds(newSelectedIds);
  };

  return (

    <div className="flex flex-col md:flex-row bg-gray-200 h-screen w-screen overflow-hidden">

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {(layerManagerOpen || pinManagerOpen || mobileMenuOpen) && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => {
            setLayerManagerOpen(false);
            setPinManagerOpen(false);
            setMobileMenuOpen(false);
          }}
        />
      )}

      {/* Layer Manager - Floating */}
      {layerManagerOpen && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ zIndex: menuZIndices.layer }}
          onMouseDown={() => bringToFront('layer')}
        >
          <LayerManager
            onLayerAction={handleLayerAction}
            onInteraction={() => bringToFront('layer')}
            onClose={() => setLayerManagerOpen(false)}
            activeProjectId={activeProjectId}
            onSelectProject={setActiveProjectId}
            projectGroupId={typeof projectId === 'string' ? projectId : null}
            addToHistory={addToHistory}
            onExport={handleExport}
            onImport={handleImport}
          />
        </div>
      )}

      {/* Pin Manager - Floating */}
      {pinManagerOpen && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ zIndex: menuZIndices.pin }}
          onMouseDown={() => bringToFront('pin')}
        >
          <PinManager
            pins={activePins}
            onToggle={(pin) => updatePinPersisted({ ...pin, enabled: !pin.enabled })}
            onRename={(pin, newName) => updatePinPersisted({ ...pin, name: newName })}
            onDelete={deletePinPersisted}
            onClose={() => setPinManagerOpen(false)}
          />
        </div>
      )}

      {/* History Menu - Floating */}
      {historyOpen && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          <HistoryMenu
            history={history}
            future={future}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClose={() => setHistoryOpen(false)}
            onRestore={restoreCanvasState}
          />
        </div>
      )}






      {/* HeaderCab - Floating (Assets) */}
      {headerOpen && (
        <div
          className="hidden md:block absolute inset-0 pointer-events-none"
          style={{ zIndex: menuZIndices.header }}
        >
          <HeaderCab
            HandleDragStart={handleDragStart}
            HandleFileChange={handleFileChange}
            IsLoading={isLoading}
            SetMessage={setMessage}
            SavedAudios={savedAudios}
            DeleteAudio={deleteAudio}
            activeAudioIds={activeAudioIds}
            proximityVolumes={proximityVolumes}
            highlightedAudioId={highlightedAudioId}
            onInteraction={() => bringToFront('header')}
            onClose={() => setHeaderOpen(false)}
          />
        </div>
      )}

      {/* Soundboard - Floating */}
      {soundboardOpen && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          <Soundboard
            items={soundboardItems}
            onPlay={(id) => {
              const item = soundboardItems.find(i => i.id === id);
              if (item) {
                // Play logic here
              }
            }}
            onStop={(id) => {
              // Stop logic here
            }}
            onClose={() => setSoundboardOpen(false)}
            onAddItem={addSoundboardItemPersisted}
            onUpdateItem={updateSoundboardItemPersisted}
            onDeleteItem={deleteSoundboardItemPersisted}
            onItemContextMenu={(e, itemId) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                screenX: e.clientX,
                screenY: e.clientY,
                worldX: 0,
                worldY: 0,
                type: 'soundboard-def',
                itemId: itemId
              });
            }}
            editingItemId={editingSoundboardItemId}
            onRename={handleRenameSoundboardItem}
          />
        </div>
      )}

      {/* Active Players Menu - Floating */}
      {/* Active Players Menu - Floating */}
      {activePlayersOpen && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 60 }} // High z-index
        >
          <ActivePlayersMenu
            activePlayers={activePlayers}
            activeAreas={activeAreas}
            savedAudios={savedAudios}
            activeAudioIds={activeAudioIds}
            onClose={() => setActivePlayersOpen(false)}
            onInteraction={() => bringToFront('header')} // Reuse header z-index logic or add new
            onLocatePlayer={(player) => {
              // Implement locate logic if needed
            }}
            onDeletePlayer={(id, type) => {
              if (type === 'player') deletePlayer(id);
              else if (type === 'area') deleteArea(id);
            }}
          />
        </div>
      )}



      {/* Desktop Dock Bar - Bottom Left */}
      <div className="hidden md:flex fixed left-4 bottom-4 z-50 flex-col gap-2">
        {/* Layer Manager Toggle */}
        {!layerManagerOpen && (
          <button
            onClick={() => setLayerManagerOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Camadas"
          >
            <Layers size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* Pin Manager Toggle */}
        {!pinManagerOpen && (
          <button
            onClick={() => setPinManagerOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Pins"
          >
            <MapPin size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* History Toggle */}
        {!historyOpen && (
          <button
            onClick={() => setHistoryOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Histórico"
          >
            <History size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* Soundboard Toggle */}
        {!soundboardOpen && (
          <button
            onClick={() => setSoundboardOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Soundboard"
          >
            <Music size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* Active Players Toggle */}
        {!activePlayersOpen && (
          <button
            onClick={() => setActivePlayersOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Players Ativos"
          >
            {/* Using Volume2 icon for Active Players */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-neutral-200"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 0 0 1 0 14.14"></path></svg>
          </button>
        )}

        {/* Header/Assets Toggle */}
        {!headerOpen && (
          <button
            onClick={() => setHeaderOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Assets"
          >
            <LayoutGrid size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}
        {/* Back to Dashboard */}
        <button
          onClick={() => router.push('/')}
          className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
          title="Voltar ao Dashboard"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-neutral-200" />
        </button>
      </div>



      <div className="flex-1 relative h-full w-full overflow-hidden">
        {/* Layer Manager Panel - Responsive positioned */}


        <div className="absolute inset-0 z-0">
          <CanvasContainer
            items={[...activePlayers, ...activeImages, ...activeAreas, ...activePins]} // Keep for minimap
            onDropItem={(itemData: { id: string | number }, type: string, x: number, y: number) => {
              addToHistory('Adicionar Item');
              if (type === 'image') {
                const image = savedImages.find((i: Images) => i.id === Number(itemData.id));
                if (image) {
                  const newImage: ActiveImage = {
                    id: crypto.randomUUID(),
                    type: 'image',
                    image: image,
                    position: { x, y }
                  };
                  addImagePersisted(newImage, activeProjectId);
                }
              } else if (type === 'audio') {
                const audio = savedAudios.find((a: Audios) => a.id === Number(itemData.id));
                if (audio) {
                  const newArea: ActiveArea = {
                    id: crypto.randomUUID(),
                    type: 'area',
                    points: [
                      { x: x, y: y },
                      { x: x + 200, y: y },
                      { x: x + 200, y: y + 200 },
                      { x: x, y: y + 200 }
                    ],
                    linkedPlayerId: null,
                    linkedAudioId: audio.id,
                    name: audio.name,
                    volumeMode: 'standard'
                  };
                  addAreaPersisted(newArea, activeProjectId);
                }
              } else if (type === 'soundboardItem') {
                const item = soundboardItems.find(i => i.id === String(itemData.id));
                if (item) {
                  const newItem: ActiveSoundboardItem = {
                    id: crypto.randomUUID(),
                    type: 'soundboard',
                    soundboardItemId: item.id,
                    position: { x, y }
                  };
                  addSoundboardItemPersisted(newItem, activeProjectId);
                }
              } else if (type === 'note') {
                const newNote: ActiveNote = {
                  id: crypto.randomUUID(),
                  type: 'note',
                  content: '',
                  position: { x, y },
                  width: 200,
                  height: 100,
                  color: '#ffffff',
                  fontSize: 14,
                  fontColor: '#000000',
                  transparentBg: true,
                  textAlign: 'left'
                };
                addNotePersisted(newNote, activeProjectId);
              } else if (type === 'pin') {
                createPin({ x, y });
              } else if (type === 'area') {
                // Handle different area shapes
                const shape = itemData.id as string; // 'rectangle', 'circle', etc.
                const baseX = x;
                const baseY = y;
                let points = [];

                if (shape === 'circle') {
                  // Approx circle with 12 points
                  const radius = 100;
                  for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    points.push({
                      x: baseX + radius + Math.cos(angle) * radius,
                      y: baseY + radius + Math.sin(angle) * radius
                    });
                  }
                } else if (shape === 'triangle') {
                  points = [
                    { x: baseX + 100, y: baseY },
                    { x: baseX + 200, y: baseY + 200 },
                    { x: baseX, y: baseY + 200 }
                  ];
                } else if (shape === 'hexagon') {
                  const radius = 100;
                  for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    points.push({
                      x: baseX + radius + Math.cos(angle) * radius,
                      y: baseY + radius + Math.sin(angle) * radius
                    });
                  }
                } else {
                  // Default Rectangle
                  points = [
                    { x: baseX, y: baseY },
                    { x: baseX + 200, y: baseY },
                    { x: baseX + 200, y: baseY + 200 },
                    { x: baseX, y: baseY + 200 }
                  ];
                }

                const newArea: ActiveArea = {
                  id: crypto.randomUUID(),
                  type: 'area',
                  name: 'Nova Área',
                  points: points,
                  linkedPlayerId: null,
                  linkedAudioId: null,
                  volumeMode: 'standard'
                };
                addAreaPersisted(newArea, activeProjectId);
              }
            }}
            onDropFile={async (files: FileList, x: number, y: number) => {
              addToHistory('Adicionar Arquivo');
              const fileArray = Array.from(files);
              for (const file of fileArray) {
                const index = fileArray.indexOf(file);
                const offsetX = x + index * 20;
                const offsetY = y + index * 20;

                if (file.type.startsWith('audio/')) {
                  await saveAudio(file);
                } else if (file.type.startsWith('image/')) {
                  const savedImage = await saveImage(file);
                  if (savedImage) {
                    const newImage: ActiveImage = {
                      id: crypto.randomUUID(),
                      type: 'image',
                      image: savedImage,
                      position: { x: offsetX, y: offsetY },
                      rotation: 0,
                      scale: 1,
                      flipH: false,
                      flipV: false,
                      brightness: 0,
                      contrast: 0,
                      opacity: 100
                    };
                    addImagePersisted(newImage, activeProjectId);
                  }
                }
              }
            }}
            onCanvasRightClick={(e, worldX, worldY) => {
              setContextMenu({
                screenX: e.clientX,
                screenY: e.clientY,
                worldX,
                worldY,
                type: 'canvas'
              });
            }}
            onSelectionChange={handleSelectionChange}
          >
            {/* Render items based on Layer Order */}
            {/* Reverse layers so the first item in the list (Top) is rendered last (Top Z-Index) */}
            {[...activeLayers].reverse().map((layer, index) => {
              if (!isLayerVisible(layer, activeLayers)) return null;

              // Filter by Active Project
              const projectId = getItemProjectId(layer);
              if (projectId !== activeProjectId) return null;

              if (layer.itemType === 'image') {
                const image = activeImages.find(i => i.id === layer.itemId);
                if (!image) return null;
                return (
                  <DraggableItem
                    key={image.id}
                    id={image.id}
                    x={Number(image.position.x)}
                    y={Number(image.position.y)}
                    zIndex={index}

                    isSelected={selectedItemIds.has(image.id)}
                    className={''}
                    onPositionChange={(id, x, y) => changePositionImage(image, { x, y })}
                    onDrag={handleImageDrag}
                    onDragStart={handleGroupDragStart}
                  >
                    <ImageItem
                      image={image}
                      onDelete={() => deleteImagePersisted(image.id)}
                      onEdit={() => handleEditImage(image.id)}
                      onUpdate={(updatedImage) => updateImagePersisted(updatedImage)}
                      isEditing={editingImageId === image.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedItemIds(new Set([image.id]));
                        setContextMenu({
                          screenX: e.clientX,
                          screenY: e.clientY,
                          worldX: 0,
                          worldY: 0,
                          type: 'image',
                          imageId: image.id
                        });
                      }}
                    />
                  </DraggableItem>
                );
              }

              if (layer.itemType === 'area') {
                const area = activeAreas.find(a => a.id === layer.itemId);
                if (!area) return null;
                return (
                  <EditableArea
                    key={area.id}
                    area={area}
                    zIndex={index}
                    onUpdate={handleUpdateArea}
                    onDelete={deleteArea}
                    isSelected={selectedItemIds.has(area.id)}
                    onSelect={() => {
                      setSelectedItemIds(new Set([area.id]));
                    }}
                    onRightClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedItemIds(new Set([area.id]));
                      setContextMenu({
                        screenX: e.clientX,
                        screenY: e.clientY,
                        worldX: 0,
                        worldY: 0,
                        type: 'area',
                        areaId: area.id
                      });
                    }}
                    isActive={activeAreaIds.has(area.id)}
                    onHover={setHighlightedAudioId}
                    onDrag={handleAreaDrag}
                    onDragStart={handleGroupDragStart}
                    isRenaming={renamingAreaId === area.id}
                    onRenameEnd={() => setRenamingAreaId(null)}
                  />
                );
              }

              if (layer.itemType === 'pin') {
                const pin = activePins.find(p => p.id === layer.itemId);
                if (!pin) return null;
                return (
                  <DraggableItem
                    key={pin.id}
                    id={pin.id}
                    x={pin.position.x}
                    y={pin.position.y}
                    zIndex={index}
                    isSelected={selectedItemIds.has(pin.id)}
                    onPositionChange={(id, x, y) => handlePinDrag(id, x, y, false)}
                    onDrag={(id, x, y, dx, dy) => handlePinDrag(id, x, y, true, dx, dy)}
                    onDragStart={handleGroupDragStart}
                  >
                    <PinItem
                      pin={pin}
                      onUpdate={updatePinPersisted}
                      onDelete={() => deletePinPersisted(pin.id)}
                      isSelected={selectedItemIds.has(pin.id)}
                      onSelect={() => setSelectedItemIds(new Set([pin.id]))}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({
                          screenX: e.clientX,
                          screenY: e.clientY,
                          worldX: 0,
                          worldY: 0,
                          type: 'pin',
                          pinId: pin.id
                        });
                      }}
                    />
                  </DraggableItem>
                );
              }

              if (layer.itemType === 'note') {
                const note = activeNotes.find(n => n.id === layer.itemId);
                if (!note) return null;
                return (
                  <NoteItem
                    key={note.id}
                    note={note}
                    zIndex={index + 200}
                    onUpdate={updateNotePersisted}
                    onDelete={deleteNotePersisted}
                    isSelected={selectedItemIds.has(note.id)}
                    onSelect={() => {
                      setSelectedItemIds(new Set([note.id]));
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // Optional: Add context menu for notes
                    }}
                  />
                );
              }

              if (layer.itemType === 'soundboard') {
                const item = activeSoundboardItems.find(i => i.id === layer.itemId);
                if (!item) return null;
                const soundboardItem = soundboardItems.find(sb => sb.id === item.soundboardItemId);
                if (!soundboardItem) return null;
                const audio = soundboardItem.audioId ? savedAudios.find(a => a.id === soundboardItem.audioId) : undefined;

                return (
                  <DraggableItem
                    key={item.id}
                    id={item.id}
                    x={item.position.x}
                    y={item.position.y}
                    zIndex={index}
                    isSelected={selectedItemIds.has(item.id)}
                    onPositionChange={(id, x, y) => updateSoundboardItemPersisted({ ...item, position: { x, y } })}
                    onDrag={(id, x, y, dx, dy) => handleSoundboardItemDrag(id, x, y, dx, dy)}
                    onDragStart={handleGroupDragStart}
                  >
                    <CanvasSoundboardItem
                      item={item}
                      soundboardItem={soundboardItem}
                      audio={audio}
                      onDelete={() => deleteSoundboardItemPersisted(item.id)}
                      isRenaming={editingSoundboardItemId === item.id || editingSoundboardItemId === soundboardItem.id}
                      onRename={(newName) => handleRenameSoundboardItem(item.id, newName)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedItemIds(new Set([item.id]));
                        setContextMenu({
                          screenX: e.clientX,
                          screenY: e.clientY,
                          worldX: 0,
                          worldY: 0,
                          type: 'soundboard-active',
                          itemId: item.id
                        });
                      }}
                    />
                  </DraggableItem>
                );
              }

              return null;
            })}
          </CanvasContainer>
        </div>


        {/* Context Menu */}
        {
          contextMenu && (
            <ContextMenu
              x={contextMenu.screenX}
              y={contextMenu.screenY}
              onClose={() => setContextMenu(null)}
              options={[
                ...(contextMenu.type === 'canvas' ? [
                  {
                    label: 'Adicionar',
                    icon: <Plus size={18} />,
                    onClick: () => { },
                    subMenu: [
                      { label: 'Criar Área', onClick: () => createArea({ x: contextMenu.worldX, y: contextMenu.worldY }), icon: <Hexagon size={18} /> },
                      { label: 'Criar Pin', onClick: () => createPin({ x: contextMenu.worldX, y: contextMenu.worldY }), icon: <MapPin size={18} /> },
                      { label: 'Criar Texto', onClick: () => createNote({ x: contextMenu.worldX, y: contextMenu.worldY }), icon: <Type size={18} /> },
                    ]
                  },
                  {
                    label: activeAreas.every(a => a.showName) ? 'Ocultar Nomes das Áreas' : 'Mostrar Nomes das Áreas',
                    onClick: () => {
                      const allVisible = activeAreas.every(a => a.showName);
                      activeAreas.forEach(area => {
                        handleUpdateArea({ ...area, showName: !allVisible });
                      });
                      setContextMenu(null);
                    },
                    icon: <Eye size={18} />
                  }
                ] : []),
                ...(contextMenu.type === 'area' ? [
                  { label: 'Renomear', onClick: () => { if (contextMenu.areaId) setRenamingAreaId(contextMenu.areaId); setContextMenu(null); }, icon: <Edit2 size={18} /> },
                  {
                    label: activeAreas.find(a => a.id === contextMenu.areaId)?.showName ? 'Ocultar Nome' : 'Mostrar Nome',
                    onClick: () => {
                      if (contextMenu.areaId) {
                        const area = activeAreas.find(a => a.id === contextMenu.areaId);
                        if (area) {
                          handleUpdateArea({ ...area, showName: !area.showName });
                        }
                      }
                      setContextMenu(null);
                    },
                    icon: <Eye size={18} />
                  },
                  {
                    label: 'Relacionar Áudio',
                    onClick: () => { }, // Submenu handles click
                    icon: <Music size={18} />,
                    searchable: true,
                    subMenu: savedAudios.map(audio => ({
                      label: audio.name,
                      onClick: () => {
                        if (contextMenu.areaId) {
                          linkAreaToAudio(contextMenu.areaId, audio.id);
                        }
                      },
                      icon: <Music size={14} />
                    }))
                  },
                  {
                    label: 'Aparência',
                    icon: <Palette size={18} />,
                    onClick: () => { },
                    subMenu: [
                      {
                        label: 'Cor',
                        onClick: () => { },
                        custom: (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">Cor</span>
                            <div className="relative w-6 h-6 overflow-hidden rounded-full border border-gray-300">
                              <input
                                type="color"
                                value={activeAreas.find(a => a.id === contextMenu.areaId)?.color || '#3b82f6'}
                                onChange={(e) => {
                                  if (contextMenu.areaId) {
                                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                                    if (area) handleUpdateArea({ ...area, color: e.target.value });
                                  }
                                }}
                                className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                              />
                            </div>
                          </div>
                        )
                      },
                      {
                        label: 'Opacidade',
                        onClick: () => { },
                        custom: (
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="font-medium">Opacidade</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={activeAreas.find(a => a.id === contextMenu.areaId)?.opacity !== undefined ? activeAreas.find(a => a.id === contextMenu.areaId)?.opacity : 0.2}
                                onChange={(e) => {
                                  if (contextMenu.areaId) {
                                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                                    if (area) handleUpdateArea({ ...area, opacity: parseFloat(e.target.value) });
                                  }
                                }}
                                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={Math.round((activeAreas.find(a => a.id === contextMenu.areaId)?.opacity !== undefined ? activeAreas.find(a => a.id === contextMenu.areaId)!.opacity! : 0.2) * 100)}
                                onChange={(e) => {
                                  if (contextMenu.areaId) {
                                    let val = parseInt(e.target.value);
                                    if (isNaN(val)) val = 0;
                                    if (val < 0) val = 0;
                                    if (val > 100) val = 100;
                                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                                    if (area) handleUpdateArea({ ...area, opacity: val / 100 });
                                  }
                                }}
                                className="w-12 text-sm border border-gray-300 rounded px-1 text-center"
                              />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                          </div>
                        )
                      }
                    ]
                  },
                  { label: 'Excluir Área', onClick: () => { if (contextMenu.areaId) deleteArea(contextMenu.areaId); }, icon: <Trash2 size={18} /> }
                ] : []),
                ...(contextMenu.type === 'pin' ? [
                  {
                    label: 'Aparência',
                    icon: <Palette size={18} />,
                    onClick: () => { },
                    subMenu: [
                      {
                        label: 'Cor',
                        onClick: () => { },
                        custom: (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">Cor</span>
                            <div className="relative w-6 h-6 overflow-hidden rounded-full border border-gray-300">
                              <input
                                type="color"
                                value={activePins.find(p => p.id === contextMenu.pinId)?.color || '#ef4444'}
                                onChange={(e) => {
                                  if (contextMenu.pinId) {
                                    const pin = activePins.find(p => p.id === contextMenu.pinId);
                                    if (pin) updatePinPersisted({ ...pin, color: e.target.value });
                                  }
                                }}
                                className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                              />
                            </div>
                          </div>
                        )
                      },
                      {
                        label: 'Opacidade',
                        onClick: () => { },
                        custom: (
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="font-medium">Opacidade</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={activePins.find(p => p.id === contextMenu.pinId)?.opacity !== undefined ? activePins.find(p => p.id === contextMenu.pinId)?.opacity : 1}
                                onChange={(e) => {
                                  if (contextMenu.pinId) {
                                    const pin = activePins.find(p => p.id === contextMenu.pinId);
                                    if (pin) updatePinPersisted({ ...pin, opacity: parseFloat(e.target.value) });
                                  }
                                }}
                                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={Math.round((activePins.find(p => p.id === contextMenu.pinId)?.opacity !== undefined ? activePins.find(p => p.id === contextMenu.pinId)!.opacity! : 1) * 100)}
                                onChange={(e) => {
                                  if (contextMenu.pinId) {
                                    let val = parseInt(e.target.value);
                                    if (isNaN(val)) val = 0;
                                    if (val < 0) val = 0;
                                    if (val > 100) val = 100;
                                    const pin = activePins.find(p => p.id === contextMenu.pinId);
                                    if (pin) updatePinPersisted({ ...pin, opacity: val / 100 });
                                  }
                                }}
                                className="w-12 text-sm border border-gray-300 rounded px-1 text-center"
                              />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                          </div>
                        )
                      }
                    ]
                  },
                  { label: 'Excluir Pin', onClick: () => { if (contextMenu.pinId) deletePinPersisted(contextMenu.pinId); }, icon: <Trash2 size={18} /> }
                ] : []),
                ...(contextMenu.type === 'image' ? [
                  { label: 'Editar Imagem', onClick: () => { if (contextMenu.imageId) handleEditImage(contextMenu.imageId); setContextMenu(null); }, icon: <Edit2 size={18} /> },
                  { label: 'Excluir Imagem', onClick: () => { if (contextMenu.imageId) deleteImagePersisted(contextMenu.imageId); }, icon: <Trash2 size={18} /> }
                ] : []),
                ...(contextMenu.type === 'soundboard-def' ? [
                  {
                    label: 'Renomear',
                    icon: <Edit2 size={18} />,
                    onClick: () => {
                      if (contextMenu.itemId) {
                        setEditingSoundboardItemId(contextMenu.itemId);
                      }
                      setContextMenu(null);
                    }
                  },
                  {
                    label: 'Relacionar Áudio',
                    onClick: () => { },
                    icon: <Music size={18} />,
                    searchable: true,
                    subMenu: savedAudios.map(audio => ({
                      label: audio.name,
                      onClick: () => {
                        if (contextMenu.itemId) {
                          linkSoundboardItemToAudio(contextMenu.itemId, audio.id);
                        }
                      },
                      icon: <Music size={14} />
                    }))
                  },
                  { label: 'Excluir Item', onClick: () => { if (contextMenu.itemId) deleteSoundboardItem(contextMenu.itemId); }, icon: <Trash2 size={18} /> }
                ] : []),
                ...(contextMenu.type === 'soundboard-active' ? [
                  {
                    label: 'Renomear',
                    icon: <Edit2 size={18} />,
                    onClick: () => {
                      if (contextMenu.itemId) {
                        // For active items, we might want to rename the definition or just the instance?
                        // Current logic in handleRenameSoundboardItem handles both via ID lookup
                        setEditingSoundboardItemId(contextMenu.itemId);
                      }
                      setContextMenu(null);
                    }
                  },
                  // Add other active item options if needed (e.g. delete from canvas)
                  { label: 'Excluir Item', onClick: () => { if (contextMenu.itemId) deleteSoundboardItemPersisted(contextMenu.itemId); }, icon: <Trash2 size={18} /> }
                ] : [])
              ]}
            />
          )
        }

        {/* Image Editor */}
        {
          editingImageId && (
            <ImageEditor
              image={activeImages.find(i => i.id === editingImageId)!}
              onUpdate={handleUpdateImage}
              onClose={() => setEditingImageId(null)}
            />
          )
        }
      </div>
      <BottomToolbar onDragStart={handleDragStart} />
    </div >
  );
}