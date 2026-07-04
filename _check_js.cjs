const fs = require('fs');
const html = fs.readFileSync('c:/Users/30466/Documents/trae_projects/旅游/index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.indexOf('</script>', scriptStart);
const js = html.substring(scriptStart, scriptEnd);

// Check backtick balance
const backticks = (js.match(/`/g) || []).length;
console.log('Backticks:', backticks, 'Balanced:', backticks % 2 === 0);

// Check template literal spans
const jsLines = js.split('\n');
console.log('JS lines:', jsLines.length);

let inTemplate = false;
let templateStart = 0;
for (let i = 0; i < jsLines.length; i++) {
  const line = jsLines[i];
  const tks = (line.match(/`/g) || []).length;
  if (!inTemplate && tks % 2 === 1) {
    inTemplate = true;
    templateStart = i + 1;
  } else if (inTemplate) {
    if (tks % 2 === 1) {
      inTemplate = false;
    }
  }
}
if (inTemplate) {
  console.log('UNCLOSED TEMPLATE LITERAL starting at JS line', templateStart);
  // Show the line
  console.log('Line content:', jsLines[templateStart - 1].substring(0, 200));
}

// Try to find the exact error location
try {
  new Function(js);
  console.log('JS syntax OK');
} catch(e) {
  console.log('Error:', e.message);
  
  // Try binary search to find the error
  let low = 0, high = jsLines.length;
  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);
    try {
      new Function(jsLines.slice(0, mid).join('\n'));
      low = mid;
    } catch(err) {
      high = mid;
    }
  }
  console.log('Error near JS line', high);
  console.log('Line', high, ':', jsLines[high - 1] ? jsLines[high - 1].substring(0, 300) : 'N/A');
  if (high > 1) console.log('Line', high - 1, ':', jsLines[high - 2] ? jsLines[high - 2].substring(0, 300) : 'N/A');
}