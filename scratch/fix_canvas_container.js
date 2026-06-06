const fs = require('fs');
let content = fs.readFileSync('src/components/Canva/canva-teste.tsx', 'utf8');

if (!content.includes('onCanvasClick?: (worldX: number, worldY: number) => void;')) {
  content = content.replace(
    '  onSelectionChange?: (rect: { x: number; y: number; width: number; height: number } | null) => void;\n}',
    '  onSelectionChange?: (rect: { x: number; y: number; width: number; height: number } | null) => void;\n  onCanvasClick?: (worldX: number, worldY: number) => void;\n}'
  );
  content = content.replace(
    '({ children, items = [], onDropItem, onDropFile, onCanvasRightClick, onSelectionChange }, ref) => {',
    '({ children, items = [], onDropItem, onDropFile, onCanvasRightClick, onSelectionChange, onCanvasClick }, ref) => {'
  );
  
  // Find where the main div is and insert onClick
  const regex = /<div\s+ref=\{containerRef\}\s+className=\{`relative w-full h-full overflow-hidden bg-\\[#1e1e1e\\] select-none \$\{isSpacePressed \? \(isDraggingCanvas \? 'cursor-grabbing' : 'cursor-grab'\) : ''\}`\}/;
  content = content.replace(regex, `<div\n        ref={containerRef}\n        className={\`relative w-full h-full overflow-hidden bg-[#1e1e1e] select-none \${isSpacePressed ? (isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab') : ''}\`}\n        onClick={(e) => {\n          if (!isDraggingCanvas && !isSpacePressed && onCanvasClick) {\n            const rect = containerRef.current?.getBoundingClientRect();\n            if (rect) {\n              const x = (e.clientX - rect.left - transform.x) / transform.k;\n              const y = (e.clientY - rect.top - transform.y) / transform.k;\n              onCanvasClick(x, y);\n            }\n          }\n        }}`);
  
  fs.writeFileSync('src/components/Canva/canva-teste.tsx', content);
  console.log('Added onCanvasClick to canva-teste.tsx');
} else {
  console.log('onCanvasClick already exists');
}
