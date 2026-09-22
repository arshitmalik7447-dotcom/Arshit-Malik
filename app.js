// Tiona Assistant - Hostinger Node.js Application Entry Point
// This file serves as the default entry point for Hostinger hPanel Node.js Selector,
// which dynamically boots the bundled production server from dist/server.cjs.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distServer = path.join(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(distServer)) {
  console.error('[Hostinger Entry Point] Error: dist/server.cjs not found.');
  console.error('Please run "npm run build" first to bundle the application.');
  process.exit(1);
}

await import(`file://${distServer}`);

