const fs = require('fs');

let content = fs.readFileSync('src/components/player-list/index.tsx', 'utf8');

// 1. Add props
content = content.replace(/onVolumeChange\?: \(volume: number\) => void;/, "onVolumeChange?: (volume: number) => void;\n    audioRotation?: number;\n    onRotationChange?: (rotation: number) => void;");

// 2. Destructure props
content = content.replace(/onVolumeChange,/, "onVolumeChange,\n    audioRotation = 0,\n    onRotationChange,");

// 3. Add local state
content = content.replace(/const \[localVolume, setLocalVolume\] = useState\(volume\);/, "const [localVolume, setLocalVolume] = useState(volume);\n    const [localRotation, setLocalRotation] = useState(audioRotation);");

// 4. Update local state on prop change
content = content.replace(/setLocalVolume\(volume\);/, "setLocalVolume(volume);\n        setLocalRotation(audioRotation);");

// 5. Inject the slider row after Pitch Control Row
const pitchEndRegex = /(<span className="text-\[10px\] text-gray-400 dark:text-neutral-400 w-8 text-right font-mono font-medium select-none">\{localPitch\.toFixed\(2\)\}<\/span>\s*<\/div>\s*<\/div>)/;
const rotationRow = `
                {/* Rotation Control Row */}
                {onRotationChange !== undefined && (
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 prevent-item-drag flex-grow">
                        <div className="w-6 flex-shrink-0" />
                        <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-semibold select-none w-8">Dir:</span>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={localRotation}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setLocalRotation(val);

                                if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
                                debounceTimeoutRef.current = setTimeout(() => {
                                    if (onRotationChange) onRotationChange(val);
                                }, 100);
                            }}
                            className="flex-1 h-1 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            title="Ajustar direção"
                        />
                        <span className="text-[10px] text-gray-400 dark:text-neutral-400 w-8 text-right font-mono font-medium select-none">{localRotation}°</span>
                    </div>
                </div>
                )}`;

content = content.replace(pitchEndRegex, `$1${rotationRow}`);

fs.writeFileSync('src/components/player-list/index.tsx', content, 'utf8');
console.log('Updated AudioPlayerList with Rotation slider');
