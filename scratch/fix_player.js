const fs = require('fs');

let content = fs.readFileSync('src/components/player-list/index.tsx', 'utf8');

// 1. Add props to interface
content = content.replace(
    'spatialPan?: number; // Added! Panning from -1 (left) to 1 (right)',
    `spatialPan?: number; // Added! Panning from -1 (left) to 1 (right)
  spatial3D?: { x: number, y: number };
  is3DEnabled?: boolean;`
);

// 2. Add to destructuring
content = content.replace(
    'spatialPan = 0,',
    `spatialPan = 0,
  spatial3D,
  is3DEnabled = false,`
);

// 3. Update pannerNodeRef type
content = content.replace(
    'const pannerNodeRef = useRef<StereoPannerNode | null>(null);',
    'const pannerNodeRef = useRef<StereoPannerNode | PannerNode | null>(null);'
);

// 4. Update the effect to handle is3DEnabled changes
content = content.replace(
    `    const el = audioElement as any;
    if (el.__webAudioConnected) {
      pannerNodeRef.current = el.__pannerNode || null;
      filterNodeRef.current = el.__filterNode || null;
      jungleRef.current = el.__jungle || null;
      return;
    }`,
    `    const el = audioElement as any;
    
    if (el.__webAudioConnected) {
      if (el.__is3D !== is3DEnabled) {
        // Rebuild graph if 3D state changed
        if (el.__pannerNode) el.__pannerNode.disconnect();
        if (el.__filterNode) el.__filterNode.disconnect();
        if (el.__gainNode) el.__gainNode.disconnect();
        if (el.__jungle) el.__jungle.disconnect();
        if (el.__sourceNode) el.__sourceNode.disconnect();
        el.__webAudioConnected = false;
      } else {
        pannerNodeRef.current = el.__pannerNode || null;
        filterNodeRef.current = el.__filterNode || null;
        jungleRef.current = el.__jungle || null;
        return;
      }
    }`
);

// 5. Update graph creation for 3D
content = content.replace(
    `    if (ctx.createStereoPanner) {
      const pannerNode = ctx.createStereoPanner();
      sourceNode.connect(filterNode);
      filterNode.connect(jungle.input);
      jungle.output.connect(pannerNode);
      pannerNode.connect(gainNode);
      gainNode.connect(ctx.destination);
      pannerNodeRef.current = pannerNode;
      el.__pannerNode = pannerNode;
    } else {`,
    `    let pannerNode: StereoPannerNode | PannerNode | null = null;
    if (is3DEnabled && ctx.createPanner) {
      const p3D = ctx.createPanner();
      p3D.panningModel = 'HRTF';
      p3D.distanceModel = 'linear';
      p3D.maxDistance = 100000;
      p3D.refDistance = 100000;
      pannerNode = p3D;
    } else if (ctx.createStereoPanner) {
      pannerNode = ctx.createStereoPanner();
    }
    
    if (pannerNode) {
      sourceNode.connect(filterNode);
      filterNode.connect(jungle.input);
      jungle.output.connect(pannerNode);
      pannerNode.connect(gainNode);
      gainNode.connect(ctx.destination);
      pannerNodeRef.current = pannerNode;
      el.__pannerNode = pannerNode;
    } else {`
);

// 6. Set __webAudioConnected and __is3D
content = content.replace(
    `    el.__webAudioConnected = true;
  }, [audio.id]);`,
    `    el.__webAudioConnected = true;
    el.__is3D = is3DEnabled;
  }, [audio.id, is3DEnabled]);`
);

// 7. Update panning logic effect
content = content.replace(
    `  // Update pan value dynamically
  useEffect(() => {
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.value = spatialPan;
    }
  }, [spatialPan]);`,
    `  // Update pan value dynamically
  useEffect(() => {
    const ctx = getSharedAudioContext();
    if (pannerNodeRef.current) {
      if (is3DEnabled && spatial3D) {
        const p3D = pannerNodeRef.current as PannerNode;
        if (ctx) {
          p3D.positionX.setTargetAtTime(spatial3D.x, ctx.currentTime, 0.1);
          p3D.positionY.setTargetAtTime(spatial3D.y, ctx.currentTime, 0.1);
          p3D.positionZ.setTargetAtTime(0, ctx.currentTime, 0.1);
        } else {
          p3D.positionX.value = spatial3D.x;
          p3D.positionY.value = spatial3D.y;
        }
      } else {
        const p2D = pannerNodeRef.current as StereoPannerNode;
        if (ctx) {
          p2D.pan.setTargetAtTime(spatialPan, ctx.currentTime, 0.1);
        } else {
          p2D.pan.value = spatialPan;
        }
      }
    }
  }, [spatialPan, spatial3D, is3DEnabled]);`
);

fs.writeFileSync('src/components/player-list/index.tsx', content, 'utf8');
console.log('Updated player-list/index.tsx');
