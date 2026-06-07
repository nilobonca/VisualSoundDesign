const fs = require('fs');
let content = fs.readFileSync('src/components/Canva/ProjectCanvasMenus.tsx', 'utf8');

const target = /\{\/\* Listener Settings Menu - Floating \*\/\}[\s\S]*?\{listenerSettingsOpen && \([\s\S]*?<div className="absolute inset-0 pointer-events-none" style=\{\{ zIndex: 66 \}\}>[\s\S]*?<ListenerSettingsMenu onClose=\{\(\) => setListenerSettingsOpen\(false\)\} \/>[\s\S]*?<\/div>[\s\S]*?\)\}/;
content = content.replace(target, '');

content = content.replace(/const \[listenerSettingsOpen, setListenerSettingsOpen\] = useState\(false\);\n/, '');

const hpButtonTarget = /<button\s+onClick=\{\(\) => setListenerSettingsOpen\(!listenerSettingsOpen\)\}[\s\S]*?Headphones[\s\S]*?<\/button>/;
content = content.replace(hpButtonTarget, '');

fs.writeFileSync('src/components/Canva/ProjectCanvasMenus.tsx', content, 'utf8');
console.log('Cleaned listenerSettingsOpen from ProjectCanvasMenus.tsx');
