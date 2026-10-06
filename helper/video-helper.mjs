import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const target = path.join(__dirname, '..', 'web', 'helper', 'video-helper.mjs');

await import(pathToFileURL(target).href);
