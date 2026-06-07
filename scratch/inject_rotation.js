const fs = require('fs');

let content = fs.readFileSync('src/components/player-list/index.tsx', 'utf8');

const target = `                        </button>
                    )}
                </div>`;

const rotationRow = `                        </button>
                    )}
                </div>

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
                            value={localRotation || 0}
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
                        <span className="text-[10px] text-gray-400 dark:text-neutral-400 w-8 text-right font-mono font-medium select-none">{localRotation || 0}°</span>
                    </div>
                </div>
                )}`;

content = content.replace(target, rotationRow);
fs.writeFileSync('src/components/player-list/index.tsx', content, 'utf8');
console.log('Successfully injected Rotation Control Row');
