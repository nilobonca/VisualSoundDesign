import { useEffect } from 'react';
import { useCanvasGlobalStore } from '@/store/canvasStore';

export const useCanvasUI = (projectId: string | string[] | undefined) => {
  const headerOpen = useCanvasGlobalStore(state => state.headerOpen);
  const setHeaderOpen = useCanvasGlobalStore(state => state.setHeaderOpen);
  
  const layerManagerOpen = useCanvasGlobalStore(state => state.layerManagerOpen);
  const setLayerManagerOpen = useCanvasGlobalStore(state => state.setLayerManagerOpen);
  
  const pinManagerOpen = useCanvasGlobalStore(state => state.pinManagerOpen);
  const setPinManagerOpen = useCanvasGlobalStore(state => state.setPinManagerOpen);
  
  const historyOpen = useCanvasGlobalStore(state => state.historyOpen);
  const setHistoryOpen = useCanvasGlobalStore(state => state.setHistoryOpen);
  
  const soundboardOpen = useCanvasGlobalStore(state => state.soundboardOpen);
  const setSoundboardOpen = useCanvasGlobalStore(state => state.setSoundboardOpen);
  
  const activePlayersOpen = useCanvasGlobalStore(state => state.activePlayersOpen);
  const setActivePlayersOpen = useCanvasGlobalStore(state => state.setActivePlayersOpen);
  
  const mobileMenuOpen = useCanvasGlobalStore(state => state.mobileMenuOpen);
  const setMobileMenuOpen = useCanvasGlobalStore(state => state.setMobileMenuOpen);
  
  const menuZIndices = useCanvasGlobalStore(state => state.menuZIndices);
  const bringToFront = useCanvasGlobalStore(state => state.bringToFront) as (menu: 'header' | 'layer' | 'pin' | 'soundboard') => void;

  // Load from localStorage on mount (hydration handling)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const keys = ['headerOpen', 'layerManagerOpen', 'pinManagerOpen', 'historyOpen', 'soundboardOpen', 'activePlayersOpen'] as const;
      keys.forEach(key => {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          const val = stored === 'true';
          if (key === 'headerOpen') setHeaderOpen(val);
          else if (key === 'layerManagerOpen') setLayerManagerOpen(val);
          else if (key === 'pinManagerOpen') setPinManagerOpen(val);
          else if (key === 'historyOpen') setHistoryOpen(val);
          else if (key === 'soundboardOpen') setSoundboardOpen(val);
          else if (key === 'activePlayersOpen') setActivePlayersOpen(val);
        }
      });
    }
  }, [setHeaderOpen, setLayerManagerOpen, setPinManagerOpen, setHistoryOpen, setSoundboardOpen, setActivePlayersOpen]);

  // Persist changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('headerOpen', String(headerOpen));
    }
  }, [headerOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('layerManagerOpen', String(layerManagerOpen));
    }
  }, [layerManagerOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pinManagerOpen', String(pinManagerOpen));
    }
  }, [pinManagerOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('historyOpen', String(historyOpen));
    }
  }, [historyOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundboardOpen', String(soundboardOpen));
    }
  }, [soundboardOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activePlayersOpen', String(activePlayersOpen));
    }
  }, [activePlayersOpen]);

  // Reset menus when project changes (navigating between folders/projects)
  useEffect(() => {
    setPinManagerOpen(false);
    setHistoryOpen(false);
    setSoundboardOpen(false);
    setActivePlayersOpen(false);
  }, [projectId, setPinManagerOpen, setHistoryOpen, setSoundboardOpen, setActivePlayersOpen]);

  return {
    headerOpen, setHeaderOpen,
    layerManagerOpen, setLayerManagerOpen,
    pinManagerOpen, setPinManagerOpen,
    historyOpen, setHistoryOpen,
    soundboardOpen, setSoundboardOpen,
    activePlayersOpen, setActivePlayersOpen,
    mobileMenuOpen, setMobileMenuOpen,
    menuZIndices, bringToFront
  };
};
