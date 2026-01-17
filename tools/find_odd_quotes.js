const fs = require('fs');
const path = process.argv[2];
if (!path) { console.error('Usage: node find_odd_quotes.js <file>'); process.exit(2); }
const s = fs.readFileSync(path,'utf8');
const lines = s.split(/\r?\n/);
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  const count = (line.match(/"/g) || []).length;
  if (count % 2 !== 0) console.log(`${i+1}: odd double-quote count ${count} -> ${line}`);
}
