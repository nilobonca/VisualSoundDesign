import { ProjectCanvasMenus } from '@/components/Canva/ProjectCanvasMenus';
import { ProjectSessionUI } from '@/components/Canva/ProjectSessionUI';
import { ProjectCanvasContextMenu } from '@/components/Canva/ProjectCanvasContextMenu';

import HeaderCab from "@/components/header";

import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { useCanvasUI } from '@/hooks/useCanvasUI';
import { useProjectState } from '@/hooks/useProjectState';
import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts';
import { useAudioInteractions } from '@/hooks/useAudioInteractions';
import { isPointInPolygon, getPolygonCentroid } from '@/hooks/useCanvasMath';
import { useThemeStore } from '@/store/themeStore';
import clsx from 'clsx';

import { useEffect, useState, DragEvent, ChangeEvent, useCallback, useRef } from "react";


import { useIDB } from '@/utils/indexedDB';
import { ActiveArea, ActiveImage, ActivePin, Audios, Images, Layer, Players, SoundboardItem, ActiveWall, ActiveSoundboardItem, ActiveNote } from '@/interfaces/utils/indexedDB';
import { Layers, MapPin, LayoutGrid, ArrowLeft, History, Music, Plus, Hexagon, Type, Eye, Edit2, Trash2, Palette, User, Ear, Check, X, Users, Filter } from 'lucide-react';
import { Jungle } from "@/utils/audio/jungle";
import { getSharedAudioContext } from "@/utils/audio/audioContext";
import LayerManager from '@/components/LayerManager';
import CanvasContainer from "@/components/Canva/canva-teste";
import DraggableItem from "@/components/Canva/itens/draggable-item";
import ImageItem from "@/components/Canva/itens/image-item";
import EditableArea from '@/components/Canva/itens/editable-area';
import { EditableWall } from '@/components/Canva/itens/editable-wall';
import ContextMenu from "@/components/ContextMenu";
import PinItem from "@/components/Canva/itens/pin-item";
import { PinManager } from "@/components/PinManager";
import ImageEditor from "@/components/ImageEditor";
import HistoryMenu from "@/components/HistoryMenu";

import Soundboard from "@/components/Soundboard";
import GlobalAudioPlayer from "@/components/GlobalAudioPlayer";
import { CanvasSoundboardItem } from "@/components/Soundboard/CanvasSoundboardItem";
import ActivePlayersMenu from "@/components/ActivePlayersMenu";
import { useRouter } from "next/router";
import BottomToolbar from "@/components/Canva/BottomToolbar";
import NoteItem from "@/components/Canva/itens/note-item";
import { createContext, useContext } from "react";

// Multiplayer/Session imports
import ListenersMenu from '@/components/ListenersMenu';
import { setPlaySoundboardCallback, setStopSoundboardCallback } from "@/components/Soundboard/activeAudios";
import { v4 as uuidv4 } from 'uuid';





export default function ProjectCanvas() {
  const router = useRouter();
  const { id: projectId } = router.query;

  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isEthereal = mounted && theme === 'ethereal';



  const {
    deleteAudio,
    resetCanvas, // Added resetCanvas
    isLoading,
    savedAudios,
    saveAudio,
    activePlayers,
    setMessage,
    // Images
    activeImages,
    addImagePersisted,
    updateImagePersisted,
    deleteImagePersisted,
    saveImage,
    savedImages,
    // Areas
    activeAreas,
    addAreaPersisted,
    updateAreaPersisted,
    deleteArea,
    deletePlayer,
    // Walls
    activeWalls,
    addWallPersisted,
    updateWallPersisted,
    deleteWallPersisted,
    // Pins
    activePins,
    addPinPersisted,
    updatePinPersisted,
    deletePinPersisted,
    // Soundboard Items
    updateSoundboardItem,
    deleteSoundboardItem,
    soundboardItems,
    addSoundboardItem, // Added
    deleteImage, // Added
    addSoundboardItemPersisted,
    updateSoundboardItemPersisted,
    deleteSoundboardItemPersisted,
    activeSoundboardItems,
    // Layers
    activeLayers,
    addLayer,
    updateLayer,



    // Export/Import
    exportCanvasState,
    importCanvasState,
    restoreCanvasState,
    // Notes
    activeNotes,
    addNotePersisted,
    updateNotePersisted,
    deleteNotePersisted,
    updateAudioPersisted,
    activeGlobalTracks
   } = useIDB();
 
  const {
    headerOpen, setHeaderOpen,
    layerManagerOpen, setLayerManagerOpen,
    pinManagerOpen, setPinManagerOpen,
    historyOpen, setHistoryOpen,
    soundboardOpen, setSoundboardOpen,
    activePlayersOpen, setActivePlayersOpen,
    mobileMenuOpen, setMobileMenuOpen,
    menuZIndices, bringToFront
  } = useCanvasUI(projectId);

  const {
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
  spatial3D, setSpatial3D,
  is3DEnabled, setIs3DEnabled,
  listenerRotation, setListenerRotation,
    audioFilters, setAudioFilters,
    clearSelection
  } = useCanvasSelection();

  const [projectName, setProjectName] = useState('Projeto Sem Nome');

  const {
    contextMenu, setContextMenu,
    activeProjectId, setActiveProjectId,
    isEditingName, setIsEditingName,
    tempName, setTempName,
    handleSaveName,
    clearConfirmation, setClearConfirmation,
    handleClearRequest, confirmClear,
    isItemInPage,
    getItemProjectId
  } = useProjectState(
    projectId,
    activeLayers,
    isLoading,
    addLayer,
    updateLayer,
    resetCanvas
  );

  // Session / Invite & Multiplayer states
  const [copied, setCopied] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [listenersOpen, setListenersOpen] = useState(false);
  const [sessionListeners, setSessionListeners] = useState<{ listenerId: string; name: string }[]>([]);
  const [currentAreaPoints, setCurrentAreaPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentWallPoints, setCurrentWallPoints] = useState<{ x: number; y: number }[]>([]);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<'cursor' | 'pin' | 'area' | 'wall' | 'eraser'>('cursor');
  const [listenerPings, setListenerPings] = useState<Record<string, number>>({});
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Record<string, any>>({});
  const canvasRef = useRef<any>(null);
  const listenerGraphsRef = useRef<Map<string, {
    destination: MediaStreamAudioDestinationNode | AudioDestinationNode;
    call?: any;
    activeSources: Map<string, {
      audioElement: HTMLAudioElement;
      sourceNode: MediaElementAudioSourceNode;
      gainNode: GainNode;
      pannerNode: StereoPannerNode | null;
      filterNode: BiquadFilterNode;
      jungle?: Jungle;
    }>;
  }>>(new Map());
  const objectUrlsRef = useRef<Map<number, string>>(new Map());



  const activeSoundboardStreamsRef = useRef<Map<string, { sound: HTMLAudioElement; source: MediaElementAudioSourceNode; jungle?: Jungle }[]>>(new Map());

  const savedAudiosRef = useRef(savedAudios);
  useEffect(() => {
    savedAudiosRef.current = savedAudios;
  }, [savedAudios]);

  const {
    history, future,
    addToHistory, handleUndo, handleRedo, handleRestoreHistory
  } = useCanvasHistory({
    currentState: {
      activePlayers, activeImages, activeAreas, activePins, activeLayers, activeSoundboardItems, activeNotes, activeGlobalTracks, activeWalls
    },
    restoreCanvasState
  });

  useCanvasShortcuts({
    selectedItemIds, setSelectedItemIds,
    activePlayers, activeImages, activeAreas, activePins, activeNotes, activeSoundboardItems, activeWalls,
    deletePlayer, deleteImagePersisted, deleteArea, deletePinPersisted, deleteNotePersisted, deleteSoundboardItemPersisted, deleteWallPersisted,
    addToHistory, handleUndo, handleRedo
  });

  const createSoundboardButton = (position: { x: number; y: number }) => {
    addToHistory('Criar Botão Soundboard');
    const newItemId = uuidv4();
    const newDef = {
      id: newItemId, name: 'Botão', audioId: null, color: '#A855F7', order: soundboardItems.length, playbackMode: 'overlap' as any
    };
    addSoundboardItem(newDef);
    const newInstance = {
      id: uuidv4(), type: 'soundboard' as any, soundboardItemId: newItemId, position
    };
    addSoundboardItemPersisted(newInstance, activeProjectId);
  };

  const handleRenameSoundboardItem = (id: string, newName: string) => {
    const definition = soundboardItems.find(d => d.id === id);
    if (definition) {
      updateSoundboardItem({ ...definition, name: newName });
    } else {
      const activeItem = activeSoundboardItems.find(i => i.id === id);
      if (activeItem) {
        const def = soundboardItems.find(d => d.id === activeItem.soundboardItemId);
        if (def) updateSoundboardItem({ ...def, name: newName });
      }
    }
    setEditingSoundboardItemId(null);
  };

  const linkSoundboardItemToAudio = (targetId: string, audioId: number) => {
    const audio = savedAudios.find(a => a.id === audioId);
    const audioName = audio ? audio.name : 'Botão';
    const definition = soundboardItems.find(d => d.id === targetId);
    if (definition) {
      updateSoundboardItem({ ...definition, audioId, name: audioName });
    } else {
      const activeItem = activeSoundboardItems.find(i => i.id === targetId);
      if (activeItem) {
        const def = soundboardItems.find(d => d.id === activeItem.soundboardItemId);
        if (def) updateSoundboardItem({ ...def, audioId, name: audioName });
      }
    }
  };

  const dragStartPositions = useRef<Record<string, { x: number; y: number; points?: { x: number; y: number }[]; volumeSourcePoint?: { x: number; y: number } }>>({});

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
      const wall = activeWalls.find(w => w.id === id);
      if (wall) {
        positions[id] = { points: wall.points };
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



  const changePositionImage = (image: ActiveImage, position: { x: number, y: number }) => {
    // Only update the anchor image on drag end (or if single drag)
    // Group updates are handled by handleImageDrag during drag
    const foundImage = activeImages.find((i: ActiveImage) => i.id === image.id)
    if (foundImage) {
      const updatedImage = { ...foundImage, position: { x: position.x, y: position.y } };
      updateImagePersisted(updatedImage)
    }
  }

  const handleImageDrag = (id: string, x: number, y: number) => {
    // Group Drag Logic using Snapshot
    const startPos = dragStartPositions.current[id];

    // Update the anchor item itself so minimap reflects the change
    const anchorImg = activeImages.find(i => i.id === id);
    if (anchorImg) updateImagePersisted({ ...anchorImg, position: { x, y } });

    // Update other selected items
    if (selectedItemIds.has(id) && startPos) {
      const totalDx = x - startPos.x;
      const totalDy = y - startPos.y;

      selectedItemIds.forEach(itemId => {
        if (itemId === id) return; // Skip anchor as we updated it above (or let's ensure consistency)

        // ... (rest of the logic)
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


  const handleSoundboardItemDrag = (id: string, x: number, y: number) => {
    // Update the anchor item itself so minimap reflects the change
    const anchorItem = activeSoundboardItems.find(i => i.id === id);
    if (anchorItem) updateSoundboardItemPersisted({ ...anchorItem, position: { x, y } });

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
      id: uuidv4(),
      type: 'area',
      name: 'Nova Área',
      points: [
        { x: baseX, y: baseY },
        { x: baseX + 200, y: baseY },
        { x: baseX + 200, y: baseY + 200 },
        { x: baseX, y: baseY + 200 }
      ],
      linkedPlayerId: null,
      linkedAudioId: null,
      volumeMode: 'standard'
    };

    addAreaPersisted(newArea, activeProjectId);
  };

  const createPin = (position?: { x: number; y: number }, icon?: 'pin' | 'person' | 'ear') => {
    addToHistory('Criar Pin');
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newPin: ActivePin = {
      id: uuidv4(),
      type: 'pin',
      position: { x: baseX, y: baseY },
      name: 'Novo Pin',
      enabled: true,
      order: activePins.length,
      icon: icon || 'pin'
    };
    addPinPersisted(newPin, activeProjectId);
    setContextMenu(null);
  };

  const createNote = (position?: { x: number; y: number }) => {
    addToHistory('Criar Texto');
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newNote: ActiveNote = {
      id: uuidv4(),
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
    setSelectedItemIds(new Set([newNote.id]));
    setContextMenu(null);
  };

  const handleUpdateWall = useCallback((updatedWall: ActiveWall) => {
    updateWallPersisted(updatedWall);
  }, [updateWallPersisted]);

  const handleDragWall = useCallback((id: string, totalDx: number, totalDy: number) => {
    const wall = activeWalls.find(w => w.id === id);
    const startPosAnchor = dragStartPositions.current[id];
    if (wall && startPosAnchor && startPosAnchor.points) {
      const newPoints = startPosAnchor.points.map((p: any) => ({ x: p.x + totalDx, y: p.y + totalDy }));
      updateWallPersisted({ ...wall, points: newPoints });
    }
  }, [activeWalls, updateWallPersisted]);

  const handleUpdateArea = (area: ActiveArea) => {
    updateAreaPersisted(area);
  };

  const handleAreaDrag = (areaId: string, totalDx: number, totalDy: number) => {
    // Update the anchor area positions during drag for minimap
    // Note: EditableArea passes total delta, so we need original points.
    // However, EditableArea manages visual state locally. 
    // To update minimap (persisted state), we need to apply delta to persisted points.
    // BUT, dragStartPositions has the snapshot.
    const startPosAnchor = dragStartPositions.current[areaId];

    // Create shadow copies for real-time interaction calculation
    const currentActiveAreas = [...activeAreas];
    let currentActivePins = [...activePins];

    if (startPosAnchor && startPosAnchor.points) {
      const areaIndex = currentActiveAreas.findIndex(a => a.id === areaId);
      if (areaIndex !== -1) {
        const area = currentActiveAreas[areaIndex];
        const newPoints = startPosAnchor.points.map((p: { x: number, y: number }) => ({ x: p.x + totalDx, y: p.y + totalDy }));
        let newVolumeSource = area.volumeSourcePoint;
        if (startPosAnchor.volumeSourcePoint) {
          newVolumeSource = { x: startPosAnchor.volumeSourcePoint.x + totalDx, y: startPosAnchor.volumeSourcePoint.y + totalDy };
        }

        const updatedArea = { ...area, points: newPoints, volumeSourcePoint: newVolumeSource };
        currentActiveAreas[areaIndex] = updatedArea;
        updateAreaPersisted(updatedArea);
      }
    }

    if (selectedItemIds.has(areaId)) {
      selectedItemIds.forEach(id => {
        if (id === areaId) return; // Already updated above

        const itemStartPos = dragStartPositions.current[id];
        if (!itemStartPos) return;

        // Move Images
        const img = activeImages.find(i => i.id === id);
        if (img) {
          updateImagePersisted({ ...img, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } });
        }

        // Move Pins
        const pinIndex = currentActivePins.findIndex(p => p.id === id);
        if (pinIndex !== -1) {
          const pin = currentActivePins[pinIndex];
          const updatedPin = { ...pin, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } };
          currentActivePins[pinIndex] = updatedPin;
          updatePinPersisted(updatedPin);
        }

        // Move other Areas
        const areaIndex = currentActiveAreas.findIndex(a => a.id === id);
        if (areaIndex !== -1 && itemStartPos.points) {
          const area = currentActiveAreas[areaIndex];
          const newPoints = itemStartPos.points.map((p: { x: number, y: number }) => ({ x: p.x + totalDx, y: p.y + totalDy }));
          let newVolumeSource = area.volumeSourcePoint;
          if (itemStartPos.volumeSourcePoint) {
            newVolumeSource = { x: itemStartPos.volumeSourcePoint.x + totalDx, y: itemStartPos.volumeSourcePoint.y + totalDy };
          }
          const updatedArea = { ...area, points: newPoints, volumeSourcePoint: newVolumeSource };
          currentActiveAreas[areaIndex] = updatedArea;
          updateAreaPersisted(updatedArea);
        }
      });
    }

    // Calculate real-time audio interactions during drag
    calculateInteractions(currentActivePins, currentActiveAreas, activeWalls, activeGlobalTracks);
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



  const getOrCreateListenerGraph = useCallback((listenerId: string) => {
    let graph = listenerGraphsRef.current.get(listenerId);
    if (!graph) {
      const ctx = getSharedAudioContext();
      if (ctx) {
        let dest: MediaStreamAudioDestinationNode | AudioDestinationNode;
        if (listenerId === 'local') {
          dest = ctx.destination;
        } else {
          dest = ctx.createMediaStreamDestination();
        }
        graph = {
          destination: dest,
          activeSources: new Map()
        };
        listenerGraphsRef.current.set(listenerId, graph);
      }
    }
    return graph;
  }, []);

  const removeListenerGraph = useCallback((listenerId: string) => {
    const graph = listenerGraphsRef.current.get(listenerId);
    if (graph) {
      graph.activeSources.forEach(src => {
        try {
          src.audioElement.pause();
          src.audioElement.src = '';
          src.audioElement.load();
        } catch (e) {}
        try {
          if (src.jungle) src.jungle.disconnect();
          if (src.pannerNode) src.pannerNode.disconnect();
          src.filterNode.disconnect();
          src.gainNode.disconnect();
          src.sourceNode.disconnect();
        } catch (e) {}
      });
      graph.activeSources.clear();

      if (graph.call) {
        try { graph.call.close(); } catch (e) {}
      }
      listenerGraphsRef.current.delete(listenerId);
    }
  }, []);

  const { calculateInteractions } = useAudioInteractions(
    isSessionActive,
    sessionListeners,
    savedAudios,
    getOrCreateListenerGraph,
    removeListenerGraph,
    objectUrlsRef
  );

  useEffect(() => {
    calculateInteractions(activePins, activeAreas, activeWalls, activeGlobalTracks);
  }, [activePins, activeAreas, activeWalls, activeGlobalTracks, calculateInteractions]);

  // Sync pending additions/deletions refs with actual activePins state
  useEffect(() => {
    const pinIds = new Set(activePins.map(p => p.id));
    
    // Additions: remove from pending once it appears in activePins
    pendingAddPinsRef.current.forEach(id => {
      if (pinIds.has(id)) {
        pendingAddPinsRef.current.delete(id);
      }
    });

    // Deletions: remove from pending once it disappears from activePins
    pendingDeletePinsRef.current.forEach(id => {
      if (!pinIds.has(id)) {
        pendingDeletePinsRef.current.delete(id);
      }
    });
  }, [activePins]);

  const cleanedPinsRef = useRef(false);
  const pendingAddPinsRef = useRef<Set<string>>(new Set());
  const pendingDeletePinsRef = useRef<Set<string>>(new Set());
  const isChannelSubscribedRef = useRef(false);
  const listenerTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      // Clear all active listener timeouts on unmount
      Object.values(listenerTimeoutsRef.current).forEach(clearTimeout);
      listenerTimeoutsRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !cleanedPinsRef.current && activePins.length > 0) {
      activePins.forEach(pin => {
        if (pin.id.startsWith('listener:')) {
          if (!pendingDeletePinsRef.current.has(pin.id)) {
            pendingDeletePinsRef.current.add(pin.id);
            deletePinPersisted(pin.id);
          }
        }
      });
      cleanedPinsRef.current = true;
    }
  }, [isLoading, activePins, deletePinPersisted]);

  // Presence updates (add/remove listener pins when listeners join/leave)
  useEffect(() => {
    if (!isSessionActive) return;

    // Detect new listeners and create pins
    sessionListeners.forEach(listener => {
      const pinId = `listener:${listener.listenerId}`;
      
      // If there was a pending delete timeout for this listener, cancel it!
      if (listenerTimeoutsRef.current[pinId]) {
        clearTimeout(listenerTimeoutsRef.current[pinId]);
        delete listenerTimeoutsRef.current[pinId];
      }

      if (pendingAddPinsRef.current.has(pinId)) return;

      const existingPin = activePins.find(p => p.id === pinId);
      if (!existingPin) {
        pendingAddPinsRef.current.add(pinId);
        const newPin: ActivePin = {
          id: pinId,
          type: 'pin',
          position: { x: 500, y: 500 }, // Default center position
          name: listener.name,
          enabled: true,
          icon: 'ear', // Use 'ear' icon for listener pins
          color: '#6366f1' // Indigo
        };
        addPinPersisted(newPin, activeProjectId);
      }
    });

    // Detect disconnected listeners and schedule pin removal with a grace period
    // Only schedule if the host is currently subscribed to Supabase presence (network is healthy)
    activePins.forEach(pin => {
      if (pin.id.startsWith('listener:')) {
        const listenerId = pin.id.replace('listener:', '');
        const stillConnected = sessionListeners.some(l => l.listenerId === listenerId);
        
        if (!stillConnected && isChannelSubscribedRef.current) {
          // If already scheduled, don't schedule again
          if (listenerTimeoutsRef.current[pin.id]) return;

          // Schedule deletion after 5 seconds grace period
          listenerTimeoutsRef.current[pin.id] = setTimeout(() => {
            if (!pendingDeletePinsRef.current.has(pin.id)) {
              pendingDeletePinsRef.current.add(pin.id);
              deletePinPersisted(pin.id);
            }
            delete listenerTimeoutsRef.current[pin.id];
          }, 5000); // 5 seconds grace period
        }
      }
    });
  }, [sessionListeners, activePins, isSessionActive, activeProjectId, addPinPersisted, deletePinPersisted]);

  // Clean listener pins when session is deactivated
  useEffect(() => {
    if (!isSessionActive) {
      activePins.forEach(pin => {
        if (pin.id.startsWith('listener:')) {
          if (!pendingDeletePinsRef.current.has(pin.id)) {
            pendingDeletePinsRef.current.add(pin.id);
            deletePinPersisted(pin.id);
          }
        }
      });
    }
  }, [isSessionActive, activePins, deletePinPersisted]);

  // Setup PeerJS host and connection handlers
  useEffect(() => {
    if (!isSessionActive || !projectId) {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn) conn.close();
      });
      connectionsRef.current = {};

      // Clean up all listener graphs
      Array.from(listenerGraphsRef.current.keys()).forEach(id => {
        removeListenerGraph(id);
      });

      // Clean up all active soundboard streams
      activeSoundboardStreamsRef.current.forEach(list => {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
      });
      activeSoundboardStreamsRef.current.clear();

      // Revoke all cached Object URLs
      objectUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();

      setSessionListeners([]);
      isChannelSubscribedRef.current = false;
      return;
    }

    const initPeer = async () => {
      try {
        const Peer = (await import('peerjs')).default;
        const gmPeerId = `visual-sound-design-${projectId}`;
        console.log(`[DEBUG] Initializing PeerJS Host with ID: ${gmPeerId}`);

        const peer = new Peer(gmPeerId, {
          debug: 1
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
          console.log(`[DEBUG] PeerJS Host opened: ${id}`);
          isChannelSubscribedRef.current = true;
        });

        peer.on('error', (err) => {
          console.error('[DEBUG] PeerJS Host error:', err);
          isChannelSubscribedRef.current = false;
        });

        peer.on('close', () => {
          console.log('[DEBUG] PeerJS Host closed');
          isChannelSubscribedRef.current = false;
        });

        peer.on('connection', (conn) => {
          const listenerId = conn.peer;
          const name = (conn.metadata as any)?.name || 'Ouvinte Anônimo';
          console.log(`[DEBUG] P2P Connection from: ${name} (${listenerId})`);

          connectionsRef.current[listenerId] = conn;

          conn.on('open', () => {
            setSessionListeners(prev => {
              if (prev.some(l => l.listenerId === listenerId)) return prev;
              return [...prev, { listenerId, name }];
            });

            // Start audio stream WebRTC call
            const ctx = getSharedAudioContext();
            if (ctx) {
              ctx.resume().then(() => {
                const graph = getOrCreateListenerGraph(listenerId);
                if (graph && graph.destination instanceof MediaStreamAudioDestinationNode && peerRef.current) {
                  console.log(`[DEBUG] Calling listener peer with media stream: ${listenerId}`);
                  const call = peerRef.current.call(listenerId, graph.destination.stream);
                  graph.call = call;
                }
              });
            }
          });

          conn.on('data', (data: any) => {
            if (!data) return;

            if (data.type === 'pong') {
              const { timestamp } = data.payload || {};
              if (timestamp) {
                const rtt = Date.now() - timestamp;
                setListenerPings(prev => ({
                  ...prev,
                  [listenerId]: rtt
                }));
              }
            }
          });

          conn.on('close', () => {
            console.log(`[DEBUG] Connection closed: ${name}`);
            delete connectionsRef.current[listenerId];
            removeListenerGraph(listenerId);
            setSessionListeners(prev => prev.filter(l => l.listenerId !== listenerId));
          });

          conn.on('error', (err) => {
            console.error(`[DEBUG] Connection error with ${name}:`, err);
            conn.close();
          });
        });
      } catch (err) {
        console.error('Failed to init PeerJS:', err);
      }
    };

    initPeer();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn) conn.close();
      });
      connectionsRef.current = {};
      
      // Clean up all listener graphs
      Array.from(listenerGraphsRef.current.keys()).forEach(id => {
        removeListenerGraph(id);
      });

      // Clean up all active soundboard streams
      activeSoundboardStreamsRef.current.forEach(list => {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
      });
      activeSoundboardStreamsRef.current.clear();

      // Revoke all cached Object URLs
      objectUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();

      setSessionListeners([]);
      isChannelSubscribedRef.current = false;
    };
  }, [isSessionActive, projectId]);

  // Broadcast ping to P2P listeners every 3 seconds
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn && conn.open) {
          conn.send({
            type: 'ping',
            payload: { timestamp: Date.now() }
          });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Hook soundboard audio plays/stops callbacks to route into P2P listener streams
  useEffect(() => {
    if (!isSessionActive) {
      setPlaySoundboardCallback(null);
      setStopSoundboardCallback(null);
      return;
    }

    setPlaySoundboardCallback((payload) => {
      const { soundboardItemId, url, volume, pitch } = payload;
      const ctx = getSharedAudioContext();
      if (!ctx) return;

      const instances: { sound: HTMLAudioElement; source: MediaElementAudioSourceNode; jungle?: Jungle }[] = [];

      // Loop through all listener graphs to play and route the audio to their stream
      Array.from(listenerGraphsRef.current.entries()).forEach(([listenerId, graph]) => {
        if (listenerId === 'local') return; // Local is already played by playSoundboardAudio

        try {
          const sound = new Audio(url);
          sound.volume = volume !== undefined ? volume : 1.0;
          sound.crossOrigin = 'anonymous';

          const source = ctx.createMediaElementSource(sound);
          let jungle: Jungle | undefined;

          if (pitch !== undefined && pitch !== 1.0) {
            jungle = new Jungle(ctx);
            jungle.setPitchOffset(pitch - 1.0);
            source.connect(jungle.input);
            jungle.output.connect(graph.destination);
          } else {
            source.connect(graph.destination);
          }

          const instance = { sound, source, jungle };
          instances.push(instance);

          sound.onended = () => {
            try {
              if (jungle) jungle.disconnect();
              source.disconnect();
            } catch (e) {}
            // Remove this instance from the list
            const current = activeSoundboardStreamsRef.current.get(soundboardItemId) || [];
            const updated = current.filter(i => i.sound !== sound);
            if (updated.length === 0) {
              activeSoundboardStreamsRef.current.delete(soundboardItemId);
            } else {
              activeSoundboardStreamsRef.current.set(soundboardItemId, updated);
            }
          };

          sound.play().catch(e => console.error("Error playing soundboard to listener stream:", e));
        } catch (err) {
          console.error("Failed to route soundboard audio to listener stream:", err);
        }
      });

      if (instances.length > 0) {
        const prev = activeSoundboardStreamsRef.current.get(soundboardItemId) || [];
        activeSoundboardStreamsRef.current.set(soundboardItemId, [...prev, ...instances]);
      }
    });

    setStopSoundboardCallback((soundboardItemId) => {
      const list = activeSoundboardStreamsRef.current.get(soundboardItemId);
      if (list) {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
        activeSoundboardStreamsRef.current.delete(soundboardItemId);
      }
    });

    return () => {
      setPlaySoundboardCallback(null);
      setStopSoundboardCallback(null);
    };
  }, [isSessionActive]);

  const handlePinDrag = (pinId: string, x: number, y: number, isDragging: boolean) => {
    // Group Drag Logic for Pins
    const startPos = dragStartPositions.current[pinId];

    // Create shadow copies for real-time interaction calculation
    let currentActivePins = [...activePins];
    const currentActiveAreas = [...activeAreas]; // Areas normally don't move when dragging a pin unless grouped
    // But if grouped, they might move.

    // NOTE: If we are dragging a pin, and it is grouped with an area, the area DOES move.
    // So we need to update activeAreas shadow copy too.

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

        const pinIndex = currentActivePins.findIndex(p => p.id === id);
        if (pinIndex !== -1) {
          const p = currentActivePins[pinIndex];
          const updatedPin = { ...p, position: { x: itemStartPos.x + totalDx, y: itemStartPos.y + totalDy } };
          currentActivePins[pinIndex] = updatedPin;
          updatePinPersisted(updatedPin);
        }

        const areaIndex = currentActiveAreas.findIndex(a => a.id === id);
        if (areaIndex !== -1 && itemStartPos.points) {
          const area = currentActiveAreas[areaIndex];
          const newPoints = itemStartPos.points.map((p: { x: number, y: number }) => ({ x: p.x + totalDx, y: p.y + totalDy }));
          let newVolumeSource = area.volumeSourcePoint;
          if (itemStartPos.volumeSourcePoint) {
            newVolumeSource = { x: itemStartPos.volumeSourcePoint.x + totalDx, y: itemStartPos.volumeSourcePoint.y + totalDy };
          }
          const updatedArea = { ...area, points: newPoints, volumeSourcePoint: newVolumeSource };
          currentActiveAreas[areaIndex] = updatedArea;
          updateAreaPersisted(updatedArea);
        }
      });
    }

    // Update the anchor pin in shadow copy
    const anchorPinIndex = currentActivePins.findIndex(p => p.id === pinId);
    if (anchorPinIndex !== -1) {
      currentActivePins[anchorPinIndex] = { ...currentActivePins[anchorPinIndex], position: { x, y } };
    }

    if (!isDragging) {
      const pinToUpdate = activePins.find((p: ActivePin) => p.id === pinId);
      if (pinToUpdate) {
        updatePinPersisted({ ...pinToUpdate, position: { x, y } });
      }
    } else {
      calculateInteractions(currentActivePins, currentActiveAreas, activeWalls, activeGlobalTracks);
    }
  };

  const handleLocateListener = (listenerId: string) => {
    const pinId = `listener:${listenerId}`;
    const pin = activePins.find(p => p.id === pinId);
    if (pin) {
      canvasRef.current?.centerOn(pin.position.x, pin.position.y);
    }
  };

  const handleKickListener = (listenerId: string) => {
    const conn = connectionsRef.current[listenerId];
    if (conn && conn.open) {
      conn.send({
        type: 'kick_listener',
        payload: { listenerId }
      });
      setTimeout(() => {
        conn.close();
      }, 500);
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
  const isLayerVisible = (layer: Layer, allLayers: Layer[], visited = new Set<string>()): boolean => {
    if (visited.has(layer.id)) return false; // Cycle detected
    visited.add(layer.id);

    if (!layer.visible) return false;
    if (layer.parentId) {
      const parent = allLayers.find(l => l.id === layer.parentId);
      if (parent) {
        return isLayerVisible(parent, allLayers, visited);
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


  // Handle Enter key to finish drawing walls or areas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (tool === 'area' && currentAreaPoints.length >= 3) {
          addToHistory('Criar Área');
          addAreaPersisted({
            id: uuidv4(),
            type: 'area',
            points: currentAreaPoints,
            linkedPlayerId: null,
            linkedAudioId: null,
            name: `Área ${activeAreas.length + 1}`,
            volumeMode: 'standard'
          } as unknown as ActiveArea, activeProjectId);
          setCurrentAreaPoints([]);
          setTool('cursor');
        } else if (tool === 'wall' && currentWallPoints.length >= 2) {
          addToHistory('Criar Parede');
          addWallPersisted({
            id: Date.now().toString(),
            type: 'wall',
            projectId: activeProjectId || 0,
            name: `Parede ${activeWalls.length + 1}`,
            points: [...currentWallPoints],
            color: '#444444',
            thickness: 8,
            occludesAudio: true
          } as unknown as ActiveWall, activeProjectId);
          setCurrentWallPoints([]);
          setTool('cursor');
        }
      } else if (e.key === 'Escape') {
        if (tool === 'area' || tool === 'wall') {
          setCurrentAreaPoints([]);
          setCurrentWallPoints([]);
          setTool('cursor');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, currentAreaPoints, currentWallPoints, activeAreas.length, activeWalls.length, activeProjectId]);

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

  const handleMultiSelect = (e: React.MouseEvent | React.PointerEvent | React.TouchEvent | undefined, id: string) => {
    if (e && (('ctrlKey' in e && e.ctrlKey) || ('metaKey' in e && e.metaKey))) {
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedItemIds(new Set([id]));
    }
  };

  
return (
    <div className={clsx(
      "flex flex-col md:flex-row h-screen w-screen overflow-hidden transition-colors duration-500",
      isEthereal ? "bg-[#050505]" : "bg-gray-200"
    )}>

      {/* Clear Canvas Confirmation Modal */}
      {clearConfirmation?.open && (
        <div
          className="fixed z-[100] flex flex-col bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 animate-in fade-in zoom-in duration-200"
          style={{
            left: clearConfirmation.x,
            top: clearConfirmation.y,
            transform: 'translate(-50%, -110%)' // Position above mouse
          }}
        >
          <p className="text-sm font-medium mb-2 text-gray-800 dark:text-neutral-200">Limpar o canva?</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setClearConfirmation(null)}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-400"
            >
              Cancelar
            </button>
            <button
              onClick={confirmClear}
              className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Global Audio Player engine */}
      <GlobalAudioPlayer />

      <ProjectCanvasMenus
        tool={tool}
        setTool={setTool}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        projectId={projectId}
        handleLayerAction={handleLayerAction}
        addToHistory={addToHistory}
        handleExport={handleExport}
        handleImport={handleImport}
        handleClearRequest={handleClearRequest}
        activePins={activePins}
        updatePinPersisted={updatePinPersisted}
        deletePinPersisted={deletePinPersisted}
        history={history}
        future={future}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        handleRestoreHistory={handleRestoreHistory}
        isSessionActive={isSessionActive}
        sessionListeners={sessionListeners}
        listenerPings={listenerPings}
        handleLocateListener={handleLocateListener}
        handleKickListener={handleKickListener}
        handleDragStart={handleDragStart}
        handleFileChange={handleFileChange}
        isLoading={isLoading}
        setMessage={setMessage}
        savedAudios={savedAudios}
        deleteAudio={deleteAudio}
        activeAudioIds={activeAudioIds}
        proximityVolumes={proximityVolumes}
        highlightedAudioId={highlightedAudioId}
        setContextMenu={setContextMenu}
        editingSoundboardItemId={editingSoundboardItemId}
        handleRenameSoundboardItem={handleRenameSoundboardItem}
        activePlayers={activePlayers}
        activeAreas={activeAreas}
        activeAreaIds={activeAreaIds}
        spatialPans={spatialPans}
          spatial3D={spatial3D}
          is3DEnabled={is3DEnabled}
        audioFilters={audioFilters}
        deletePlayer={deletePlayer}
        deleteArea={deleteArea}
        handleUpdateArea={handleUpdateArea}
        
        isEditingName={isEditingName}
        setIsEditingName={setIsEditingName}
        projectName={projectName}
        setProjectName={setProjectName}
        handleSaveName={handleSaveName}
        clearConfirmation={clearConfirmation}
        setClearConfirmation={setClearConfirmation}
        confirmClear={confirmClear}
        
        tempName={tempName}
        setTempName={setTempName}
        
        activeLayers={activeLayers}
      />

      <div className="flex-1 relative h-full w-full overflow-hidden">
        

        {/* Layer Manager Panel - Responsive positioned */}


        <div className="absolute inset-0 z-0">
          <CanvasContainer
            ref={canvasRef}
            items={[
              ...activePlayers.filter(p => isItemInPage(p.id)),
              ...activeImages.filter(i => isItemInPage(i.id)),
              ...activeAreas.filter(a => isItemInPage(a.id)),
              ...activePins.filter(p => isItemInPage(p.id)),
              ...activeSoundboardItems.filter(s => isItemInPage(s.id)),
              ...activeNotes.filter(n => isItemInPage(n.id))
            ]} // Keep for minimap
            onDropItem={(itemData: { id: string | number }, type: string, x: number, y: number) => {
              addToHistory('Adicionar Item');
              if (tool === 'area' && currentAreaPoints.length >= 3) {
                // handle completion logic
              }
              if (type === 'image') {
                const image = savedImages.find((i: Images) => i.id === Number(itemData.id));
                if (image) {
                  const newImage: ActiveImage = {
                    id: uuidv4(),
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
                    id: uuidv4(),
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
                    id: uuidv4(),
                    type: 'soundboard',
                    soundboardItemId: item.id,
                    position: { x, y }
                  };
                  addSoundboardItemPersisted(newItem, activeProjectId);
                }
              } else if (type === 'note') {
                const newNote: ActiveNote = {
                  id: uuidv4(),
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
                setSelectedItemIds(new Set([newNote.id]));
              } else if (type === 'pin') {
                const icon = itemData.id as 'pin' | 'person' | 'ear';
                createPin({ x, y }, icon);
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
                  id: uuidv4(),
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
                      id: uuidv4(),
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
            isSelectionEnabled={tool === 'cursor'}
            onCanvasClick={(e, worldX, worldY) => {
              if (tool === 'area') {
                setCurrentAreaPoints(prev => [...prev, { x: worldX, y: worldY }]);
              } else if (tool === 'wall') {
                setCurrentWallPoints(prev => [...prev, { x: worldX, y: worldY }]);
              }
            }}
            onCanvasMouseMove={(e, worldX, worldY) => {
              if (tool === 'wall' || tool === 'area') {
                setCursorPosition({ x: worldX, y: worldY });
              } else if (cursorPosition !== null) {
                setCursorPosition(null);
              }
            }}
            onSelectionChange={handleSelectionChange}
            onCanvasRightClick={(e, worldX, worldY) => {
              if (tool === 'area' && currentAreaPoints.length >= 3) {
                addToHistory('Criar Área');
                addAreaPersisted({
                  id: uuidv4(),
                  type: 'area',
                  points: currentAreaPoints,
                  linkedPlayerId: null,
                  linkedAudioId: null,
                  name: `Área ${activeAreas.length + 1}`,
                  volumeMode: 'standard'
                } as unknown as ActiveArea, activeProjectId);
                setCurrentAreaPoints([]);
                setTool('cursor');
              } else if (tool === 'wall') {
                setCurrentWallPoints([]);
                setTool('cursor');
              } else if (tool === 'area') {
                setCurrentAreaPoints([]);
                setCurrentWallPoints([]);
                setTool('cursor');
              } else {
                setContextMenu({
                  screenX: e.clientX,
                  screenY: e.clientY,
                  worldX,
                  worldY,
                  type: 'canvas'
                });
              }
            }}
          >
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 9999, pointerEvents: 'none' }}>
              {currentWallPoints.length > 0 && (
                <polyline
                  points={[...currentWallPoints, ...(cursorPosition ? [cursorPosition] : [])].map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#444444"
                  strokeWidth={8}
                  opacity={0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {currentAreaPoints.length > 0 && (
                <polygon
                  points={[...currentAreaPoints, ...(cursorPosition ? [cursorPosition] : [])].map(p => `${p.x},${p.y}`).join(' ')}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
            </svg>
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
                    rotation={croppingImageId === image.id ? 0 : (image.rotation || 0)} // Pass rotation here, disable if cropping
                  >
                    <ImageItem
                      image={image}
                      onDelete={() => deleteImagePersisted(image.id)}
                      onEdit={() => handleEditImage(image.id)}
                      onUpdate={(updatedImage) => updateImagePersisted(updatedImage)}
                      isEditing={editingImageId === image.id}
                      onCropStart={() => setCroppingImageId(image.id)}
                      onCropEnd={() => setCroppingImageId(null)}
                      onContextMenu={(e) => {
                        if (tool !== 'cursor') return;
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

              if (layer.itemType === 'wall') {
                const wall = activeWalls.find(w => w.id === layer.itemId);
                if (!wall) return null;
                return (
                  <EditableWall
                    key={wall.id}
                    wall={wall}
                    zIndex={index}
                    isDrawingMode={tool !== 'cursor'}
                    onUpdate={handleUpdateWall}
                    isSelected={selectedItemIds.has(wall.id)}
                    onSelect={(e) => handleMultiSelect(e, wall.id)}
                    onRightClick={(e) => {
                      if (tool !== 'cursor') return;
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({
                        type: 'wall',
                        screenX: e.clientX,
                        screenY: e.clientY,
                        worldX: 0,
                        worldY: 0,
                        itemId: wall.id
                      });
                    }}
                    onDragStart={(id) => {
                      const w = activeWalls.find(wl => wl.id === id);
                      if (w) dragStartPositions.current[id] = { ...dragStartPositions.current[id], x: w.points[0].x, y: w.points[0].y, points: w.points };
                    }}
                    onDrag={handleDragWall}
                  />
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
                    isDrawingMode={tool !== 'cursor'}
                    onUpdate={handleUpdateArea}
                    isSelected={selectedItemIds.has(area.id)}
                    onSelect={(e) => handleMultiSelect(e, area.id)}
                    onRightClick={(e) => {
                      if (tool !== 'cursor') return;
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
                    zIndex={index + 9999}
                    isSelected={selectedItemIds.has(pin.id)}
                    onPositionChange={(id, x, y) => handlePinDrag(id, x, y, false)}
                    onDrag={(id, x, y) => handlePinDrag(id, x, y, true)}
                    onDragStart={handleGroupDragStart}
                  >
                    <PinItem
                      pin={pin}
                      onSelect={(e) => handleMultiSelect(e, pin.id)}
                      onContextMenu={(e) => {
                        if (tool !== 'cursor') return;
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
                    onSelect={(e) => handleMultiSelect(e, note.id)}
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
                    onDrag={(id, x, y) => handleSoundboardItemDrag(id, x, y)}
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
                        if (tool !== 'cursor') return;
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
        <ProjectCanvasContextMenu
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          activeAreas={activeAreas}
          activePins={activePins}
          activeImages={activeImages}
          savedAudios={savedAudios}
          soundboardItems={soundboardItems}
          activeSoundboardItems={activeSoundboardItems}
          handleUpdateArea={handleUpdateArea}
          deleteArea={deleteArea}
          updatePinPersisted={updatePinPersisted}
          deletePinPersisted={deletePinPersisted}
          handleEditImage={handleEditImage}
          deleteImagePersisted={deleteImagePersisted}
          deleteSoundboardItem={deleteSoundboardItem}
          deleteSoundboardItemPersisted={deleteSoundboardItemPersisted}
          deleteAudio={deleteAudio}
          deleteImage={deleteImage}
          createArea={createArea}
          createPin={createPin}
          createNote={createNote}
          createSoundboardButton={createSoundboardButton}
          setRenamingAreaId={setRenamingAreaId}
          linkAreaToAudio={linkAreaToAudio}
          setEditingSoundboardItemId={setEditingSoundboardItemId}
          linkSoundboardItemToAudio={linkSoundboardItemToAudio}
          deleteWallPersisted={deleteWallPersisted}
        />

        {/* Image Editor */}
        {
          editingImageId && activeImages.find(i => i.id === editingImageId) && (
            <ImageEditor
              image={activeImages.find(i => i.id === editingImageId)!}
              onUpdate={handleUpdateImage}
              onClose={() => setEditingImageId(null)}
            />
          )
        }

        {/* Session/Invite Bar & Modal */}
        <ProjectSessionUI
          isSessionActive={isSessionActive}
          setIsSessionActive={setIsSessionActive}
          showInviteModal={showInviteModal}
          setShowInviteModal={setShowInviteModal}
          listenersOpen={listenersOpen}
          setListenersOpen={setListenersOpen}
          sessionListeners={sessionListeners}
          projectId={projectId as string}
        />
      </div>
      <BottomToolbar onDragStart={handleDragStart} tool={tool} setTool={setTool} />
    </div >
  );
}