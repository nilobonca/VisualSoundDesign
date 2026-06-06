const fs = require('fs');
let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

const replacement = `<CanvasContainer
            ref={canvasRef}
            onCanvasClick={(worldX, worldY) => {
              if (tool === 'wall') {
                setCurrentWallPoints(prev => {
                  const newPoints = [...prev, { x: worldX, y: worldY }];
                  if (newPoints.length === 2) {
                    const newWall = {
                      id: crypto.randomUUID(),
                      points: newPoints,
                      type: 'wall'
                    };
                    addWallPersisted(newWall);
                    // setTool('cursor'); // let's allow continuous drawing
                    return [];
                  }
                  return newPoints;
                });
              }
            }}`;

content = content.replace('<CanvasContainer\n            ref={canvasRef}', replacement);
fs.writeFileSync('src/pages/project/[id].tsx', content);
console.log('Added onCanvasClick to CanvasContainer in [id].tsx');
