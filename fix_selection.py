# -*- coding: utf-8 -*-
import sys

with open('src/pages/project/[id].tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_canvas = '''            onDropItem={handleDropItem}
            onDropFile={handleDropFile}
            onCanvasClick={(e, worldX, worldY) => {'''

replacement_canvas = '''            onDropItem={handleDropItem}
            onDropFile={handleDropFile}
            isSelectionEnabled={tool === 'cursor'}
            onCanvasClick={(e, worldX, worldY) => {'''

if target_canvas in content:
    content = content.replace(target_canvas, replacement_canvas)
    with open('src/pages/project/[id].tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed [id].tsx selection.")
else:
    print("Targets not found.")
