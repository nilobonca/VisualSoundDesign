const fs = require('fs');
const path = require('path');

const chunksDir = 'c:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\.next\\dev\\static\\chunks';

if (!fs.existsSync(chunksDir)) {
    console.log('Chunks folder does not exist');
    process.exit(0);
}

function findAndPrintAllSources(mapObj, depth = 0) {
    if (!mapObj) return;
    
    if (mapObj.sources) {
        console.log(`${'  '.repeat(depth)}Has ${mapObj.sources.length} sources`);
        mapObj.sources.slice(0, 5).forEach((s, idx) => {
            console.log(`${'  '.repeat(depth)}  Source [${idx}]: ${s}`);
        });
    }
    
    if (mapObj.sections) {
        mapObj.sections.forEach((sec, sidx) => {
            if (sec.map) {
                findAndPrintAllSources(sec.map, depth + 1);
            }
        });
    }
}

function getMapFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getMapFiles(fullPath));
        } else if (file.endsWith('.js.map') && file.includes('[id]')) {
            results.push(fullPath);
        }
    });
    return results;
}

const mapFiles = getMapFiles(chunksDir);
console.log(`Inspecting ${mapFiles.length} map files.`);

for (let i = 0; i < Math.min(mapFiles.length, 3); i++) {
    const mapFile = mapFiles[i];
    console.log(`\nMap: ${mapFile}`);
    try {
        const mapData = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
        findAndPrintAllSources(mapData);
    } catch (e) {
        console.error(e);
    }
}
