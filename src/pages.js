// DESTPEC Bâtiment — page builders. renderPage(key, ctx) -> full HTML document.

import { shell, jsonLd, img, icon, icons } from './template.js';
import { PRICES, AIDS, SURFACE } from './pricing.js';

/* ---------- shared fragments ---------- */

function baSlider(ctx, item, { eager = false, ratio = [1400, 940] } = {}) {
  const { t } = ctx;
  const [w, h] = ratio;
  return `<figure class="ba" data-ba style="--pos:50%">
  <div class="ba__frame">
    ${img(item.before.id, { alt: item.before.alt, cls: 'ba__img', w, h, sizes: '(min-width: 1080px) 55vw, 100vw', eager })}
    <div class="ba__after" aria-hidden="true">
      ${img(item.after.id, { alt: '', cls: 'ba__img', w, h, sizes: '(min-width: 1080px) 55vw, 100vw', eager })}
    </div>
    <div class="ba__handle" aria-hidden="true"><span class="ba__grip">${icons.chevron}${icons.chevron}</span></div>
    <span class="ba__tag ba__tag--before">${t.common.before}</span>
    <span class="ba__tag ba__tag--after">${t.common.after}</span>
  </div>
  <input class="ba__range" type="range" min="0" max="100" value="50" step="1" aria-label="${t.common.sliderLabel} : ${item.title}">
</figure>`;
}

function projectMeta(ctx, item) {
  const { t } = ctx;
  return `<dl class="project__meta" data-reveal-stagger>
  <div><dt>${t.common.location}</dt><dd>${item.place}</dd></div>
  <div><dt>${t.common.year}</dt><dd>${item.year}</dd></div>
  <div><dt>${t.common.duration}</dt><dd>${item.duration}</dd></div>
  <div><dt>${t.common.surface}</dt><dd>${item.surface}</dd></div>
</dl>`;
}

/* ---------- home ---------- */

function buildSequenceSvg() {
  return `<svg class="build-house" viewBox="0 0 420 320" role="img" aria-label="Maison en construction, des fondations aux fenêtres allumées" data-build-house>
  <line class="bh-ground" x1="16" y1="282" x2="404" y2="282"/>
  <g class="bh-stage" data-stage="foundation">
    <path class="bh-draw" d="M70 258 h280 v14 h-280 z"/>
    <path class="bh-draw" d="M96 272 v10 M180 272 v10 M264 272 v10 M332 272 v10"/>
    <path class="bh-draw" d="M86 282 h24 M170 282 h24 M254 282 h24 M322 282 h24"/>
  </g>
  <g class="bh-stage" data-stage="frame">
    <path class="bh-draw" d="M96 258 v-118 M168 258 v-118 M240 258 v-118 M312 258 v-118"/>
    <path class="bh-draw" d="M88 140 h232"/>
    <path class="bh-draw" d="M96 196 h216"/>
  </g>
  <g class="bh-stage" data-stage="walls">
    <path class="bh-fill" d="M96 140 h216 v118 h-216 z"/>
    <path class="bh-draw" d="M96 140 h216 v118 h-216 z"/>
    <path class="bh-fill bh-fill--cut" d="M190 258 v-66 h30 v66 z"/>
  </g>
  <g class="bh-stage" data-stage="roof">
    <path class="bh-draw" d="M78 140 204 62l126 78"/>
    <path class="bh-fill" d="M78 140 204 62l126 78-10 8-116-72-116 72z"/>
    <path class="bh-draw" d="M276 96 v-26 h18 v38"/>
  </g>
  <g class="bh-stage" data-stage="windows">
    <rect class="bh-glow" x="118" y="168" width="42" height="46" rx="2"/>
    <rect class="bh-glow" x="252" y="168" width="42" height="46" rx="2"/>
    <path class="bh-draw" d="M118 168 h42 v46 h-42 z M139 168 v46 M118 191 h42"/>
    <path class="bh-draw" d="M252 168 h42 v46 h-42 z M273 168 v46 M252 191 h42"/>
    <rect class="bh-glow bh-glow--door" x="190" y="192" width="30" height="66" rx="2"/>
    <path class="bh-draw" d="M190 258 v-66 h30 v66"/>
  </g>
</svg>`;
}

function homePage(ctx) {
  const { t, url, lang } = ctx;
  const h = t.home;

  /* -- build / services overview -- */
  const services = h.services.items
    .map(
      (s, i) => `<li class="build-list__item" data-stage="${s.stage}"${i === 0 ? ' data-stage-first' : ''}>
    <span class="build-list__n" aria-hidden="true">${s.n}</span>
    <div>
      <h3>${s.title}</h3>
      <p>${s.body}</p>
      <a class="text-link" href="${url('devis')}">${t.common.ctaDevis}</a>
    </div>
  </li>`
    )
    .join('');

  /* -- realisations -- */
  const r = t.realisations;
  const filters = r.filters
    .map(
      (f, i) =>
        `<button class="filter-btn${i === 0 ? ' is-active' : ''}" type="button" data-filter="${f.key}" aria-pressed="${i === 0}">${f.label}</button>`
    )
    .join('');

  const realItems = r.items
    .map((pr, i) => {
      const flip = i % 2 === 1 ? ' project--flip' : '';
      return `<article class="project${flip}" id="${pr.id}" data-cat="${pr.cat}" data-project>
    <div class="project__media" data-reveal>
      ${baSlider(ctx, pr, { eager: i === 0 })}
    </div>
    <div class="project__content" data-reveal>
      <p class="project__cat">${r.filters.find((f) => f.key === pr.cat).label}</p>
      <h2 class="h-display-sm">${pr.title}</h2>
      ${projectMeta(ctx, pr)}
      <p>${pr.body}</p>
    </div>
  </article>`;
    })
    .join('');

  /* -- about -- */
  const a = t.apropos;
  const paras = a.story.body.map((ap) => `<p>${ap}</p>`).join('');

  /* -- reviews -- */
  const reviews = h.reviews.items
    .map(
      (rv) => `<li class="review" data-reveal>
    <div class="review__stars" aria-label="5/5">${icons.star}${icons.star}${icons.star}${icons.star}${icons.star}</div>
    <blockquote><p>«&nbsp;${rv.text}&nbsp;»</p></blockquote>
    <footer><strong>${rv.name}</strong><span>${rv.place} · ${rv.job}</span></footer>
  </li>`
    )
    .join('');

  /* -- contact -- */
  const ct = t.contactPage;
  const f = ct.form;
  const subjects = f.subjects.map((s) => `<option value="${s}">${s}</option>`).join('');
  const hours = t.contact.hours.map(([d, hr]) => `<li><span>${d}</span><span>${hr}</span></li>`).join('');

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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </button>
  </div>

  <div class="stage__beats">
    <div class="beat beat--open">
      <div class="beat__inner">
        <div class="beat__body">
          <h1 class="hero__title">${h.hero.title}</h1>
          <p class="hero__sub">${h.hero.sub}</p>
          <div class="hero__actions">
            <a class="btn btn--primary btn--lg" href="${url('devis')}" data-magnetic>${h.hero.cta}</a>
            <p class="hero__call">${h.hero.callPrefix} <a href="tel:${t.contact.phoneHref}">${t.contact.phoneDisplay}</a></p>
          </div>
        </div>
        <p class="stage__marker" aria-hidden="true"><span>${h.hero.marker}</span></p>
      </div>
    </div>

    <div class="beat beat--close">
      <div class="beat__inner">
        <div class="beat__body">
          <h2 class="beat__title">${h.hero.beat3.title}</h2>
          <p class="beat__text">${h.hero.beat3.body}</p>
          <a class="btn btn--primary btn--lg beat__cta" href="${url('devis')}" data-magnetic>${h.hero.beat3.cta}</a>
        </div>
        <p class="stage__marker stage__marker--after" aria-hidden="true"><span>${h.hero.beat3.marker}</span></p>
      </div>
    </div>
  </div>
</section>

<section class="section section--ink build" id="prestations" data-build-section>
  <div class="wrap build__grid">
    <div class="build__sticky">
      <h2 class="h-display build__title">${h.services.title}</h2>
      <p class="build__sub">${h.services.sub}</p>
      ${buildSequenceSvg()}
    </div>
    <ol class="build-list" data-reveal-stagger>${services}</ol>
  </div>
</section>

<section class="section section--ink2 realisations-section" id="realisations">
  <div class="wrap">
    <header class="section-head" data-reveal>
      <h2 class="h-display">${r.head.title}</h2>
      <p>${r.head.sub}</p>
    </header>
  </div>
  <div class="wrap filters" role="group" aria-label="${r.filterLabel}" data-filters data-reveal-stagger>
    ${filters}
  </div>
  <p class="visually-hidden" role="status" data-filter-status data-noun-one="${r.resultNounOne}" data-noun="${r.resultNoun}"></p>
  <div class="projects" data-projects>
    ${realItems}
    <p class="projects__empty" data-projects-empty hidden>${r.emptyState}</p>
  </div>
</section>

<section class="section section--ink story" id="apropos">
  <div class="wrap story__inner" data-reveal>
    <h2 class="h-display story__title">${a.story.title}</h2>
    <div class="story__body" data-reveal-stagger>${paras}</div>
  </div>
</section>

<section class="section section--ink2 reviews-section">
  <div class="wrap reviews-header" data-reveal>
    <h2 class="h-display">${h.reviews.title}</h2>
    <p>${h.reviews.sub}</p>
  </div>
  <div class="reviews-marquee" data-reviews-marquee>
    <div class="reviews-marquee__track">
      ${reviews}${reviews}
    </div>
  </div>
</section>

<section class="section section--ink contact" id="contact">
  <div class="wrap contact__grid">
    <div class="contact__form-wrap" data-reveal>
      <h2 class="h-display-sm">${f.title}</h2>
      <form class="contact-form" novalidate data-contact-form data-err-name="${f.errors.name}" data-err-email="${f.errors.email}" data-err-message="${f.errors.message}">
        <div class="form-grid" data-reveal-stagger>
          <div class="form-field">
            <label for="c-name">${f.name} <span class="req" aria-hidden="true">*</span></label>
            <input type="text" id="c-name" name="name" placeholder="${f.namePh}" autocomplete="name" required>
            <p class="field-error" data-error-for="name" hidden></p>
          </div>
          <div class="form-field">
            <label for="c-email">${f.email} <span class="req" aria-hidden="true">*</span></label>
            <input type="email" id="c-email" name="email" placeholder="${f.emailPh}" autocomplete="email" required>
            <p class="field-error" data-error-for="email" hidden></p>
          </div>
          <div class="form-field">
            <label for="c-phone">${f.phone}</label>
            <input type="tel" id="c-phone" name="phone" placeholder="${f.phonePh}" autocomplete="tel" inputmode="tel">
          </div>
          <div class="form-field">
            <label for="c-subject">${f.subject}</label>
            <select id="c-subject" name="subject">${subjects}</select>
          </div>
          <div class="form-field form-field--full">
            <label for="c-message">${f.message} <span class="req" aria-hidden="true">*</span></label>
            <textarea id="c-message" name="message" rows="6" placeholder="${f.messagePh}" required></textarea>
            <p class="field-error" data-error-for="message" hidden></p>
          </div>
        </div>
        <button class="btn btn--primary btn--lg" type="submit">${f.submit}${icon('arrow')}</button>
      </form>
      <div class="contact-sent" data-contact-sent hidden tabindex="-1">
        <div class="confirm__badge">${icon('check', 'icon icon--lg')}<span>${f.sent.title}</span></div>
        <p>${f.sent.body}</p>
        <a class="btn btn--primary" href="${url('devis')}">${f.sent.cta}</a>
      </div>
    </div>

    <aside class="contact__aside" data-reveal-left>
      <div class="contact-card">
        <h2 class="contact-card__title">${ct.aside.title}</h2>
        <p class="contact-card__note">${ct.aside.depotNote}</p>
        <address class="contact-card__address">
          <a href="tel:${t.contact.phoneHref}">${icon('phone')}<span>${t.contact.phoneDisplay}</span></a>
          <a href="mailto:${t.contact.email}">${icon('mail')}<span>${t.contact.email}</span></a>
          <span>${icon('pin')}<span>${t.contact.address}</span></span>
        </address>
        <ul class="contact-card__hours">${hours}</ul>
        ${img(ct.aside.img, { alt: ct.aside.imgAlt, cls: 'contact-card__img', w: 900, h: 560, sizes: '(min-width: 1080px) 34vw, 100vw' })}
        <div class="contact-card__devis">
          <h3>${ct.aside.devisNote}</h3>
          <p>${ct.aside.devisBody}</p>
          <a class="btn btn--primary" href="${url('devis')}" data-magnetic>${t.common.ctaDevis}</a>
        </div>
      </div>
    </aside>
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
