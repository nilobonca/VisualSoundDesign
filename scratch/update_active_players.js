const fs = require('fs');

let content = fs.readFileSync('src/components/ActivePlayersMenu/index.tsx', 'utf8');

const target = /<div className="flex justify-between text-\[10px\] text-gray-500 dark:text-neutral-500 px-1 mt-1">/g;

const replacement = `{player.type === 'area' && 'original' in player && (
                                <div className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border-x border-b border-gray-200 dark:border-neutral-700/50 rounded-b mt-[-2px]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-600 dark:text-neutral-400 font-medium">Direção do Som</span>
                                        <input
                                            type="range" min="0" max="360" step="1"
                                            value={(player.original as any).audioRotation || 0}
                                            onChange={(e) => {
                                                if (onUpdateArea) {
                                                    onUpdateArea({ ...(player.original as any), audioRotation: parseInt(e.target.value) });
                                                }
                                            }}
                                            className="flex-1 accent-blue-500"
                                        />
                                        <span className="text-[10px] text-gray-500 w-6 text-right">{(player.original as any).audioRotation || 0}°</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between text-[10px] text-gray-500 dark:text-neutral-500 px-1 mt-1">`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/ActivePlayersMenu/index.tsx', content, 'utf8');
console.log('Updated ActivePlayersMenu.tsx');
