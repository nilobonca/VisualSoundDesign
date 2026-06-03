const fs = require('fs');
const path = require('path');

const appData = 'C:\\Users\\nilo\\AppData\\Roaming';
const dirs = fs.readdirSync(appData);

console.log('Searching for History folders in APPDATA...');

const historyPaths = [];
for (const d of dirs) {
    const full = path.join(appData, d);
    if (!fs.statSync(full).isDirectory()) continue;
    
    const userHistory = path.join(full, 'User', 'History');
    if (fs.existsSync(userHistory)) {
        console.log(`Found History directory: ${userHistory}`);
        historyPaths.push(userHistory);
    }
}

const matches = [];

for (const historyDir of historyPaths) {
    const subdirs = fs.readdirSync(historyDir);
    for (const subdir of subdirs) {
        const dirPath = path.join(historyDir, subdir);
        if (!fs.statSync(dirPath).isDirectory()) continue;
        
        const entryJsonPath = path.join(dirPath, 'entries.json');
        if (fs.existsSync(entryJsonPath)) {
            try {
                const entryJson = JSON.parse(fs.readFileSync(entryJsonPath, 'utf8'));
                if (entryJson.resource && (
                    entryJson.resource.toLowerCase().includes('%5bid%5d.tsx') ||
                    entryJson.resource.toLowerCase().includes('[id].tsx') ||
                    (entryJson.resource.toLowerCase().includes('project') && entryJson.resource.toLowerCase().includes('.tsx'))
                )) {
                    console.log(`Found resource in ${historyDir} / ${subdir}: ${entryJson.resource}`);
                    const files = fs.readdirSync(dirPath).filter(f => f !== 'entries.json');
                    for (const file of files) {
                        const filePath = path.join(dirPath, file);
                        const stat = fs.statSync(filePath);
                        matches.push({
                            historyDir,
                            subdir,
                            file,
                            path: filePath,
                            time: stat.mtime,
                            size: stat.size,
                            resource: entryJson.resource
                        });
                    }
                }
            } catch (e) {
                // ignore
            }
        }
    }
}

matches.sort((a, b) => b.time - a.time);

console.log(`\nFound ${matches.length} history matches across all editors:`);
matches.forEach((m, idx) => {
    console.log(`[${idx}] Time: ${m.time}, Size: ${m.size} bytes, Res: ${m.resource}, Path: ${m.path}`);
});

if (matches.length > 0) {
    const bestMatch = matches[0];
    const dest = 'C:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\scratch\\recovered_id.tsx';
    fs.copyFileSync(bestMatch.path, dest);
    console.log(`\nSuccessfully recovered newest history file to ${dest}`);
}
