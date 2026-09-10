// Debug/audit harness: for each page, scroll through (instant), wait for
// images to settle, then report broken images + section-level screenshots
// on request. Usage: node audit.mjs [/fr/ ...]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const outDir = join(dirname(fileURLToPath(import.meta.url)), 'shots', 'audit');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
};

function serve(port) {
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
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
async function findChrome() {
  const { access } = await import('node:fs/promises');
  for (const p of CHROME) { try { await access(p); return p; } catch {} }
  throw new Error('No Chrome/Edge found');
}

const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/fr/', '/fr/prestations/', '/fr/realisations/', '/fr/devis/', '/fr/a-propos/', '/fr/contact/', '/en/'];

const server = await serve(4892);
const browser = await puppeteer.launch({
  executablePath: await findChrome(),
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1'],
});
await mkdir(outDir, { recursive: true });

let failures = 0;
for (const path of PAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://localhost:4892${path}`, { waitUntil: 'networkidle0', timeout: 45000 });
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  // wait until every <img> is loaded and decoded, cap 12s
  await page.evaluate(async () => {
    const imgs = [...document.images];
    await Promise.race([
      Promise.all(imgs.map(async (i) => {
        if (!i.complete) await new Promise((r) => { i.onload = i.onerror = r; });
        try { await i.decode(); } catch {}
      })),
      new Promise((r) => setTimeout(r, 12000)),
    ]);
  });
  const report = await page.evaluate(() => {
    const broken = [...document.images]
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src);
    const hidden = [...document.querySelectorAll('[data-reveal]:not(.is-in)')]
      .map((el) => el.className.split(' ')[0] || el.tagName);
    return { broken, hiddenReveals: hidden.slice(0, 12), hiddenCount: hidden.length };
  });
  const errs = [];
  if (report.broken.length) errs.push(`broken imgs: ${report.broken.join(' | ')}`);
  if (report.hiddenCount) errs.push(`unrevealed x${report.hiddenCount}: ${report.hiddenReveals.join(', ')}`);
  console.log(`${path} ${errs.length ? 'FAIL ' + errs.join(' ;; ') : 'OK'}`);
  if (errs.length) failures++;
  await page.close();
}
await browser.close();
server.close();
console.log(failures ? `${failures} page(s) with issues` : 'all clean');
process.exit(failures ? 1 : 0);
