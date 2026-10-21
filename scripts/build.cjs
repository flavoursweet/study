'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
for (const file of ['index.html', 'style.css', 'app.js']) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
console.log('Built independent study site in dist/');
