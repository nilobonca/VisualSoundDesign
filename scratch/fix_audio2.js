const fs = require('fs');
let content = fs.readFileSync('src/hooks/useAudioInteractions.ts', 'utf8');

const correctBlock = `          if (area.linkedAudioId) {
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

            // Stereo Panning with Rotation (Fixing 2D pan orientation)
            const angle = -listenerRotation * (Math.PI / 180);
            const rawX = sourcePoint.x - hotspot.x;
            const rawY = sourcePoint.y - hotspot.y;
            const rotatedX = rawX * Math.cos(angle) - rawY * Math.sin(angle);
            const rotatedY = rawX * Math.sin(angle) + rawY * Math.cos(angle);
            
            const xs = area.points.map(p => p.x);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const width = maxX - minX || 1;
            const relX = rotatedX / (width / 2);
            const pan = Math.max(-1.0, Math.min(1.0, relX));
            
            newSpatialPans.set(area.linkedAudioId, pan);

            // Spatial 3D Audio HRTF
            newSpatial3D.set(area.linkedAudioId, {
              x: rotatedX,
              y: rotatedY
            });

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
          }`;

// Using regex to match from `if (area.linkedAudioId) {` up to `}` before `});`
const regex = /if \(area\.linkedAudioId\) \{[\s\S]*?newProximityVolumes\.set[\s\S]*?\}\s*\}/;

if (regex.test(content)) {
  content = content.replace(regex, correctBlock);
  fs.writeFileSync('src/hooks/useAudioInteractions.ts', content, 'utf8');
  console.log('Fixed useAudioInteractions.ts using regex!');
} else {
  console.log('Could not find block to replace!');
}
