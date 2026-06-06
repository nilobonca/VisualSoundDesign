const fs = require('fs');
let content = fs.readFileSync('src/components/Canva/itens/editable-area.tsx', 'utf8');

// Add import
if (!content.includes('useCanvasSelection')) {
  content = content.replace(
    "import AudioPlayerList from '@/components/player-list';",
    "import AudioPlayerList from '@/components/player-list';\nimport { useCanvasSelection } from '@/hooks/useCanvasSelection';"
  );
}

// Inject hooks inside component
if (!content.includes('proximityVolumes.get')) {
  content = content.replace(
    "const { getAudioById } = useCanvas();",
    "const { getAudioById } = useCanvas();\n    const { activeAreaIds, proximityVolumes, spatialPans, audioFilters } = useCanvasSelection();\n    const isActive = activeAreaIds.has(area.id);\n    const linkedAudioId = area.linkedAudioId;\n    const proxVol = linkedAudioId ? (proximityVolumes.get(linkedAudioId) ?? 1.0) : 1.0;\n    const pan = linkedAudioId ? (spatialPans.get(linkedAudioId) ?? 0) : 0;\n    const filter = linkedAudioId ? (audioFilters.get(linkedAudioId) ?? 'none') : 'none';"
  );
}

// Update AudioPlayerList
const targetPlayer = `                            <AudioPlayerList
                                audio={linkedAudio}
                                onDelete={() => { }} // No-op for delete in this context
                                onDuplicate={() => { }} // No-op for duplicate
                                pitch={area.pitch ?? 1.0}
                                onPitchChange={(newPitch) => onUpdate({ ...area, pitch: newPitch })}
                                volume={area.volume ?? 1.0}
                                onVolumeChange={(newVolume) => onUpdate({ ...area, volume: newVolume })}
                            />`;

const newPlayer = `                            <AudioPlayerList
                                audio={linkedAudio}
                                forcePlay={isActive}
                                proximityFactor={proxVol}
                                spatialPan={pan}
                                filterType={filter}
                                onDelete={() => { }} // No-op for delete in this context
                                onDuplicate={() => { }} // No-op for duplicate
                                pitch={area.pitch ?? 1.0}
                                onPitchChange={(newPitch) => onUpdate({ ...area, pitch: newPitch })}
                                volume={area.volume ?? 1.0}
                                onVolumeChange={(newVolume) => onUpdate({ ...area, volume: newVolume })}
                            />`;

if (content.includes(targetPlayer)) {
  content = content.replace(targetPlayer, newPlayer);
} else {
  // If my previous replace_file_content succeeded partially
  const fallbackPlayer = `                            <AudioPlayerList
                                forcePlay={isActive}
                                audio={linkedAudio}`;
  if (content.includes(fallbackPlayer)) {
    content = content.replace(fallbackPlayer, `                            <AudioPlayerList
                                audio={linkedAudio}
                                forcePlay={isActive}
                                proximityFactor={proxVol}
                                spatialPan={pan}
                                filterType={filter}`);
  }
}

fs.writeFileSync('src/components/Canva/itens/editable-area.tsx', content);
console.log('Updated editable-area.tsx to use Audio interactions');
