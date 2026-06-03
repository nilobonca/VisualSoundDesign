import { useEffect } from 'react';
import { Players, ActiveImage, ActiveArea, ActivePin, ActiveSoundboardItem, ActiveNote } from '@/interfaces/utils/indexedDB';

interface UseCanvasShortcutsProps {
  selectedItemIds: Set<string>;
  setSelectedItemIds: (ids: Set<string>) => void;
  activePlayers: Players[];
  activeImages: ActiveImage[];
  activeAreas: ActiveArea[];
  activePins: ActivePin[];
  activeNotes: ActiveNote[];
  activeSoundboardItems: ActiveSoundboardItem[];
  deletePlayer: (id: string) => void;
  deleteImagePersisted: (id: string) => void;
  deleteArea: (id: string) => void;
  deletePinPersisted: (id: string) => void;
  deleteNotePersisted: (id: string) => void;
  deleteSoundboardItemPersisted: (id: string) => void;
  addToHistory: (description?: string) => void;
  handleUndo: () => void;
  handleRedo: () => void;
}

export const useCanvasShortcuts = ({
  selectedItemIds,
  setSelectedItemIds,
  activePlayers,
  activeImages,
  activeAreas,
  activePins,
  activeNotes,
  activeSoundboardItems,
  deletePlayer,
  deleteImagePersisted,
  deleteArea,
  deletePinPersisted,
  deleteNotePersisted,
  deleteSoundboardItemPersisted,
  addToHistory,
  handleUndo,
  handleRedo
}: UseCanvasShortcutsProps) => {
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
};
