const fs = require('fs');
let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

// 1. Add import if not present
if (!content.includes('useAudioInteractions')) {
  content = content.replace(
    "import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts';",
    "import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts';\nimport { useAudioInteractions } from '@/hooks/useAudioInteractions';"
  );
}

// 2. Initialize useAudioInteractions inside the component
const hookCall = `  const { calculateInteractions } = useAudioInteractions(
    isSessionActive,
    sessionListeners,
    savedAudios,
    getOrCreateListenerGraph,
    removeListenerGraph,
    objectUrlsRef
  );

  useEffect(() => {
    calculateInteractions(activePins, activeAreas, activeWalls);
  }, [activePins, activeAreas, activeWalls, calculateInteractions]);`;

if (!content.includes('const { calculateInteractions }')) {
  // Find a good spot to insert it. After `const objectUrlsRef = useRef<Map<number, string>>(new Map());`
  content = content.replace(
    "const objectUrlsRef = useRef<Map<number, string>>(new Map());",
    `const objectUrlsRef = useRef<Map<number, string>>(new Map());\n\n${hookCall}\n`
  );
}

fs.writeFileSync('src/pages/project/[id].tsx', content);
console.log('Restored calculateInteractions in [id].tsx');
