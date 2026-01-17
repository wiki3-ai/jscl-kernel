#!/usr/bin/env node
/**
 * Script to copy the built extension files to the Python package location
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'packages', 'jscl-kernel-extension');
const targetDir = path.join(__dirname, '..', 'jupyterlite_jscl_kernel', 'labextension');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Ensure static directory exists
const staticDir = path.join(targetDir, 'static');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

// Copy directories
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(child => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy lib directory
copyRecursive(path.join(sourceDir, 'lib'), path.join(targetDir, 'lib'));

// Copy style directory
copyRecursive(path.join(sourceDir, 'style'), path.join(targetDir, 'style'));

// Copy package.json
fs.copyFileSync(
  path.join(sourceDir, 'package.json'),
  path.join(targetDir, 'package.json')
);

// Copy style/index.js to static/style.js for the build target
fs.copyFileSync(
  path.join(sourceDir, 'style', 'index.js'),
  path.join(staticDir, 'style.js')
);

console.log('Extension files copied successfully!');
