// Element-level screenshot tool: node zoom.mjs <path> <selector> <out.png> [width]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const outDir = join(dirname(fileURLToPath(import.meta.url)), 'shots', 'zoom');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(root, normalize(path));
    if (path.endsWith('/') || !extname(file)) file = join(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(4893, r));

const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
let exe;
for (const p of CHROME) { try { await readFile(p); exe = p; break; } catch {} }

const [path, selector, out, width = '1440'] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: parseInt(width, 10), height: 900 });
await page.goto(`http://localhost:4893${path}`, { waitUntil: 'networkidle0', timeout: 45000 });
const el = await page.$(selector);
if (!el) { console.error('selector not found'); process.exit(1); }
await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
await new Promise((r) => setTimeout(r, 800));
await mkdir(outDir, { recursive: true });
await el.screenshot({ path: join(outDir, out) });
console.log(`zoom -> shots/zoom/${out}`);
await browser.close();
server.close();
