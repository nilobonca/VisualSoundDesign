const fs = require('fs');
const path = require('path');

const appData = 'C:\\Users\\nilo\\AppData\\Roaming';
const dirs = fs.readdirSync(appData);

console.log('Searching for files modified since June 1, 2026...');

const targetDate = new Date('2026-06-01T00:00:00Z');
const foundFiles = [];

function searchHistory(historyDir) {
    if (!fs.existsSync(historyDir)) return;
    const subdirs = fs.readdirSync(historyDir);
    for (const subdir of subdirs) {
        const fullSubdir = path.join(historyDir, subdir);
        if (!fs.statSync(fullSubdir).isDirectory()) continue;
        
        const entryJsonPath = path.join(fullSubdir, 'entries.json');
        if (fs.existsSync(entryJsonPath)) {
            try {
                const entryJson = JSON.parse(fs.readFileSync(entryJsonPath, 'utf8'));
                const subfiles = fs.readdirSync(fullSubdir).filter(f => f !== 'entries.json');
                for (const f of subfiles) {
                    const fpath = path.join(fullSubdir, f);
                    const stat = fs.statSync(fpath);
                    if (stat.mtime > targetDate) {
                        foundFiles.push({
                            historyDir,
                            subdir,
                            file: f,
                            path: fpath,
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

for (const d of dirs) {
    const full = path.join(appData, d);
    if (!fs.statSync(full).isDirectory()) continue;
    
    // Check various history folders
    searchHistory(path.join(full, 'User', 'History'));
    searchHistory(path.join(full, 'UserHistory'));
}

foundFiles.sort((a, b) => b.time - a.time);

console.log(`Found ${foundFiles.length} files modified since June 1, 2026:`);
foundFiles.slice(0, 30).forEach((f, idx) => {
    console.log(`[${idx}] Time: ${f.time}, Size: ${f.size} bytes, Res: ${f.resource}, Path: ${f.path}`);
});

if (foundFiles.length > 0) {
    // Find the one for [id].tsx
    const bestMatch = foundFiles.find(f => f.resource && (f.resource.includes('[id].tsx') || f.resource.includes('%5Bid%5D.tsx')));
    if (bestMatch) {
        const dest = 'C:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\scratch\\recovered_id.tsx';
        fs.copyFileSync(bestMatch.path, dest);
        console.log(`\nSuccessfully recovered newest [id].tsx history file to ${dest}`);
    } else {
        console.log('\nNo [id].tsx found among the files modified since June 1, 2026.');
    }
}
