# -*- coding: utf-8 -*-
import sys

with open('src/hooks/useAudioInteractions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''            // Audio Filter (Check Walls)
            let filterType = area.filterType || 'none';
            if (doesIntersectWalls(hotspot, sourcePoint, walls)) {
              filterType = 'wall';
            }
            newAudioFilters.set(area.linkedAudioId, filterType);
          }
        }
      });
    });'''

replacement1 = '''            // Audio Filter (Check Walls)
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
    });'''

# Remove the original newProximityVolumes.set
target1_1 = '''            newProximityVolumes.set(area.linkedAudioId, volFactor);

            // Stereo Panning'''

replacement1_1 = '''            // Stereo Panning'''

target2 = '''              // Wall occlusion
              const isOccluded = doesIntersectWalls(hotspot, sourcePoint, walls);

              let src = graph.activeSources.get(area.id);'''

replacement2 = '''              // Wall occlusion
              const isOccluded = doesIntersectWalls(hotspot, sourcePoint, walls);
              const occlusionAttenuation = isOccluded ? 0.2 : 1.0;

              let src = graph.activeSources.get(area.id);'''

target3 = '''              const areaMasterVolume = area.volume !== undefined ? area.volume : 1.0;
              const finalVolume = volFactor * areaMasterVolume;'''

replacement3 = '''              const areaMasterVolume = area.volume !== undefined ? area.volume : 1.0;
              const finalVolume = volFactor * areaMasterVolume * occlusionAttenuation;'''

if target1 in content and target1_1 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target1_1, replacement1_1)
if target2 in content and target3 in content:
    content = content.replace(target2, replacement2)
    content = content.replace(target3, replacement3)

with open('src/hooks/useAudioInteractions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed useAudioInteractions.")
