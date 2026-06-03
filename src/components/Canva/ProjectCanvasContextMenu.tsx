import React from 'react';
import { 
  Plus, Hexagon, MapPin, Type, LayoutGrid, Eye, Edit2, 
  Music, Filter, Check, Palette, Trash2, User, Ear 
} from 'lucide-react';
import ContextMenu from '@/components/ContextMenu';

interface ProjectCanvasContextMenuProps {
  contextMenu: any;
  setContextMenu: (menu: any) => void;
  activeAreas: any[];
  activePins: any[];
  activeImages: any[];
  savedAudios: any[];
  soundboardItems: any[];
  activeSoundboardItems: any[];
  handleUpdateArea: (area: any) => void;
  deleteArea: (id: string) => void;
  updatePinPersisted: (pin: any) => void;
  deletePinPersisted: (id: string) => void;
  handleEditImage: (id: string) => void;
  deleteImagePersisted: (id: string) => void;
  deleteSoundboardItem: (id: string) => void;
  deleteSoundboardItemPersisted: (id: string) => void;
  deleteAudio: (id: number) => void;
  deleteImage: (id: number) => void;
  createArea: (pos: {x: number, y: number}) => void;
  createPin: (pos: {x: number, y: number}) => void;
  createNote: (pos: {x: number, y: number}) => void;
  createSoundboardButton: (pos: {x: number, y: number}) => void;
  setRenamingAreaId: (id: string) => void;
  linkAreaToAudio: (areaId: string, audioId: number) => void;
  setEditingSoundboardItemId: (id: string) => void;
  linkSoundboardItemToAudio: (itemId: string, audioId: number) => void;
}

export function ProjectCanvasContextMenu({
  contextMenu,
  setContextMenu,
  activeAreas,
  activePins,
  activeImages,
  savedAudios,
  soundboardItems,
  activeSoundboardItems,
  handleUpdateArea,
  deleteArea,
  updatePinPersisted,
  deletePinPersisted,
  handleEditImage,
  deleteImagePersisted,
  deleteSoundboardItem,
  deleteSoundboardItemPersisted,
  deleteAudio,
  deleteImage,
  createArea,
  createPin,
  createNote,
  createSoundboardButton,
  setRenamingAreaId,
  linkAreaToAudio,
  setEditingSoundboardItemId,
  linkSoundboardItemToAudio
}: ProjectCanvasContextMenuProps) {
  if (!contextMenu) return null;

  return (
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
              { label: 'Criar Botão Soundboard', onClick: () => createSoundboardButton({ x: contextMenu.worldX, y: contextMenu.worldY }), icon: <LayoutGrid size={18} /> },
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
            label: 'Filtro de Áudio',
            icon: <Filter size={18} />,
            onClick: () => { },
            subMenu: [
              {
                label: 'Nenhum',
                onClick: () => {
                  if (contextMenu.areaId) {
                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                    if (area) handleUpdateArea({ ...area, filterType: 'none' });
                  }
                },
                icon: (activeAreas.find(a => a.id === contextMenu.areaId)?.filterType === 'none' || !activeAreas.find(a => a.id === contextMenu.areaId)?.filterType) ? <Check size={14} /> : undefined
              },
              {
                label: 'Passa-Baixas (Lowpass)',
                onClick: () => {
                  if (contextMenu.areaId) {
                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                    if (area) handleUpdateArea({ ...area, filterType: 'lowpass' });
                  }
                },
                icon: activeAreas.find(a => a.id === contextMenu.areaId)?.filterType === 'lowpass' ? <Check size={14} /> : undefined
              },
              {
                label: 'Parede (Wall/Muffled)',
                onClick: () => {
                  if (contextMenu.areaId) {
                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                    if (area) handleUpdateArea({ ...area, filterType: 'wall' });
                  }
                },
                icon: activeAreas.find(a => a.id === contextMenu.areaId)?.filterType === 'wall' ? <Check size={14} /> : undefined
              },
              {
                label: 'Telefone (Telephone)',
                onClick: () => {
                  if (contextMenu.areaId) {
                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                    if (area) handleUpdateArea({ ...area, filterType: 'telephone' });
                  }
                },
                icon: activeAreas.find(a => a.id === contextMenu.areaId)?.filterType === 'telephone' ? <Check size={14} /> : undefined
              }
            ]
          },
          {
            label: 'Modo de Volume',
            icon: <Music size={18} />,
            onClick: () => { },
            subMenu: [
              {
                label: 'Padrão (Volume Fixo)',
                onClick: () => {
                  if (contextMenu.areaId) {
                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                    if (area) handleUpdateArea({ ...area, volumeMode: 'standard' });
                  }
                },
                icon: activeAreas.find(a => a.id === contextMenu.areaId)?.volumeMode !== 'proximity' ? <Check size={14} /> : undefined
              },
              {
                label: 'Proximidade (Distância)',
                onClick: () => {
                  if (contextMenu.areaId) {
                    const area = activeAreas.find(a => a.id === contextMenu.areaId);
                    if (area) {
                      handleUpdateArea({
                        ...area,
                        volumeMode: 'proximity',
                        proximityRadius: area.proximityRadius || 300
                      });
                    }
                  }
                },
                icon: activeAreas.find(a => a.id === contextMenu.areaId)?.volumeMode === 'proximity' ? <Check size={14} /> : undefined
              }
            ]
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
                        max="0.2"
                        step="0.01"
                        value={activeAreas.find(a => a.id === contextMenu.areaId)?.opacity !== undefined ? activeAreas.find(a => a.id === contextMenu.areaId)?.opacity : 0.2}
                        onChange={(e) => {
                          if (contextMenu.areaId) {
                            const area = activeAreas.find(a => a.id === contextMenu.areaId);
                            if (area) {
                              let val = parseFloat(e.target.value);
                              if (val > 0.2) val = 0.2;
                              handleUpdateArea({ ...area, opacity: val });
                            }
                          }
                        }}
                        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={Math.round((activeAreas.find(a => a.id === contextMenu.areaId)?.opacity !== undefined ? activeAreas.find(a => a.id === contextMenu.areaId)!.opacity! : 0.2) * 100)}
                        onChange={(e) => {
                          if (contextMenu.areaId) {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) val = 0;
                            if (val < 0) val = 0;
                            if (val > 20) val = 20;
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
          {
            label: 'Ícone',
            icon: <User size={18} />,
            onClick: () => { },
            subMenu: [
              { label: 'Pin', onClick: () => { if (contextMenu.pinId) { const p = activePins.find(x => x.id === contextMenu.pinId); if (p) updatePinPersisted({ ...p, icon: 'pin' }); } }, icon: <MapPin size={18} /> },
              { label: 'Pessoa', onClick: () => { if (contextMenu.pinId) { const p = activePins.find(x => x.id === contextMenu.pinId); if (p) updatePinPersisted({ ...p, icon: 'person' }); } }, icon: <User size={18} /> },
              { label: 'Ouvido', onClick: () => { if (contextMenu.pinId) { const p = activePins.find(x => x.id === contextMenu.pinId); if (p) updatePinPersisted({ ...p, icon: 'ear' }); } }, icon: <Ear size={18} /> },
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
                setEditingSoundboardItemId(contextMenu.itemId);
              }
              setContextMenu(null);
            }
          },
          { label: 'Excluir Item', onClick: () => { if (contextMenu.itemId) deleteSoundboardItemPersisted(contextMenu.itemId); }, icon: <Trash2 size={18} /> }
        ] : []),
        ...(contextMenu.type === 'asset-audio' ? [
          { label: 'Excluir Áudio', onClick: () => { if (contextMenu.itemId) deleteAudio(Number(contextMenu.itemId)); }, icon: <Trash2 size={18} /> }
        ] : []),
        ...(contextMenu.type === 'asset-image' ? [
          { label: 'Excluir Imagem', onClick: () => { if (contextMenu.itemId) deleteImage(Number(contextMenu.itemId)); }, icon: <Trash2 size={18} /> }
        ] : [])
      ]}
    />
  );
}
