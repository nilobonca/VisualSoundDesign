const fs = require('fs');
const path = require('path');

const historyDir = 'C:\\Users\\nilo\\AppData\\Roaming\\Code\\User\\History';

if (!fs.existsSync(historyDir)) {
    console.log('VS Code Local History folder does not exist at ' + historyDir);
    process.exit(0);
}

// VS Code History stores files in subfolders named after a hash or ID
// Each subfolder contains entries, and one entry.json file mapping original files to their history entries.
const subdirs = fs.readdirSync(historyDir);
console.log(`Found ${subdirs.length} subfolders in VS Code History.`);

const matches = [];

for (const subdir of subdirs) {
    const dirPath = path.join(historyDir, subdir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    
    const entryJsonPath = path.join(dirPath, 'entries.json');
    if (fs.existsSync(entryJsonPath)) {
        try {
            const entryJson = JSON.parse(fs.readFileSync(entryJsonPath, 'utf8'));
            if (entryJson.resource && entryJson.resource.includes('[id].tsx')) {
                console.log(`Found resource in subdir ${subdir}: ${entryJson.resource}`);
                // List all files in this directory
                const files = fs.readdirSync(dirPath).filter(f => f !== 'entries.json');
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stat = fs.statSync(filePath);
                    matches.push({
                        subdir,
                        file,
                        path: filePath,
                        time: stat.mtime,
                        size: stat.size
                    });
                }
            }
        } catch (e) {
            // ignore
        }
    }
}

// Sort matches by modification time descending
matches.sort((a, b) => b.time - a.time);

console.log(`Found ${matches.length} history matches for [id].tsx:`);
matches.forEach((m, idx) => {
    console.log(`[${idx}] Time: ${m.time}, Size: ${m.size} bytes, Path: ${m.path}`);
});

// Copy the newest match to the scratch directory
if (matches.length > 0) {
    const bestMatch = matches[0];
    const dest = 'C:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\scratch\\recovered_id.tsx';
    fs.copyFileSync(bestMatch.path, dest);
    console.log(`Successfully recovered newest history file to ${dest}`);
}
