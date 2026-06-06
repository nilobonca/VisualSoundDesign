import sys

with open('src/utils/indexedDB/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''        const exportData = {
            savedAudios,
            savedImages,
            soundboardItems,
            activePlayers,
            activeImages,
            activeAreas,
            activePins,
            activeLayers,
            activeSoundboardItems,
            activeNotes,
            activeGlobalTracks
        };'''

replacement1 = '''        const exportData = {
            savedAudios,
            savedImages,
            soundboardItems,
            activePlayers,
            activeImages,
            activeAreas,
            activePins,
            activeLayers,
            activeSoundboardItems,
            activeNotes,
            activeGlobalTracks,
            activeWalls
        };'''

target2 = '''    }, [db, savedAudios, savedImages, soundboardItems, activePlayers, activeImages, activeAreas, activePins, activeLayers, activeSoundboardItems, activeNotes, activeGlobalTracks]);'''

replacement2 = '''    }, [db, savedAudios, savedImages, soundboardItems, activePlayers, activeImages, activeAreas, activePins, activeLayers, activeSoundboardItems, activeNotes, activeGlobalTracks, activeWalls]);'''

if target1 in content and target2 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    with open('src/utils/indexedDB/index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed exportCanvasState logic successfully.')
else:
    print('Targets not found in exportCanvasState.')
