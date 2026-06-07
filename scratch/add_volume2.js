const fs = require('fs');
let content = fs.readFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', 'utf8');

if (!content.includes('Volume2')) {
    content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Volume2, $1 } from 'lucide-react';");
    fs.writeFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', content, 'utf8');
}
