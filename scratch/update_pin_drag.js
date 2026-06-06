const fs = require('fs');
let content = fs.readFileSync('src/pages/project/[id].tsx', 'utf8');

const targetStr = `    if (!isDragging) {
      const pinToUpdate = activePins.find((p: ActivePin) => p.id === pinId);
      if (pinToUpdate) {
        updatePinPersisted({ ...pinToUpdate, position: { x, y } });
      }
    }`;

const replaceStr = `    if (!isDragging) {
      const pinToUpdate = activePins.find((p: ActivePin) => p.id === pinId);
      if (pinToUpdate) {
        updatePinPersisted({ ...pinToUpdate, position: { x, y } });
      }
    } else {
      // Calculate real-time audio interactions during drag
      calculateInteractions(currentActivePins, currentActiveAreas, activeWalls);
    }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/pages/project/[id].tsx', content);
  console.log('Added calculateInteractions inside handlePinDrag successfully!');
} else {
  console.log('Could not find target string in handlePinDrag.');
}
