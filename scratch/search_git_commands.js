const fs = require('fs');

const logPath = 'C:\\Users\\nilo\\.gemini\\antigravity\\brain\\52e83c45-9391-4e9d-acce-9eb20fb40e25\\.system_generated\\logs\\transcript.jsonl';

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const gitCommands = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
                if (tc.name === 'run_command') {
                    const cmd = typeof tc.args === 'string' ? JSON.parse(tc.args).CommandLine : tc.args.CommandLine;
                    if (cmd && cmd.toLowerCase().includes('git')) {
                        gitCommands.push({
                            step: obj.step_index,
                            command: cmd
                        });
                    }
                }
            }
        }
    } catch (e) {
        // ignore
    }
}

console.log(`Found ${gitCommands.length} git commands in history:`);
gitCommands.forEach(c => console.log(`Step ${c.step}: ${c.command}`));
