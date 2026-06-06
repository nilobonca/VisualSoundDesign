import sys

with open('src/pages/project/[id].tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''    activeNotes,
    addNotePersisted,
    updateNotePersisted,
    deleteNotePersisted,
    updateAudioPersisted
   } = useIDB();'''

replacement1 = '''    activeNotes,
    addNotePersisted,
    updateNotePersisted,
    deleteNotePersisted,
    updateAudioPersisted,
    activeGlobalTracks,
    activeWalls
   } = useIDB();'''

target2 = '''    currentState: {
      activePlayers, activeImages, activeAreas, activePins, activeLayers, activeSoundboardItems, activeNotes
    },'''

replacement2 = '''    currentState: {
      activePlayers, activeImages, activeAreas, activePins, activeLayers, activeSoundboardItems, activeNotes, activeGlobalTracks, activeWalls
    },'''

if target1 in content and target2 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    with open('src/pages/project/[id].tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed [id].tsx successfully.')
else:
    print('Targets not found in [id].tsx.')
