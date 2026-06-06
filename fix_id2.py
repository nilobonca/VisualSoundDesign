import sys

with open('src/pages/project/[id].tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    updateAudioPersisted,
    activeGlobalTracks,
    activeWalls
   } = useIDB();'''

replacement = '''    updateAudioPersisted,
    activeGlobalTracks
   } = useIDB();'''

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/project/[id].tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Removed duplicate activeWalls successfully.')
else:
    print('Target not found.')
