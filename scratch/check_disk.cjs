const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const uploadsEnv = process.env.UPLOADS_DIR;
const siblingDir = path.resolve(cwd, '..', 'uploads');
const localDir = path.resolve(cwd, 'public', 'uploads');

console.log('cwd:', cwd);
console.log('process.env.UPLOADS_DIR:', uploadsEnv);
console.log('siblingDir:', siblingDir, 'exists:', fs.existsSync(siblingDir));
console.log('localDir:', localDir, 'exists:', fs.existsSync(localDir));

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  function rec(d) {
    const list = fs.readdirSync(d, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(d, item.name);
      if (item.isDirectory()) rec(full);
      else results.push(full);
    }
  }
  rec(dir);
  return results;
}

if (fs.existsSync(siblingDir)) {
  const files = scanDir(siblingDir);
  console.log('Sibling uploads files count:', files.length);
  if (files.length > 0) console.log('Sample sibling files:', files.slice(0, 10));
}

if (fs.existsSync(localDir)) {
  const files = scanDir(localDir);
  console.log('Public uploads files count:', files.length);
  if (files.length > 0) console.log('Sample public files:', files.slice(0, 10));
}
