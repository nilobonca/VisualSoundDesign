const fs = require('fs');
let content = fs.readFileSync('src/components/GlobalAudioMenu/index.tsx', 'utf8');

content = content.replace("import { useCanvasStore }", "import { useCanvasGlobalStore }");
fs.writeFileSync('src/components/GlobalAudioMenu/index.tsx', content, 'utf8');
console.log('Fixed import!');
