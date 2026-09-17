// AM Construction — static site generator
// Renders src/content.js through src/pages.js + src/template.js
// into dist/fr/... with clean-URL index.html files.

import { mkdir, writeFile, readFile, copyFile, cp, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { LANGS, content } from './src/content.js';
import { renderPage } from './src/pages.js';
import { shell } from './src/template.js';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');

// Load .env if it exists (for Supabase keys injection at build time)
const envPath = join(root, '.env');
const env = {};
if (existsSync(envPath)) {
  const raw = await readFile(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m) env[m[1]] = m[2];
  }
}
const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';

// A site built without its database settings still looked like it worked: the
// quote form showed a confirmation and a reference number, and saved nothing.
// Stop the build instead, so the mistake is caught at deploy time rather than by
// a customer whose request vanished. ALLOW_OFFLINE_BUILD=1 is only for previewing
// the design on a machine that has no keys.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (process.env.ALLOW_OFFLINE_BUILD === '1') {
    console.warn('\n  ALLOW_OFFLINE_BUILD=1: building without Supabase. The quote form will refuse to send.\n');
  } else {
    console.error('\n  Build stopped: SUPABASE_URL and SUPABASE_ANON_KEY are required.');
    console.error('  Without them every quote request would be lost silently.');
    console.error('  Set them in .env locally or in the Vercel project settings.\n');
    process.exit(1);
  }
}

// Public address of the site. One place to change when the custom domain arrives.
const SITE_URL = (process.env.SITE_URL || env.SITE_URL || 'https://amconstruction.vercel.app').replace(/\/+$/, '');

// The Supabase browser library is served from this site, pinned by package-lock,
// rather than pulled from a CDN at a floating version: it runs on the page where
// customers type their personal details.
// The version is part of the file name, so the file can be cached forever and a
// library upgrade still reaches every visitor.
const SUPABASE_JS_DIR = join(root, 'node_modules', '@supabase', 'supabase-js');
const SUPABASE_JS_VERSION = JSON.parse(await readFile(join(SUPABASE_JS_DIR, 'package.json'), 'utf8')).version;
const SUPABASE_JS_PATH = `/assets/vendor/supabase-${SUPABASE_JS_VERSION}.js`;

export const PAGES = [
  { key: 'home',  slug: { fr: '' } },
  { key: 'devis', slug: { fr: 'devis' } },
];

export function urlFor(lang, key) {
  const page = PAGES.find((p) => p.key === key);
  const slug = page.slug[lang];
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
}

// Every rendered page goes through here, including the 404, which also carries
// the quote form. It used to skip this step, so its form had no database settings.
function finalize(html) {
  return html
    .replace(/__SUPABASE_URL__/g, SUPABASE_URL)
    .replace(/__SUPABASE_ANON_KEY__/g, SUPABASE_ANON_KEY)
    .replace(/__SUPABASE_JS__/g, SUPABASE_JS_PATH)
    .replace(/__SITE_URL__/g, SITE_URL);
}

async function build() {
  await rm(dist, { recursive: true, force: true });
  let count = 0;

  for (const lang of LANGS) {
    const t = content[lang];
    for (const page of PAGES) {
      const ctx = { lang, t, page: page.key, url: (key) => urlFor(lang, key) };
      const html = finalize(renderPage(page.key, ctx));
      const outDir = page.slug[lang] ? join(dist, lang, page.slug[lang]) : join(dist, lang);
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, 'index.html'), html, 'utf8');
      count++;
    }
  }

  // Assets
  await mkdir(join(dist, 'assets'), { recursive: true });
  await copyFile(join(root, 'src', 'styles.css'), join(dist, 'assets', 'styles.css'));
  await copyFile(join(root, 'src', 'main.js'), join(dist, 'assets', 'main.js'));
  await mkdir(join(dist, 'assets', 'vendor'), { recursive: true });
  await copyFile(join(SUPABASE_JS_DIR, 'dist', 'umd', 'supabase.js'), join(dist, SUPABASE_JS_PATH));

  // Media (frame sequence cut from the source orbit), nested dirs included
  await cp(join(root, 'src', 'media'), join(dist, 'assets', 'media'), { recursive: true });

  // Public assets served at the site root (frame sequences for the hero, etc.)
  await cp(join(root, 'public'), dist, { recursive: true });

  // Not found. A real 404 rather than the homepage with a 200: answering "found
  // it" for an address that does not exist lets search engines index invented
  // URLs, and it hides mistakes - a missing file looks like a working page.
  const ctx404 = {
    lang: 'fr',
    t: content.fr,
    page: 'home',
    url: (key) => urlFor('fr', key),
  };
  const notFound = shell(ctx404, {
    title: 'Page introuvable · AM Construction',
    desc: 'Cette page n’existe pas ou a été déplacée.',
    bodyClass: 'page-404',
    // Reachable directly as /404.html with a 200: kept out of Google so it is
    // never taken for a copy of the home page.
    headExtra: '<meta name="robots" content="noindex">',
    main: `
<section class="section notfound">
  <div class="wrap">
    <p class="label">Erreur 404</p>
    <h1 class="h2 notfound__title">Cette page n’existe pas.</h1>
    <p class="notfound__text">Le lien est peut-être ancien, ou l’adresse comporte une erreur.</p>
    <div class="notfound__actions">
      <a class="btn btn--lg btn--plein" href="${urlFor('fr', 'home')}">Retour à l’accueil</a>
      <a class="btn btn--lg" href="${urlFor('fr', 'devis')}">Demander votre devis</a>
    </div>
  </div>
</section>`,
  });
  await writeFile(join(dist, '404.html'), finalize(notFound), 'utf8');

  // Search engines: what may be indexed, and where the pages are.
  const pageUrls = LANGS.flatMap((lang) => PAGES.map((page) => `${SITE_URL}${urlFor(lang, page.key)}`));
  await writeFile(
    join(dist, 'robots.txt'),
    `User-agent: *
Disallow: /admin
Disallow: /api

Sitemap: ${SITE_URL}/sitemap.xml
`,
    'utf8',
  );
  await writeFile(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pageUrls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`,
    'utf8',
  );

  // Root redirect to /fr/
  await writeFile(
    join(dist, 'index.html'),
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/fr/"><link rel="canonical" href="/fr/"><title>AM Construction</title></head><body><a href="/fr/">AM Construction</a></body></html>`,
    'utf8'
  );

  console.log(`Built ${count} pages + assets into dist/`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
