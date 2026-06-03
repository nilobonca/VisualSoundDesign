const fs = require('fs');

const logPath = 'C:\\Users\\nilo\\.gemini\\antigravity\\brain\\52e83c45-9391-4e9d-acce-9eb20fb40e25\\.system_generated\\logs\\transcript.jsonl';
const targetFilePath = 'c:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\src\\pages\\project\\[id].tsx';

const logContent = fs.readFileSync(logPath, 'utf8');
const lines = logContent.split('\n');

const edits = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
                if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
                    const args = typeof tc.args === 'string' ? JSON.parse(tc.args) : tc.args;
                    if (args && args.TargetFile && args.TargetFile.includes('[id].tsx')) {
                        edits.push({
                            step: obj.step_index,
                            tool: tc.name,
                            args: args
                        });
                    }
                }
            }
        }
    } catch (e) {
        // ignore
    }
}

// Sort edits by step_index ascending
edits.sort((a, b) => a.step - b.step);

// Filter edits to only those from step 95 onwards
const relevantEdits = edits.filter(e => e.step >= 95);
console.log(`Loaded ${relevantEdits.length} relevant edits (step >= 95) to apply.`);

let fileContent = fs.readFileSync(targetFilePath, 'utf8');

function cleanJsonString(str) {
    return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
        if (match === '\n') return '\\n';
        if (match === '\r') return '\\r';
        if (match === '\t') return '\\t';
        return '';
    });
}

function parseReplacementChunks(chunksVal) {
    if (typeof chunksVal === 'object') return chunksVal;
    try {
        return JSON.parse(chunksVal);
    } catch (e) {
        try {
            const cleaned = cleanJsonString(chunksVal);
            return JSON.parse(cleaned);
        } catch (e2) {
            return Function(`return (${chunksVal})`)();
        }
    }
}

for (const edit of relevantEdits) {
    console.log(`Applying step ${edit.step} using ${edit.tool}...`);
    if (edit.tool === 'replace_file_content') {
        const { TargetContent, ReplacementContent } = edit.args;
        if (!fileContent.includes(TargetContent)) {
            console.warn(`WARNING: TargetContent for step ${edit.step} not found in file!`);
            console.warn(`TargetContent snippet: ${TargetContent.substring(0, 100)}...`);
            continue;
        }
        fileContent = fileContent.replace(TargetContent, ReplacementContent);
    } else if (edit.tool === 'multi_replace_file_content') {
        const chunks = parseReplacementChunks(edit.args.ReplacementChunks);
        for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
            const chunk = chunks[chunkIdx];
            const { TargetContent, ReplacementContent } = chunk;
            if (!fileContent.includes(TargetContent)) {
                console.warn(`WARNING: Chunk ${chunkIdx} for step ${edit.step} not found in file!`);
                console.warn(`TargetContent snippet: ${TargetContent.substring(0, 100)}...`);
                continue;
            }
            fileContent = fileContent.replace(TargetContent, ReplacementContent);
        }
    }
}

fs.writeFileSync(targetFilePath, fileContent, 'utf8');
console.log('Done replaying all edits!');
