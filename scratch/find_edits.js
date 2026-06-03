const fs = require('fs');

const logPath = 'C:\\Users\\nilo\\.gemini\\antigravity\\brain\\52e83c45-9391-4e9d-acce-9eb20fb40e25\\.system_generated\\logs\\transcript.jsonl';

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const matches = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
                const argsStr = typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args);
                if (argsStr && argsStr.includes('[id].tsx')) {
                    matches.push({
                        step: obj.step_index,
                        created_at: obj.created_at,
                        tool: tc.name,
                        args: tc.args
                    });
                }
            }
        }
    } catch (e) {
        // ignore
    }
}

console.log(`Found ${matches.length} matches:`);
matches.forEach((m, idx) => {
    console.log(`[${idx}] Step: ${m.step}, Tool: ${m.tool}`);
});
