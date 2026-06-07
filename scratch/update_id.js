const fs = require('fs');
let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

content = content.replace(
    'spatialPans, setSpatialPans,',
    `spatialPans, setSpatialPans,
  spatial3D, setSpatial3D,
  is3DEnabled, setIs3DEnabled,
  listenerRotation, setListenerRotation,`
);

content = content.replace(
    'spatialPans={spatialPans}',
    `spatialPans={spatialPans}
          spatial3D={spatial3D}
          is3DEnabled={is3DEnabled}`
);

fs.writeFileSync('src/pages/project/[id].tsx', content, 'utf8');
console.log("Updated [id].tsx");
