const fs = require('fs');

let contentGlobal = fs.readFileSync('src/components/GlobalAudioMenu/index.tsx', 'utf8');
contentGlobal = contentGlobal.replace(/\s*is3DEnabled=\{is3DEnabled\}/g, '');

fs.writeFileSync('src/components/GlobalAudioMenu/index.tsx', contentGlobal, 'utf8');
console.log('Cleaned GlobalAudioMenu');
