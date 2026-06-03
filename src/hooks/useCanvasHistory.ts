import { useState, useCallback } from 'react';
import { Players, ActiveImage, ActiveArea, ActivePin, Layer, ActiveSoundboardItem, ActiveNote } from '@/interfaces/utils/indexedDB';

export interface CanvasStateSnapshot {
  activePlayers: Players[];
  activeImages: ActiveImage[];
  activeAreas: ActiveArea[];
  activePins: ActivePin[];
  activeLayers: Layer[];
  activeSoundboardItems: ActiveSoundboardItem[];
  activeNotes: ActiveNote[];
}

export interface HistoryEntry {
  description: string;
  timestamp: number;
  state: CanvasStateSnapshot;
}

interface UseCanvasHistoryProps {
  currentState: CanvasStateSnapshot;
  restoreCanvasState: (state: CanvasStateSnapshot) => void;
}

export const useCanvasHistory = ({ currentState, restoreCanvasState }: UseCanvasHistoryProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);

  const addToHistory = useCallback((description: string = 'Alteração') => {
    const entry: HistoryEntry = {
      description,
      timestamp: Date.now(),
      state: currentState
    };
    setHistory(prev => {
      const newHistory = [...prev, entry];
      if (newHistory.length > 50) newHistory.shift(); // Limit history size
      return newHistory;
    });
    setFuture([]);
  }, [currentState]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousEntry = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    setFuture(prev => [previousEntry, ...prev]);
    setHistory(newHistory);
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

  const handleRestoreHistory = (state: any, index: number, type: 'history' | 'future') => {
    restoreCanvasState(state);

    if (type === 'history') {
      const newHistory = history.slice(0, index + 1);
      const newFuture = [...history.slice(index + 1), ...future];
      setHistory(newHistory);
      setFuture(newFuture);
    } else {
      const newHistory = [...history, ...future.slice(0, index + 1)];
      const newFuture = future.slice(index + 1);
      setHistory(newHistory);
      setFuture(newFuture);
    }
  };

  return {
    history,
    future,
    addToHistory,
    handleUndo,
    handleRedo,
    handleRestoreHistory
  };
};
