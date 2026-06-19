import re

filepath = "src/pages/project/[id].tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """  useEffect(() => {
    calculateInteractions(activePins, activeAreas, activeWalls, activeGlobalTracks);
  }, [activePins, activeAreas, activeWalls, activeGlobalTracks, calculateInteractions]);"""

new_code = """  // Create a hash of audio-relevant properties to avoid recalculating interactions on visual updates (like color changes)
  const interactionsDependenciesHash = useMemo(() => {
    const pinsStr = activePins.map(p => `${p.id}:${p.position.x},${p.position.y}:${p.enabled}`).join('|');
    const areasStr = activeAreas.map(a => `${a.id}:${a.points.map(pt => `${pt.x},${pt.y}`).join(';')}:${a.audioRotation}:${a.filterType}:${a.linkedAudioId}:${a.volumeMode}:${a.proximityRadius}`).join('|');
    const wallsStr = activeWalls.map(w => `${w.id}:${w.start.x},${w.start.y}-${w.end.x},${w.end.y}:${w.attenuation}`).join('|');
    const tracksStr = activeGlobalTracks.map(t => `${t.id}:${t.audioFileId}`).join('|');
    return `${pinsStr}#${areasStr}#${wallsStr}#${tracksStr}`;
  }, [activePins, activeAreas, activeWalls, activeGlobalTracks]);

  useEffect(() => {
    calculateInteractions(activePins, activeAreas, activeWalls, activeGlobalTracks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionsDependenciesHash, calculateInteractions]);"""

content = content.replace(old_code, new_code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated interactions hash dependencies")
