// DESTPEC Bâtiment — static site generator
// Renders src/content.js through src/pages.js + src/template.js
// into dist/{fr,en}/... with clean-URL index.html files.

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
const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '__SUPABASE_ANON_KEY__';

export const PAGES = [
  { key: 'home',  slug: { fr: '' } },
  { key: 'devis', slug: { fr: 'devis' } },
];

export function urlFor(lang, key) {
  const page = PAGES.find((p) => p.key === key);
  const slug = page.slug[lang];
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
}

async function build() {
  await rm(dist, { recursive: true, force: true });
  let count = 0;

  for (const lang of LANGS) {
    const t = content[lang];
    for (const page of PAGES) {
      const ctx = { lang, t, page: page.key, url: (key) => urlFor(lang, key) };
      let html = renderPage(page.key, ctx);
      html = html.replace(/__SUPABASE_URL__/g, SUPABASE_URL);
      html = html.replace(/__SUPABASE_ANON_KEY__/g, SUPABASE_ANON_KEY);
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
  await writeFile(join(dist, '404.html'), notFound, 'utf8');

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
