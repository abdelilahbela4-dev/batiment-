// DESTPEC Bâtiment — progressive enhancement.
// Everything degrades gracefully: content is visible and usable without JS,
// and every motion respects prefers-reduced-motion.

document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasIO = 'IntersectionObserver' in window;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- footer year ---------- */
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* ---------- mobile nav ---------- */
(() => {
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-mobile-nav]');
  if (!toggle || !panel) return;
  const labelOpen = toggle.getAttribute('aria-label');
  const labelClose = toggle.dataset.labelClose || labelOpen;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
})();

/* ---------- smooth anchor scroll ---------- */
(() => {
  if (reducedMotion) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', `#${id}`);
  });
})();

/* ---------- reveal on scroll ---------- */
(() => {
  const els = document.querySelectorAll('[data-reveal], [data-reveal-stagger], [data-reveal-left]');
  if (!els.length) return;
  if (reducedMotion) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  let pending = [...els];
  const sweep = () => {
    const limit = window.innerHeight * 0.92;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top >= limit) return true;
      el.classList.add('is-in');
      return false;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', sweep);
      window.removeEventListener('resize', sweep);
      clearInterval(timer);
    }
  };
  const timer = setInterval(sweep, 250);
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep);
  sweep();
})();

/* ---------- count-up stats ---------- */
(() => {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length || !hasIO || reducedMotion) return;
  const fmt = new Intl.NumberFormat(document.documentElement.lang || 'fr');
  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const dur = 1500;
    const t0 = performance.now();
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt.format(target);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          animate(en.target);
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  els.forEach((el) => io.observe(el));
})();

/* ---------- hero / page-head parallax ---------- */
(() => {
  if (reducedMotion) return;
  const media = [...document.querySelectorAll('[data-parallax]')];
  if (!media.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    media.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      el.style.transform = `translateY(${((progress - 0.5) * 9).toFixed(2)}%)`;
    });
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- scroll-scrubbed frame sequence ---------- */
/* Cinematic camera orbit — a house morphing from worn to fully renovated —
   scrubbed through a <canvas> as the reader scrolls. The <img> still underneath
   remains in the document: with JS off, reduced motion, or a slow network the
   opening is a real photograph (the final renovated frame) rather than an empty
   box, so the hero is never broken. */
(() => {
  const stage = document.querySelector('[data-seq-stage]');
  if (!stage) return;
  const canvas = stage.querySelector('[data-seq-canvas]');
  const still = stage.querySelector('.stage__still');
  const cue = stage.querySelector('[data-seq-cue]');
  const count = parseInt(stage.dataset.seqFrames, 10) || 80;

  // Reduced motion, or no canvas support: leave the static final-renovated
  // still in place — the hero looks intentional, never empty.
  if (!canvas || reducedMotion) {
    if (cue) cue.hidden = true;
    return;
  }

  const mobile = window.matchMedia('(max-width: 860px)').matches;
  const basePrefix = mobile
    ? stage.dataset.seqMobile || '/frames/mobile/frame_'
    : stage.dataset.seqDesktop || '/frames/desktop/frame_';
  const src = (i) => `${basePrefix}${String(i + 1).padStart(4, '0')}.webp`;

  const frames = new Array(count);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  let painted = -1;
  let lastDrawn = null;

  const paintFrame = (frame) => {
    if (!frame || !frame.complete || !frame.naturalWidth) return false;
    const { width: cw, height: ch } = canvas;
    const scale = Math.max(cw / frame.naturalWidth, ch / frame.naturalHeight);
    const dw = frame.naturalWidth * scale;
    const dh = frame.naturalHeight * scale;
    ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    lastDrawn = frame;
    return true;
  };

  const paintNearest = (targetIdx) => {
    const i = Math.max(0, Math.min(count - 1, Math.round(targetIdx)));
    if (i === painted && lastDrawn) return;
    const f = frames[i];
    if (f && paintFrame(f)) { painted = i; return; }
    for (let d = 1; d < count; d++) {
      const a = frames[i - d];
      const b = frames[i + d];
      if (a && paintFrame(a)) { painted = i - d; return; }
      if (b && paintFrame(b)) { painted = i + d; return; }
    }
  };

  const resize = () => {
    const dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    if (lastDrawn) paintFrame(lastDrawn);
  };

  let scrollTarget = 0;
  let scrollEased = 0;
  let rafId = 0;

  const readProgress = () => {
    const rect = stage.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    scrollTarget = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
  };

  // Heavy dampening so the sequence always progresses slowly and cinematically,
  // even during a fast scroll/swipe.
  const ease = mobile ? 0.05 : 0.06;

  const step = () => {
    scrollEased += (scrollTarget - scrollEased) * ease;
    const idx = scrollEased * (count - 1);
    paintNearest(idx);
    if (Math.abs(scrollTarget - scrollEased) > 0.0005) {
      rafId = requestAnimationFrame(step);
    } else {
      scrollEased = scrollTarget;
      paintNearest(scrollEased * (count - 1));
      rafId = 0;
    }
  };
  const kick = () => {
    if (!rafId) rafId = requestAnimationFrame(step);
  };
  const onScroll = () => {
    readProgress();
    kick();
    if (cue && scrollTarget > 0.02) cue.classList.add('is-gone');
  };

  const load = (i) =>
    new Promise((resolve) => {
      if (frames[i]) return resolve();
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { paintNearest(scrollEased * (count - 1)); resolve(); };
      im.onerror = () => { frames[i] = null; resolve(); };
      im.src = src(i);
      frames[i] = im;
    });

  const priority = [0, 1, 2, 3, 4, 5, 6, 7, count - 1, count >> 1, count >> 2, (count * 3) >> 2];
  Promise.all(priority.map(load)).then(() => {
    if (frames[0] && frames[0].naturalWidth) {
      resize();
      if (still) still.style.visibility = 'hidden';
      readProgress();
      scrollEased = scrollTarget;
      paintNearest(scrollEased * (count - 1));
    } else {
      // Sequence failed entirely: leave the static final still in place.
      if (cue) cue.hidden = true;
      return;
    }
    const rest = [];
    for (let i = 0; i < count; i++) if (!frames[i]) rest.push(i);
    rest.reduce((chain, i) => chain.then(() => load(i)), Promise.resolve());
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    resize();
    onScroll();
  });
  window.addEventListener('orientationchange', () => {
    resize();
    onScroll();
  });
})();

/* ---------- home live price ---------- */
/* The same tables the quote page uses, answered before anyone has to call.
   Server-rendered markup stays meaningful without JS; this only fills figures. */
(() => {
  const root = document.querySelector('[data-price]');
  if (!root) return;
  const cfgEl = document.querySelector('[data-price-config]');
  if (!cfgEl) return;
  const CFG = JSON.parse(cfgEl.textContent);
  const lang = CFG.lang || 'fr';
  const eur = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  });
  const num = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB');

  const range = root.querySelector('[data-price-range-input]');
  const out = {
    surface: root.querySelector('[data-price-surface]'),
    figure: root.querySelector('[data-price-figure]'),
    perm2: root.querySelector('[data-price-perm2]'),
    aids: root.querySelector('[data-price-aids]'),
    aidsLine: root.querySelector('[data-price-aidsline]'),
    net: root.querySelector('[data-price-net]'),
    netLine: root.querySelector('[data-price-netline]'),
    min: root.querySelector('[data-price-min]'),
    max: root.querySelector('[data-price-max]'),
    aidsField: root.querySelector('[data-price-aids-field]'),
  };

  const typeOf = () => (root.querySelector('input[name="ptype"]:checked') || {}).value || 'renovation';
  const bracketOf = () => (root.querySelector('input[name="pbracket"]:checked') || {}).value || 'jaune';

  // Each project type gets its own sensible surface window.
  function applyBounds(type, keepValue) {
    const s = CFG.surface[type];
    if (!s) return;
    const previous = Number(range.value);
    range.min = s.min; range.max = s.max; range.step = s.step;
    range.value = keepValue ? clamp(previous, s.min, s.max) : s.start;
    if (out.min) out.min.textContent = num.format(s.min);
    if (out.max) out.max.textContent = `${num.format(s.max)} m²`;
  }

  function compute() {
    const type = typeOf();
    const surface = Number(range.value);
    const P = CFG.prices[type];
    const low = P.low * surface;
    const high = P.high * surface;

    // Energy grants apply to insulation, and to renovation as an energy retrofit.
    const eligible = type === 'isolation' || type === 'renovation';
    let aidTotal = 0;
    if (eligible) {
      const b = bracketOf();
      if (type === 'isolation') {
        aidTotal = (CFG.aids.isolationPerM2[b] || 0) * surface + CFG.aids.isolationCeePerM2 * surface;
      } else {
        const mid = (low + high) / 2;
        const mpr = b === 'rose' ? 0 : Math.min((CFG.aids.renoPct[b] || 0) * mid, CFG.aids.renoCap);
        aidTotal = mpr + (CFG.aids.renoCee[b] || 0);
      }
    }

    out.surface.textContent = num.format(surface);
    out.figure.textContent = `${eur.format(low)} – ${eur.format(high)}`;
    out.perm2.textContent = `${num.format(P.low)} – ${num.format(P.high)} €/m²`;

    if (out.aidsField) out.aidsField.hidden = !eligible;
    if (eligible && aidTotal > 0) {
      out.aidsLine.hidden = false;
      out.netLine.hidden = false;
      out.aids.textContent = `− ${eur.format(aidTotal)}`;
      out.net.textContent = `${eur.format(Math.max(low - aidTotal, 0))} – ${eur.format(Math.max(high - aidTotal, 0))}`;
    } else {
      out.aidsLine.hidden = true;
      out.netLine.hidden = true;
    }
  }

  root.addEventListener('input', (e) => {
    if (e.target === range) compute();
  });
  root.addEventListener('change', (e) => {
    if (e.target.name === 'ptype') {
      applyBounds(typeOf(), false);
      compute();
    } else if (e.target.name === 'pbracket') {
      compute();
    }
  });

  applyBounds(typeOf(), false);
  compute();
})();

/* ---------- mobile action bar ---------- */
(() => {
  const bar = document.querySelector('[data-action-bar]');
  const sentinel = document.querySelector('[data-fold-sentinel]');
  if (!bar) return;
  bar.hidden = false;
  // No IntersectionObserver: show it permanently rather than never.
  if (!sentinel || !hasIO) {
    bar.classList.add('is-in');
    return;
  }
  // Slides in once the first screen is behind the user, so it never covers the hero CTAs.
  const io = new IntersectionObserver(([entry]) => bar.classList.toggle('is-in', !entry.isIntersecting));
  io.observe(sentinel);
})();

/* ---------- magnetic buttons ---------- */
(() => {
  if (reducedMotion || !finePointer) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = 6;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      el.style.transform = `translate(${(x * strength).toFixed(1)}px, ${(y * strength).toFixed(1)}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

/* ---------- card tilt ---------- */
(() => {
  if (reducedMotion || !finePointer) return;
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

/* ---------- before/after sliders ---------- */
(() => {
  document.querySelectorAll('[data-ba]').forEach((ba) => {
    const range = ba.querySelector('.ba__range');
    if (!range) return;
    const set = (v) => ba.style.setProperty('--pos', `${clamp(v, 0, 100)}%`);
    range.addEventListener('input', () => set(parseFloat(range.value)));
    set(parseFloat(range.value));
  });
})();

/* ---------- build sequence scrub ---------- */
(() => {
  const section = document.querySelector('[data-build-section]');
  if (!section) return;
  const svg = section.querySelector('[data-build-house]');
  const stages = [...section.querySelectorAll('.bh-stage')];
  const items = [...section.querySelectorAll('.build-list__item')];
  if (!svg || !stages.length || !items.length) return;

  if (reducedMotion) {
    items.forEach((it) => it.classList.add('is-active'));
    return;
  }

  // Prepare draw-on strokes
  const drawables = stages.map((stage) =>
    [...stage.querySelectorAll('.bh-draw')].map((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      return { p, len };
    })
  );
  const fills = stages.map((stage) => [...stage.querySelectorAll('.bh-fill, .bh-glow')]);
  fills.flat().forEach((f) => (f.style.opacity = '0'));

  let ticking = false;
  const update = () => {
    ticking = false;
    const list = section.querySelector('.build-list');
    const rect = list.getBoundingClientRect();
    const vh = window.innerHeight;
    // progress 0..1 while the list scrolls through the viewport middle band
    const total = rect.height - vh * 0.45;
    const done = clamp(vh * 0.55 - rect.top, 0, total);
    const progress = total > 0 ? done / total : 1;

    const n = stages.length;
    let activeIdx = 0;
    stages.forEach((stage, i) => {
      const local = clamp(progress * n - i, 0, 1);
      if (progress * n >= i) activeIdx = i;
      drawables[i].forEach(({ p, len }) => {
        p.style.strokeDashoffset = `${len * (1 - local)}`;
      });
      fills[i].forEach((f) => (f.style.opacity = local.toFixed(3)));
    });
    items.forEach((it, i) => it.classList.toggle('is-active', i === activeIdx));
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- réalisations filters ---------- */
(() => {
  const bar = document.querySelector('[data-filters]');
  const projects = [...document.querySelectorAll('[data-project]')];
  if (!bar || !projects.length) return;
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const key = btn.dataset.filter;
    bar.querySelectorAll('[data-filter]').forEach((b) => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    let shown = 0;
    projects.forEach((p) => {
      const hide = key !== 'all' && p.dataset.cat !== key;
      p.classList.toggle('is-hidden', hide);
      if (!hide) shown++;
    });
    const empty = document.querySelector('[data-projects-empty]');
    if (empty) empty.hidden = shown > 0;
    // Filtering silently changed the page before; say what happened.
    const status = document.querySelector('[data-filter-status]');
    if (status) {
      const noun = shown === 1 ? status.dataset.nounOne : status.dataset.noun;
      status.textContent = `${shown} ${noun} · ${btn.textContent.trim()}`;
    }
  });
})();

/* ---------- devis flow ---------- */
(() => {
  const root = document.querySelector('[data-devis]');
  if (!root) return;
  const configEl = document.querySelector('[data-devis-config]');
  if (!configEl) return;
  const CFG = JSON.parse(configEl.textContent);
  const S = CFG.strings;
  const lang = CFG.lang || 'fr';
  const fmtEUR = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  });
  const fmtNum = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB');

  const form = root.querySelector('[data-devis-form]');
  const steps = [...root.querySelectorAll('.devis-step')];
  const progressItems = [...root.querySelectorAll('[data-progress-step]')];
  const status = root.querySelector('[data-devis-status]');
  const btnPrev = root.querySelector('[data-prev]');
  const btnNext = root.querySelector('[data-next]');
  const btnSubmit = root.querySelector('[data-submit]');
  const estimateBody = root.querySelector('[data-estimate-body]');
  const aidsPanel = root.querySelector('[data-aids-panel]');
  const surfaceInput = root.querySelector('[data-surface]');
  const surfaceOut = root.querySelector('[data-surface-out]');
  const confirmBox = root.querySelector('[data-confirm]');
  const main = root.querySelector('[data-devis-main]');

  const state = {
    step: 0,
    type: null,
    surface: 100,
    delay: null,
    options: {},
    energy: false,
    bracket: null,
    photos: [],
    day: null,
    slot: null,
    nocall: false,
  };

  /* --- price engine --- */
  function currentRange() {
    if (!state.type) return null;
    const P = CFG.prices[state.type];
    let low = P.low;
    let high = P.high;
    if (state.type === 'renovation') {
      if (state.options.ampleur === 'full') ({ low, high } = P.full);
    } else if (state.type === 'extension') {
      const k = state.options.kind;
      if (k === 'masonry') ({ low, high } = P.masonry);
      else if (k === 'raise') ({ low, high } = P.raise);
    }
    return { low: low * state.surface, high: high * state.surface, perLow: low, perHigh: high };
  }

  function aidsEligible() {
    if (state.type === 'isolation') return 'isolation';
    if (state.type === 'renovation' && state.energy) return 'renovation';
    return null;
  }

  function computeAids() {
    const kind = aidsEligible();
    if (!kind || !state.bracket || state.bracket === 'unknown') return null;
    const range = currentRange();
    if (!range) return null;
    const A = CFG.aids;
    const b = state.bracket;
    let mpr = 0;
    let cee = 0;
    if (kind === 'isolation') {
      mpr = (A.isolationPerM2[b] || 0) * state.surface;
      cee = A.isolationCeePerM2 * state.surface;
    } else {
      if (b === 'rose') {
        mpr = 0;
      } else {
        const mid = (range.low + range.high) / 2;
        mpr = Math.min((A.renoPct[b] || 0) * mid, A.renoCap);
      }
      cee = A.renoCee[b] || 0;
    }
    return { kind, mpr, cee, total: mpr + cee };
  }

  /* --- estimate aside render --- */
  function renderEstimate() {
    const range = currentRange();
    // Drives progressive disclosure: on narrow screens the panel stays out of
    // the way until it has a number to show.
    root.toggleAttribute('data-has-estimate', Boolean(range));
    if (!range) {
      estimateBody.innerHTML = `<p class="estimate__empty">${S.estimateEmpty}</p>`;
      return;
    }
    const typeLabel = CFG.typeLabels[state.type];
    const perM2 = S.perM2.replace('{price}', `${fmtNum.format(range.perLow)}–${fmtNum.format(range.perHigh)}`);
    const aids = computeAids();
    let aidsHtml = '';
    if (aids) {
      aidsHtml = `<div class="estimate__aids">
        <div class="estimate__row"><span>${S.totalAids}</span><strong>− ${fmtEUR.format(aids.total)}</strong></div>
        <div class="estimate__row"><span>${S.net}</span><strong>${fmtEUR.format(Math.max(range.low - aids.total, 0))} – ${fmtEUR.format(Math.max(range.high - aids.total, 0))}</strong></div>
      </div>`;
    }
    estimateBody.innerHTML = `
      <div class="estimate__row"><span>${S.surface}</span><strong>${fmtNum.format(state.surface)} m²</strong></div>
      <div class="estimate__row"><span>${lang === 'fr' ? 'Projet' : 'Project'}</span><strong>${typeLabel}</strong></div>
      <div class="estimate__range">
        <small>${S.range}</small>
        <div class="estimate__value">${fmtEUR.format(range.low)} – ${fmtEUR.format(range.high)}</div>
        <div class="estimate__perm2">${perM2}</div>
        <div class="estimate__vat">${S.vat}</div>
      </div>
      ${aidsHtml}`;
  }

  /* --- aids panel (step 3) render --- */
  function renderAids() {
    if (!aidsPanel) return;
    const kind = aidsEligible();
    if (!kind) {
      aidsPanel.innerHTML = `<p class="aids-panel__empty">${S.noAids}</p>`;
      return;
    }
    if (!state.bracket || state.bracket === 'unknown') {
      aidsPanel.innerHTML = `<p class="aids-panel__empty">${S.unknown}</p>`;
      return;
    }
    const aids = computeAids();
    const range = currentRange();
    const lines = [];
    if (aids.mpr > 0) {
      lines.push(`<div class="aids-line"><span>${S.lines.maprimerenov}</span><strong>${fmtEUR.format(aids.mpr)}</strong></div>`);
    }
    lines.push(`<div class="aids-line"><span>${S.lines.cee}</span><strong>${fmtEUR.format(aids.cee)}</strong></div>`);
    lines.push(`<div class="aids-line"><span>${S.lines.tva}<small>${S.lines.tvaNote}</small></span><strong>5,5 %</strong></div>`);
    const note = state.bracket === 'rose' && aids.kind === 'renovation' ? `<p class="devis-note">${S.notEligible}</p>` : '';
    aidsPanel.innerHTML = `
      <p class="aids-panel__title">${S.aidsTitle}</p>
      ${lines.join('')}
      <div class="aids-total"><span>${S.totalAids}</span><strong>− ${fmtEUR.format(aids.total)}</strong></div>
      <div class="aids-net"><span>${S.net}</span><strong>${fmtEUR.format(Math.max(range.low - aids.total, 0))} – ${fmtEUR.format(Math.max(range.high - aids.total, 0))}</strong></div>
      ${note}`;
  }

  /* --- step navigation --- */
  function announce(msg) {
    if (status) status.textContent = msg;
  }

  function showStep(n) {
    state.step = clamp(n, 0, steps.length - 1);
    steps.forEach((fs, i) => {
      fs.hidden = i !== state.step;
      fs.toggleAttribute('disabled', i !== state.step);
    });
    progressItems.forEach((li, i) => {
      li.classList.toggle('is-current', i === state.step);
      li.classList.toggle('is-done', i < state.step);
      if (i === state.step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    btnPrev.hidden = state.step === 0;
    btnNext.hidden = state.step === steps.length - 1;
    btnSubmit.hidden = state.step !== steps.length - 1;
    announce(S.progress.replace('{n}', state.step + 1).replace('{total}', steps.length));
    if (state.step === 2) renderAids();
    const heading = steps[state.step].querySelector('.devis-step__title');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    root.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function setError(field, msg) {
    const err = root.querySelector(`[data-error-for="${field}"]`);
    if (!err) return;
    err.textContent = msg || '';
    err.hidden = !msg;
    const wrap = err.closest('.form-field, .devis-step, .check');
    if (wrap) wrap.classList.toggle('has-error', Boolean(msg));
  }

  function validateStep(n) {
    if (n === 0) {
      const ok = Boolean(state.type);
      setError('type', ok ? '' : S.typeRequired);
      return ok;
    }
    if (n === 3) {
      let ok = true;
      const get = (name) => form.elements[name];
      const name = get('name').value.trim();
      const email = get('email').value.trim();
      const phone = get('phone').value.replace(/[\s.\-]/g, '');
      const zip = get('zip').value.trim();
      if (!name) { setError('name', S.errors.name); ok = false; } else setError('name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', S.errors.email); ok = false; } else setError('email', '');
      if (!/^(\+33|0033|0)\d{9}$/.test(phone)) { setError('phone', S.errors.phone); ok = false; } else setError('phone', '');
      if (!/^\d{5}$/.test(zip)) { setError('zip', S.errors.zip); ok = false; } else setError('zip', '');
      if (!get('consent').checked) { setError('consent', S.errors.consent); ok = false; } else setError('consent', '');
      return ok;
    }
    if (n === 4) {
      const ok = state.nocall || (state.day && state.slot);
      setError('slot', ok ? '' : S.slotRequired);
      if (!ok) announce(S.slotRequired);
      return Boolean(ok);
    }
    return true;
  }

  // The recap is the last thing the user reads before trusting us with a call:
  // show their number the way they would write it.
  function formatPhone(raw) {
    const digits = raw.replace(/[^\d+]/g, '');
    const local = digits.replace(/^(\+33|0033)/, '0');
    return /^0\d{9}$/.test(local) ? local.replace(/(\d{2})(?=\d)/g, '$1 ').trim() : raw;
  }

  // Colour and an icon are not enough on their own: move the user to the problem.
  function focusFirstError() {
    const err = [...root.querySelectorAll('[data-error-for]')].find((el) => !el.hidden);
    if (!err) return;
    const field = err.getAttribute('data-error-for');
    const control =
      form.querySelector(`[name="${field}"]:not([disabled])`) ||
      err.closest('.form-field, .devis-step, .devis-field')?.querySelector('input, select, textarea');
    const target = control || err;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    if (control) control.focus({ preventScroll: true });
  }

  btnNext.addEventListener('click', () => {
    if (!validateStep(state.step)) {
      focusFirstError();
      return;
    }
    showStep(state.step + 1);
  });
  btnPrev.addEventListener('click', () => showStep(state.step - 1));

  /* --- form wiring --- */
  form.addEventListener('change', (e) => {
    const el = e.target;
    if (el.name === 'type') {
      state.type = el.value;
      setError('type', '');
      // reset per-type options when type changes
      state.options = {};
      root.querySelectorAll('[data-type-options]').forEach((box) => {
        const match = box.dataset.typeOptions === state.type;
        box.hidden = !match;
        box.querySelectorAll('input').forEach((i) => { if (!match) i.checked = false; });
      });
    } else if (el.closest('[data-type-options]')) {
      const name = el.name;
      if (el.type === 'checkbox' && name !== 'energy') {
        const set = new Set(state.options[name] || []);
        if (el.checked) set.add(el.value); else set.delete(el.value);
        state.options[name] = [...set];
      } else if (name === 'energy') {
        state.energy = el.checked;
      } else {
        state.options[name] = el.value;
      }
    } else if (el.name === 'delay') {
      state.delay = el.value;
    } else if (el.name === 'bracket') {
      state.bracket = el.value;
      renderAids();
    } else if (el.name === 'day') {
      state.day = el.value;
      state.dayLabel = el.dataset.label || el.value;
    } else if (el.name === 'slot') {
      state.slot = el.value;
    } else if (el.name === 'nocall') {
      state.nocall = el.checked;
      root.querySelectorAll('input[name="day"], input[name="slot"]').forEach((i) => { i.disabled = state.nocall; });
    }
    renderEstimate();
  });

  if (surfaceInput) {
    surfaceInput.addEventListener('input', () => {
      state.surface = parseInt(surfaceInput.value, 10);
      if (surfaceOut) surfaceOut.textContent = state.surface;
      renderEstimate();
      if (state.step === 2) renderAids();
    });
  }

  /* --- callback day chips --- */
  (() => {
    const daysBox = root.querySelector('[data-days]');
    if (!daysBox) return;
    const days = [];
    const d = new Date();
    while (days.length < 5) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue; // skip Sundays
      days.push(new Date(d));
    }
    daysBox.innerHTML = days
      .map((day) => {
        const wd = S.weekdaysShort[(day.getDay() + 6) % 7];
        const label = `${wd} ${day.getDate()} ${S.monthsShort[day.getMonth()]}`;
        // ISO date is the value that gets submitted; the label is display only.
        const value = day.toISOString().slice(0, 10);
        return `<label class="chip"><input type="radio" name="day" value="${value}" data-label="${label}"><span>${label}</span></label>`;
      })
      .join('');
  })();

  /* --- photo upload --- */
  (() => {
    const input = root.querySelector('[data-upload-input]');
    const list = root.querySelector('[data-upload-list]');
    if (!input || !list) return;
    input.addEventListener('change', () => {
      const files = [...input.files].filter((f) => f.type.startsWith('image/') && f.size <= 8 * 1024 * 1024);
      state.photos = [...state.photos, ...files].slice(0, 6);
      input.value = '';
      renderPhotos();
    });
    function renderPhotos() {
      list.innerHTML = '';
      state.photos.forEach((file, i) => {
        const li = document.createElement('li');
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', `Retirer ${file.name}`);
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        btn.addEventListener('click', () => {
          state.photos.splice(i, 1);
          renderPhotos();
        });
        li.append(img, btn);
        list.append(li);
      });
    }
  })();

  /* --- submit --- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const contactOk = validateStep(3);
    const slotOk = validateStep(4);
    if (!contactOk || !slotOk) {
      if (!contactOk) showStep(3);
      focusFirstError();
      return;
    }
    btnSubmit.disabled = true;
    setTimeout(() => {
      const get = (n) => form.elements[n].value.trim();
      const ref = `D-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const firstName = get('name').split(' ')[0];
      const range = currentRange();
      const aids = computeAids();

      root.querySelector('[data-confirm-title]').innerHTML = S.confirmTitle.replace('{name}', firstName);
      const when = state.nocall ? S.whenMail : S.whenCall;
      root.querySelector('[data-confirm-body]').textContent = S.confirmBody.replace('{when}', when);
      root.querySelector('[data-confirm-ref]').textContent = ref;

      const rows = [];
      const L = (fr, en) => (lang === 'fr' ? fr : en);
      rows.push([L('Projet', 'Project'), CFG.typeLabels[state.type]]);
      rows.push([L('Surface', 'Area'), `${fmtNum.format(state.surface)} m²`]);
      if (range) rows.push([S.range, `${fmtEUR.format(range.low)} – ${fmtEUR.format(range.high)}`]);
      if (aids) rows.push([S.totalAids, `− ${fmtEUR.format(aids.total)}`]);
      rows.push([L('Nom', 'Name'), get('name')]);
      rows.push([L('Téléphone', 'Phone'), formatPhone(get('phone'))]);
      rows.push([L('E-mail', 'E-mail'), get('email')]);
      rows.push([L('Code postal', 'Postcode'), get('zip')]);
      if (!state.nocall && state.day) rows.push([L('Rappel', 'Call back'), `${state.dayLabel} · ${state.slot}`]);
      if (state.photos.length) rows.push([L('Photos jointes', 'Photos attached'), String(state.photos.length)]);
      root.querySelector('[data-confirm-recap]').innerHTML = rows
        .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`)
        .join('');

      main.hidden = true;
      root.querySelector('.devis-progress').hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus({ preventScroll: true });
      confirmBox.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      btnSubmit.disabled = false;
    }, 700);
  });

  root.querySelector('[data-confirm-reset]').addEventListener('click', () => {
    form.reset();
    state.step = 0; state.type = null; state.surface = 100; state.delay = null;
    state.options = {}; state.energy = false; state.bracket = null;
    state.photos = []; state.day = null; state.dayLabel = null; state.slot = null; state.nocall = false;
    root.querySelectorAll('[data-type-options]').forEach((b) => (b.hidden = true));
    root.querySelector('[data-upload-list]').innerHTML = '';
    root.querySelectorAll('input[name="day"], input[name="slot"]').forEach((i) => { i.disabled = false; });
    renderEstimate();
    confirmBox.hidden = true;
    main.hidden = false;
    root.querySelector('.devis-progress').hidden = false;
    showStep(0);
  });

  renderEstimate();
  showStep(0);
})();

/* ---------- contact form ---------- */
(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const sent = document.querySelector('[data-contact-sent]');
  const errors = {
    name: form.dataset.errName,
    email: form.dataset.errEmail,
    message: form.dataset.errMessage,
  };
  const setErr = (field, msg) => {
    const err = form.querySelector(`[data-error-for="${field}"]`);
    if (!err) return;
    err.textContent = msg || '';
    err.hidden = !msg;
    err.closest('.form-field').classList.toggle('has-error', Boolean(msg));
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();
    if (!name) { setErr('name', errors.name); ok = false; } else setErr('name', '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setErr('email', errors.email); ok = false; } else setErr('email', '');
    if (message.length < 10) { setErr('message', errors.message); ok = false; } else setErr('message', '');
    if (!ok) return;
    form.hidden = true;
    sent.hidden = false;
    sent.focus();
  });
})();

/* ---------- cursor glow ---------- */
(() => {
  if (reducedMotion || !finePointer) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
  const step = () => {
    cx += (x - cx) * 0.12;
    cy += (y - cy) * 0.12;
    glow.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
    if (Math.abs(x - cx) > 0.5 || Math.abs(y - cy) > 0.5) raf = requestAnimationFrame(step);
    else raf = 0;
  };
  document.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(step);
  });
})();

/* ---------- header hide on scroll down, show on up ---------- */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const stage = document.querySelector('[data-seq-stage]');
  let lastY = 0;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    // Keep navbar visible through the entire hero/stage section
    const stageEnd = stage ? stage.offsetTop + stage.offsetHeight : 0;
    if (y > stageEnd && y > lastY) header.classList.add('is-hidden');
    else header.classList.remove('is-hidden');
    lastY = y;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
})();

/* ---------- active nav highlight ---------- */
(() => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.site-nav a, .mobile-nav a');
  if (!sections.length || !navLinks.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const id = en.target.id;
        navLinks.forEach((a) => {
          a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach((s) => io.observe(s));
})();

/* ---------- devis overlay ---------- */
(() => {
  const overlay = document.querySelector('[data-dov]');
  if (!overlay) return;
  const cfgEl = document.querySelector('[data-dov-config]');
  const CFG = cfgEl ? JSON.parse(cfgEl.textContent) : {};
  const isFr = (CFG.lang || 'fr') === 'fr';
  const fmtEUR = new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmtNum = new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-GB');

  // Supabase client (only if keys are configured)
  const sbReady = CFG.supabaseUrl && !CFG.supabaseUrl.startsWith('__');
  const sb = sbReady ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey) : null;

  const panel = overlay.querySelector('.dov__panel');
  const body = overlay.querySelector('[data-dov-body]');
  const steps = [...overlay.querySelectorAll('[data-dov-step]')];
  const stepperItems = [...overlay.querySelectorAll('[data-dov-si]')];
  const mobileNum = overlay.querySelector('[data-dov-num]');
  const mobileBar = overlay.querySelector('[data-dov-bar]');
  const btnPrev = overlay.querySelector('[data-dov-prev]');
  const btnNext = overlay.querySelector('[data-dov-next]');
  const btnSubmit = overlay.querySelector('[data-dov-submit]');
  const confirmEl = overlay.querySelector('[data-dov-confirm]');
  const estimateBody = overlay.querySelector('[data-dov-estimate-body]');

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const state = { step: 0, types: [], desc: '', lname: '', fname: '', email: '', phone: '', pref: 'email', budget: '', delay: '', photos: [], address: '', zip: '', city: '', consent: false };
  const TOTAL = steps.length;

  /* -- open / close -- */
  function open() {
    overlay.hidden = false;
    requestAnimationFrame(() => { overlay.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    showStep(0);
  }
  function close() {
    overlay.classList.remove('is-open');
    setTimeout(() => { overlay.hidden = true; confirmEl.hidden = true; }, 400);
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="devis"]');
    if (link && !link.closest('.dov')) {
      e.preventDefault();
      open();
    }
  });
  overlay.querySelectorAll('[data-dov-close]').forEach(b => b.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) close(); });

  /* -- step navigation -- */
  function showStep(n) {
    state.step = clamp(n, 0, TOTAL - 1);
    steps.forEach((s, i) => { s.hidden = i !== state.step; });
    stepperItems.forEach((li, i) => {
      li.classList.toggle('is-current', i === state.step);
      li.classList.toggle('is-done', i < state.step);
    });
    if (mobileNum) mobileNum.textContent = state.step + 1;
    if (mobileBar) mobileBar.style.width = `${((state.step + 1) / TOTAL) * 100}%`;
    btnPrev.hidden = state.step === 0;
    btnNext.hidden = state.step === TOTAL - 1;
    btnSubmit.hidden = state.step !== TOTAL - 1;
    body.scrollTop = 0;
    if (state.step === TOTAL - 1) buildRecap();
    if (state.step === 2) renderEstimate();
  }

  btnNext.addEventListener('click', () => {
    if (!validateStep(state.step)) return;
    showStep(state.step + 1);
  });
  btnPrev.addEventListener('click', () => showStep(state.step - 1));

  /* -- validation -- */
  function setErr(name, msg) {
    const el = overlay.querySelector(`[data-dov-err="${name}"]`);
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }
  function clearErrs() { overlay.querySelectorAll('.dov-error').forEach(e => e.hidden = true); }

  function validateStep(n) {
    clearErrs();
    if (n === 0) {
      readStep0();
      if (!state.types.length) { setErr('type', ''); overlay.querySelector('[data-dov-err="type"]').hidden = false; return false; }
      return true;
    }
    if (n === 1) {
      readStep1();
      let ok = true;
      if (!state.lname.trim()) { setErr('lname', CFG.errors.lname); ok = false; }
      if (!state.fname.trim()) { setErr('fname', CFG.errors.fname); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email)) { setErr('email', CFG.errors.email); ok = false; }
      if (!/^(\+33|0033|0)\d{9}$/.test(state.phone.replace(/[\s.\-]/g, ''))) { setErr('phone', CFG.errors.phone); ok = false; }
      return ok;
    }
    if (n === 2) return true;
    if (n === 3) {
      readStep3();
      let ok = true;
      if (!/^\d{5}$/.test(state.zip)) { setErr('zip', CFG.errors.zip); ok = false; }
      if (!state.city.trim()) { setErr('city', CFG.errors.city); ok = false; }
      return ok;
    }
    if (n === 4) {
      if (!state.consent) { setErr('consent', ''); overlay.querySelector('[data-dov-err="consent"]').hidden = false; return false; }
      return true;
    }
    return true;
  }

  /* -- read form state -- */
  function readStep0() {
    state.types = [...overlay.querySelectorAll('input[name="dov-type"]:checked')].map(i => i.value);
    state.desc = (overlay.querySelector('[data-dov-desc]') || {}).value || '';
  }
  function readStep1() {
    const g = (id) => (overlay.querySelector(`#${id}`) || {}).value || '';
    state.lname = g('dov-lname');
    state.fname = g('dov-fname');
    state.email = g('dov-email');
    state.phone = g('dov-phone');
    state.pref = (overlay.querySelector('input[name="dov-pref"]:checked') || {}).value || 'email';
  }
  function readStep2() {
    state.budget = (overlay.querySelector('input[name="dov-budget"]:checked') || {}).value || '';
    state.delay = (overlay.querySelector('input[name="dov-delay"]:checked') || {}).value || '';
  }
  function readStep3() {
    const g = (id) => (overlay.querySelector(`#${id}`) || {}).value || '';
    state.address = g('dov-address');
    state.zip = g('dov-zip');
    state.city = g('dov-city');
  }

  /* -- consent -- */
  const consentBox = overlay.querySelector('[data-dov-consent]');
  if (consentBox) consentBox.addEventListener('change', () => { state.consent = consentBox.checked; });

  /* -- estimate -- */
  function renderEstimate() {
    readStep0(); readStep2();
    if (!state.types.length || !estimateBody) {
      estimateBody.innerHTML = `<p class="dov-estimate__empty">${isFr ? 'Choisissez un type de projet à l\'étape 1.' : 'Choose a project type in step 1.'}</p>`;
      return;
    }
    const t = state.types[0];
    const P = CFG.prices[t];
    if (!P) { estimateBody.innerHTML = `<p class="dov-estimate__empty">${isFr ? 'Pas d\'estimation pour ce type.' : 'No estimate for this type.'}</p>`; return; }
    const S = CFG.surface[t] || { start: 100 };
    const surface = S.start;
    const low = P.low * surface;
    const high = P.high * surface;
    estimateBody.innerHTML = `
      <div class="dov-estimate__range">${fmtEUR.format(low)} – ${fmtEUR.format(high)}</div>
      <div class="dov-estimate__perm2">${fmtNum.format(P.low)} – ${fmtNum.format(P.high)} €/m² · ${fmtNum.format(surface)} m²</div>`;
  }

  /* -- photos -- */
  const uploadInput = overlay.querySelector('[data-dov-upload-input]');
  const uploadBtn = overlay.querySelector('[data-dov-upload-btn]');
  const uploadList = overlay.querySelector('[data-dov-upload-list]');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', () => {
      const files = [...uploadInput.files].filter(f => f.type.startsWith('image/') && f.size <= 8 * 1024 * 1024);
      state.photos = [...state.photos, ...files].slice(0, 6);
      uploadInput.value = '';
      renderPhotos();
    });
  }
  function renderPhotos() {
    if (!uploadList) return;
    uploadList.innerHTML = '';
    state.photos.forEach((file, i) => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      btn.addEventListener('click', () => { state.photos.splice(i, 1); renderPhotos(); });
      li.append(img, btn);
      uploadList.append(li);
    });
  }

  /* drag and drop */
  const uploadArea = overlay.querySelector('[data-dov-upload]');
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('is-drag'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('is-drag'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault(); uploadArea.classList.remove('is-drag');
      const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/') && f.size <= 8 * 1024 * 1024);
      state.photos = [...state.photos, ...files].slice(0, 6);
      renderPhotos();
    });
  }

  /* -- recap -- */
  function buildRecap() {
    readStep0(); readStep1(); readStep2(); readStep3();
    const recapEl = overlay.querySelector('[data-dov-recap]');
    if (!recapEl) return;
    const typeLabels = { renovation: isFr ? 'Rénovation' : 'Renovation', construction: isFr ? 'Construction neuve' : 'New build', extension: 'Extension', isolation: isFr ? 'Isolation' : 'Insulation', amenagement: isFr ? 'Aménagement' : 'Conversion', toiture: isFr ? 'Toiture' : 'Roofing', autre: isFr ? 'Autre' : 'Other' };
    const budgetLabels = { small: '< 30 000 €', mid: '30 – 80 k€', large: '80 – 150 k€', xl: '> 150 000 €' };
    const delayLabels = { asap: isFr ? 'Dès que possible' : 'ASAP', '3months': isFr ? '3 mois' : '3 months', '6months': isFr ? '6 mois' : '6 months', info: isFr ? 'Se renseigne' : 'Researching' };
    const prefLabels = { email: 'Email', whatsapp: 'WhatsApp', phone: isFr ? 'Téléphone' : 'Phone' };

    const block = (label, value, step) => `<div class="dov-recap__block" data-dov-goto="${step}">
      <div class="dov-recap__label">${label} <small>${isFr ? 'Modifier' : 'Edit'}</small></div>
      <div class="dov-recap__value">${value}</div>
    </div>`;

    recapEl.innerHTML = [
      block(isFr ? 'Travaux' : 'Work', state.types.map(t => typeLabels[t] || t).join(', ') + (state.desc ? `<br><em>"${state.desc.substring(0, 80)}${state.desc.length > 80 ? '…' : ''}"</em>` : ''), 0),
      block(isFr ? 'Contact' : 'Contact', `${state.fname} ${state.lname}<br>${state.email}<br>${state.phone}<br><em>${isFr ? 'Préférence :' : 'Preference:'} ${prefLabels[state.pref]}</em>`, 1),
      block(isFr ? 'Projet' : 'Project', `${state.budget ? (isFr ? 'Budget : ' : 'Budget: ') + (budgetLabels[state.budget] || '–') : ''}${state.delay ? (isFr ? ' · Délai : ' : ' · Timeline: ') + (delayLabels[state.delay] || '–') : ''}${state.photos.length ? ` · ${state.photos.length} photo${state.photos.length > 1 ? 's' : ''}` : ''}`, 2),
      block(isFr ? 'Adresse' : 'Address', `${state.address ? state.address + ', ' : ''}${state.zip} ${state.city}`, 3),
    ].join('');

    recapEl.querySelectorAll('[data-dov-goto]').forEach(b => {
      b.addEventListener('click', () => showStep(parseInt(b.dataset.dovGoto, 10)));
    });
  }

  /* -- submit -- */
  async function submitToSupabase() {
    readStep0(); readStep1(); readStep2(); readStep3();

    // Upload photos to Supabase Storage
    let photoUrls = [];
    if (sb && state.photos.length) {
      for (const file of state.photos) {
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const { data, error } = await sb.storage.from('photos').upload(name, file);
        if (!error && data) {
          const { data: urlData } = sb.storage.from('photos').getPublicUrl(data.path);
          photoUrls.push(urlData.publicUrl);
        }
      }
    }

    if (!sb) {
      return { ok: true, ref: `D-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}` };
    }

    // Generate client UUID client-side (anon RLS = insert-only, no select)
    const clientId = crypto.randomUUID();

    const { error: clientErr } = await sb.from('clients').insert({
      id: clientId,
      nom: state.lname,
      prenom: state.fname,
      email: state.email,
      telephone: state.phone,
      canal_prefere: state.pref === 'phone' ? 'telephone' : state.pref,
      adresse: state.address || null,
      code_postal: state.zip,
      ville: state.city,
    });

    if (clientErr) return { ok: false, error: clientErr.message };

    const { error: demandeErr } = await sb.from('demandes').insert({
      client_id: clientId,
      type_travaux: state.types,
      description: state.desc || null,
      budget_tranche: state.budget || null,
      delai: state.delay || null,
      photos: photoUrls,
    });

    if (demandeErr) return { ok: false, error: demandeErr.message };

    return { ok: true, ref: `D-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}` };
  }

  const submitLabel = btnSubmit.innerHTML;
  btnSubmit.addEventListener('click', async () => {
    if (!validateStep(state.step)) return;
    btnSubmit.disabled = true;
    btnSubmit.textContent = isFr ? 'Envoi en cours…' : 'Sending…';

    try {
      const result = await submitToSupabase();
      if (result.ok) {
        const refEl = overlay.querySelector('[data-dov-ref]');
        if (refEl) refEl.textContent = `${isFr ? 'Référence' : 'Reference'} : ${result.ref}`;
        confirmEl.hidden = false;
      } else {
        alert(isFr ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.');
      }
    } catch (e) {
      alert(isFr ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.');
    }
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = submitLabel;
  });

  showStep(0);
})();
