const fs = require('fs');
let idTsx = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

const webrtcStart = idTsx.indexOf('const [isSessionActive, setIsSessionActive] = useState(false);');
const webrtcEndMarker = 'const handlePinDrag =';
const webrtcEnd = idTsx.indexOf(webrtcEndMarker);

if (webrtcStart !== -1 && webrtcEnd !== -1) {
  const chunkToRemove = idTsx.substring(webrtcStart, webrtcEnd);
  
  const hookCall = `const {
    isSessionActive,
    setIsSessionActive,
    sessionListeners,
    listenerPings,
    handleLocateListener,
    handleKickListener,
    listenerGraphsRef,
    activeSoundboardStreamsRef,
    isChannelSubscribedRef
  } = useCanvasAudioSession(
    projectId as string | null,
    activePins,
    deletePinPersisted,
    pendingDeletePinsRef,
    setPlaySoundboardCallback,
    setStopSoundboardCallback,
    objectUrlsRef
  );

  `;
  
  idTsx = idTsx.replace(chunkToRemove, hookCall);
  
  // also handleLocateListener and handleKickListener might have been defined later in [id].tsx, let's remove them
  const locateStart = idTsx.indexOf('const handleLocateListener =');
  const kickEndStr = 'const handleLayerAction =';
  const kickEnd = idTsx.indexOf(kickEndStr, locateStart);
  if (locateStart !== -1 && kickEnd !== -1 && locateStart < kickEnd) {
     const chunk2 = idTsx.substring(locateStart, kickEnd);
     idTsx = idTsx.replace(chunk2, '');
  }

  fs.writeFileSync('src/pages/project/[id].tsx', idTsx);
  console.log('Patched correctly');
} else {
  console.log('Could not find markers');
}
