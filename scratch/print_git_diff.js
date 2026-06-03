const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\nilo\\.gemini\\antigravity\\brain\\52e83c45-9391-4e9d-acce-9eb20fb40e25\\.system_generated\\logs\\transcript.jsonl';

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.step_index === 1228 || obj.step_index === 1229 || obj.step_index === 1230) {
            console.log(`\nFound step ${obj.step_index}! Source: ${obj.source}, Type: ${obj.type}, Status: ${obj.status}`);
            console.log('Keys:', Object.keys(obj));
            if (obj.content && obj.content.length > 0) {
                console.log(`Content length: ${obj.content.length}`);
                fs.writeFileSync(`C:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\scratch\\step_${obj.step_index}_content.txt`, obj.content, 'utf8');
                console.log(`Saved content to step_${obj.step_index}_content.txt`);
            }
        }
    } catch (e) {
        // ignore
    }
}
