# -*- coding: utf-8 -*-
import sys

with open('src/pages/project/[id].tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''            onCanvasRightClick={(e, worldX, worldY) => {
              setContextMenu({
                screenX: e.clientX,
                screenY: e.clientY,
                worldX,
                worldY,
                type: 'canvas'
              });
            }}
            onSelectionChange={handleSelectionChange}'''

replacement = '''            onCanvasClick={(e, worldX, worldY) => {
              if (tool === 'area') {
                setCurrentAreaPoints(prev => [...prev, { x: worldX, y: worldY }]);
              } else if (tool === 'wall') {
                setCurrentWallPoints(prev => [...prev, { x: worldX, y: worldY }]);
              }
            }}
            onCanvasRightClick={(e, worldX, worldY) => {
              if (tool === 'area' && currentAreaPoints.length >= 3) {
                addToHistory('Criar Área');
                addAreaPersisted({
                  id: crypto.randomUUID(),
                  type: 'area',
                  points: currentAreaPoints,
                  color: '#3B82F6',
                  name: Área ,
                  loop: true,
                  volume: 1
                }, activeProjectId);
                setCurrentAreaPoints([]);
                setTool('cursor');
              } else if (tool === 'wall' && currentWallPoints.length >= 2) {
                addToHistory('Criar Parede');
                addWallPersisted({
                  id: crypto.randomUUID(),
                  type: 'wall',
                  points: currentWallPoints
                }, activeProjectId);
                setCurrentWallPoints([]);
                setTool('cursor');
              } else if (tool === 'area' || tool === 'wall') {
                setCurrentAreaPoints([]);
                setCurrentWallPoints([]);
                setTool('cursor');
              } else {
                setContextMenu({
                  screenX: e.clientX,
                  screenY: e.clientY,
                  worldX,
                  worldY,
                  type: 'canvas'
                });
              }
            }}
            onSelectionChange={handleSelectionChange}'''

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/project/[id].tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed drawing logic successfully.')
else:
    print('Target not found in [id].tsx.')
