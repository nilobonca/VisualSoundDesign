const fs = require('fs');

let content = fs.readFileSync('src/components/ActivePlayersMenu/index.tsx', 'utf8');

// Remove the custom rotation block I added earlier
const customRotationBlockRegex = /\{player\.type === 'area' && 'original' in player && \([\s\S]*?<div className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border-x border-b border-gray-200 dark:border-neutral-700\/50 rounded-b mt-\[-2px\]">[\s\S]*?<\/div>\s*\)\}/;
content = content.replace(customRotationBlockRegex, '');

// Now find where <AudioPlayerList is rendered and add the props
// Wait, the props of AudioPlayerList are spread like:
// <AudioPlayerList
//   audio={audioToPass}
//   ...
//   onPitchChange={(pitch) => {
//       if (onUpdateArea) {
//           onUpdateArea({ ...(player.original as any), pitch });
//       }
//   }}
// />
// I need to add audioRotation and onRotationChange.

content = content.replace(/(onVolumeChange=\{[\s\S]*?\}\s*\}[\s\S]*?\n\s*\/>)/g, (match) => {
    return `audioRotation={player.type === 'area' && 'original' in player ? (player.original as any).audioRotation : undefined}
                                onRotationChange={(rotation) => {
                                    if (player.type === 'area' && 'original' in player && onUpdateArea) {
                                        onUpdateArea({ ...(player.original as any), audioRotation: rotation });
                                    }
                                }}\n` + match;
});

fs.writeFileSync('src/components/ActivePlayersMenu/index.tsx', content, 'utf8');
console.log('Updated ActivePlayersMenu to pass rotation props');
