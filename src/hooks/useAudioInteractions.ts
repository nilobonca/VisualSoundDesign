import { useCallback, useEffect } from 'react';
import { useCanvasGlobalStore } from '@/store/canvasStore';
import { ActivePin, ActiveArea, Audios, ActiveWall, ActiveGlobalTrack } from '@/interfaces/utils/indexedDB';
import { isPointInPolygon, getPolygonCentroid, doesIntersectWalls } from '@/hooks/useCanvasMath';
import { getSharedAudioContext } from '@/utils/audio/audioContext';
import { Jungle } from '@/utils/audio/jungle';

export const useAudioInteractions = (
  isSessionActive: boolean,
  sessionListeners: { listenerId: string; name: string }[],
  savedAudios: Audios[],
  getOrCreateListenerGraph: (listenerId: string) => any,
  removeListenerGraph: (listenerId: string) => void,
  objectUrlsRef: React.MutableRefObject<Map<number, string>>
) => {
  const setActiveAreaIds = useCanvasGlobalStore(state => state.setActiveAreaIds);
  const setProximityVolumes = useCanvasGlobalStore(state => state.setProximityVolumes);
  const setActiveAudioIds = useCanvasGlobalStore(state => state.setActiveAudioIds);
  const setSpatialPans = useCanvasGlobalStore(state => state.setSpatialPans);
  const setAudioFilters = useCanvasGlobalStore(state => state.setAudioFilters);

  const calculateInteractions = useCallback((pins: ActivePin[], areas: ActiveArea[], walls: ActiveWall[] = [], globalTracks: ActiveGlobalTrack[] = []) => {
    console.log("[useAudioInteractions] calculateInteractions called!", {
      isSessionActive,
      listeners: sessionListeners.length,
      globalTracks: globalTracks.length,
      ctxState: getSharedAudioContext()?.state
    });
    const newActiveIds = new Set<string>();
    const newProximityVolumes = new Map<number, number>();
    const newActiveAudioIds = new Set<number>();
    const newSpatialPans = new Map<number, number>();
    const newAudioFilters = new Map<number, 'none' | 'lowpass' | 'wall' | 'telephone'>();

    pins.forEach((pin: ActivePin) => {
      if (pin.enabled === false) return;

      const hotspot = { x: pin.position.x + 24, y: pin.position.y + 48 };

      areas.forEach((area: ActiveArea) => {
        if (isPointInPolygon(hotspot, area.points)) {
          newActiveIds.add(area.id);

          if (area.linkedAudioId) {
            newActiveAudioIds.add(area.linkedAudioId);

            let volFactor = 1.0;
            const sourcePoint = area.volumeSourcePoint || getPolygonCentroid(area.points);

            if (area.volumeMode === 'proximity') {
              const dx = hotspot.x - sourcePoint.x;
              const dy = hotspot.y - sourcePoint.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const radius = area.proximityRadius || 300;

              if (distance < radius) {
                volFactor = 1 - (distance / radius);
              } else {
                volFactor = 0;
              }
            }
            // Stereo Panning with Area Rotation
            const rawX = hotspot.x - sourcePoint.x;
            const rawY = hotspot.y - sourcePoint.y;
            const angle = -(area.audioRotation || 0) * (Math.PI / 180);
            const rotatedX = rawX * Math.cos(angle) - rawY * Math.sin(angle);

            const xs = area.points.map(p => p.x);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const width = maxX - minX || 1;
            const relX = rotatedX / (width / 2);
            const pan = Math.max(-1.0, Math.min(1.0, relX));
            newSpatialPans.set(area.linkedAudioId, pan);

            // Audio Filter (Check Walls)
            let filterType = area.filterType || 'none';
            if (doesIntersectWalls(hotspot, sourcePoint, walls)) {
              filterType = 'wall';
            }
            newAudioFilters.set(area.linkedAudioId, filterType);
            
            // Attenuate volume if wall is blocking
            if (filterType === 'wall') {
              newProximityVolumes.set(area.linkedAudioId, volFactor * 0.2); // 80% volume reduction
            } else {
              newProximityVolumes.set(area.linkedAudioId, volFactor);
            }
          }
        }
      });
    });

    setActiveAreaIds(newActiveIds);
    setProximityVolumes(newProximityVolumes);
    setActiveAudioIds(newActiveAudioIds);
    setSpatialPans(newSpatialPans);
    setAudioFilters(newAudioFilters);

    // Live WebRTC Audio mixing and streaming for each connected listener
    const ctx = getSharedAudioContext();
    if (ctx && isSessionActive && sessionListeners.length > 0) {
      sessionListeners.forEach(listener => {
        const pinId = `listener:${listener.listenerId}`;
        const pin = pins.find(p => p.id === pinId);
        const graph = getOrCreateListenerGraph(listener.listenerId);
        
        if (!graph) return;

        const activeAreaIdsForListener = new Set<string>();

        if (pin && pin.enabled) {
          const hotspot = { x: pin.position.x + 24, y: pin.position.y + 48 };

          areas.forEach(area => {
          if (area.linkedAudioId && isPointInPolygon(hotspot, area.points)) {
            const audio = savedAudios.find(a => a.id === area.linkedAudioId || a.id === Number(area.linkedAudioId));
            if (audio) {
              activeAreaIdsForListener.add(area.id);
              const sourcePoint = area.volumeSourcePoint || getPolygonCentroid(area.points);

              // 1. Proximity volume
              let volFactor = 1.0;
              if (area.volumeMode === 'proximity') {
                const dx = hotspot.x - sourcePoint.x;
                const dy = hotspot.y - sourcePoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const radius = area.proximityRadius || 300;
                
                if (distance < radius) {
                  volFactor = 1 - (distance / radius);
                } else {
                  volFactor = 0;
                }
              }

              // Wall occlusion
              const isOccluded = doesIntersectWalls(hotspot, sourcePoint, walls);
              const occlusionAttenuation = isOccluded ? 0.2 : 1.0;

              const areaMasterVolume = area.volume !== undefined ? area.volume : 1.0;
              const finalVolume = volFactor * areaMasterVolume * occlusionAttenuation;

              // 2. Stereo Panning
              const xs = area.points.map(p => p.x);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const width = maxX - minX || 1;
              const relX = (hotspot.x - sourcePoint.x) / (width / 2);
              const pan = Math.max(-1.0, Math.min(1.0, relX));

              // Pitch
              const pitch = area.pitch !== undefined ? area.pitch : 1.0;

              let src = graph.activeSources.get(area.id);
              if (!src) {
                let objectUrl = audio.url || objectUrlsRef.current.get(audio.id);
                if (!objectUrl && audio.file) {
                  objectUrl = URL.createObjectURL(audio.file);
                  objectUrlsRef.current.set(audio.id, objectUrl);
                }
                
                if (!objectUrl) {
                    console.error("No valid URL for area audio");
                    return;
                }

                try {
                  const audioEl = new Audio(objectUrl);
                  audioEl.loop = true;
                  audioEl.crossOrigin = 'anonymous';
                  audioEl.style.display = 'none';
                  document.body.appendChild(audioEl);

                  const gmAudioEl = document.getElementById(`gm-audio-${area.id}`) as HTMLAudioElement;
                  if (gmAudioEl) {
                    audioEl.currentTime = gmAudioEl.currentTime;
                  }

                  const sourceNode = ctx.createMediaElementSource(audioEl);
                  const filterNode = ctx.createBiquadFilter();
                  const jungle = new Jungle(ctx);
                  const pannerNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
                  const gainNode = ctx.createGain();

                  sourceNode.connect(filterNode);
                  filterNode.connect(jungle.input);
                  
                  if (pannerNode) {
                    jungle.output.connect(pannerNode);
                    pannerNode.connect(gainNode);
                  } else {
                    jungle.output.connect(gainNode);
                  }
                  
                  gainNode.connect(graph.destination);

                  const playPromise = audioEl.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (e.name !== 'AbortError') console.error("Error playing listener audio:", e);
                    });
                  }

                  src = {
                    audioElement: audioEl,
                    sourceNode,
                    gainNode,
                    pannerNode,
                    filterNode,
                    jungle,
                    audioId: audio.id,
                    playerId: area.id,
                    isPlaying: true // Areas always play when listener is inside
                  };
                  graph.activeSources.set(area.id, src);
                } catch (err) {
                  console.error("Failed to build virtual source node:", err);
                  return;
                }
              }

              if (src) {
                src.gainNode.gain.setTargetAtTime(finalVolume, ctx.currentTime, 0.05);
                
                if (src.pannerNode) {
                  src.pannerNode.pan.setTargetAtTime(pan, ctx.currentTime, 0.1);
                }
                
                const filter = src.filterNode;
                let filterType = area.filterType || 'none';
                if (isOccluded) filterType = 'wall';

                if (filterType === 'telephone') {
                  filter.type = 'bandpass';
                  filter.frequency.setTargetAtTime(1500, ctx.currentTime, 0.05);
                } else if (filterType === 'wall') {
                  filter.type = 'lowpass';
                  filter.frequency.setTargetAtTime(450, ctx.currentTime, 0.05);
                } else if (filterType === 'lowpass') {
                  filter.type = 'lowpass';
                  filter.frequency.setTargetAtTime(1000, ctx.currentTime, 0.05);
                } else {
                  filter.type = 'lowpass';
                  filter.frequency.setTargetAtTime(20000, ctx.currentTime, 0.1);
                }

                if (src.jungle) {
                  src.jungle.setPitchOffset(pitch - 1.0);
                }

                // CONTINUOUS SYNC: If host scrubbed the audio, sync the virtual source node
                const gmAudioEl = document.getElementById(`gm-audio-${area.id}`) as HTMLAudioElement;
                if (gmAudioEl) {
                    if (Math.abs(src.audioElement.currentTime - gmAudioEl.currentTime) > 0.3) {
                        src.audioElement.currentTime = gmAudioEl.currentTime;
                    }
                    if (gmAudioEl.paused && !src.audioElement.paused) {
                        src.audioElement.pause();
                    } else if (!gmAudioEl.paused && src.audioElement.paused) {
                        src.audioElement.play().catch((e: any) => console.error(e));
                    }
                }
              }
            }
          }
        });
        }

        // 2. Global Tracks (No spatial logic, just pure audio injection)
        console.log(`[useAudioInteractions] Processing ${globalTracks.length} global tracks for listener ${listener.listenerId}`);
        globalTracks.forEach(track => {
          if (track.isPlaying) {
            const audio = savedAudios.find(a => a.id === track.linkedAudioId || a.id === Number(track.linkedAudioId));
            if (audio) {
              const sourceKey = `global-${track.id}`;
              activeAreaIdsForListener.add(sourceKey);
              
              let src = graph.activeSources.get(sourceKey);
              if (!src) {
                console.log(`[useAudioInteractions] Creating WebRTC source for global track ${track.id}`);
                let objectUrl = audio.url || objectUrlsRef.current.get(audio.id);
                if (!objectUrl && audio.file) {
                  objectUrl = URL.createObjectURL(audio.file);
                  objectUrlsRef.current.set(audio.id, objectUrl);
                }
                
                if (!objectUrl) {
                    console.error("No valid URL for global track");
                    return;
                }
                
                try {
                  const audioEl = new Audio(objectUrl);
                  audioEl.loop = true;
                  audioEl.crossOrigin = 'anonymous';
                  audioEl.style.display = 'none';
                  document.body.appendChild(audioEl);

                  let gmAudioEl = document.getElementById(`gm-audio-global-${track.id}`) as HTMLAudioElement;
                  if (!gmAudioEl) gmAudioEl = document.getElementById(`gm-audio-${track.id}`) as HTMLAudioElement;
                  if (gmAudioEl) {
                    audioEl.currentTime = gmAudioEl.currentTime;
                  }

                  const sourceNode = ctx.createMediaElementSource(audioEl);
                  const gainNode = ctx.createGain();
                  
                  sourceNode.connect(gainNode);
                  gainNode.connect(graph.destination);

                  console.log(`[useAudioInteractions] Calling audioEl.play() for global track ${track.id}`);
                  const playPromise = audioEl.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (e.name !== 'AbortError') console.error("Error playing global track listener audio:", e);
                    });
                  }

                  src = {
                    audioElement: audioEl,
                    sourceNode,
                    gainNode,
                    pannerNode: null,
                    filterNode: null,
                    audioId: audio.id,
                    playerId: track.id,
                    isPlaying: track.isPlaying
                  };
                  graph.activeSources.set(sourceKey, src);
                } catch (err) {
                  console.error("Failed to build virtual source node for global track:", err);
                  return;
                }
              }

              if (src) {
                src.isPlaying = track.isPlaying;
                console.log(`[useAudioInteractions] Setting gain for global track ${track.id} to ${track.volume}`);
                src.gainNode.gain.setTargetAtTime(track.volume, ctx.currentTime, 0.05);
              }
            }
          }
        });

        graph.activeSources.forEach((src: any, areaId: string) => {
          if (!activeAreaIdsForListener.has(areaId)) {
            try {
              src.audioElement.pause();
              src.audioElement.removeAttribute('src');
              src.audioElement.load();
              if (src.audioElement.parentNode) {
                src.audioElement.parentNode.removeChild(src.audioElement);
              }
            } catch (e) {}
            try {
              if (src.jungle) src.jungle.disconnect();
              if (src.pannerNode) src.pannerNode.disconnect();
              if (src.filterNode) src.filterNode.disconnect();
              if (src.gainNode) src.gainNode.disconnect();
              if (src.sourceNode) src.sourceNode.disconnect();
            } catch (e) {}
            graph.activeSources.delete(areaId);
          }
        });
      });
    }
  }, [isSessionActive, sessionListeners, savedAudios, getOrCreateListenerGraph, removeListenerGraph, objectUrlsRef]);

  // Continuous sync interval to ensure play/pause and seek state are matched perfectly over time
  useEffect(() => {
    if (!isSessionActive || sessionListeners.length === 0) return;

    const intervalId = setInterval(() => {
      sessionListeners.forEach(listener => {
        const graph = getOrCreateListenerGraph(listener.listenerId);
        if (!graph) return;

        graph.activeSources.forEach((src: any) => {
          if (!src.audioId) return;
          let gmAudioEl = null;
          
          if (src.playerId) {
            // First priority: UI menu player (this one has accurate scrubbed timeline)
            const uiEl = document.getElementById(`gm-audio-${src.playerId}`) as HTMLAudioElement;
            if (uiEl && (!uiEl.paused || uiEl.currentTime > 0)) {
              gmAudioEl = uiEl;
            }
            
            // Second priority: Background global player
            if (!gmAudioEl) {
              const globalEl = document.getElementById(`gm-audio-global-${src.playerId}`) as HTMLAudioElement;
              if (globalEl && (!globalEl.paused || globalEl.currentTime > 0)) {
                gmAudioEl = globalEl;
              }
            }
          }
          
          if (!gmAudioEl) {
            gmAudioEl = document.getElementById(`gm-audio-${src.playerId || src.audioId}`) as HTMLAudioElement;
          }
          
          if (gmAudioEl && !gmAudioEl.paused && gmAudioEl.currentTime > 0) {
            if (Math.abs(src.audioElement.currentTime - gmAudioEl.currentTime) > 0.3) {
              src.audioElement.currentTime = gmAudioEl.currentTime;
            }
          }
          
          const shouldPlay = src.isPlaying !== undefined ? src.isPlaying : (gmAudioEl ? !gmAudioEl.paused : true);

          if (!shouldPlay && !src.audioElement.paused) {
            src.audioElement.pause();
          } else if (shouldPlay && src.audioElement.paused) {
            const playPromise = src.audioElement.play();
            if (playPromise !== undefined) {
              playPromise.catch((e: any) => {
                if (e.name !== 'AbortError') {
                  console.error(e);
                }
              });
            }
          }
        });
      });
    }, 100); // 10Hz sync rate

    return () => clearInterval(intervalId);
  }, [isSessionActive, sessionListeners, getOrCreateListenerGraph]);

  return { calculateInteractions };
};

