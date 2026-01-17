const fs = require('fs');
const path = process.argv[2];
if (!path) { console.error('Usage: node bracket_check.js <file>'); process.exit(2); }
const s = fs.readFileSync(path,'utf8');
let stack = [];
let line = 1, col = 0;
let inSingle = false, inDouble = false, inBack = false, inLineComment = false, inBlockComment = false;
let singleStart = null, doubleStart = null, backStart = null;
for (let i=0;i<s.length;i++){
  const ch = s[i];
  const next = s[i+1];
  if (ch === '\n') { line++; col=0; inLineComment=false; }
  else col++;

  if (inLineComment) continue;
  if (inBlockComment) {
    if (ch==='*' && next === '/') { inBlockComment=false; i++; col++; }
    continue;
  }
  if (!inSingle && !inDouble && !inBack) {
    if (ch === '/' && next === '/') { inLineComment = true; i++; col++; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; i++; col++; continue; }
  }
  if (ch === "'" && !inDouble && !inBack) { inSingle = !inSingle; if (inSingle) singleStart = {line,col}; else singleStart = null; continue; }
  if (ch === '"' && !inSingle && !inBack) { inDouble = !inDouble; if (inDouble) doubleStart = {line,col}; else doubleStart = null; continue; }
  if (ch === '`' && !inSingle && !inDouble) { inBack = !inBack; if (inBack) backStart = {line,col}; else backStart = null; continue; }
  if (inSingle || inDouble || inBack) continue;

  if (ch === '{' || ch === '(' || ch === '[') stack.push({ch, line, col});
  else if (ch === '}' || ch === ')' || ch === ']') {
    const last = stack.pop();
    if (!last) { console.error(`Unmatched closing ${ch} at ${line}:${col}`); process.exit(3); }
    const mapping = { '}':'{', ')':'(', ']':'[' };
    if (last.ch !== mapping[ch]) { console.error(`Mismatched ${last.ch} opened at ${last.line}:${last.col} closed by ${ch} at ${line}:${col}`); process.exit(4); }
  }
}
if (inSingle || inDouble || inBack) {
  if (inSingle) console.error(`Unterminated single-quoted string started at ${singleStart.line}:${singleStart.col}`);
  if (inDouble) console.error(`Unterminated double-quoted string started at ${doubleStart.line}:${doubleStart.col}`);
  if (inBack) console.error(`Unterminated template literal started at ${backStart.line}:${backStart.col}`);
  // Print context around the start
  const all = s.split(/\r?\n/);
  const startLine = inSingle ? singleStart.line : (inDouble ? doubleStart.line : backStart.line);
  const from = Math.max(0, startLine-4);
  const to = Math.min(all.length, startLine+3);
  console.error('\nContext around start:');
  for (let i=from;i<to;i++) {
    const num = i+1;
    console.error((num===startLine? '>> ':'   ') + num + ': ' + all[i]);
  }
  process.exit(5);
}
if (inBlockComment) { console.error('Unterminated block comment'); process.exit(6); }
if (stack.length) { console.error('Unclosed brackets:', stack); process.exit(7); }
console.log('Brackets appear balanced');
