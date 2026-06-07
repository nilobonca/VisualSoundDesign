const fs = require('fs');

let contentIDB = fs.readFileSync('src/interfaces/utils/indexedDB.tsx', 'utf8');
contentIDB = contentIDB.replace(/\s*audioRotation\?: number;/g, '');
contentIDB = contentIDB.replace(/\s*spatialFade\?: number;/g, '');
fs.writeFileSync('src/interfaces/utils/indexedDB.tsx', contentIDB, 'utf8');
console.log('Cleaned indexedDB.tsx');

let contentMenu = fs.readFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', 'utf8');
const rotationBlockRegex = /<div className="flex items-center gap-2 mt-4">[\s\S]*?<div className="flex-1">[\s\S]*?Rotação de Áudio[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g;
contentMenu = contentMenu.replace(rotationBlockRegex, '');
fs.writeFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', contentMenu, 'utf8');
console.log('Cleaned ProjectCanvasContextMenu.tsx');
