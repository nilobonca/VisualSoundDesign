const fs = require('fs');
const path = require('path');

const mapPath = 'C:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\.next\\dev\\static\\chunks\\src_pages_project_[id]_tsx_19468485._.js.map';

if (!fs.existsSync(mapPath)) {
    console.log(`Source map does not exist at ${mapPath}`);
    process.exit(0);
}

try {
    const rawMap = fs.readFileSync(mapPath, 'utf8');
    const map = JSON.parse(rawMap);
    
    console.log('Map properties:', Object.keys(map));
    console.log('Sources list:', map.sources);
    
    if (map.sourcesContent && map.sourcesContent.length > 0) {
        // Find the index of the file we want
        const fileIdx = map.sources.findIndex(s => s.includes('[id].tsx'));
        if (fileIdx !== -1 && map.sourcesContent[fileIdx]) {
            const originalSource = map.sourcesContent[fileIdx];
            console.log(`Found source content of length: ${originalSource.length}`);
            fs.writeFileSync('C:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\scratch\\recovered_id.tsx', originalSource, 'utf8');
            console.log('Successfully wrote recovered code to scratch/recovered_id.tsx');
        } else {
            console.log('Could not find [id].tsx source content in this map.');
            // Dump the first sources content length
            map.sourcesContent.forEach((sc, idx) => {
                console.log(`Source [${idx}]: ${map.sources[idx]} (${sc ? sc.length : 0} chars)`);
            });
        }
    } else {
        console.log('No sourcesContent found in the source map.');
    }
} catch (e) {
    console.error('Error reading/parsing source map:', e);
}
