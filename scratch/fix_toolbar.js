const fs = require('fs');
let content = fs.readFileSync('src/components/Canva/BottomToolbar.tsx', 'utf8');

// 1. Update Props
content = content.replace(
  'interface BottomToolbarProps {\n    onDragStart: (e: React.DragEvent, type: string, data?: string) => void;\n}',
  'interface BottomToolbarProps {\n    onDragStart: (e: React.DragEvent, type: string, data?: string) => void;\n    tool?: string;\n    setTool?: (tool: any) => void;\n}'
);

// update function signature
content = content.replace(
  'export default function BottomToolbar({ onDragStart }: BottomToolbarProps) {',
  'export default function BottomToolbar({ onDragStart, tool, setTool }: BottomToolbarProps) {'
);

// Add MousePointer2 and PenTool imports if not present
if (!content.includes('MousePointer2')) {
  content = content.replace(
    "import { MapPin, Square, User, Circle, Triangle, Hexagon, Ear, StickyNote, Music, ChevronDown, ChevronUp } from 'lucide-react';",
    "import { MapPin, Square, User, Circle, Triangle, Hexagon, Ear, StickyNote, Music, ChevronDown, ChevronUp, MousePointer2, PenTool } from 'lucide-react';"
  );
}

// Add the buttons to the main toolbar.
const buttons = `
                        {/* Tool: Cursor */}
                        {setTool && (
                            <button
                                onClick={() => setTool('cursor')}
                                className={\`p-2 rounded-full transition-colors \${tool === 'cursor' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-gray-100 text-gray-600 dark:text-neutral-400 dark:hover:bg-neutral-800'}\`}
                                title="Cursor"
                            >
                                <MousePointer2 size={20} />
                            </button>
                        )}
                        {/* Tool: Wall */}
                        {setTool && (
                            <button
                                onClick={() => setTool(tool === 'wall' ? 'cursor' : 'wall')}
                                className={\`p-2 rounded-full transition-colors \${tool === 'wall' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-gray-100 text-gray-600 dark:text-neutral-400 dark:hover:bg-neutral-800'}\`}
                                title="Desenhar Parede (Barreira de Som)"
                            >
                                <PenTool size={20} />
                            </button>
                        )}
                        <div className="h-6 w-px bg-gray-300 dark:bg-neutral-700"></div>
`;

content = content.replace(
  '{/* Pin */}',
  buttons + '\n                        {/* Pin */}'
);

fs.writeFileSync('src/components/Canva/BottomToolbar.tsx', content);
console.log('Updated BottomToolbar.tsx');
