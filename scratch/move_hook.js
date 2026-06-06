const fs = require('fs');
let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

const hookCallRegex = /  const \{ calculateInteractions \} = useAudioInteractions\(\s*isSessionActive,\s*sessionListeners,\s*savedAudios,\s*getOrCreateListenerGraph,\s*removeListenerGraph,\s*objectUrlsRef\s*\);\s*useEffect\(\(\) => \{\s*calculateInteractions\(activePins, activeAreas, activeWalls\);\s*\}, \[activePins, activeAreas, activeWalls, calculateInteractions\]\);/g;

// Remove it from current location
content = content.replace(hookCallRegex, '');

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

// Find a good place to put it after removeListenerGraph
const removeFuncEnd = `  const removeListenerGraph = useCallback((listenerId: string) => {
    const graph = listenerGraphsRef.current.get(listenerId);
    if (graph) {
      graph.activeSources.forEach((src) => {
        try {
          src.audioElement.pause();
          src.audioElement.src = '';
          src.audioElement.load();
        } catch (e) {}
        try {
          if (src.jungle) src.jungle.disconnect();
          if (src.pannerNode) src.pannerNode.disconnect();
          src.filterNode.disconnect();
          src.gainNode.disconnect();
          src.sourceNode.disconnect();
        } catch (e) {}
      });
      graph.activeSources.clear();
      listenerGraphsRef.current.delete(listenerId);
    }
  }, []);`;

if (content.includes(removeFuncEnd)) {
  content = content.replace(
    removeFuncEnd,
    removeFuncEnd + '\n\n' + hookCall
  );
  fs.writeFileSync('src/pages/project/[id].tsx', content);
  console.log('Moved hook call down successfully!');
} else {
  // Try finding it with regex if exact string match fails
  const fallbackRegex = /const removeListenerGraph = useCallback[\s\S]*?\}, \[\]\);/;
  const match = content.match(fallbackRegex);
  if (match) {
    content = content.replace(match[0], match[0] + '\n\n' + hookCall);
    fs.writeFileSync('src/pages/project/[id].tsx', content);
    console.log('Moved hook call down successfully via fallback!');
  } else {
    console.log('Failed to find removeListenerGraph');
  }
}
