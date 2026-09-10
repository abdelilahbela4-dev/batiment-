// Tiny static server for dist/ with clean-URL support.
// /            -> /fr/ (redirect)
// /fr/prestations -> dist/fr/prestations/index.html
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const port = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.jpeg': 'image/jpeg',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/') {
      res.writeHead(302, { Location: '/fr/' });
      return res.end();
    }
    let file = join(root, normalize(path));
    if (path.endsWith('/')) file = join(file, 'index.html');
    if (!extname(file)) file = join(file, 'index.html');
    const data = await readFile(file);
    const type = MIME[extname(file)] || 'application/octet-stream';
    // Range support: browsers request video in byte ranges, and a 200 with the
    // whole file makes seeking and playback unreliable.
    const range = req.headers.range;
    if (range && extname(file) === '.mp4') {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : data.length - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${data.length}`,
        'Content-Length': end - start + 1,
        'Cache-Control': 'no-store',
      });
      return res.end(data.subarray(start, end + 1));
    }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': data.length, 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');
  }
}).listen(port, () => console.log(`Serving dist/ on http://localhost:${port}`));
