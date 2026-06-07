const fs = require('fs');

let content = fs.readFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', 'utf8');

const target = /\{\s*label: 'Filtro de Áudio',/g;

const replacement = `{
            label: 'Direção do Som',
            onClick: () => { },
            icon: <Volume2 size={18} />,
            custom: (
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Rotação</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={activeAreas.find(a => a.id === contextMenu.areaId)?.audioRotation || 0}
                    onChange={(e) => {
                      if (contextMenu.areaId) {
                        const area = activeAreas.find(a => a.id === contextMenu.areaId);
                        if (area) handleUpdateArea({ ...area, audioRotation: parseInt(e.target.value) });
                      }
                    }}
                    className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 w-6 text-right">{activeAreas.find(a => a.id === contextMenu.areaId)?.audioRotation || 0}°</span>
                </div>
              </div>
            )
          },
          {
            label: 'Filtro de Áudio',`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/Canva/ProjectCanvasContextMenu.tsx', content, 'utf8');
console.log('Updated ProjectCanvasContextMenu.tsx');
