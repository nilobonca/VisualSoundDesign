const fs = require('fs');

let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

const newIndicator = `const ListenerIndicator = ({ rotation, setRotation }: { rotation: number, setRotation?: (r: number) => void }) => {
  const handlePointerDown = (e) => {
    if (!setRotation) return;
    
    // capture initial angle
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    target.setPointerCapture(e.pointerId);
    
    const updateRotation = (clientX, clientY) => {
      const dx = clientX - cx;
      const dy = clientY - cy;
      // Math.atan2(dy, dx) returns angle from X-axis. 
      // We want angle from top (Y-axis pointing down in screen, so Top is -Y).
      // Math.atan2(dx, -dy) gives angle from top clockwise.
      let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      setRotation(Math.round(angle));
    };

    const handlePointerMove = (moveEvent) => {
      updateRotation(moveEvent.clientX, moveEvent.clientY);
    };

    const handlePointerUp = (upEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerup', handlePointerUp);
    };

    target.addEventListener('pointermove', handlePointerMove);
    target.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-[35] pointer-events-none">
      <div 
        className="relative w-32 h-32 rounded-full border-2 border-dashed border-emerald-500/30 flex items-center justify-center transition-transform duration-100 pointer-events-auto cursor-pointer hover:border-emerald-500/80 active:cursor-grabbing bg-transparent"
        style={{ transform: \`rotate(\${rotation}deg)\` }}
        onPointerDown={handlePointerDown}
        title="Arraste para girar a audição"
      >
        <div className="w-8 h-8 bg-emerald-500/20 rounded-full border border-emerald-500/50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-emerald-500" />
        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-3 h-6 bg-neutral-800 rounded-sm border border-neutral-600" />
        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-3 h-6 bg-neutral-800 rounded-sm border border-neutral-600" />
      </div>
    </div>
  );
};`;

const oldIndicatorRegex = /const ListenerIndicator = \(\{ rotation, is3D \}: \{ rotation: number, is3D: boolean \}\) => \{[\s\S]*?\};\n/;

content = content.replace(oldIndicatorRegex, newIndicator + '\n');

// Next we also need to replace the call `<ListenerIndicator rotation={listenerRotation} is3D={is3DEnabled} />`
// with `<ListenerIndicator rotation={listenerRotation} setRotation={setListenerRotation} />`
content = content.replace(
  /<ListenerIndicator rotation=\{listenerRotation\} is3D=\{is3DEnabled\} \/>/g, 
  '<ListenerIndicator rotation={listenerRotation} setRotation={setListenerRotation} />'
);

fs.writeFileSync('src/pages/project/[id].tsx', content, 'utf8');
console.log('Fixed ListenerIndicator to be interactive!');
