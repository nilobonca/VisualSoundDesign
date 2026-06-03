const fs = require('fs');
const path = require('path');

const nextDir = 'c:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\.next';

if (!fs.existsSync(nextDir)) {
    console.log('Next dir does not exist');
    process.exit(0);
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            // Skip large cache dirs if needed, but let's scan all to be thorough
            results = results.concat(walk(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

const allFiles = walk(nextDir);
console.log(`Found ${allFiles.length} files to search in .next.`);

const keywords = ['isSessionActive', 'sessionListeners', 'listenerPings'];

let matches = 0;
allFiles.forEach(f => {
    try {
        const stat = fs.statSync(f);
        if (stat.size > 2000000) return; // skip very large files to avoid OOM
        const content = fs.readFileSync(f, 'utf8');
        const found = keywords.filter(kw => content.includes(kw));
        if (found.length > 0) {
            console.log(`File: ${f} (${stat.size} bytes, modified: ${stat.mtime})`);
            console.log(`  Found: ${found.join(', ')}`);
            matches++;
        }
    } catch (e) {
        // ignore
    }
});

console.log(`Found ${matches} files matching the keywords.`);
