import { useState, useRef, useEffect, useCallback } from 'react';
import { ActivePin, Audios } from '@/interfaces/utils/indexedDB';
import { Jungle } from '@/utils/audio/jungle';
import { getSharedAudioContext } from '@/utils/audio/audioContext';
import { setPlaySoundboardCallback, setStopSoundboardCallback } from '@/components/Soundboard/activeAudios';

export const useCanvasAudioSession = (
  projectId: string | null,
  activePins: ActivePin[],
  deletePinPersisted: (id: string) => void,
  pendingDeletePinsRef: React.MutableRefObject<Set<string>>,
  objectUrlsRef: React.MutableRefObject<Map<number, string>>
) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionListeners, setSessionListeners] = useState<{ listenerId: string; name: string }[]>([]);
  const [listenerPings, setListenerPings] = useState<Record<string, number>>({});
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Record<string, any>>({});
  const isChannelSubscribedRef = useRef(false);
  const activeSoundboardStreamsRef = useRef<Map<string, { sound: HTMLAudioElement; source: MediaElementAudioSourceNode; jungle?: Jungle }[]>>(new Map());

  const listenerGraphsRef = useRef<Map<string, {
    destination: MediaStreamAudioDestinationNode | AudioDestinationNode;
    call?: any;
    activeSources: Map<string, {
      audioElement: HTMLAudioElement;
      sourceNode: MediaElementAudioSourceNode;
      gainNode: GainNode;
      pannerNode: StereoPannerNode | null;
      filterNode: BiquadFilterNode;
      jungle?: Jungle;
    }>;
  }>>(new Map());

  const getOrCreateListenerGraph = useCallback((listenerId: string) => {
    let graph = listenerGraphsRef.current.get(listenerId);
    if (!graph) {
      const ctx = getSharedAudioContext();
      if (ctx) {
        let dest: MediaStreamAudioDestinationNode | AudioDestinationNode;
        if (listenerId === 'local') {
          dest = ctx.destination;
        } else {
          dest = ctx.createMediaStreamDestination();
        }
        graph = {
          destination: dest,
          activeSources: new Map()
        };
        listenerGraphsRef.current.set(listenerId, graph);
      }
    }
    return graph;
  }, []);

  const removeListenerGraph = useCallback((listenerId: string) => {
    const graph = listenerGraphsRef.current.get(listenerId);
    if (graph) {
      if (graph.call) {
        graph.call.close();
      }
      graph.activeSources.forEach(sourceData => {
        try {
          if (sourceData.jungle) {
            sourceData.jungle.disconnect();
          }
          sourceData.sourceNode.disconnect();
          sourceData.gainNode.disconnect();
          if (sourceData.pannerNode) sourceData.pannerNode.disconnect();
          sourceData.filterNode.disconnect();
        } catch (err) {}
      });
      graph.activeSources.clear();
      listenerGraphsRef.current.delete(listenerId);
    }
  }, []);

  // Clean listener pins when session is deactivated
  useEffect(() => {
    if (!isSessionActive) {
      activePins.forEach(pin => {
        if (pin.id.startsWith('listener:')) {
          if (!pendingDeletePinsRef.current.has(pin.id)) {
            pendingDeletePinsRef.current.add(pin.id);
            deletePinPersisted(pin.id);
          }
        }
      });
    }
  }, [isSessionActive, activePins, deletePinPersisted, pendingDeletePinsRef]);

  // Setup PeerJS host and connection handlers
  useEffect(() => {
    if (!isSessionActive || !projectId) {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn) conn.close();
      });
      connectionsRef.current = {};

      // Clean up all listener graphs
      Array.from(listenerGraphsRef.current.keys()).forEach(id => {
        removeListenerGraph(id);
      });

      // Clean up all active soundboard streams
      activeSoundboardStreamsRef.current.forEach(list => {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
      });
      activeSoundboardStreamsRef.current.clear();

      // Revoke all cached Object URLs
      objectUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();

      setSessionListeners([]);
      isChannelSubscribedRef.current = false;
      return;
    }

    const initPeer = async () => {
      try {
        const Peer = (await import('peerjs')).default;
        const gmPeerId = `visual-sound-design-${projectId}`;
        console.log(`[DEBUG] Initializing PeerJS Host with ID: ${gmPeerId}`);

        const peer = new Peer(gmPeerId, {
          debug: 1
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
          console.log(`[DEBUG] PeerJS Host opened: ${id}`);
          isChannelSubscribedRef.current = true;
        });

        peer.on('error', (err) => {
          console.error('[DEBUG] PeerJS Host error:', err);
          isChannelSubscribedRef.current = false;
        });

        peer.on('close', () => {
          console.log('[DEBUG] PeerJS Host closed');
          isChannelSubscribedRef.current = false;
        });

        peer.on('connection', (conn) => {
          const listenerId = conn.peer;
          const name = (conn.metadata as any)?.name || 'Ouvinte Anônimo';
          console.log(`[DEBUG] P2P Connection from: ${name} (${listenerId})`);

          connectionsRef.current[listenerId] = conn;

          conn.on('open', () => {
            setSessionListeners(prev => {
              if (prev.some(l => l.listenerId === listenerId)) return prev;
              return [...prev, { listenerId, name }];
            });

            // Start audio stream WebRTC call
            const ctx = getSharedAudioContext();
            if (ctx) {
              ctx.resume().then(() => {
                const graph = getOrCreateListenerGraph(listenerId);
                if (graph && graph.destination instanceof MediaStreamAudioDestinationNode && peerRef.current) {
                  console.log(`[DEBUG] Calling listener peer with media stream: ${listenerId}`);
                  const call = peerRef.current.call(listenerId, graph.destination.stream);
                  graph.call = call;
                }
              });
            }
          });

          conn.on('data', (data: any) => {
            if (!data) return;

            if (data.type === 'pong') {
              const { timestamp } = data.payload || {};
              if (timestamp) {
                const rtt = Date.now() - timestamp;
                setListenerPings(prev => ({
                  ...prev,
                  [listenerId]: rtt
                }));
              }
            }
          });

          conn.on('close', () => {
            console.log(`[DEBUG] Connection closed: ${name}`);
            delete connectionsRef.current[listenerId];
            removeListenerGraph(listenerId);
            setSessionListeners(prev => prev.filter(l => l.listenerId !== listenerId));
          });

          conn.on('error', (err) => {
            console.error(`[DEBUG] Connection error with ${name}:`, err);
            conn.close();
          });
        });
      } catch (err) {
        console.error('Failed to init PeerJS:', err);
      }
    };

    initPeer();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn) conn.close();
      });
      connectionsRef.current = {};
      
      // Clean up all listener graphs
      Array.from(listenerGraphsRef.current.keys()).forEach(id => {
        removeListenerGraph(id);
      });

      // Clean up all active soundboard streams
      activeSoundboardStreamsRef.current.forEach(list => {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
      });
      activeSoundboardStreamsRef.current.clear();

      // Revoke all cached Object URLs
      objectUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();

      setSessionListeners([]);
      isChannelSubscribedRef.current = false;
    };
  }, [isSessionActive, projectId, removeListenerGraph, objectUrlsRef]);

  // Broadcast ping to P2P listeners every 3 seconds
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn && conn.open) {
          conn.send({
            type: 'ping',
            payload: { timestamp: Date.now() }
          });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Hook soundboard audio plays/stops callbacks to route into P2P listener streams
  useEffect(() => {
    if (!isSessionActive) {
      setPlaySoundboardCallback(null);
      setStopSoundboardCallback(null);
      return;
    }

    setPlaySoundboardCallback((payload: any) => {
      const { soundboardItemId, url, volume, pitch } = payload;
      const ctx = getSharedAudioContext();
      if (!ctx) return;

      const instances: { sound: HTMLAudioElement; source: MediaElementAudioSourceNode; jungle?: Jungle }[] = [];

      // Loop through all listener graphs to play and route the audio to their stream
      Array.from(listenerGraphsRef.current.entries()).forEach(([listenerId, graph]) => {
        if (listenerId === 'local') return; // Local is already played by playSoundboardAudio

        try {
          const sound = new Audio(url);
          sound.volume = volume !== undefined ? volume : 1.0;
          sound.crossOrigin = 'anonymous';

          const source = ctx.createMediaElementSource(sound);
          let jungle: Jungle | undefined;

          if (pitch !== undefined && pitch !== 1.0) {
            jungle = new Jungle(ctx);
            jungle.setPitchOffset(pitch - 1.0);
            source.connect(jungle.input);
            jungle.output.connect(graph.destination);
          } else {
            source.connect(graph.destination);
          }

          const instance = { sound, source, jungle };
          instances.push(instance);

          sound.onended = () => {
            try {
              if (jungle) jungle.disconnect();
              source.disconnect();
            } catch (e) {}
            // Remove this instance from the list
            const current = activeSoundboardStreamsRef.current.get(soundboardItemId) || [];
            const updated = current.filter(i => i.sound !== sound);
            if (updated.length === 0) {
              activeSoundboardStreamsRef.current.delete(soundboardItemId);
            } else {
              activeSoundboardStreamsRef.current.set(soundboardItemId, updated);
            }
          };

          sound.play().catch(e => console.error("Error playing soundboard to listener stream:", e));
        } catch (err) {
          console.error("Failed to route soundboard audio to listener stream:", err);
        }
      });

      if (instances.length > 0) {
        const prev = activeSoundboardStreamsRef.current.get(soundboardItemId) || [];
        activeSoundboardStreamsRef.current.set(soundboardItemId, [...prev, ...instances]);
      }
    });

    setStopSoundboardCallback((soundboardItemId: string) => {
      const list = activeSoundboardStreamsRef.current.get(soundboardItemId);
      if (list) {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
        activeSoundboardStreamsRef.current.delete(soundboardItemId);
      }
    });

    return () => {
      setPlaySoundboardCallback(null);
      setStopSoundboardCallback(null);
    };
  }, [isSessionActive, getOrCreateListenerGraph, setPlaySoundboardCallback, setStopSoundboardCallback]);

  const handleLocateListener = (listenerId: string) => {
    // Basic implementation since map centering isn't explicitly defined here
  };

  const handleKickListener = (listenerId: string) => {
    if (connectionsRef.current[listenerId]) {
      connectionsRef.current[listenerId].close();
      delete connectionsRef.current[listenerId];
    }
    removeListenerGraph(listenerId);
    setSessionListeners(prev => prev.filter(l => l.listenerId !== listenerId));
    
    // Also remove the pin
    const pinId = `listener:${listenerId}`;
    if (!pendingDeletePinsRef.current.has(pinId)) {
      pendingDeletePinsRef.current.add(pinId);
      deletePinPersisted(pinId);
    }
  };

  return {
    isSessionActive,
    setIsSessionActive,
    sessionListeners,
    listenerPings,
    handleLocateListener,
    handleKickListener,
    listenerGraphsRef,
    activeSoundboardStreamsRef,
    isChannelSubscribedRef,
    getOrCreateListenerGraph,
    removeListenerGraph
  };
};
