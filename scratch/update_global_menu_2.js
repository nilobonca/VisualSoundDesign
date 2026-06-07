const fs = require('fs');
let content = fs.readFileSync('src/components/GlobalAudioMenu/index.tsx', 'utf8');

// Ensure useCanvasStore is imported
if (!content.includes('useCanvasStore')) {
    content = content.replace(
        "import { useProjectDB } from '@/hooks/useProjectDB';",
        "import { useProjectDB } from '@/hooks/useProjectDB';\nimport { useCanvasStore } from '@/store/canvasStore';"
    );
}

// Add is3DEnabled to component
content = content.replace(
    '    const { activeGlobalTracks',
    '    const { is3DEnabled } = useCanvasStore();\n    const { activeGlobalTracks'
);

// Update AudioPlayerList props
content = content.replace(
    '                                            spatialPan={0}',
    '                                            spatialPan={track.spatialPan || 0}\n                                            spatial3D={{ x: (track.spatialPan || 0) * 300, y: (track.spatialFade || 0) * 300 }}\n                                            is3DEnabled={is3DEnabled}'
);

fs.writeFileSync('src/components/GlobalAudioMenu/index.tsx', content, 'utf8');
console.log('Updated GlobalAudioMenu with 3D props!');
