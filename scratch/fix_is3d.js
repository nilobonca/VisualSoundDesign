const fs = require('fs');
let content = fs.readFileSync('src/components/GlobalAudioMenu/index.tsx', 'utf8');

content = content.replace(
    '    const { savedAudios, activeGlobalTracks, addGlobalTrackPersisted, updateGlobalTrackPersisted, deleteGlobalTrackPersisted } = useIDB();',
    '    const { savedAudios, activeGlobalTracks, addGlobalTrackPersisted, updateGlobalTrackPersisted, deleteGlobalTrackPersisted } = useIDB();\n    const { is3DEnabled } = useCanvasGlobalStore();'
);

fs.writeFileSync('src/components/GlobalAudioMenu/index.tsx', content, 'utf8');
console.log('Fixed useCanvasGlobalStore inside component!');
