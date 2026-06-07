const fs = require('fs');

let content = fs.readFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', 'utf8');

const audioRotationMenu = `
          {
            label: 'Rotação de Áudio',
            icon: <Music size={18} />,
            onClick: () => { },
            subMenu: [
              {
                label: 'Ângulo',
                onClick: () => { },
                custom: (
                  <div className="flex flex-col gap-2 p-2 w-48">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ângulo</span>
                      <span className="text-xs text-neutral-400">
                        {activeAreas.find(a => a.id === contextMenu.areaId)?.audioRotation || 0}°
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={activeAreas.find(a => a.id === contextMenu.areaId)?.audioRotation || 0}
                        onChange={(e) => {
                          if (contextMenu.areaId) {
                            const area = activeAreas.find(a => a.id === contextMenu.areaId);
                            if (area) handleUpdateArea({ ...area, audioRotation: parseInt(e.target.value) });
                          }
                        }}
                        className="w-full accent-emerald-500"
                      />
                      <div 
                        className="w-6 h-6 shrink-0 rounded-full border border-emerald-500/50 flex items-center justify-center relative"
                        style={{ transform: \`rotate(\${activeAreas.find(a => a.id === contextMenu.areaId)?.audioRotation || 0}deg)\` }}
                      >
                         <div className="absolute top-0 w-1 h-2 bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                )
              }
            ]
          },`;

content = content.replace(
  "          {\n            label: 'Aparência',",
  audioRotationMenu + "\n          {\n            label: 'Aparência',"
);

fs.writeFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', content, 'utf8');
console.log('Updated ProjectCanvasContextMenu.tsx!');
