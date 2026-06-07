const fs = require('fs');
const lines = fs.readFileSync('src/pages/project/[id].tsx', 'utf8').split('\n');
for (let i = 1350; i < 1420; i++) {
    console.log(i + ': ' + lines[i].trim());
}
