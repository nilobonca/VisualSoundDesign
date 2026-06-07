const fs = require('fs');

const content = fs.readFileSync('src/hooks/useAudioInteractions.ts', 'utf8');

const fixedBlock = `            if (area.volumeMode === 'proximity') {
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
            const dx = sourcePoint.x - hotspot.x;
            const dy = sourcePoint.y - hotspot.y;
            const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
            
            const xs = area.points.map(p => p.x);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const width = maxX - minX || 1;
            const relX = rotatedX / (width / 2);
            const pan = Math.max(-1.0, Math.min(1.0, relX));
            
            newSpatialPans.set(area.linkedAudioId, pan);

            // Audio Filter (Check Walls)
            let filterType = area.filterType || 'none';
            if (doesIntersectWalls(hotspot, sourcePoint, walls)) {`;

const toReplace = `            if (area.volumeMode === 'proximity') {
              const dx = hotspot.x - sourcePoint.x;
              const dy = hotspot.y - sourcePoint.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const radius = area.proximityRadius || 300;

              if (doesIntersectWalls(hotspot, sourcePoint, walls)) {`;

const newContent = content.replace(toReplace, fixedBlock);
fs.writeFileSync('src/hooks/useAudioInteractions.ts', newContent, 'utf8');
console.log('Fixed useAudioInteractions.ts!');
