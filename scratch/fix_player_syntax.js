const fs = require('fs');

let contentPlayer = fs.readFileSync('src/components/player-list/index.tsx', 'utf8');

// The file currently has:
/*
    useEffect(() => {
        const ctx = getSharedAudioContext();
        if (pannerNodeRef.current) {

            } else {
                const p2D = pannerNodeRef.current as StereoPannerNode;
                if (ctx) {
                    p2D.pan.setTargetAtTime(spatialPan, ctx.currentTime, 0.1);
                } else {
                    p2D.pan.value = spatialPan;
                }
            }
        }
    }, [spatialPan]);
*/
const badRegex = /\{\n\s*\} else \{\n\s*const p2D = pannerNodeRef\.current as StereoPannerNode;/;
contentPlayer = contentPlayer.replace(badRegex, '{\n                const p2D = pannerNodeRef.current as StereoPannerNode;');

const extraClosingRegex = /\}\n\s*\}\n\s*\}\n\s*\}, \[spatialPan\]\);/;
contentPlayer = contentPlayer.replace(extraClosingRegex, '}\n        }\n    }, [spatialPan]);');

fs.writeFileSync('src/components/player-list/index.tsx', contentPlayer, 'utf8');
console.log('Fixed syntax in player-list');
