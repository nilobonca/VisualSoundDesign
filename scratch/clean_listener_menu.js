const fs = require('fs');
let content = fs.readFileSync('src/components/ListenerSettingsMenu/index.tsx', 'utf8');

// Remove store hooks
content = content.replace(/\s*const is3DEnabled = useCanvasGlobalStore\(state => state\.is3DEnabled\);/g, '');
content = content.replace(/\s*const setIs3DEnabled = useCanvasGlobalStore\(state => state\.setIs3DEnabled\);/g, '');

// Remove toggle section
const toggleSectionRegex = /<div className="flex items-center justify-between">[\s\S]*?<\/button>\s*<\/div>/;
content = content.replace(toggleSectionRegex, '');

// Remove opacity condition from rotation slider container
content = content.replace(/className={`space-y-3 transition-opacity \$\{is3DEnabled \? 'opacity-100' : 'opacity-50 pointer-events-none'\}`}/g, 'className="space-y-3"');

fs.writeFileSync('src/components/ListenerSettingsMenu/index.tsx', content, 'utf8');
console.log('Cleaned up ListenerSettingsMenu');
