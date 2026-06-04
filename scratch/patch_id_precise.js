const fs = require('fs');

let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

// 1. Remove the WebRTC useEffects and session state that were moved
const stateStart = content.indexOf('const [isSessionActive, setIsSessionActive] = useState(false);');
const stateEndStr = 'const isChannelSubscribedRef = useRef(false);';
const stateEnd = content.indexOf(stateEndStr) + stateEndStr.length;

if (stateStart !== -1 && stateEnd !== -1) {
  content = content.slice(0, stateStart) + content.slice(stateEnd);
  console.log('Removed session states');
} else {
  console.log('Could not find session states to remove');
}

const effect1Start = content.indexOf('// Clean listener pins when session is deactivated');
const effect1EndStr = '  const handlePinDrag =';
const effect1End = content.indexOf(effect1EndStr);

if (effect1Start !== -1 && effect1End !== -1) {
  content = content.slice(0, effect1Start) + content.slice(effect1End);
  console.log('Removed effects');
}

const graphStart = content.indexOf('const getOrCreateListenerGraph =');
const graphEndStr = 'const calculateInteractions =';
const graphEnd = content.indexOf(graphEndStr);

if (graphStart !== -1 && graphEnd !== -1) {
  content = content.slice(0, graphStart) + content.slice(graphEnd);
  console.log('Removed graph helpers');
}

// 2. Insert the hook usage right after the `objectUrlsRef` declaration
const injectPointStr = 'const activeSoundboardStreamsRef = useRef<Map<string, { sound: HTMLAudioElement; source: MediaElementAudioSourceNode; jungle?: Jungle }[]>>(new Map());';
const injectPoint = content.indexOf(injectPointStr);

if (injectPoint !== -1) {
  const hookCall = `
  const {
    isSessionActive,
    setIsSessionActive,
    sessionListeners,
    listenerPings,
    handleLocateListener,
    handleKickListener,
    listenerGraphsRef,
    isChannelSubscribedRef
  } = useCanvasAudioSession(
    projectId as string | null,
    activePins,
    deletePinPersisted,
    pendingDeletePinsRef,
    objectUrlsRef
  );
  `;
  
  content = content.slice(0, injectPoint + injectPointStr.length) + '\\n' + hookCall + content.slice(injectPoint + injectPointStr.length);
  console.log('Injected hook');
}

// 3. Remove the old handleLocateListener and handleKickListener functions further down
const locateStart = content.indexOf('const handleLocateListener =');
const locateEndStr = 'const handleLayerAction =';
const locateEnd = content.indexOf(locateEndStr);

if (locateStart !== -1 && locateEnd !== -1 && locateStart < locateEnd) {
  content = content.slice(0, locateStart) + content.slice(locateEnd);
  console.log('Removed old locate/kick handlers');
}

// 4. Add the import
if (!content.includes('useCanvasAudioSession')) {
  content = "import { useCanvasAudioSession } from '@/hooks/useCanvasAudioSession';\\n" + content;
}

fs.writeFileSync('src/pages/project/[id].tsx', content);
console.log('Done patching [id].tsx');
