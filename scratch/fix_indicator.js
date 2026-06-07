const fs = require('fs');
let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

const indicatorComponent = `
const ListenerIndicator = ({ rotation, is3D }: { rotation: number, is3D: boolean }) => {
  if (!is3D) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-40">
      <div 
        className="relative w-32 h-32 rounded-full border-2 border-dashed border-emerald-500/30 flex items-center justify-center transition-transform duration-300"
        style={{ transform: \`rotate(\${rotation}deg)\` }}
      >
        <div className="w-8 h-8 bg-emerald-500/20 rounded-full border border-emerald-500/50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-emerald-500" />
        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-3 h-6 bg-neutral-800 rounded-sm border border-neutral-600" />
        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-3 h-6 bg-neutral-800 rounded-sm border border-neutral-600" />
      </div>
    </div>
  );
};
`;

content = content.replace(
  'export default function ProjectCanvas() {',
  indicatorComponent + '\nexport default function ProjectCanvas() {'
);

fs.writeFileSync('src/pages/project/[id].tsx', content, 'utf8');
console.log('Fixed ListenerIndicator missing definition');
