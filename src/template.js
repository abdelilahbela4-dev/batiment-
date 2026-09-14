// AM Construction — page shell: <head>, navigation, mobile menu, footer, icon set, image helpers.

// « Lumière du jour » type system:
//   Newsreader — display serif with a true italic (titles, quotes, key figures)
//   Archivo — text and interface; its expanded width sets the 12 px title-block labels
// Both are served from this site (@font-face at the top of styles.css).

const MEDIA = '/assets/media';

// Local photography, exported at 960 and 1800 px wide (src/media/realisations, src/media/atelier).
//
// WebP first, in four widths, so a phone takes the 720 px file instead of the
// 960 px JPEG it used to download (maison-bordeaux: 52 KB instead of 127 KB).
// Quality 75 was chosen by measurement: closer to the 1800 px master than the
// JPEGs it replaces. The JPEGs stay as the fallback for browsers without WebP.
// Widths above the photo's own size are not generated (maison-crepuscule is
// 1024 px), so the list stops at the natural width - it must match the files in
// src/media, produced from the -1800.jpg masters.
//
// The <picture> wrapper is display:contents (.pic in styles.css): the photo
// frames size their <img> with height:100%, which would otherwise resolve
// against the wrapper instead of the frame and change the layout.
const WEBP_WIDTHS = [720, 960, 1400, 1800];

export function pic(folder, name, { alt = '', cls = '', w, h, sizes = '100vw', eager = false } = {}) {
  const small = `${MEDIA}/${folder}/${name}-960.jpg`;
  const large = `${MEDIA}/${folder}/${name}-1800.jpg`;
  const natural = Math.min(w, 1800);
  const webpWidths = [...WEBP_WIDTHS.filter((x) => x < natural), natural];
  const webpSrcset = webpWidths.map((x) => `${MEDIA}/${folder}/${name}-${x}.webp ${x}w`).join(', ');
  const loading = eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"';
  return `<picture class="pic"><source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}"><img src="${large}" srcset="${small} 960w, ${large} ${natural}w" sizes="${sizes}" alt="${alt}"${cls ? ` class="${cls}"` : ''} width="${w}" height="${h}"${loading}></picture>`;
}

// Inline SVG icon set: 1.5px stroke, round caps (reference mockup DNA).
const I = (paths, vb = '0 0 24 24') =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  trowel: I('<path d="M4 20 14.5 9.5"/><path d="m13 6 5 5 3.5-3.5a2.1 2.1 0 0 0-3-3L15 8z" transform="translate(-1 3)"/><path d="M9 15c-2 1-4 3-5 5 2-1 4-3 5-5z"/>'),
  house: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5.5h4V20"/>'),
  roller: I('<rect x="3" y="4" width="13" height="5" rx="1"/><path d="M16 6.5h3a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1h-8v2.5"/><rect x="10" y="15.5" width="2.2" height="5" rx="1"/>'),
  expand: I('<path d="M9 3H3v6"/><path d="M3 3l7 7"/><path d="M15 21h6v-6"/><path d="M21 21l-7-7"/><path d="M12 8v3H9" opacity="0"/>'),
  leaf: I('<path d="M5 19C5 9 12 4 20 4c0 9-5 15-13 15"/><path d="M5 19c3-5 7-8 11-10"/>'),
  layout: I('<rect x="3" y="4" width="18" height="7" rx="1"/><rect x="3" y="14" width="8" height="6" rx="1"/><rect x="14" y="14" width="7" height="6" rx="1"/>'),
  user: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5"/>'),
  calendar: I('<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14.5h3M8 17.5h6"/>'),
  euro: I('<path d="M17 6.5A7 7 0 1 0 17 17.5"/><path d="M4.5 10h9M4.5 14h8"/>'),
  shield: I('<path d="M12 3 5 5.8v5.4c0 4.6 3 7.9 7 9.8 4-1.9 7-5.2 7-9.8V5.8z"/><path d="m9 11.8 2.2 2.2 4-4.2"/>'),
  handshake: I('<path d="m4 12 3-3 5 5 3-3"/><path d="M14 14.5 17 17a1.8 1.8 0 0 0 2.5-2.5L15 10l-4-4H6.5L3 9.5v5L6.5 18a1.8 1.8 0 0 0 2.5-2.5"/>'),
  hammer: I('<path d="m14 5 5 5"/><path d="M12.5 6.5 5 14l-1.5 4L7 19l7.5-7.5z" transform="translate(0 -1)"/><path d="m13 4 3-1.5L19.5 6 18 9"/>'),
  eye: I('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  phone: I('<path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.6 1.5C10 20 4 14 3.5 5.6A1.5 1.5 0 0 1 5 4z"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  pin: I('<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.3" r="2.2"/>'),
  clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  check: I('<path d="m4.5 12.5 5 5 10-11"/>'),
  arrow: I('<path d="M4 12h15M13.5 6l6 6-6 6"/>'),
  menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/></svg>',
  upload: I('<path d="M12 16V5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 16v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3"/>'),
  camera: I('<path d="M4 8h3.2L9 5.5h6L16.8 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.2"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  minus: I('<path d="M5 12h14"/>'),
  chevron: I('<path d="m9 5 7 7-7 7"/>'),
  file: I('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'),
};

export function icon(name, cls = 'icon') {
  const svg = icons[name] || '';
  return `<span class="${cls}" data-icon="${name}">${svg}</span>`;
}

// The company's own mark, traced from its site sign: the red roof with its
// chimney and window, the eave running out into a long line. The name sits
// under it, as on the sign, and takes the text colour of wherever it is.
const HOUSE_MARK = '<path d="M3 240 L320 3 L447 79 L447 33 L502 33 L502 112 L643 196 L1395 208 L630 223 L320 44 L22 228 Z"/><rect x="276" y="132" width="37" height="50"/><rect x="320" y="132" width="37" height="50"/><rect x="276" y="189" width="37" height="52"/><rect x="320" y="189" width="37" height="52"/>';
const LOGO_RED = '#C0392B';

export function wordmark() {
  return `<span class="wm"><svg class="wm__mark" viewBox="0 0 1400 244" aria-hidden="true" focusable="false"><g fill="${LOGO_RED}">${HOUSE_MARK}</g></svg><span class="wm__name">AM Construction</span></span>`;
}

// Favicon: the house alone, on a transparent ground.
const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -203 650 650"><g fill="${LOGO_RED}">${HOUSE_MARK}</g></svg>`
)}`;

function head(ctx, title, desc, extra = '') {
  const { lang, t } = ctx;
  const canonical = `__SITE_URL__${ctx.url(ctx.page)}`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${t.siteName}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="fr_FR">
<meta name="theme-color" content="#EDEBE6">
<link rel="icon" href="${FAVICON}">
<link rel="preload" as="font" type="font/woff2" href="/assets/media/fonts/newsreader-300-400-v26.woff2" crossorigin>
<link rel="stylesheet" href="/assets/styles.css">
${ctx.page === 'home' ? `<link rel="preload" as="image" href="/frames/desktop/frame_0001.webp" media="(min-width: 861px)">
<link rel="preload" as="image" href="/frames/desktop/frame_0002.webp" media="(min-width: 861px)">
<link rel="preload" as="image" href="/frames/still/hero-avant.webp" media="(max-width: 860px)" fetchpriority="high">` : ''}
${extra}
</head>`;
}

function navHref(key, url, isHome) {
  return isHome ? `#${key}` : `${url('home')}#${key}`;
}

function header(ctx) {
  const { t, page, url } = ctx;
  const isHome = page === 'home';
  const links = t.nav
    .map((n) => `<li><a href="${navHref(n.key, url, isHome)}">${n.label}</a></li>`)
    .join('');
  const menuLinks = t.nav
    .map((n, i) => `<a style="--i:${i}" href="${navHref(n.key, url, isHome)}">${n.label}</a>`)
    .join('');
  const homeLabel = `aria-label="${t.siteName}, ${t.common.homeLabel}"`;
  // On the home page the bar floats transparent over the film and turns solid after it.
  return `<a class="skip-link" href="#main">${t.common.skip}</a>
<header class="nav${isHome ? '' : ' is-solid'}" data-nav${isHome ? ' data-nav-overlay' : ''}>
  <div class="bar">
    <a class="bar__brand" href="${url('home')}" ${homeLabel}>${wordmark()}</a>
    <nav class="bar__nav" aria-label="${t.common.mainNav}"><ul class="bar__links">${links}</ul></nav>
    <div class="bar__end">
      <a class="bar__tel" href="tel:${t.contact.phoneHref}">${t.contact.phoneDisplay}</a>
      <a class="btn btn--plein bar__cta" href="${url('devis')}">${t.navCta}</a>
      <button class="btn bar__menu" type="button" aria-expanded="false" aria-controls="menu" data-menu-open>${t.navOpen}</button>
    </div>
  </div>
</header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t.common.mobileNav}" hidden data-menu>
  <div class="bar">
    <a class="bar__brand" href="${url('home')}" ${homeLabel}>${wordmark()}</a>
    <button class="btn" type="button" data-menu-close>${t.navClose}</button>
  </div>
  <nav class="menu__links" aria-label="${t.common.mobileNav}">${menuLinks}</nav>
  <div class="menu__foot">
    <a class="bar__tel" href="tel:${t.contact.phoneHref}">${t.contact.phoneDisplay}</a>
    <a class="btn btn--plein btn--lg" href="${url('devis')}">${t.navCta}</a>
  </div>
</div>
<div class="action-bar" data-action-bar hidden>
  <a class="btn btn--plein action-bar__cta" href="${url('devis')}">${t.navCta}</a>
  <a class="btn action-bar__call" href="tel:${t.contact.phoneHref}">${icon('phone')}<span>${t.common.call}</span></a>
</div>`;
}

function footer(ctx) {
  const { t, url, page } = ctx;
  const c = t.contact;
  const isHome = page === 'home';
  const links = t.nav
    .map((n) => `<li><a class="lien" href="${navHref(n.key, url, isHome)}">${n.label}</a></li>`)
    .join('');
  const certs = t.common.certs.map((x) => `<li>${x}</li>`).join('');
  const hours = c.hours.map(([d, h]) => `<li><span>${d}</span><span class="num">${h}</span></li>`).join('');
  return `<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <a class="bar__brand foot__brand" href="${url('home')}" aria-label="${t.siteName}, ${t.common.homeLabel}">${wordmark()}</a>
      <p class="foot__tagline">${t.common.footerTagline}</p>
    </div>
    <div class="foot__cols">
      <div>
        <h2 class="label">${t.common.footerContactTitle}</h2>
        <address>
          <span>${t.home.atelier.name}</span>
          <a class="lien num" href="tel:${c.phoneHref}">${c.phoneDisplay}</a>
          <a class="lien" href="mailto:${c.email}">${c.email}</a>
          <span>${c.address}</span>
        </address>
      </div>
      <div>
        <h2 class="label">${t.common.footerHoursTitle}</h2>
        <ul class="foot__hours">${hours}</ul>
      </div>
      <nav aria-label="${t.common.footerNavTitle}">
        <h2 class="label">${t.common.footerNavTitle}</h2>
        <ul>${links}<li><a class="lien" href="${url('devis')}">${t.navCta}</a></li></ul>
      </nav>
      <div>
        <h2 class="label">${t.common.footerCertsTitle}</h2>
        <ul>${certs}</ul>
      </div>
    </div>
    <div class="foot__base label">
      <span>© <span data-year>2026</span> ${t.siteName}. ${t.common.allRights}</span>
      <span class="num">${c.siret}</span>
    </div>
  </div>
</footer>
<script src="/assets/main.js" defer></script>
</body>
</html>`;
}

const jsonLd = (ctx) => `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'GeneralContractor',
  name: ctx.t.siteName,
  url: '__SITE_URL__',
  telephone: ctx.t.contact.phoneHref,
  email: ctx.t.contact.email,
  founder: { '@type': 'Person', name: ctx.t.home.atelier.name },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '14 rue des Artisans',
    postalCode: '90000',
    addressLocality: 'Belfort',
    addressCountry: 'FR',
  },
  areaServed: 'Territoire de Belfort, Nord Franche-Comté',
  foundingDate: '2008',
  slogan: ctx.t.home.atelier.quote,
})}</script>`;

function devisOverlay(ctx) {
  const { t } = ctx;
  const d = t.devis;
  const isFr = t.code === 'fr';
  const types = [
    { id: 'renovation', icon: icons.roller, title: isFr ? 'Rénovation' : 'Renovation', desc: isFr ? 'Transformer ou rénover l\'existant' : 'Transform or renovate existing' },
    { id: 'construction', icon: icons.house, title: isFr ? 'Construction neuve' : 'New build', desc: isFr ? 'Maison individuelle clé en main' : 'Turnkey individual house' },
    { id: 'extension', icon: icons.expand, title: isFr ? 'Extension' : 'Extension', desc: isFr ? 'Agrandir, surélever, ajouter' : 'Expand, raise, add' },
    { id: 'isolation', icon: icons.leaf, title: isFr ? 'Isolation' : 'Insulation', desc: isFr ? 'Murs, toiture, combles, menuiseries' : 'Walls, roof, attic, windows' },
    { id: 'amenagement', icon: icons.layout, title: isFr ? 'Aménagement' : 'Conversion', desc: isFr ? 'Combles, garage, sous-sol' : 'Attic, garage, basement' },
    { id: 'toiture', icon: icons.shield, title: isFr ? 'Toiture' : 'Roofing', desc: isFr ? 'Couverture, charpente, zinguerie' : 'Roofing, framework, zinc' },
    { id: 'autre', icon: icons.plus, title: isFr ? 'Autre' : 'Other', desc: isFr ? 'Décrivez votre projet' : 'Describe your project' },
  ];
  const tiles = types.map(tp => `<label class="dov-tile" data-dov-tile>
    <input type="checkbox" name="dov-type" value="${tp.id}">
    <span class="dov-tile__icon">${tp.icon}</span>
    <span class="dov-tile__title">${tp.title}</span>
    <span class="dov-tile__desc">${tp.desc}</span>
  </label>`).join('');

  const delays = [
    { id: 'asap', label: isFr ? 'Dès que possible' : 'ASAP' },
    { id: '3months', label: isFr ? 'Dans 3 mois' : 'In 3 months' },
    { id: '6months', label: isFr ? 'Dans 6 mois' : 'In 6 months' },
    { id: 'info', label: isFr ? 'Je me renseigne' : 'Just researching' },
  ];
  const delayChips = delays.map(dl => `<label class="dov-chip"><input type="radio" name="dov-delay" value="${dl.id}"><span>${dl.label}</span></label>`).join('');

  const stepLabels = isFr
    ? ['Vos besoins', 'Vos informations', 'Votre projet', 'Votre adresse', 'Validation']
    : ['Your needs', 'Your info', 'Your project', 'Your address', 'Validation'];

  const stepperItems = stepLabels.map((s, i) => `<li class="dov-stepper__item${i === 0 ? ' is-current' : ''}" data-dov-si="${i}">
    <span class="dov-stepper__num">${i + 1}</span><span class="dov-stepper__label">${s}</span>
  </li>`).join('');

  return `<div class="dov" data-dov hidden aria-modal="true" role="dialog" aria-label="${isFr ? 'Demande de devis' : 'Quote request'}">
<div class="dov__backdrop" data-dov-close></div>
<div class="dov__panel">
  <header class="dov__head">
    <button class="dov__close" data-dov-close aria-label="${isFr ? 'Fermer' : 'Close'}">${icons.close}</button>
    <ol class="dov-stepper" data-dov-stepper>${stepperItems}</ol>
    <div class="dov-stepper-m">
      <span>${isFr ? 'Étape' : 'Step'} <b data-dov-num>1</b> / 5</span>
      <div class="dov-stepper-m__bar"><div class="dov-stepper-m__fill" data-dov-bar></div></div>
    </div>
  </header>

  <div class="dov__body" data-dov-body>
    <!-- Step 1: Vos besoins -->
    <section class="dov__step" data-dov-step="0">
      <h2 class="dov__title">${isFr ? 'Quel type de travaux ?' : 'What type of work?'}</h2>
      <p class="dov__sub">${isFr ? 'Sélectionnez un ou plusieurs types de travaux.' : 'Select one or more types of work.'}</p>
      <div class="dov-tiles" data-dov-tiles>${tiles}</div>
      <div class="dov-field dov-field--full">
        <label for="dov-desc">${isFr ? 'Description du projet' : 'Project description'}</label>
        <textarea id="dov-desc" name="dov-desc" rows="4" maxlength="2000" placeholder="${isFr ? 'Plus vous êtes précis, plus votre devis sera juste et rapide.' : 'The more precise you are, the more accurate and faster your quote will be.'}" data-dov-desc></textarea>
      </div>
      <p class="dov-error" data-dov-err="type" hidden>${isFr ? 'Choisissez au moins un type de travaux.' : 'Choose at least one type.'}</p>
    </section>

    <!-- Step 2: Vos informations -->
    <section class="dov__step" data-dov-step="1" hidden>
      <h2 class="dov__title">${isFr ? 'Vos informations' : 'Your information'}</h2>
      <p class="dov__sub">${isFr ? 'Pour que nous puissions vous recontacter rapidement.' : 'So we can get back to you quickly.'}</p>
      <div class="dov-grid">
        <div class="dov-field"><label for="dov-lname">${isFr ? 'Nom' : 'Last name'} <span class="dov-req">*</span></label><input type="text" id="dov-lname" name="dov-lname" autocomplete="family-name" maxlength="100" required><p class="dov-error" data-dov-err="lname" hidden></p></div>
        <div class="dov-field"><label for="dov-fname">${isFr ? 'Prénom' : 'First name'} <span class="dov-req">*</span></label><input type="text" id="dov-fname" name="dov-fname" autocomplete="given-name" maxlength="100" required><p class="dov-error" data-dov-err="fname" hidden></p></div>
        <div class="dov-field"><label for="dov-email">E-mail <span class="dov-req">*</span></label><input type="email" id="dov-email" name="dov-email" autocomplete="email" maxlength="254" placeholder="${isFr ? 'claire@exemple.fr' : 'claire@example.com'}" required><p class="dov-error" data-dov-err="email" hidden></p></div>
        <div class="dov-field"><label for="dov-phone">${isFr ? 'Téléphone / WhatsApp' : 'Phone / WhatsApp'} <span class="dov-req">*</span></label><input type="tel" id="dov-phone" name="dov-phone" autocomplete="tel" maxlength="30" placeholder="06 12 34 56 78" inputmode="tel" required><p class="dov-error" data-dov-err="phone" hidden></p></div>
        <div class="dov-trap" aria-hidden="true"><label for="dov-website">Site web</label><input type="text" id="dov-website" name="dov-website" tabindex="-1" autocomplete="off" data-dov-trap></div>
      </div>
      <fieldset class="dov-contact-pref">
        <legend>${isFr ? 'Je préfère être recontacté par :' : 'I prefer to be contacted by:'}</legend>
        <div class="dov-toggle">
          <label class="dov-chip"><input type="radio" name="dov-pref" value="email" checked><span>Email</span></label>
          <label class="dov-chip"><input type="radio" name="dov-pref" value="whatsapp"><span>WhatsApp</span></label>
          <label class="dov-chip"><input type="radio" name="dov-pref" value="phone"><span>${isFr ? 'Téléphone' : 'Phone'}</span></label>
        </div>
      </fieldset>
    </section>

    <!-- Step 3: Votre projet -->
    <section class="dov__step" data-dov-step="2" hidden>
      <h2 class="dov__title">${isFr ? 'Votre projet' : 'Your project'}</h2>
      <p class="dov__sub">${isFr ? 'Ces détails nous aident à préparer votre devis.' : 'These details help us prepare your quote.'}</p>
      <div>
          <fieldset class="dov-fieldset"><legend>${isFr ? 'Délai souhaité' : 'Desired timeline'}</legend><div class="dov-chips">${delayChips}</div></fieldset>
          <div class="dov-field dov-field--full">
            <label>${isFr ? 'Photos du projet (facultatif)' : 'Project photos (optional)'}</label>
            <div class="dov-upload" data-dov-upload>
              <input type="file" accept="image/*" multiple hidden data-dov-upload-input>
              <button type="button" class="dov-upload__btn" data-dov-upload-btn>${icon('camera')} ${isFr ? 'Ajouter des photos' : 'Add photos'}</button>
              <p class="dov-upload__hint">${isFr ? 'Glissez-déposez ou cliquez. Jusqu’à 6 photos, allégées automatiquement avant l’envoi.' : 'Drag & drop or click. Up to 6 photos, made lighter automatically before sending.'}</p>
              <p class="dov-upload__msg" data-dov-upload-msg role="status" hidden></p>
              <ul class="dov-upload__list" data-dov-upload-list></ul>
            </div>
          </div>
      </div>
    </section>

    <!-- Step 4: Votre adresse -->
    <section class="dov__step" data-dov-step="3" hidden>
      <h2 class="dov__title">${isFr ? 'Adresse du chantier' : 'Site address'}</h2>
      <p class="dov__sub">${isFr ? 'Pour situer votre projet.' : 'To locate your project.'}</p>
      <div class="dov-grid">
        <div class="dov-field dov-field--full"><label for="dov-address">${isFr ? 'Adresse' : 'Address'}</label><input type="text" id="dov-address" name="dov-address" autocomplete="street-address" maxlength="200" placeholder="${isFr ? '14 rue des Artisans' : '14 rue des Artisans'}"></div>
        <div class="dov-field"><label for="dov-zip">${isFr ? 'Code postal' : 'Postal code'} <span class="dov-req">*</span></label><input type="text" id="dov-zip" name="dov-zip" autocomplete="postal-code" maxlength="10" placeholder="90000" inputmode="numeric" pattern="\\d{5}" required><p class="dov-error" data-dov-err="zip" hidden></p></div>
        <div class="dov-field"><label for="dov-city">${isFr ? 'Ville' : 'City'} <span class="dov-req">*</span></label><input type="text" id="dov-city" name="dov-city" autocomplete="address-level2" maxlength="100" placeholder="${isFr ? 'Belfort' : 'Belfort'}" required><p class="dov-error" data-dov-err="city" hidden></p></div>
      </div>
      <p class="dov-zone-hint">${icon('pin')} ${isFr ? 'Nous intervenons à Belfort, dans le Territoire de Belfort, le Nord Franche-Comté et les environs.' : 'We work in Belfort, Territoire de Belfort, Nord Franche-Comté and the surrounding area.'}</p>
    </section>

    <!-- Step 5: Validation -->
    <section class="dov__step" data-dov-step="4" hidden>
      <h2 class="dov__title">${isFr ? 'Récapitulatif' : 'Summary'}</h2>
      <p class="dov__sub">${isFr ? 'Vérifiez vos informations. Cliquez sur un bloc pour le modifier.' : 'Check your information. Click a block to edit it.'}</p>
      <div class="dov-recap" data-dov-recap></div>
      <p class="dov-notice">${isFr ? 'En envoyant votre demande, vous acceptez d\'être recontacté à son sujet. Vos données ne servent qu\'à établir votre devis.' : 'By sending your request you agree to be contacted about it. Your data is only used to prepare your quote.'}</p>
    </section>
  </div>

  <footer class="dov__foot">
    <button class="dov__prev" data-dov-prev hidden type="button">${icon('arrow')} ${isFr ? 'Retour' : 'Back'}</button>
    <button class="dov__next btn btn--primary btn--lg" data-dov-next type="button">${isFr ? 'Étape suivante' : 'Next step'} ${icon('arrow')}</button>
    <button class="dov__submit btn btn--primary btn--lg" data-dov-submit hidden type="button">${icon('check')} ${isFr ? 'Envoyer ma demande' : 'Send my request'}</button>
  </footer>

  <!-- Confirmation -->
  <div class="dov__confirm" data-dov-confirm hidden>
    <div class="dov-confirm__anim" data-dov-checkmark>
      <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="none" stroke="var(--sanguine)" stroke-width="3" class="dov-confirm__circle"/><path d="M24 42l10 10 22-24" fill="none" stroke="var(--sanguine-hi)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="dov-confirm__check"/></svg>
    </div>
    <h2 class="dov__title">${isFr ? 'Merci, votre demande est bien reçue.' : 'Thank you, your request has been received.'}</h2>
    <p class="dov-confirm__sub">${isFr ? 'Vous recevrez votre devis sous 48 h, par email ou WhatsApp.' : 'You will receive your quote within 48 hours, by email or WhatsApp.'}</p>
    <div class="dov-confirm__trust">
      <span>${icon('user')} ${isFr ? 'Un interlocuteur unique' : 'A single point of contact'}</span>
      <span>${icon('shield')} ${isFr ? 'Garantie décennale' : '10-year warranty'}</span>
      <span>${icon('check')} ${isFr ? 'Devis gratuit et sans engagement' : 'Free, no-obligation quote'}</span>
    </div>
    <div class="dov-confirm__ref" data-dov-ref></div>
    <p class="dov-confirm__warn" data-dov-photo-warn hidden></p>
    <div class="dov-confirm__actions">
      <button class="btn btn--primary" data-dov-close type="button">${isFr ? 'Retour au site' : 'Back to site'}</button>
    </div>
  </div>
</div>
</div>
<script type="application/json" data-dov-config>${JSON.stringify({
  lang: t.code,
  supabaseUrl: '__SUPABASE_URL__',
  supabaseKey: '__SUPABASE_ANON_KEY__',
  // Fetched only when the form opens (main.js), not with every page.
  supabaseJs: '__SUPABASE_JS__',
  prices: { construction: { low: 1750, high: 2500 }, renovation: { low: 600, high: 950 }, extension: { low: 1400, high: 1900 }, isolation: { low: 90, high: 160 }, amenagement: { low: 700, high: 1300 }, toiture: { low: 80, high: 200 } },
  surface: { construction: { min: 60, max: 300, start: 120 }, renovation: { min: 20, max: 300, start: 100 }, extension: { min: 10, max: 120, start: 35 }, isolation: { min: 40, max: 400, start: 140 }, amenagement: { min: 10, max: 150, start: 40 }, toiture: { min: 40, max: 400, start: 120 } },
  errors: {
    lname: isFr ? 'Indiquez votre nom.' : 'Enter your last name.',
    fname: isFr ? 'Indiquez votre prénom.' : 'Enter your first name.',
    email: isFr ? 'Cet e-mail semble incomplet.' : 'This email seems incomplete.',
    phone: isFr ? 'Numéro de téléphone invalide.' : 'Invalid phone number.',
    zip: isFr ? 'Code postal invalide.' : 'Invalid postal code.',
    city: isFr ? 'Indiquez la ville.' : 'Enter the city.',
  },
})}</script>`;
}

export function shell(ctx, { title, desc, main, bodyClass = '', headExtra = '' }) {
  return `${head(ctx, title, desc, headExtra)}
<body class="${bodyClass}" data-page="${ctx.page}">
${header(ctx)}
<main id="main">
<div class="fold-sentinel" data-fold-sentinel aria-hidden="true"></div>
${main}
</main>
${devisOverlay(ctx)}
${footer(ctx)}`;
}

export { jsonLd };
