#!/usr/bin/env node
/**
 * Patch jscl.js to add WebWorker support.
 *
 * The npm jscl@0.8.2 package only exports to `window` or `module.exports`,
 * but WebWorkers have neither. The upstream GitHub master branch has a fix
 * that exports to `self`, but it hasn't been released to npm yet.
 *
 * This script patches the copied jscl.js to use `self` instead of `window`,
 * which works in both browsers (where self === window) and WebWorkers.
 */

const fs = require('fs');
const path = require('path');

const jsclPath = path.resolve(
  __dirname,
  '../../../jupyterlite_jscl_kernel/labextension/static/jscl.js'
);

console.log('Patching jscl.js for WebWorker support...');

let content = fs.readFileSync(jsclPath, 'utf8');

// Replace the window-only export with self (works in both browser and WebWorker)
const oldExport = `if (typeof module !== 'undefined')
  module.exports = jscl;
else if (typeof window !== 'undefined')
  window.jscl = jscl;`;

const newExport = `if (typeof module !== 'undefined')
  module.exports = jscl;
else if (typeof self !== 'undefined')
  self.jscl = jscl;`;

if (content.includes(oldExport)) {
  content = content.replace(oldExport, newExport);
  fs.writeFileSync(jsclPath, content);
  console.log('Successfully patched jscl.js for WebWorker support.');
} else if (content.includes(newExport)) {
  console.log('jscl.js already has WebWorker support.');
} else {
  console.error('ERROR: Could not find expected export pattern in jscl.js');
  console.error(
    'The jscl package may have been updated. Please check the export code manually.'
  );
  process.exit(1);
}
