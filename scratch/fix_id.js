const fs = require('fs');
let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

if (!content.includes('useAudioInteractions')) {
  content = content.replace(
    'import { useCanvasAudioSession } from \'@/hooks/useCanvasAudioSession\';',
    'import { useCanvasAudioSession } from \'@/hooks/useCanvasAudioSession\';\nimport { useAudioInteractions } from \'@/hooks/useAudioInteractions\';'
  );
}

if (!content.includes('const { calculateInteractions } = useAudioInteractions(')) {
  const replacement = `
  const { calculateInteractions } = useAudioInteractions(
    isSessionActive,
    sessionListeners,
    savedAudios,
    getOrCreateListenerGraph,
    removeListenerGraph,
    objectUrlsRef
  );

  useEffect(() => {
    calculateInteractions(activePins, activeAreas, activeWalls);
  }, [activePins, activeAreas, activeWalls, calculateInteractions]);
`;
  
  content = content.replace(
    '  const handleSelectPage = (pageId: string) => {',
    replacement + '\n  const handleSelectPage = (pageId: string) => {'
  );
}

fs.writeFileSync('src/pages/project/[id].tsx', content);
console.log('Hooked up useAudioInteractions in [id].tsx');
