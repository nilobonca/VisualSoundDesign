import { useState, useEffect, useRef, useCallback } from 'react';
import { Layer } from '@/interfaces/utils/indexedDB';

export interface ContextMenuState {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  type?: 'canvas' | 'area' | 'pin' | 'image' | 'wall' | 'soundboard-def' | 'soundboard-active' | 'asset-audio' | 'asset-image';
  areaId?: string;
  pinId?: string;
  imageId?: string;
  soundboardItemId?: string;
  itemId?: string;
}

export const useProjectState = (
  projectId: string | string[] | undefined,
  activeLayers: Layer[],
  isLoading: boolean,
  addLayer: (layer: Layer) => void,
  updateLayer: (layer: Layer) => void,
  resetCanvas: (pageId: string) => void
) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const [clearConfirmation, setClearConfirmation] = useState<{ open: boolean; x: number; y: number; pageId?: string } | null>(null);

  const initializedProjectId = useRef<string | null>(null);

  const handleSaveName = () => {
    const pId = Array.isArray(projectId) ? projectId[0] : projectId;
    if (tempName.trim() && pId) {
      const metaLayer = activeLayers.find(l => l.id === pId);
      if (metaLayer) {
        updateLayer({ ...metaLayer, name: tempName });
      }
    }
    setIsEditingName(false);
  };

  const handleClearRequest = (e: React.MouseEvent, pageId?: string) => {
    const x = e.clientX;
    const y = e.clientY;
    setClearConfirmation({ open: true, x, y, pageId });
  };

  const confirmClear = () => {
    const pId = clearConfirmation?.pageId || activeProjectId || (Array.isArray(projectId) ? projectId[0] : projectId);
    if (pId) resetCanvas(pId);
    setClearConfirmation(null);
  };

  useEffect(() => {
    const pId = Array.isArray(projectId) ? projectId[0] : projectId;

    if (pId && !isLoading) {
      if (initializedProjectId.current !== pId) {
        initializedProjectId.current = null;
      }

      const pages = activeLayers.filter(l => l.isProject && l.projectId === pId);

      if (pages.length > 0) {
        if (initializedProjectId.current === pId && activeProjectId) {
          const currentLayer = activeLayers.find(l => l.id === activeProjectId);
          if (currentLayer && currentLayer.projectId === pId) return;
        }

        const currentActive = activeLayers.find(l => l.id === activeProjectId);

        if (!activeProjectId || !currentActive || currentActive.projectId !== pId) {
          const storedActiveId = localStorage.getItem(`activePage_${pId}`);
          const storedPage = storedActiveId && pages.find(p => p.id === storedActiveId);

          if (storedPage) {
            setActiveProjectId(storedPage.id);
            initializedProjectId.current = pId;
          } else {
            const firstPage = pages.sort((a, b) => (a.order || 0) - (b.order || 0))[0];
            if (firstPage) {
              setActiveProjectId(firstPage.id);
              initializedProjectId.current = pId;
            }
          }
        } else {
          initializedProjectId.current = pId;
        }
      } else {
        const legacyPage = activeLayers.find(l => l.id === pId && l.isProject);
        if (legacyPage) {
          if (activeProjectId !== legacyPage.id) {
            setActiveProjectId(legacyPage.id);
          }
        } else {
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
            projectId: pId,
            order: 0
          };
          addLayer(newLayer);
          setActiveProjectId(newPageId);
          initializedProjectId.current = pId;
        }
      }
    }
  }, [projectId, activeLayers, activeProjectId, isLoading, addLayer]);

  useEffect(() => {
    if (activeProjectId && projectId) {
      const pId = Array.isArray(projectId) ? projectId[0] : projectId;
      if (pId) {
        localStorage.setItem(`activePage_${pId}`, activeProjectId);
      }
    }
  }, [activeProjectId, projectId]);

  const isItemInPage = useCallback((itemId: string | number) => {
    if (!activeProjectId) return false;
    const idStr = String(itemId);
    const layer = activeLayers.find(l => l.itemId === idStr);
    if (!layer) return false;

    let current: Layer | undefined = layer;
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current.id)) return false;
      visited.add(current.id);

      if (current.parentId === activeProjectId) return true;
      if (current.id === activeProjectId) return true;

      if (current.parentId) {
        current = activeLayers.find(l => l.id === current?.parentId);
      } else {
        return false;
      }
    }
    return false;
  }, [activeProjectId, activeLayers]);

  const getItemProjectId = useCallback((layer: Layer): string | null => {
    let current = layer;
    const visited = new Set<string>();

    if (current.isProject) return current.id;

    while (current.parentId) {
      if (visited.has(current.id)) {
        console.warn('Cycle detected in getItemProjectId:', current.id);
        return null;
      }
      visited.add(current.id);

      const parent = activeLayers.find(l => l.id === current.parentId);
      if (!parent) return null;

      if (parent.isProject) return parent.id;
      current = parent;
    }
    return null;
  }, [activeLayers]);

  return {
    contextMenu, setContextMenu,
    activeProjectId, setActiveProjectId,
    isEditingName, setIsEditingName,
    tempName, setTempName,
    handleSaveName,
    clearConfirmation, setClearConfirmation,
    handleClearRequest, confirmClear,
    isItemInPage,
    getItemProjectId
  };
};
