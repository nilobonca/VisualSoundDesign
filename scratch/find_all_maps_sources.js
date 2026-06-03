const fs = require('fs');
const path = require('path');

const nextDir = 'c:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\.next';

if (!fs.existsSync(nextDir)) {
    console.log('Next dir does not exist');
    process.exit(0);
}

function findSourceInMap(mapObj, targetName) {
    if (!mapObj) return null;
    if (mapObj.sources) {
        const idx = mapObj.sources.findIndex(s => s.toLowerCase().includes(targetName.toLowerCase()));
        if (idx !== -1 && mapObj.sourcesContent && mapObj.sourcesContent[idx]) {
            return mapObj.sourcesContent[idx];
        }
    }
    if (mapObj.sections) {
        for (const sec of mapObj.sections) {
            if (sec.map) {
                const res = findSourceInMap(sec.map, targetName);
                if (res) return res;
            }
        }
    }
    return null;
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.map')) {
            results.push(fullPath);
        }
    });
    return results;
}

const mapFiles = walk(nextDir);
console.log(`Found ${mapFiles.length} map files in total under .next.`);

let foundCount = 0;
for (const mapFile of mapFiles) {
    try {
        const stat = fs.statSync(mapFile);
        if (stat.size > 10000000) continue; // skip huge files
        const mapData = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
        const source = findSourceInMap(mapData, '[id].tsx');
        if (source) {
            console.log(`FOUND in map: ${mapFile} (modified: ${stat.mtime}, length: ${source.length})`);
            if (source.includes('isSessionActive')) {
                console.log(`  -> Contains isSessionActive!`);
                const dest = 'C:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\scratch\\recovered_id_global.tsx';
                fs.writeFileSync(dest, source, 'utf8');
                console.log(`  -> Saved to ${dest}`);
                foundCount++;
            } else {
                console.log(`  -> Does not contain isSessionActive.`);
            }
        }
    } catch (e) {
        // ignore
    }
}

console.log(`Scan complete. Found ${foundCount} matching map files with multiplayer code.`);
