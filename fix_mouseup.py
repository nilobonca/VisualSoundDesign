import sys

with open('src/components/Canva/canva-teste.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    const handleWindowMouseUp = () => {
      if (selectionBox && onSelectionChange) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const left = Math.min(selectionBox.startX, selectionBox.currentX);
          const top = Math.min(selectionBox.startY, selectionBox.currentY);
          const width = Math.abs(selectionBox.currentX - selectionBox.startX);
          const height = Math.abs(selectionBox.currentY - selectionBox.startY);

          if (width > 5 && height > 5) {
            onSelectionChange({ x: left, y: top, width, height });
          } else {
            onSelectionChange(null); // Clicked without dragging much -> Deselect
          }
        }
      }

      setIsDraggingCanvas(false);
      setIsDraggingMinimap(false);
      setSelectionBox(null);
      document.body.style.cursor = 'default';
    };'''

replacement = '''    const handleWindowMouseUp = (e: MouseEvent) => {
      if (selectionBox) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const left = Math.min(selectionBox.startX, selectionBox.currentX);
          const top = Math.min(selectionBox.startY, selectionBox.currentY);
          const width = Math.abs(selectionBox.currentX - selectionBox.startX);
          const height = Math.abs(selectionBox.currentY - selectionBox.startY);

          if (width > 5 && height > 5) {
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
          }
        }
      }

      setIsDraggingCanvas(false);
      setIsDraggingMinimap(false);
      setSelectionBox(null);
      document.body.style.cursor = 'default';
    };'''

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/Canva/canva-teste.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed handleWindowMouseUp successfully.')
else:
    print('Target not found in canva-teste.tsx')
