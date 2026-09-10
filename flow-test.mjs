// End-to-end functional test of the devis flow + key interactions.
// Usage: node flow-test.mjs
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const outDir = join(dirname(fileURLToPath(import.meta.url)), 'shots', 'flow');
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
await new Promise((r) => server.listen(4895, r));

const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
let exe;
for (const p of CHROME) { try { await readFile(p); exe = p; break; } catch {} }

const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] });
await mkdir(outDir, { recursive: true });

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  ok ? pass++ : fail++;
};

/* ---------- devis flow (FR) ---------- */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4895/fr/devis/', { waitUntil: 'networkidle0' });

  const stepVisible = (n) => page.evaluate((i) => {
    const fs = document.querySelector(`[data-step="${i}"]`);
    return fs && !fs.hidden;
  }, n);

  // 1. next without type -> error shown, stays on step 0
  await page.click('[data-next]');
  await new Promise((r) => setTimeout(r, 200));
  const errShown = await page.evaluate(() => {
    const e = document.querySelector('[data-error-for="type"]');
    return e && !e.hidden && e.textContent.length > 3;
  });
  check('devis: type required error', errShown && (await stepVisible(0)));

  // 2. pick "Rénovation" -> estimate appears with a range
  await page.click('[data-type-card="renovation"]');
  await new Promise((r) => setTimeout(r, 200));
  const est = await page.evaluate(() => document.querySelector('[data-estimate-body]').textContent);
  check('devis: estimate appears after type', /\d/.test(est) && est.includes('€'), est.replace(/\s+/g, ' ').slice(0, 90));

  // 3. step 2: pick ampleur=full + energy, surface stays 100
  await page.click('[data-next]');
  await new Promise((r) => setTimeout(r, 300));
  check('devis: reached step 2', await stepVisible(1));
  const perTypeVisible = await page.evaluate(() => {
    const box = document.querySelector('[data-type-options="renovation"]');
    return box && !box.hidden;
  });
  check('devis: per-type options shown', perTypeVisible);
  // Click via the label wrapper, matching real user interaction (the input is
   // visually hidden and only reachable through the label).
  const setRadio = (sel) => page.evaluate((s) => {
    const el = document.querySelector(s);
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, sel);
  await setRadio('[data-type-options="renovation"] input[value="full"]');
  await setRadio('[data-type-options="renovation"] input[name="energy"]');
  await new Promise((r) => setTimeout(r, 200));
  const est2 = await page.evaluate(() => document.querySelector('[data-estimate-body]').textContent);
  // \s covers the narrow no-break space (U+202F) that Intl uses for fr-FR groups
  check('devis: full renovation reprices', /1[0-9]{2}[\s.]?[0-9]{3}/.test(est2.replace(/,/g, ' ')), est2.replace(/\s+/g, ' ').slice(0, 120));

  // 4. step 3: bracket jaune -> aids panel computed
  await page.click('[data-next]');
  await new Promise((r) => setTimeout(r, 300));
  check('devis: reached step 3', await stepVisible(2));
  await setRadio('input[name="bracket"][value="jaune"]');
  await new Promise((r) => setTimeout(r, 200));
  const aids = await page.evaluate(() => document.querySelector('[data-aids-panel]').textContent);
  check('devis: aids computed (MPR + CEE + TVA)', aids.includes('MaPrimeRénov') && aids.includes('CEE'), aids.replace(/\s+/g, ' ').slice(0, 140));

  // 5. step 4: invalid then valid coordinates
  await page.click('[data-next]');
  await new Promise((r) => setTimeout(r, 300));
  check('devis: reached step 4', await stepVisible(3));
  await page.click('[data-next]'); // empty -> errors
  await new Promise((r) => setTimeout(r, 200));
  const coordErrs = await page.evaluate(() =>
    [...document.querySelectorAll('.field-error')].filter((e) => !e.hidden && e.textContent.trim()).length
  );
  check('devis: coordinate validation errors', coordErrs >= 4, `${coordErrs} errors`);
  await page.type('#d-name', 'Claire Martin');
  await page.type('#d-email', 'claire@exemple.fr');
  await page.type('#d-phone', '0612345678');
  await page.type('#d-zip', '91150');
  await setRadio('input[name="consent"]');
  await page.click('[data-next]');
  await new Promise((r) => setTimeout(r, 300));
  check('devis: reached step 5', await stepVisible(4));

  // 6. step 5: day + slot generated, submit -> confirmation
  const dayCount = await page.evaluate(() => document.querySelectorAll('[data-days] .chip').length);
  check('devis: 5 callback days generated', dayCount === 5, `${dayCount}`);
  await setRadio('[data-days] .chip input');
  await setRadio('input[name="slot"]');
  await page.click('[data-submit]');
  await new Promise((r) => setTimeout(r, 1200));
  const confirm = await page.evaluate(() => {
    const box = document.querySelector('[data-confirm]');
    const ref = document.querySelector('[data-confirm-ref]').textContent;
    const recap = document.querySelector('[data-confirm-recap]').textContent;
    return { visible: box && !box.hidden, ref, recap };
  });
  check('devis: confirmation + reference', confirm.visible && /^D-\d{4}-\d{4}$/.test(confirm.ref), confirm.ref);
  check('devis: recap contains project + contact', confirm.recap.includes('Rénovation') && confirm.recap.includes('Claire Martin'));

  await page.screenshot({ path: join(outDir, 'devis-confirmation.png'), fullPage: true });

  // 7. reset flow
  await page.click('[data-confirm-reset]');
  await new Promise((r) => setTimeout(r, 300));
  check('devis: reset returns to step 1', await stepVisible(0));
  await page.close();
}

/* ---------- devis flow (EN smoke) ---------- */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4895/en/quote/', { waitUntil: 'networkidle0' });
  await page.click('[data-type-card="construction"]');
  await new Promise((r) => setTimeout(r, 200));
  const est = await page.evaluate(() => document.querySelector('[data-estimate-body]').textContent);
  check('en: estimate in English', est.includes('Project') && est.includes('New home'), est.replace(/\s+/g, ' ').slice(0, 110));
  await page.close();
}

/* ---------- réalisations filters ---------- */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4895/fr/realisations/', { waitUntil: 'networkidle0' });
  await page.click('[data-filter="extension"]');
  await new Promise((r) => setTimeout(r, 300));
  const counts = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[data-project]')];
    return { total: all.length, hidden: all.filter((p) => p.classList.contains('is-hidden')).length,
             visibleCats: all.filter((p) => !p.classList.contains('is-hidden')).map((p) => p.dataset.cat) };
  });
  check('filters: only extension visible', counts.visibleCats.length > 0 && counts.visibleCats.every((c) => c === 'extension'), JSON.stringify(counts));
  await page.click('[data-filter="all"]');
  await new Promise((r) => setTimeout(r, 200));
  const shown = await page.evaluate(() => [...document.querySelectorAll('[data-project]')].filter((p) => !p.classList.contains('is-hidden')).length);
  check('filters: reset shows all', shown === 7, `${shown}/7`);
  await page.close();
}

/* ---------- mobile nav ---------- */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:4895/fr/', { waitUntil: 'networkidle0' });
  await page.click('[data-nav-toggle]');
  await new Promise((r) => setTimeout(r, 300));
  const navOpen = await page.evaluate(() => {
    const panel = document.querySelector('[data-mobile-nav]');
    const toggle = document.querySelector('[data-nav-toggle]');
    return !panel.hidden && toggle.getAttribute('aria-expanded') === 'true';
  });
  check('mobile nav opens', navOpen);
  await page.screenshot({ path: join(outDir, 'mobile-nav.png') });
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 200));
  const navClosed = await page.evaluate(() => document.querySelector('[data-mobile-nav]').hidden);
  check('mobile nav closes on Escape', navClosed);
  await page.close();
}

/* ---------- before/after slider ---------- */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4895/fr/realisations/', { waitUntil: 'networkidle0' });
  const pos = await page.evaluate(() => {
    const ba = document.querySelector('[data-ba]');
    const range = ba.querySelector('.ba__range');
    range.value = 80;
    range.dispatchEvent(new Event('input', { bubbles: true }));
    return ba.style.getPropertyValue('--pos');
  });
  check('ba slider updates --pos', pos.trim() === '80%', pos);

  // The event-dispatch check above passes even when the control is unreachable,
  // so hit-test the pixels a user actually drags.
  const hit = await page.evaluate(() => {
    const ba = document.querySelector('[data-ba]');
    ba.scrollIntoView({ block: 'center', behavior: 'instant' });
    const frame = ba.querySelector('.ba__frame').getBoundingClientRect();
    const grip = ba.querySelector('.ba__grip').getBoundingClientRect();
    const tag = (x, y) => (document.elementFromPoint(x, y) || {}).className || 'none';
    return {
      centre: tag(frame.x + frame.width / 2, frame.y + frame.height / 2),
      grip: tag(grip.x + grip.width / 2, grip.y + grip.height / 2),
    };
  });
  check('ba slider draggable at the grip', hit.grip.includes('ba__range'), `grip hit: ${hit.grip}`);
  check('ba slider draggable at frame centre', hit.centre.includes('ba__range'), `centre hit: ${hit.centre}`);
  await page.close();
}

/* ---------- no uncaught errors on any page ---------- */
{
  const paths = ['/fr/', '/fr/prestations/', '/fr/realisations/', '/fr/devis/', '/fr/a-propos/', '/fr/contact/', '/en/', '/en/quote/'];
  for (const path of paths) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:4895${path}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
    check(`no uncaught error on ${path}`, errors.length === 0, errors.join(' | '));
    await page.close();
  }
}

/* ---------- mobile action bar ---------- */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:4895/fr/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  const hiddenAtTop = await page.evaluate(() => !document.querySelector('[data-action-bar]').classList.contains('is-in'));
  check('action bar hidden over the hero', hiddenAtTop);
  await page.evaluate(() => window.scrollTo({ top: 2500, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 400));
  const shown = await page.evaluate(() => {
    const bar = document.querySelector('[data-action-bar]');
    const r = bar.getBoundingClientRect();
    return { isIn: bar.classList.contains('is-in'), onScreen: r.bottom <= window.innerHeight + 1 && r.top < window.innerHeight };
  });
  check('action bar appears after the fold', shown.isIn && shown.onScreen, JSON.stringify(shown));
  await page.close();
}

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
