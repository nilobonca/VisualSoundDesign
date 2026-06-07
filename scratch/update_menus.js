const fs = require('fs');

let content = fs.readFileSync('src/components/Canva/ProjectCanvasMenus.tsx', 'utf8');

// 1. Import Headphones
content = content.replace(
    'ArrowLeft, MapPin, History, Music, LayoutGrid, PenTool, MousePointer2, Globe',
    'ArrowLeft, MapPin, History, Music, LayoutGrid, PenTool, MousePointer2, Globe, Headphones'
);

// 2. Import ListenerSettingsMenu
content = content.replace(
    "import ListenersMenu from '@/components/ListenersMenu';",
    "import ListenersMenu from '@/components/ListenersMenu';\nimport ListenerSettingsMenu from '@/components/ListenerSettingsMenu';"
);

// 3. Add listenerSettingsOpen to useCanvasUI destructuring
content = content.replace(
    'listenersOpen, setListenersOpen,',
    'listenersOpen, setListenersOpen,\n    listenerSettingsOpen, setListenerSettingsOpen,'
);

// 4. Add the button in the sidebar. Let's find a good spot, maybe next to GlobalAudioMenu toggle.
content = content.replace(
    `<button
                onClick={() => {
                  setGlobalTracksOpen(!globalTracksOpen);
                  bringToFront('globalTracks');
                }}`,
    `<button
                title="Configurações de Áudio 3D"
                onClick={() => {
                  setListenerSettingsOpen(!listenerSettingsOpen);
                  bringToFront('listenerSettings');
                }}
                className={\`p-2 rounded-lg flex items-center justify-center transition-colors \${
                  listenerSettingsOpen 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }\`}
              >
                <Headphones size={20} />
              </button>

              <button
                onClick={() => {
                  setGlobalTracksOpen(!globalTracksOpen);
                  bringToFront('globalTracks');
                }}`
);

// 5. Add the actual ListenerSettingsMenu rendering block
content = content.replace(
    '{/* Listeners Menu - Floating */}',
    `{/* Listener Settings Menu - Floating */}
      {listenerSettingsOpen && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 66 }}>
          <ListenerSettingsMenu onClose={() => setListenerSettingsOpen(false)} />
        </div>
      )}

      {/* Listeners Menu - Floating */}`
);

fs.writeFileSync('src/components/Canva/ProjectCanvasMenus.tsx', content, 'utf8');
console.log('Updated ProjectCanvasMenus.tsx');
