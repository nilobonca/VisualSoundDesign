import AudioPlayer from "@/components/player";
import HeaderCab from "@/components/header";
import { useEffect, useState, DragEvent, ChangeEvent, MouseEvent, useCallback } from "react";
import { useIDB } from '@/utils/indexedDB';
import { Players, Audios, Images, ActiveImage, ActiveArea, ActivePin, Layer } from '@/interfaces/utils/indexedDB';
import LayerManager from '@/components/LayerManager';
import CanvasContainer from "@/components/Canva/canva-teste";
import DraggableItem from "@/components/Canva/itens/draggable-item";
import ImageItem from "@/components/Canva/itens/image-item";
import EditableArea from "@/components/Canva/itens/editable-area";
import ContextMenu from "@/components/ContextMenu";
import PinItem from "@/components/Canva/itens/pin-item";
import { PinManager } from "@/components/PinManager";
import ImageEditor from "@/components/ImageEditor";

export default function Home() {
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
    // Layers
    activeLayers,
    addLayer,
    updateLayer,
    deleteLayer,
    reorderLayers
  } = useIDB();

  const [contextMenu, setContextMenu] = useState<{ screenX: number; screenY: number; worldX: number; worldY: number; type?: 'canvas' | 'area' | 'pin'; areaId?: string; pinId?: string } | null>(null);

  // Pin State
  const [activeAreaIds, setActiveAreaIds] = useState<Set<string>>(new Set());
  const [proximityVolumes, setProximityVolumes] = useState<Map<number, number>>(new Map()); // Changed to audio IDs
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  const handleDragStart = (e: DragEvent, item: Audios | Images, type: 'audio' | 'image') => {
    e.dataTransfer.setData('itemId', item.id.toString());
    e.dataTransfer.setData('itemType', type);
    return ('');
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

  const changePositionPlayer = (player: Players, position: { x: number, y: number }) => {
    if (position.x === 0 && position.y === 0) return

    const foundPlayer = activePlayers.find((p: Players) => p.id === player.id)
    if (foundPlayer) {
      const updatedPlayer = { ...foundPlayer, position: { x: position.x, y: position.y } };

      if (findPlayer(foundPlayer.id)) {
        updatePlayerPersisted(updatedPlayer)
      }
      else {
        addPlayerPersisted(updatedPlayer)
      }
    }
  }

  const changePositionImage = (image: ActiveImage, position: { x: number, y: number }) => {
    if (position.x === 0 && position.y === 0) return

    const foundImage = activeImages.find((i: ActiveImage) => i.id === image.id)
    if (foundImage) {
      const updatedImage = { ...foundImage, position: { x: position.x, y: position.y } };
      updateImagePersisted(updatedImage)
    }
  }

  const handleEditImage = (id: string) => {
    setEditingImageId(id);
  }

  const handleUpdateImage = (updatedImage: ActiveImage) => {
    // Update in real-time without closing the editor
    updateImagePersisted(updatedImage);
  }

  const createArea = (position?: { x: number; y: number }) => {
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newArea: ActiveArea = {
      id: crypto.randomUUID(),
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
    addAreaPersisted(newArea);
  };

  const handleUpdateArea = (area: ActiveArea) => {
    updateAreaPersisted(area);
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

  const handlePinDrag = (pinId: string, x: number, y: number, isDragging: boolean) => {
    const tempPins = activePins.map((p: ActivePin) => p.id === pinId ? { ...p, position: { x, y } } : p);
    calculateInteractions(tempPins);

    if (!isDragging) {
      const pinToUpdate = activePins.find((p: ActivePin) => p.id === pinId);
      if (pinToUpdate) {
        updatePinPersisted({ ...pinToUpdate, position: { x, y } });
      }
    }
  };

  const createPin = (position: { x: number, y: number }) => {
    const newPin: ActivePin = {
      id: crypto.randomUUID(),
      position,
      name: `Pin ${activePins.length + 1} `,
      enabled: true
    };
    addPinPersisted(newPin);
    setContextMenu(null);
    // Interaction will be calculated by useEffect
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

  return (

    <div className="flex bg-gray-200 h-screen w-screen">

      <PinManager
        pins={activePins}
        onToggle={(pin) => updatePinPersisted({ ...pin, enabled: !pin.enabled })}
        onRename={(pin, newName) => updatePinPersisted({ ...pin, name: newName })}
        onDelete={deletePinPersisted}
      />

      <HeaderCab
        HandleDragStart={handleDragStart}
        HandleFileChange={handleFileChange}
        IsLoading={isLoading}
        SetMessage={setMessage}
        SavedAudios={savedAudios}
        DeleteAudio={deleteAudio}
        activeAudioIds={activeAudioIds}
        proximityVolumes={proximityVolumes}
      />
      <div className="absolute right-10 bottom-10 z-10 flex flex-col gap-2">

      </div>

      <div className="flex-1 relative h-full w-full overflow-hidden">
        {/* Layer Manager Panel - Floating */}
        <LayerManager
          onLayerAction={handleLayerAction}
        />

        <div className="absolute inset-0 z-0">
          <CanvasContainer
            items={[...activePlayers, ...activeImages, ...activeAreas, ...activePins]} // Keep for minimap
            onDropItem={(itemData: { id: string }, type: string, x: number, y: number) => {
              if (type === 'image') {
                const image = savedImages.find((i: Images) => i.id === Number(itemData.id));
                if (image) {
                  const newImage: ActiveImage = {
                    id: crypto.randomUUID(),
                    image: image,
                    position: { x, y }
                  };
                  addImagePersisted(newImage);
                }
              }
            }}
            onDropFile={async (files: FileList, x: number, y: number) => {
              const fileArray = Array.from(files);
              for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                const offsetX = x + i * 20;
                const offsetY = y + i * 20;

                if (file.type.startsWith('audio/')) {
                  const savedAudio = await saveAudio(file);
                  if (savedAudio) {
                    setMessage(`Áudio ${file.name} adicionado à biblioteca.`);
                  }
                } else if (file.type.startsWith('image/')) {
                  const savedImage = await saveImage(file);
                  if (savedImage) {
                    const newImage: ActiveImage = {
                      id: crypto.randomUUID(),
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
                    addImagePersisted(newImage);
                    setMessage(`Imagem ${file.name} adicionada ao canvas.`);
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
          >
            {/* Render items based on Layer Order */}
            {/* Reverse layers so the first item in the list (Top) is rendered last (Top Z-Index) */}
            {[...activeLayers].reverse().map((layer) => {
              if (!isLayerVisible(layer, activeLayers)) return null;

              if (layer.itemType === 'image') {
                const image = activeImages.find(i => i.id === layer.itemId);
                if (!image) return null;
                return (
                  <DraggableItem
                    key={image.id}
                    id={image.id}
                    x={Number(image.position.x)}
                    y={Number(image.position.y)}
                    zIndex={1} // Layer order determines z-index now
                    isSelected={false}
                    className={''}
                    onPositionChange={(id, x, y) => changePositionImage(image, { x, y })}
                  >
                    <ImageItem
                      image={image}
                      onDelete={() => deleteImagePersisted(image.id)}
                      onEdit={() => handleEditImage(image.id)}
                      onUpdate={(updatedImage) => updateImagePersisted(updatedImage)}
                      isEditing={editingImageId === image.id}
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
                    onUpdate={handleUpdateArea}
                    onDelete={deleteArea}
                    isSelected={true}
                    onRightClick={(e) => handleAreaContextMenu(e, area.id)}
                    isActive={activeAreaIds.has(area.id)}
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
                    zIndex={20} // Pins usually stay on top, but we can let layers decide
                    isSelected={false}
                    onPositionChange={(id, x, y) => handlePinDrag(id, x, y, false)}
                    onDrag={(id, x, y) => handlePinDrag(id, x, y, true)}
                  >
                    <PinItem
                      pin={pin}
                      onDelete={(id) => deletePinPersisted(id)}
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

              return null;
            })}
          </CanvasContainer>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.screenX}
          y={contextMenu.screenY}
          onClose={() => setContextMenu(null)}
          options={contextMenu.type === 'area' ? [
            // Audio Library - Direct linking
            ...savedAudios.map((audio: Audios) => ({
              label: `🎵 ${audio.name} `,
              onClick: () => contextMenu.areaId && linkAreaToAudio(contextMenu.areaId, audio.id),
              icon: '🔗'
            })),
            {
              label: 'Deletar Área',
              onClick: () => contextMenu.areaId && deleteArea(contextMenu.areaId),
              icon: '🗑️'
            },
            {
              label: activeAreas.find(a => a.id === contextMenu.areaId)?.volumeMode === 'proximity' ? 'Desativar Proximidade' : 'Ativar Proximidade',
              onClick: () => {
                if (contextMenu.areaId) {
                  const area = activeAreas.find(a => a.id === contextMenu.areaId);
                  if (area) {
                    const isEnabling = area.volumeMode !== 'proximity';
                    const updates: Partial<ActiveArea> = { volumeMode: isEnabling ? 'proximity' : 'standard' };

                    if (isEnabling && !area.volumeSourcePoint) {
                      updates.volumeSourcePoint = getPolygonCentroid(area.points);
                    }

                    handleUpdateArea({ ...area, ...updates });
                    setContextMenu(null);
                  }
                }
              },
              icon: '🔊'
            }
          ] : contextMenu.type === 'pin' ? [
            {
              label: 'Renomear Pin',
              onClick: () => {
                if (contextMenu.pinId) {
                  const pin = activePins.find((p: ActivePin) => p.id === contextMenu.pinId);
                  if (pin) {
                    const newName = window.prompt('Novo nome do pin:', pin.name);
                    if (newName) {
                      updatePinPersisted({ ...pin, name: newName });
                      setContextMenu(null);
                    }
                  }
                }
              },
              icon: '✏️'
            },
            {
              label: 'Deletar Pin',
              onClick: () => contextMenu.pinId && deletePinPersisted(contextMenu.pinId),
              icon: '🗑️'
            }
          ] : [
            {
              label: 'Criar nova área',
              onClick: () => createArea({ x: contextMenu.worldX, y: contextMenu.worldY }),
              icon: '📐'
            },
            {
              label: 'Criar Pin',
              onClick: () => createPin({ x: contextMenu.worldX, y: contextMenu.worldY }),
              icon: '📍'
            }
          ]}
        />
      )}

      {/* Image Editor Modal */}
      {editingImageId && (() => {
        const imageToEdit = activeImages.find((img: ActiveImage) => img.id === editingImageId);
        return imageToEdit ? (
          <ImageEditor
            image={imageToEdit}
            onUpdate={handleUpdateImage}
            onClose={() => setEditingImageId(null)}
          />
        ) : null;
      })()}

      <div className="absolute h-screen w-screen -z-10"
      >
      </div>
    </div>
  );
}