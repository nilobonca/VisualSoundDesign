# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/canva-teste.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_props = "  onCanvasClick?: (e: React.MouseEvent, worldX: number, worldY: number) => void;"
replacement_props = "  onCanvasClick?: (e: React.MouseEvent, worldX: number, worldY: number) => void;\n  onCanvasMouseMove?: (e: React.MouseEvent, worldX: number, worldY: number) => void;"

target_destruct = "  ({ children, items = [], onDropItem, onDropFile, onCanvasRightClick, onSelectionChange, onCanvasClick }, ref) => {"
replacement_destruct = "  ({ children, items = [], onDropItem, onDropFile, onCanvasRightClick, onSelectionChange, onCanvasClick, onCanvasMouseMove }, ref) => {"

target_div = '''          onMouseUp={handleContainerMouseUp}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}'''
replacement_div = '''          onMouseUp={handleContainerMouseUp}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
          onMouseMove={(e) => {
            if (onCanvasMouseMove && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              const worldX = (mouseX - transform.x) / transform.k;
              const worldY = (mouseY - transform.y) / transform.k;
              onCanvasMouseMove(e, worldX, worldY);
            }
          }}'''

if target_props in content and target_destruct in content:
    content = content.replace(target_props, replacement_props)
    content = content.replace(target_destruct, replacement_destruct)
    content = content.replace(target_div, replacement_div)
    with open('src/components/Canva/canva-teste.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed CanvasContainer.")
else:
    print("Targets not found.")
