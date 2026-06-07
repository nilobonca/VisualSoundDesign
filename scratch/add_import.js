const fs = require('fs');
let content = fs.readFileSync('src/components/GlobalAudioMenu/index.tsx', 'utf8');

if (!content.includes('import { useCanvasStore }')) {
    content = content.replace(
        "import { useIDB } from '@/utils/indexedDB';",
        "import { useIDB } from '@/utils/indexedDB';\nimport { useCanvasStore } from '@/store/canvasStore';"
    );
}

fs.writeFileSync('src/components/GlobalAudioMenu/index.tsx', content, 'utf8');
console.log('Added useCanvasStore import!');
