const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'client/src/pages'),
  path.join(__dirname, 'client/src/components')
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Replace "#030108" string literal, considering potential quotes around it depending on usage.
      // E.g. background: "#030108" -> background: "var(--theme-bg-main)"
      content = content.replace(/#030108/g, 'var(--theme-bg-main)');

      // Replace rgba(255,255,255
      content = content.replace(/rgba\(255,\s*255,\s*255,/g, 'rgba(var(--theme-white),');

      // Replace rgba(0,0,0
      content = content.replace(/rgba\(0,\s*0,\s*0,/g, 'rgba(var(--theme-black),');

      // Replace specific dark nav gradients
      content = content.replace(/rgba\(10,\s*6,\s*24,\s*0.95\)/g, 'var(--theme-bg-nav)');
      content = content.replace(/rgba\(5,\s*2,\s*8,\s*0.98\)/g, 'var(--theme-bg-nav-dark)');

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Processed: ${fullPath}`);
    }
  }
}

for (const d of directories) {
  if (fs.existsSync(d)) {
    processDirectory(d);
  }
}

console.log('Done replacement.');
