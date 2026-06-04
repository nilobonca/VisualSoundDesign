const fs = require('fs');
const lines = fs.readFileSync('src/pages/project/[id].tsx', 'utf8').split('\n');

const newLines = [];

for (let i = 0; i < lines.length; i++) {
  // 1. Remove session states
  if (i === 155) {
    // const [isSessionActive, setIsSessionActive] = useState(false);
    // skip up to 161 (connectionsRef)
    i = 161;
    continue;
  }

  // 2. Remove listenerGraphsRef and activeSoundboardStreamsRef
  if (i >= 163 && i <= 177) {
    // const listenerGraphsRef = useRef<Map<string, { ... }>>(new Map());
    // ...
    // const activeSoundboardStreamsRef = useRef<Map<string, { ... }>>(new Map());
    continue;
  }

  // 3. Remove isChannelSubscribedRef
  if (i === 899) {
    // const isChannelSubscribedRef = useRef(false);
    continue;
  }

  // 4. Inject hook usage where activeSoundboardStreamsRef used to be (after objectUrlsRef)
  if (i === 178) {
    newLines.push(`  const {`);
    newLines.push(`    isSessionActive,`);
    newLines.push(`    setIsSessionActive,`);
    newLines.push(`    sessionListeners,`);
    newLines.push(`    listenerPings,`);
    newLines.push(`    handleLocateListener,`);
    newLines.push(`    handleKickListener,`);
    newLines.push(`    listenerGraphsRef,`);
    newLines.push(`    activeSoundboardStreamsRef,`);
    newLines.push(`    isChannelSubscribedRef`);
    newLines.push(`  } = useCanvasAudioSession(`);
    newLines.push(`    projectId as string | null,`);
    newLines.push(`    activePins,`);
    newLines.push(`    deletePinPersisted,`);
    newLines.push(`    pendingDeletePinsRef,`);
    newLines.push(`    objectUrlsRef`);
    newLines.push(`  );`);
    newLines.push(lines[i]);
    continue;
  }

  // 5. Remove getOrCreateListenerGraph and removeListenerGraph
  if (i >= 566 && i <= 608) {
    // lines found via manual check in previous runs
    continue;
  }

  // 6. Remove "Clean listener pins when session is deactivated" effect
  if (i >= 999 && i <= 1010) {
    continue;
  }

  // 7. Remove "Setup PeerJS host and connection handlers" effect
  if (i >= 1012 && i <= 1182) {
    continue;
  }

  // 8. Remove "Broadcast ping to P2P listeners every 3 seconds" effect
  if (i >= 1184 && i <= 1200) {
    continue;
  }

  // 9. Remove "Hook soundboard audio plays/stops callbacks" effect
  if (i >= 1202 && i <= 1289) {
    continue;
  }

  // 10. Remove handleLocateListener and handleKickListener
  if (i >= 1363 && i <= 1381) {
    continue;
  }

  newLines.push(lines[i]);
}

let result = newLines.join('\n');

// Add import
if (!result.includes('useCanvasAudioSession')) {
  result = "import { useCanvasAudioSession } from '@/hooks/useCanvasAudioSession';\n" + result;
}

fs.writeFileSync('src/pages/project/[id].tsx', result);
console.log('Done!');
