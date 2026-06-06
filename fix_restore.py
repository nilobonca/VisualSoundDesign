import sys

with open('src/utils/indexedDB/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''        const allItems = [
            ...state.activePlayers,
            ...state.activeImages,
            ...state.activeAreas,
            ...state.activePins,
            ...state.activeLayers,
            ...state.activeSoundboardItems,
            ...state.activeNotes,
            ...(state.activeGlobalTracks || [])
        ];'''

replacement1 = '''        const allItems = [
            ...state.activePlayers,
            ...state.activeImages,
            ...state.activeAreas,
            ...state.activePins,
            ...state.activeLayers,
            ...state.activeSoundboardItems,
            ...state.activeNotes,
            ...(state.activeGlobalTracks || []),
            ...(state.activeWalls || [])
        ];'''

target2 = '''        setActivePlayers(state.activePlayers);
        setActiveImages(state.activeImages);
        setActiveAreas(state.activeAreas);
        setActivePins(state.activePins);
        setActiveLayers(state.activeLayers);
        setActiveSoundboardItems(state.activeSoundboardItems);
        setActiveNotes(state.activeNotes);
        setActiveGlobalTracks(state.activeGlobalTracks || []);
    }, [db]);'''

replacement2 = '''        setActivePlayers(state.activePlayers);
        setActiveImages(state.activeImages);
        setActiveAreas(state.activeAreas);
        setActivePins(state.activePins);
        setActiveLayers(state.activeLayers);
        setActiveSoundboardItems(state.activeSoundboardItems);
        setActiveNotes(state.activeNotes);
        setActiveGlobalTracks(state.activeGlobalTracks || []);
        setActiveWalls(state.activeWalls || []);
    }, [db]);'''

if target1 in content and target2 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    with open('src/utils/indexedDB/index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed restoreCanvasState logic successfully.')
else:
    print('Targets not found.')
