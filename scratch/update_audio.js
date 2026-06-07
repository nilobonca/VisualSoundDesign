const fs = require('fs');

let content = fs.readFileSync('src/hooks/useAudioInteractions.ts', 'utf8');

const replacement = `            // Stereo Panning with Rotation (Fixing 2D pan orientation)
            const combinedRotation = listenerRotation + (area.audioRotation || 0);
            const angle = -combinedRotation * (Math.PI / 180);`;

content = content.replace(
  '            // Stereo Panning with Rotation (Fixing 2D pan orientation)\n            const angle = -listenerRotation * (Math.PI / 180);',
  replacement
);

fs.writeFileSync('src/hooks/useAudioInteractions.ts', content, 'utf8');
console.log('Updated useAudioInteractions.ts!');
