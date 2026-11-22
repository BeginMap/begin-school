// Use the Chromium that is already installed on this machine (do not download another one).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
function find() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (!fs.existsSync(root)) return undefined;
  const dirs = fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const d of dirs) {
    const exe = path.join(root, d, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}
export const executablePath = find();
export function launch(opts = {}) {
  return chromium.launch({ executablePath, headless: true, ...opts });
}
