const fs = require('fs');

const logPath = 'C:\\Users\\nilo\\.gemini\\antigravity\\brain\\52e83c45-9391-4e9d-acce-9eb20fb40e25\\.system_generated\\logs\\transcript.jsonl';

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

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

edits.sort((a, b) => a.step - b.step);

const relevantEdits = edits.filter(e => e.step >= 1036);
console.log(`Found ${relevantEdits.length} relevant edits from step 1036 onwards:\n`);

// Only print the first 6 matches (0 to 5)
relevantEdits.slice(0, 6).forEach((edit, idx) => {
    console.log(`=========================================`);
    console.log(`[${idx}] Step: ${edit.step}, Tool: ${edit.tool}`);
    console.log(`Description: ${edit.args.Description || edit.args.Instruction}`);
    console.log(`=========================================`);
    
    if (edit.tool === 'replace_file_content') {
        console.log(`--- TARGET CONTENT ---`);
        console.log(edit.args.TargetContent);
        console.log(`--- REPLACEMENT CONTENT ---`);
        console.log(edit.args.ReplacementContent);
    } else {
        const chunks = typeof edit.args.ReplacementChunks === 'string' 
            ? JSON.parse(edit.args.ReplacementChunks) 
            : edit.args.ReplacementChunks;
        chunks.forEach((c, cidx) => {
            console.log(`--- Chunk [${cidx}] Target ---`);
            console.log(c.TargetContent);
            console.log(`--- Chunk [${cidx}] Replacement ---`);
            console.log(c.ReplacementContent);
        });
    }
    console.log('\n');
});
