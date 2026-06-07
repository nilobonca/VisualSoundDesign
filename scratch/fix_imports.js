const fs = require('fs');

let content1 = fs.readFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', 'utf8');
content1 = content1.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Volume2, $1 } from 'lucide-react';");
fs.writeFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', content1, 'utf8');

let content2 = fs.readFileSync('src/components/Canva/ProjectCanvasMenus.tsx', 'utf8');
content2 = content2.replace(/import ListenerSettingsMenu from '@\/components\/ListenerSettingsMenu';\r?\n/g, '');
fs.writeFileSync('src/components/Canva/ProjectCanvasMenus.tsx', content2, 'utf8');

console.log('Fixed imports');
