// AM Construction — page builders. renderPage(key, ctx) -> full HTML document.

import { shell, jsonLd, pic, icon, icons } from './template.js';
import { PRICES, AIDS, SURFACE } from './pricing.js';

const pad = (n) => String(n).padStart(2, '0');

/* ---------- shared fragments ---------- */

// Title-block strip: the section's name on the left, a true count or fact on the right.
function strip(label, aside = '', asideAttrs = '') {
  return `<div class="strip"><span class="label">${label}</span>${
    aside ? `<span class="label strip__aside num"${asideAttrs}>${aside}</span>` : ''
  }</div>`;
}

function sectionHead(s) {
  return `${strip(s.label, s.count)}
    <header class="grid12 shead">
      <h2 class="h2 shead__title" data-reveal>${s.title}</h2>
      ${s.sub ? `<p class="shead__sub" data-reveal>${s.sub}</p>` : ''}
    </header>`;
}

// Only confirmed facts are printed: fields left empty in content.js stay off the page.
function cartouche(fields, meta = {}) {
  const rows = Object.entries(fields)
    .filter(([key]) => meta[key])
    .map(([key, label]) => `<div><dt class="label">${label}</dt><dd>${meta[key]}</dd></div>`)
    .join('');
  return rows ? `<dl class="cart">${rows}</dl>` : '';
}

function project(p, i, total, fields, { cls, sizes }) {
  return `<article class="proj ${cls}" id="${p.id}">
      <div class="win" data-window>${pic('realisations', p.img, { alt: p.alt, w: p.w, h: p.h, sizes })}</div>
      <div class="proj__cap">
        <p class="label num proj__n">${pad(i + 1)} / ${pad(total)}</p>
        <h3 class="h3 proj__title">${p.title}</h3>
        ${cartouche(fields, p.meta)}
      </div>
    </article>`;
}

// Elevation of house 01, traced in the photograph's own coordinates (1000 × 560),
// so the photo can sweep over the drawing. Cladding hatch is generated in main.js.
function planSvg(label) {
  return `<svg viewBox="0 0 1000 560" role="img" aria-label="${label}">
          <g class="hatch" data-hatch></g>
          <line class="ln ln--fine" x1="40" y1="520" x2="960" y2="520" pathLength="1"/>
          <line class="ln" x1="60" y1="440" x2="940" y2="440" pathLength="1"/>
          <path class="ln" d="M170 440 V90 H765 V252" pathLength="1"/>
          <rect class="ln" x="164" y="84" width="607" height="8" pathLength="1"/>
          <rect class="ln" x="250" y="148" width="48" height="92" pathLength="1"/>
          <line class="ln" x1="250" y1="188" x2="298" y2="188" pathLength="1"/>
          <rect class="ln" x="422" y="158" width="40" height="88" pathLength="1"/>
          <line class="ln" x1="422" y1="196" x2="462" y2="196" pathLength="1"/>
          <rect class="ln" x="505" y="162" width="20" height="183" pathLength="1"/>
          <rect class="ln" x="570" y="145" width="157" height="107" pathLength="1"/>
          <path class="ln" d="M575 218 H722 M575 218 V252 M722 218 V252 M648 218 V252" pathLength="1"/>
          <rect class="ln" x="170" y="312" width="78" height="52" pathLength="1"/>
          <rect class="ln" x="250" y="314" width="83" height="46" pathLength="1"/>
          <line class="ln" x1="291" y1="314" x2="291" y2="360" pathLength="1"/>
          <rect class="ln" x="335" y="312" width="72" height="52" pathLength="1"/>
          <rect class="ln" x="410" y="315" width="52" height="125" pathLength="1"/>
          <line class="ln" x1="448" y1="315" x2="448" y2="440" pathLength="1"/>
          <rect class="ln" x="557" y="252" width="288" height="188" pathLength="1"/>
          <line class="ln" x1="551" y1="247" x2="851" y2="247" pathLength="1"/>
          <rect class="ln" x="587" y="322" width="20" height="118" pathLength="1"/>
          <rect class="ln" x="682" y="322" width="120" height="118" pathLength="1"/>
          <path class="ln" d="M682 352 H802 M682 381 H802 M682 410 H802" pathLength="1"/>
          <path class="ln ln--fine" d="M170 40 H765 M170 32 V48 M765 32 V48" pathLength="1"/>
        </svg>`;
}

/* ---------- home ---------- */

function homePage(ctx) {
  const { t, url } = ctx;
  const h = t.home;
  const phone = `<a class="lien num" href="tel:${t.contact.phoneHref}">${t.contact.phoneDisplay}</a>`;

  const pr = h.projects;
  const total = pr.items.length;
  const [p1, p2, p3, evening] = pr.items;

  const s = h.services;
  const services = s.items
    .map(
      (it, i) => `<li class="service${i === 0 ? ' is-current' : ''}" data-service>
          <span class="label num service__n">${it.n}</span>
          <div>
            <h3 class="service__title">${it.title}</h3>
            <p>${it.body}</p>
          </div>
        </li>`
    )
    .join('');

  const me = h.method;
  const steps = me.steps
    .map(
      (st) => `<li class="steps__item" data-step>
          <span class="steps__n num" aria-hidden="true">${st.n}</span>
          <h3 class="steps__title">${st.title}</h3>
          <p>${st.body}</p>
        </li>`
    )
    .join('');
  const certs = t.common.certs.map((c) => `<li>${c}</li>`).join('');

  const a = h.atelier;
  const figures = a.figures
    .map((f) => `<div><dt class="label">${f.label}</dt><dd class="num">${f.value}</dd></div>`)
    .join('');

  const rv = h.reviews;
  const reviews = rv.items
    .map(
      (r) => `<figure class="review" data-review>
          <blockquote><p>«&nbsp;${r.text}&nbsp;»</p></blockquote>
          <figcaption><strong>${r.name}</strong><span class="label muted">${r.place} · ${r.job}</span></figcaption>
        </figure>`
    )
    .join('');

  const v = h.visit;
  const hours = t.contact.hours
    .map(([d, hr]) => `<li><span>${d}</span><span class="num">${hr}</span></li>`)
    .join('');

  return `
<section class="stage" data-seq-stage data-seq-frames="80" data-seq-beats="2"
         data-seq-desktop="/frames/desktop/frame_" data-seq-mobile="/frames/mobile/frame_"
         data-seq-still-desktop="/frames/still/final-desktop.webp"
         data-seq-still-mobile="/frames/still/final-mobile.webp">
  <div class="stage__viewport">
    <picture>
      <source media="(max-width: 860px)" srcset="/frames/still/final-mobile.webp" width="540" height="960">
      <img class="stage__still" src="/frames/still/final-desktop.webp" alt="${h.hero.seqAlt}" fetchpriority="high" width="1600" height="900">
    </picture>
    <canvas class="stage__canvas" data-seq-canvas aria-hidden="true"></canvas>
    <div class="stage__scrim" aria-hidden="true"></div>
    <button class="stage__cue" data-seq-cue aria-hidden="true" tabindex="-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </button>
  </div>

  <div class="stage__beats">
    <div class="beat beat--open">
      <div class="beat__inner">
        <div class="beat__body">
          <h1 class="hero__title">${h.hero.title}</h1>
          <p class="hero__sub">${h.hero.sub}</p>
          <div class="hero__actions">
            <a class="btn btn--blanc btn--lg" href="${url('devis')}">${h.hero.cta}</a>
            <p class="hero__call">${h.hero.callPrefix} <a class="lien num" href="tel:${t.contact.phoneHref}">${t.contact.phoneDisplay}</a></p>
          </div>
        </div>
      </div>
    </div>

    <div class="beat beat--close">
      <div class="beat__inner">
        <div class="beat__body">
          <p class="label beat__marker">${h.hero.beat3.marker}</p>
          <h2 class="beat__title">${h.hero.beat3.title}</h2>
          <p class="beat__text">${h.hero.beat3.body}</p>
          <a class="btn btn--blanc btn--lg beat__cta" href="${url('devis')}">${h.hero.beat3.cta}</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="manifesto" id="engagement" aria-label="${h.manifesto.label}">
  <div class="wrap">
    <p class="label manifesto__label">${h.manifesto.label}</p>
    ${h.manifesto.lines.map((l) => `<p class="manifesto__line" data-line>${l}</p>`).join('\n    ')}
  </div>
</section>

<section class="section projects" id="realisations">
  <div class="wrap">
    ${sectionHead(pr)}
    ${project(p1, 0, total, pr.fields, { cls: 'proj--wide', sizes: '(min-width: 1440px) 1330px, 94vw' })}
    <div class="grid12 pair">
      ${project(p2, 1, total, pr.fields, { cls: 'proj--main', sizes: '(min-width: 960px) 56vw, 94vw' })}
      ${project(p3, 2, total, pr.fields, { cls: 'proj--side', sizes: '(min-width: 960px) 31vw, 94vw' })}
    </div>
  </div>
</section>

<section class="evening" id="${evening.id}" aria-label="${evening.label}">
  <div class="wrap grid12">
    <div class="evening__text">
      <p class="label evening__label">${evening.label}</p>
      <p class="label num">${pad(total)} / ${pad(total)}</p>
      <h3 class="h2">${evening.title}</h3>
      <p class="evening__body">${evening.body}</p>
      ${cartouche(pr.fields, evening.meta)}
    </div>
    <div class="win evening__win" data-window>${pic('realisations', evening.img, { alt: evening.alt, w: evening.w, h: evening.h, sizes: '(min-width: 960px) 48vw, 94vw' })}</div>
  </div>
</section>

<section class="section savoir" id="savoir-faire" data-draw-section>
  <div class="wrap">
    ${sectionHead(s)}
    <div class="savoir__grid">
      <ol class="savoir__list" data-draw-list>
        ${services}
      </ol>
      <div class="savoir__sticky">
        <div class="plan">
          ${planSvg(s.drawingLabel)}
          <div class="plan__photo" data-draw-photo>${pic('realisations', 'maison-meleze', { alt: '', w: 1800, h: 1005, sizes: '(min-width: 960px) 54vw, 94vw' })}</div>
          <div class="plan__beam" data-draw-beam aria-hidden="true"></div>
          <div class="plan__tb label" aria-hidden="true"><span>Élévation principale</span><span class="num">Maison 01</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section method" id="methode">
  <div class="wrap">
    ${sectionHead(me)}
    <ol class="steps" data-method>
      ${steps}
    </ol>
    <div class="guarantees">
      <p class="label">${me.guaranteesLabel}</p>
      <ul>${certs}</ul>
    </div>
  </div>
</section>

<section class="section atelier" id="atelier">
  <div class="wrap">
    ${strip(a.label, a.count)}
    <div class="grid12 atelier__grid">
      <div class="atelier__photo" data-portrait>${pic('atelier', 'aziz-amellah', { alt: a.alt, w: 1800, h: 1344, sizes: '(min-width: 960px) 46vw, 94vw' })}</div>
      <div class="atelier__text">
        <p class="label muted">${a.role}</p>
        <h2 class="h2">${a.name}</h2>
        ${a.body.map((p) => `<p>${p}</p>`).join('\n        ')}
        <blockquote class="atelier__quote"><p>«&nbsp;${a.quote}&nbsp;»</p></blockquote>
        <dl class="figures">${figures}</dl>
      </div>
    </div>
  </div>
</section>

<section class="section reviews" id="avis">
  <div class="wrap">
    ${strip(rv.label, `${pad(1)} / ${pad(rv.items.length)}`, ' data-review-count')}
    <div class="reviews__grid" data-reviews>
      <div class="reviews__head">
        <h2 class="h2" data-reveal>${rv.title}</h2>
        <p class="muted">${rv.sub}</p>
      </div>
      <div class="reviews__stage" aria-live="polite">
        ${reviews}
      </div>
      <div class="reviews__nav">
        <button class="btn reviews__btn reviews__btn--prev" type="button" data-review-prev hidden aria-label="${rv.prev}">${icons.arrow}</button>
        <button class="btn reviews__btn" type="button" data-review-next hidden aria-label="${rv.next}">${icons.arrow}</button>
      </div>
    </div>
  </div>
</section>

<section class="visit" id="contact">
  <div class="wrap">
    ${strip(v.label, t.contact.address)}
    <div class="grid12 visit__grid">
      <div class="visit__main">
        <h2 class="display visit__title" data-reveal>${v.title}</h2>
        <p class="visit__body">${v.body}</p>
        <div class="visit__actions">
          <a class="btn btn--plein btn--lg" href="${url('devis')}">${v.cta}</a>
          <p class="visit__call">${v.callPrefix} ${phone}</p>
        </div>
      </div>
      <dl class="visit__info">
        <div><dt class="label">${v.depot}</dt><dd>${t.contact.address}<br><span class="muted">${v.depotNote}</span></dd></div>
        <div><dt class="label">${v.hours}</dt><dd><ul class="hours">${hours}</ul></dd></div>
        <div><dt class="label">${v.write}</dt><dd><a class="lien" href="mailto:${t.contact.email}">${t.contact.email}</a></dd></div>
      </dl>
    </div>
  </div>
</section>
`;
}

/* ---------- devis ---------- */

function devisPage(ctx) {
  const { t, url, lang } = ctx;
  const d = t.devis;

  const progress = d.steps
    .map(
      (s, i) => `<li class="devis-progress__item" data-progress-step="${i}">
    <span class="devis-progress__dot" aria-hidden="true">${icon('check', 'icon icon--sm')}<i>${i + 1}</i></span>
    <span class="devis-progress__label">${s.label}</span>
  </li>`
    )
    .join('');

  const types = d.step1.types
    .map(
      (tp) => `<label class="type-card" data-type-card="${tp.id}">
    <input type="radio" name="type" value="${tp.id}">
    <span class="type-card__icon">${icon(tp.icon, 'icon icon--xl')}</span>
    <span class="type-card__title">${tp.title}</span>
    <span class="type-card__desc">${tp.desc}</span>
  </label>`
    )
    .join('');

  const delays = d.step2.delays
    .map(
      (x) => `<label class="chip"><input type="radio" name="delay" value="${x.id}"><span>${x.label}</span></label>`
    )
    .join('');

  // Per-type option groups (all rendered; JS toggles visibility)
  const perType = Object.entries(d.step2.perType)
    .map(([typeId, cfg]) => {
      const inputType = cfg.multi ? 'checkbox' : 'radio';
      const opts = cfg.options
        .map(
          (o) =>
            `<label class="chip"><input type="${inputType}" name="${cfg.field}" value="${o.id}"><span>${o.label}</span></label>`
        )
        .join('');
      const energy = cfg.energy
        ? `<label class="check"><input type="checkbox" name="energy" value="1"><span class="check__box" aria-hidden="true">${icon('check', 'icon icon--sm')}</span><span>${cfg.energy}</span></label>`
        : '';
      return `<div class="devis-field devis-field--type" data-type-options="${typeId}" hidden>
      <p class="devis-field__label" id="lbl-${cfg.field}">${cfg.label}</p>
      <div class="chips" role="group" aria-labelledby="lbl-${cfg.field}">${opts}</div>
      ${energy}
    </div>`;
    })
    .join('');

  const brackets = d.step3.brackets
    .map(
      (b) => `<label class="bracket bracket--${b.id}">
    <input type="radio" name="bracket" value="${b.id}">
    <span class="bracket__swatch" aria-hidden="true"></span>
    <span class="bracket__label">${b.label}${b.hint ? `<small>${b.hint}</small>` : ''}</span>
  </label>`
    )
    .join('');

  const slots = d.step5.slots
    .map((s) => `<label class="chip"><input type="radio" name="slot" value="${s}"><span>${s}</span></label>`)
    .join('');

  const nextItems = d.confirm.nextItems
    .map(
      (x, i) => `<li class="confirm-next__item">
    <span class="process-step__n" aria-hidden="true">${i + 1}</span>
    <div><h3>${x.title}</h3><p>${x.body}</p></div>
  </li>`
    )
    .join('');

  const config = {
    lang,
    prices: PRICES,
    aids: AIDS,
    typeLabels: Object.fromEntries(d.step1.types.map((x) => [x.id, x.title])),
    strings: {
      estimateEmpty: d.estimate.empty,
      range: d.estimate.range,
      vat: d.estimate.vat,
      surface: d.estimate.surfaceLabel,
      perM2: d.estimate.perM2,
      aidsTitle: d.step3.aidsTitle,
      noAids: d.step3.noAids,
      notEligible: d.step3.notEligible,
      unknown: d.step3.unknown,
      lines: d.step3.lines,
      totalAids: d.step3.totalAids,
      net: d.step3.net,
      errors: d.step4.errors,
      typeRequired: lang === 'fr' ? 'Choisissez un type de projet pour continuer.' : 'Pick a project type to continue.',
      slotRequired: lang === 'fr' ? 'Choisissez un jour et un créneau, ou cochez « pas besoin de rappel ».' : 'Pick a day and a slot, or tick “no call needed”.',
      confirmTitle: d.confirm.title,
      confirmBody: d.confirm.body,
      progress: d.progress,
      whenCall: d.confirm.whenCall,
      whenMail: d.confirm.whenMail,
      noCall: d.step5.noCall,
      weekdaysShort: d.step5.weekdaysShort,
      monthsShort: d.step5.monthsShort,
      dayLabel: d.step5.dayLabel,
    },
  };

  return `
<section class="page-head page-head--light">
  <div class="wrap page-head__inner">
    <h1 class="h-display page-head__title">${d.head.title}</h1>
    <p class="page-head__sub">${d.head.sub}</p>
    <ul class="devis-trust">${d.trust.map((x) => `<li>${icon('check', 'icon icon--sm')}<span>${x}</span></li>`).join('')}</ul>
  </div>
</section>

<section class="section section--bone devis-section">
  <div class="wrap">
    <div class="devis" data-devis>
      <ol class="devis-progress">${progress}</ol>
      <p class="visually-hidden" role="status" data-devis-status></p>

      <div class="devis__grid" data-devis-main>
        <form class="devis__form" novalidate data-devis-form>
          <fieldset class="devis-step" data-step="0">
            <legend><span class="devis-step__title">${d.step1.title}</span><span class="devis-step__sub">${d.step1.sub}</span></legend>
            <div class="type-grid">${types}</div>
            <p class="field-error" data-error-for="type" hidden></p>
          </fieldset>

          <fieldset class="devis-step" data-step="1" hidden>
            <legend><span class="devis-step__title">${d.step2.title}</span><span class="devis-step__sub">${d.step2.sub}</span></legend>
            <div class="devis-field">
              <label class="devis-field__label" for="surface">${d.step2.surface} · <output for="surface" data-surface-out>100</output> ${d.step2.surfaceUnit}</label>
              <input type="range" id="surface" name="surface" min="20" max="300" step="5" value="100" data-surface>
              <div class="range-marks" aria-hidden="true"><span>20</span><span>300 ${d.step2.surfaceUnit}</span></div>
            </div>
            ${perType}
            <div class="devis-field">
              <p class="devis-field__label" id="lbl-delay">${d.step2.delay}</p>
              <div class="chips" role="group" aria-labelledby="lbl-delay">${delays}</div>
            </div>
          </fieldset>

          <fieldset class="devis-step" data-step="2" hidden>
            <legend><span class="devis-step__title">${d.step3.title}</span><span class="devis-step__sub">${d.step3.sub}</span></legend>
            <p class="devis-field__label" id="lbl-bracket">${d.step3.bracketLabel}</p>
            <div class="brackets" role="radiogroup" aria-labelledby="lbl-bracket">${brackets}</div>
            <div class="aids-panel" data-aids-panel aria-live="polite"></div>
            <p class="devis-note">${d.step3.disclaimer}</p>
          </fieldset>

          <fieldset class="devis-step" data-step="3" hidden>
            <legend><span class="devis-step__title">${d.step4.title}</span><span class="devis-step__sub">${d.step4.sub}</span></legend>
            <div class="form-grid">
              <div class="form-field">
                <label for="d-name">${d.step4.name} <span class="req" aria-hidden="true">*</span></label>
                <input type="text" id="d-name" name="name" placeholder="${d.step4.namePh}" autocomplete="name" required>
                <p class="field-error" data-error-for="name" hidden></p>
              </div>
              <div class="form-field">
                <label for="d-email">${d.step4.email} <span class="req" aria-hidden="true">*</span></label>
                <input type="email" id="d-email" name="email" placeholder="${d.step4.emailPh}" autocomplete="email" required>
                <p class="field-error" data-error-for="email" hidden></p>
              </div>
              <div class="form-field">
                <label for="d-phone">${d.step4.phone} <span class="req" aria-hidden="true">*</span></label>
                <input type="tel" id="d-phone" name="phone" placeholder="${d.step4.phonePh}" autocomplete="tel" inputmode="tel" required>
                <p class="field-error" data-error-for="phone" hidden></p>
              </div>
              <div class="form-field">
                <label for="d-zip">${d.step4.zip} <span class="req" aria-hidden="true">*</span></label>
                <input type="text" id="d-zip" name="zip" placeholder="${d.step4.zipPh}" autocomplete="postal-code" inputmode="numeric" maxlength="5" required>
                <p class="field-error" data-error-for="zip" hidden></p>
              </div>
              <div class="form-field form-field--full">
                <label for="d-message">${d.step4.message}</label>
                <textarea id="d-message" name="message" rows="4" placeholder="${d.step4.messagePh}"></textarea>
              </div>
              <div class="form-field form-field--full">
                <span class="devis-field__label">${d.step4.photos}</span>
                <p class="devis-note">${d.step4.photosHint}</p>
                <label class="upload" data-upload>
                  <input type="file" accept="image/*" multiple data-upload-input>
                  <span class="upload__btn">${icon('camera')}<span>${d.step4.photosAdd}</span></span>
                </label>
                <ul class="upload-list" data-upload-list></ul>
              </div>
              <div class="form-field form-field--full">
                <label class="check">
                  <input type="checkbox" name="consent" value="1" required>
                  <span class="check__box" aria-hidden="true">${icon('check', 'icon icon--sm')}</span>
                  <span>${d.step4.consent}</span>
                </label>
                <p class="field-error" data-error-for="consent" hidden></p>
              </div>
            </div>
          </fieldset>

          <fieldset class="devis-step" data-step="4" hidden>
            <legend><span class="devis-step__title">${d.step5.title}</span><span class="devis-step__sub">${d.step5.sub}</span></legend>
            <div class="devis-field">
              <p class="devis-field__label" id="lbl-day">${d.step5.dayLabel}</p>
              <div class="chips chips--days" role="radiogroup" aria-labelledby="lbl-day" data-days></div>
            </div>
            <div class="devis-field">
              <p class="devis-field__label" id="lbl-slot">${d.step5.slotLabel}</p>
              <div class="chips" role="radiogroup" aria-labelledby="lbl-slot">${slots}</div>
              <label class="check check--nocall">
                <input type="checkbox" name="nocall" value="1" data-nocall>
                <span class="check__box" aria-hidden="true">${icon('check', 'icon icon--sm')}</span>
                <span>${d.step5.noCall}</span>
              </label>
              <p class="field-error" data-error-for="slot" hidden></p>
            </div>
          </fieldset>

          <div class="devis-nav">
            <button class="btn btn--outline" type="button" data-prev hidden>${d.nav.prev}</button>
            <button class="btn btn--primary" type="button" data-next>${d.nav.next}${icon('arrow')}</button>
            <button class="btn btn--primary btn--lg" type="submit" data-submit hidden>${icon('check')}${d.nav.submit}</button>
          </div>
        </form>
      </div>

      <div class="confirm" data-confirm hidden>
        <div class="confirm__badge">${icon('check', 'icon icon--lg')}<span>${d.confirm.badge}</span></div>
        <h2 class="h-display" data-confirm-title></h2>
        <p class="confirm__body" data-confirm-body></p>
        <p class="confirm__ref"><span>${d.confirm.refLabel}</span><strong data-confirm-ref></strong></p>
        <div class="confirm__cols">
          <div class="confirm__recap">
            <h3>${d.confirm.recap}</h3>
            <dl data-confirm-recap></dl>
          </div>
          <div class="confirm__next">
            <h3>${d.confirm.next}</h3>
            <ol class="confirm-next">${nextItems}</ol>
          </div>
        </div>
        <div class="confirm__actions">
          <a class="btn btn--outline" href="${url('home')}">${d.confirm.backHome}</a>
          <button class="btn btn--outline" type="button" data-confirm-reset>${d.confirm.newRequest}</button>
        </div>
      </div>
    </div>
  </div>
  <script type="application/json" data-devis-config>${JSON.stringify(config)}</script>
</section>`;
}

/* ---------- dispatcher ---------- */

const BUILDERS = {
  home: homePage,
  devis: devisPage,
};

export function renderPage(key, ctx) {
  const builder = BUILDERS[key];
  const meta = ctx.t.meta[key];
  const main = builder(ctx);
  const headExtra = key === 'home' ? jsonLd(ctx) : '';
  return shell(ctx, {
    title: meta.title,
    desc: meta.desc,
    main,
    bodyClass: `page-${key}`,
    headExtra,
  });
}
