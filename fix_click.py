# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/canva-teste.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_ref = "  const minimapDragStart = useRef({ x: 0, y: 0 });"
replacement_ref = "  const minimapDragStart = useRef({ x: 0, y: 0 });\n  const mouseDownPos = useRef<{ x: number, y: number } | null>(null);"

target_mousedown = '''  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking on an item (no-drag class) or space is pressed, don't start selection'''
replacement_mousedown = '''  const handleContainerMouseUp = (e: React.MouseEvent) => {
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      if (dx <= 5 && dy <= 5 && !isDraggingCanvas && !isSpacePressed) {
        if (onCanvasClick && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const worldX = (mouseX - transform.x) / transform.k;
          const worldY = (mouseY - transform.y) / transform.k;
          onCanvasClick(e, worldX, worldY);
        }
      }
      mouseDownPos.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    // If clicking on an item (no-drag class) or space is pressed, don't start selection'''

target_div = '''        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden bg-neutral-900"
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}'''
replacement_div = '''        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden bg-neutral-900"
          onMouseDown={handleMouseDown}
          onMouseUp={handleContainerMouseUp}
          onContextMenu={handleContextMenu}'''

target_mouseup = '''          if (width > 5 && height > 5) {
            if (onSelectionChange) onSelectionChange({ x: left, y: top, width, height });
          } else {
            if (onSelectionChange) onSelectionChange(null); // Clicked without dragging much -> Deselect
            
            // Fire onCanvasClick
            if (onCanvasClick) {
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              const worldX = (mouseX - transform.x) / transform.k;
              const worldY = (mouseY - transform.y) / transform.k;
              onCanvasClick(e as any, worldX, worldY);
            }
          }'''
replacement_mouseup = '''          if (width > 5 && height > 5) {
            if (onSelectionChange) onSelectionChange({ x: left, y: top, width, height });
          } else {
            if (onSelectionChange) onSelectionChange(null); // Clicked without dragging much -> Deselect
          }'''

content = content.replace(target_ref, replacement_ref)
content = content.replace(target_mousedown, replacement_mousedown)
content = content.replace(target_div, replacement_div)
content = content.replace(target_mouseup, replacement_mouseup)

with open('src/components/Canva/canva-teste.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Click logic fixed successfully.")
