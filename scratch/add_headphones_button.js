const fs = require('fs');
let content = fs.readFileSync('src/components/Canva/ProjectCanvasMenus.tsx', 'utf8');

const buttonCode = `
        {/* Listener Settings Toggle */}
        {!listenerSettingsOpen && (
          <button
            onClick={() => setListenerSettingsOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Configurações de Áudio 3D"
          >
            <Headphones size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* Active Players Toggle */}`;

content = content.replace('{/* Active Players Toggle */}', buttonCode);
fs.writeFileSync('src/components/Canva/ProjectCanvasMenus.tsx', content, 'utf8');
console.log('Added button');
