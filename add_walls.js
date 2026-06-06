
const fs = require('fs');
let content = fs.readFileSync('src/utils/indexedDB/index.tsx', 'utf8');

const searchStr1 = 'handleSetActiveGlobalTracks\\n    ]);';
const replaceStr1 = 'handleSetActiveGlobalTracks,\\n        activeWalls,\\n        addWallPersisted,\\n        updateWallPersisted,\\n        deleteWallPersisted,\\n        handleSetActiveWalls\\n    ]);';
content = content.replace(searchStr1, replaceStr1);

const searchStr2 = 'handleSetActiveGlobalTracks\\n    }), [';
const replaceStr2 = 'handleSetActiveGlobalTracks,\\n        activeWalls,\\n        addWallPersisted,\\n        updateWallPersisted,\\n        deleteWallPersisted,\\n        handleSetActiveWalls\\n    }), [';
content = content.replace(searchStr2, replaceStr2);

const methodsToAdd = \

    const addWallPersisted = useCallback((wall: ActiveWall, parentId?: string | null) => {
        setActiveWalls(prev => [...prev, wall]);
        updateItemPersisted(wall, 'Wall');
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'item',
            name: wall.name || 'Parede',
            visible: true,
            locked: false,
            parentId: parentId || null,
            depth: 0,
            itemId: wall.id,
            itemType: 'wall'
        };
        addLayer(newLayer);
    }, [updateItemPersisted, addLayer]);

    const updateWallPersisted = useCallback((wall: ActiveWall) => {
        setActiveWalls(prev => prev.map(w => w.id === wall.id ? wall : w));
        updateItemPersisted(wall, 'Wall');
        const layer = activeLayers.find(l => l.itemId === wall.id);
        if (layer && layer.name !== wall.name) {
            updateLayer({ ...layer, name: wall.name || 'Parede' });
        }
    }, [updateItemPersisted, activeLayers, updateLayer]);

    const deleteWallPersisted = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActiveWalls(prev => prev.filter(w => w.id !== id));
        const layer = activeLayers.find(l => l.itemId === id);
        if (layer) deleteLayer(layer.id);
    }, [deleteItemPersisted, activeLayers, deleteLayer]);

    const handleSetActiveWalls = useCallback((walls: ActiveWall[]) => {
        setActiveWalls(walls);
    }, []);
\;

const splitBy = '    const handleSetActiveAreas = useCallback((areas: ActiveArea[]) => {\\n        setActiveAreas(areas);\\n    }, []);';
if(content.includes(splitBy)) {
  content = content.replace(splitBy, splitBy + methodsToAdd);
}

fs.writeFileSync('src/utils/indexedDB/index.tsx', content);
console.log('done');

