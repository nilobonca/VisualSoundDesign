import sys

with open('src/hooks/useCanvasHistory.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''import { Players, ActiveImage, ActiveArea, ActivePin, Layer, ActiveSoundboardItem, ActiveNote } from '@/interfaces/utils/indexedDB';

export interface CanvasStateSnapshot {
  activePlayers: Players[];
  activeImages: ActiveImage[];
  activeAreas: ActiveArea[];
  activePins: ActivePin[];
  activeLayers: Layer[];
  activeSoundboardItems: ActiveSoundboardItem[];
  activeNotes: ActiveNote[];
}'''

replacement = '''import { Players, ActiveImage, ActiveArea, ActivePin, Layer, ActiveSoundboardItem, ActiveNote, ActiveGlobalTrack, ActiveWall } from '@/interfaces/utils/indexedDB';

export interface CanvasStateSnapshot {
  activePlayers: Players[];
  activeImages: ActiveImage[];
  activeAreas: ActiveArea[];
  activePins: ActivePin[];
  activeLayers: Layer[];
  activeSoundboardItems: ActiveSoundboardItem[];
  activeNotes: ActiveNote[];
  activeGlobalTracks: ActiveGlobalTrack[];
  activeWalls: ActiveWall[];
}'''

if target in content:
    content = content.replace(target, replacement)
    with open('src/hooks/useCanvasHistory.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed CanvasStateSnapshot successfully.')
else:
    print('Target not found in useCanvasHistory.ts.')
