const fs = require('fs');

let content = fs.readFileSync('src/interfaces/utils/indexedDB.tsx', 'utf8');

// Update ActiveArea
content = content.replace(
  /volume\?: number;/g, 
  "volume?: number;\n    audioRotation?: number; // 0-360 degrees"
);

// Update ActiveGlobalTrack
content = content.replace(
  /filterType\?: 'none' \| 'lowpass' \| 'wall' \| 'telephone';/g,
  "filterType?: 'none' | 'lowpass' | 'wall' | 'telephone';\n    spatialPan?: number; // -1 to 1 (left to right)\n    spatialFade?: number; // -1 to 1 (front to back)"
);

fs.writeFileSync('src/interfaces/utils/indexedDB.tsx', content, 'utf8');
console.log('Updated indexedDB types!');
