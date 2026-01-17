#!/usr/bin/env node
/**
 * Add jupyterlab_extracted_files to package.json
 * This is needed for JupyterLab extension validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagePath = path.join(__dirname, '..', 'jupyterlite_jscl_kernel', 'labextension', 'package.json');
const labextensionDir = path.dirname(packagePath);

// Read package.json
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Collect all files recursively
function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (item.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

// Get all files
const allFiles = getAllFiles(labextensionDir);

// Add to package.json
packageData.jupyterlab_extracted_files = allFiles.sort();

// Write back
fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');

console.log(`Added ${allFiles.length} files to jupyterlab_extracted_files in package.json`);
