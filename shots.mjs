// Screenshot harness: serves dist/ and captures every page at desktop + mobile widths.
// Usage: npm run build && node shots.mjs [url-path ...]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const outDir = join(dirname(fileURLToPath(import.meta.url)), 'shots');

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
    } catch {
      res.writeHead(404); res.end('404');
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

async function findChrome() {
  const { access } = await import('node:fs/promises');
  for (const p of CHROME_CANDIDATES) {
    try { await access(p); return p; } catch {}
  }
  throw new Error('No Chrome/Edge executable found. Set CHROME_PATH.');
}

const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/fr/', '/fr/prestations/', '/fr/realisations/', '/fr/devis/', '/fr/a-propos/', '/fr/contact/', '/en/'];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const server = await serve(4891);
const browser = await puppeteer.launch({
  executablePath: await findChrome(),
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1'],
});

await mkdir(outDir, { recursive: true });

for (const path of PAGES) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`http://localhost:4891${path}`, { waitUntil: 'networkidle0', timeout: 45000 });
    // Scroll through to trigger reveals + lazy images, then back to top.
    // behavior:'instant' is required: CSS scroll-behavior:smooth stalls
    // under headless composition and below-fold IO never fires.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    // let lazy images that entered the viewport during the pass finish
    // loading AND decoding (decode() prevents unpainted-black frames)
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
    await new Promise((r) => setTimeout(r, 400));
    const slug = path.replace(/\//g, '_').replace(/^_+|_+$/g, '') || 'home';
    const file = join(outDir, `${slug}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`shot ${file}`);
    await page.close();
  }
}

await browser.close();
server.close();
console.log('done');
