const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\nilo\\.gemini\\antigravity\\brain\\52e83c45-9391-4e9d-acce-9eb20fb40e25\\.system_generated\\logs\\transcript.jsonl';
const outputDir = 'C:\\Users\\nilo\\Documents\\Projetos\\VisualSoundDesign\\scratch';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

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
console.log(`Extracting ${relevantEdits.length} edits...`);

relevantEdits.forEach((edit) => {
    const step = edit.step;
    console.log(`Saving step ${step}...`);
    
    if (edit.tool === 'replace_file_content') {
        const targetPath = path.join(outputDir, `step_${step}_target.txt`);
        const replacementPath = path.join(outputDir, `step_${step}_replacement.txt`);
        
        fs.writeFileSync(targetPath, edit.args.TargetContent || '', 'utf8');
        fs.writeFileSync(replacementPath, edit.args.ReplacementContent || '', 'utf8');
    } else {
        const chunks = typeof edit.args.ReplacementChunks === 'string' 
            ? JSON.parse(edit.args.ReplacementChunks) 
            : edit.args.ReplacementChunks;
        chunks.forEach((c, cidx) => {
            const targetPath = path.join(outputDir, `step_${step}_chunk_${cidx}_target.txt`);
            const replacementPath = path.join(outputDir, `step_${step}_chunk_${cidx}_replacement.txt`);
            
            fs.writeFileSync(targetPath, c.TargetContent || '', 'utf8');
            fs.writeFileSync(replacementPath, c.ReplacementContent || '', 'utf8');
        });
    }
});

console.log('All files saved successfully!');
