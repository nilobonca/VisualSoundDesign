import sys

with open('src/utils/indexedDB/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    const restoreCanvasState = useCallback(async (state: {
        activePlayers: Players[];
        activeImages: ActiveImage[];
        activeAreas: ActiveArea[];
        activePins: ActivePin[];
        activeLayers: Layer[];
        activeSoundboardItems: ActiveSoundboardItem[];
        activeNotes: ActiveNote[];
        activeGlobalTracks: ActiveGlobalTrack[];
    }) => {'''

replacement = '''    const restoreCanvasState = useCallback(async (state: {
        activePlayers: Players[];
        activeImages: ActiveImage[];
        activeAreas: ActiveArea[];
        activePins: ActivePin[];
        activeLayers: Layer[];
        activeSoundboardItems: ActiveSoundboardItem[];
        activeNotes: ActiveNote[];
        activeGlobalTracks: ActiveGlobalTrack[];
        activeWalls: ActiveWall[];
    }) => {'''

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/indexedDB/index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed inline type successfully.')
else:
    print('Inline target not found.')
