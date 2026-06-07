const fs = require('fs');

let contentPlayer = fs.readFileSync('src/components/player-list/index.tsx', 'utf8');
contentPlayer = contentPlayer.replace(/is3DEnabled\?: boolean;/g, '');
contentPlayer = contentPlayer.replace(/\s*is3DEnabled = false,/g, '');

// Replace the condition if (is3DEnabled && spatial3D) with if (spatial3D)
contentPlayer = contentPlayer.replace(/if \(is3DEnabled && spatial3D\)/g, 'if (spatial3D)');

// Replace the dependency array [spatialPan, spatial3D, is3DEnabled]
contentPlayer = contentPlayer.replace(', is3DEnabled]);', ']);');

fs.writeFileSync('src/components/player-list/index.tsx', contentPlayer, 'utf8');
console.log('Cleaned player-list');
