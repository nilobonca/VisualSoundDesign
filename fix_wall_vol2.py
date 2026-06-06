# -*- coding: utf-8 -*-
import sys

with open('src/hooks/useAudioInteractions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''              const areaMasterVolume = area.volume !== undefined ? area.volume : 1.0;
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

              // Wall occlusion
              const isOccluded = doesIntersectWalls(hotspot, sourcePoint, walls);
              const occlusionAttenuation = isOccluded ? 0.2 : 1.0;'''

replacement = '''              // Wall occlusion
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
              const pitch = area.pitch !== undefined ? area.pitch : 1.0;'''

if target in content:
    content = content.replace(target, replacement)
    with open('src/hooks/useAudioInteractions.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed useAudioInteractions order.")
else:
    print("Not found.")
