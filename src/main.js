// AM Construction — progressive enhancement.
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
  const els = document.querySelectorAll('[data-reveal], [data-reveal-stagger], [data-reveal-left], [data-reveal-scale]');
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
  const viewport = stage.querySelector('.stage__viewport');
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
    // Last tenth of the film: the frame folds into a print on the lime-render page.
    const fold = clamp((scrollTarget - 0.9) / 0.1, 0, 1);
    viewport.style.setProperty('--fold', `${((1 - Math.pow(1 - fold, 3)) * Math.min(window.innerWidth * 0.035, 56)).toFixed(1)}px`);
  };

  // Damped enough to stay cinematic, tight enough that the house settles about
  // 1.5 s after the finger stops (0.03 left it drifting for ~4 s).
  const ease = mobile ? 0.09 : 0.08;

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

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const state = { step: 0, types: [], desc: '', lname: '', fname: '', email: '', phone: '', pref: 'email', delay: '', photos: [], address: '', zip: '', city: '' };
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
      if (!/^\+?\d{7,15}$/.test(state.phone.replace(/[\s.\-]/g, ''))) { setErr('phone', CFG.errors.phone); ok = false; }
      return ok;
    }
    if (n === 2) return true;
    if (n === 3) {
      readStep3();
      let ok = true;
      if (state.zip && !/^[A-Za-z0-9\s\-]{3,10}$/.test(state.zip)) { setErr('zip', CFG.errors.zip); ok = false; }
      if (!state.city.trim()) { setErr('city', CFG.errors.city); ok = false; }
      return ok;
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
    state.delay = (overlay.querySelector('input[name="dov-delay"]:checked') || {}).value || '';
  }
  function readStep3() {
    const g = (id) => (overlay.querySelector(`#${id}`) || {}).value || '';
    state.address = g('dov-address');
    state.zip = g('dov-zip');
    state.city = g('dov-city');
  }

  function renderEstimate() {}

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
    const delayLabels = { asap: isFr ? 'Dès que possible' : 'ASAP', '3months': isFr ? '3 mois' : '3 months', '6months': isFr ? '6 mois' : '6 months', info: isFr ? 'Se renseigne' : 'Researching' };
    const prefLabels = { email: 'Email', whatsapp: 'WhatsApp', phone: isFr ? 'Téléphone' : 'Phone' };

    const block = (label, value, step) => `<div class="dov-recap__block" data-dov-goto="${step}">
      <div class="dov-recap__label">${label} <small>${isFr ? 'Modifier' : 'Edit'}</small></div>
      <div class="dov-recap__value">${value}</div>
    </div>`;

    recapEl.innerHTML = [
      block(isFr ? 'Travaux' : 'Work', state.types.map(t => typeLabels[t] || t).join(', ') + (state.desc ? `<br><em>"${state.desc.substring(0, 80)}${state.desc.length > 80 ? '…' : ''}"</em>` : ''), 0),
      block(isFr ? 'Contact' : 'Contact', `${state.fname} ${state.lname}<br>${state.email}<br>${state.phone}<br><em>${isFr ? 'Préférence :' : 'Preference:'} ${prefLabels[state.pref]}</em>`, 1),
      block(isFr ? 'Projet' : 'Project', `${state.delay ? (isFr ? 'Délai : ' : 'Timeline: ') + (delayLabels[state.delay] || '–') : ''}${state.photos.length ? `${state.delay ? ' · ' : ''}${state.photos.length} photo${state.photos.length > 1 ? 's' : ''}` : ''}` || (isFr ? 'Non precise' : 'Not specified'), 2),
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

  // /fr/devis/ is the form's own address: open it straight away.
  if (document.body.dataset.page === 'devis') open();
})();

/* ---------- navigation: transparent over the film, solid after ---------- */
(() => {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const overlay = nav.hasAttribute('data-nav-overlay');
  const stage = document.querySelector('[data-seq-stage]');
  const links = [...nav.querySelectorAll('.bar__links a')];
  const targets = links.map((a) => {
    const id = (a.getAttribute('href') || '').split('#')[1];
    return id ? document.getElementById(id) : null;
  });
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    if (overlay) {
      const pastFilm = !stage || stage.getBoundingClientRect().bottom <= nav.offsetHeight + 1;
      nav.classList.toggle('is-solid', pastFilm);
    }
    // The last section whose top has crossed 40 % of the viewport is the active one.
    let active = -1;
    targets.forEach((el, i) => {
      if (el && el.getBoundingClientRect().top < vh * 0.4) active = i;
    });
    links.forEach((a, i) => a.classList.toggle('is-active', i === active));
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
    // rAF is suspended in hidden tabs and some embedded renderers: never leave the page stale.
    setTimeout(() => {
      if (ticking) update();
    }, 120);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- mobile menu: full screen, outside the header ---------- */
(() => {
  const menu = document.querySelector('[data-menu]');
  const openBtn = document.querySelector('[data-menu-open]');
  if (!menu || !openBtn) return;
  const closeBtn = menu.querySelector('[data-menu-close]');
  const setOpen = (open) => {
    menu.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      requestAnimationFrame(() => menu.classList.add('is-open'));
      closeBtn.focus();
    } else {
      menu.classList.remove('is-open');
    }
  };
  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => {
    setOpen(false);
    openBtn.focus();
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      openBtn.focus();
    }
  });
})();

/* ---------- scroll craft: windows, manifesto, plan to house, method, portrait ---------- */
/* Every effect is scrubbed by scroll position and plays once in each direction:
   no timers, no loops. Resting states stay readable without JavaScript. */
(() => {
  const wins = [...document.querySelectorAll('[data-window]')];
  const lines = [...document.querySelectorAll('[data-line]')];
  const portrait = document.querySelector('[data-portrait]');
  const method = document.querySelector('[data-method]');
  const methodSteps = method ? [...method.querySelectorAll('[data-step]')] : [];
  const plan = document.querySelector('[data-draw-section]');
  if (!wins.length && !lines.length && !portrait && !method && !plan) return;
  const out3 = (p) => 1 - Math.pow(1 - p, 3);

  let strokes = [];
  let hatch = null;
  let photo = null;
  let beam = null;
  let services = [];
  let list = null;
  if (plan) {
    hatch = plan.querySelector('[data-hatch]');
    if (hatch) {
      // Vertical larch cladding on the garage volume and the two timber panels.
      const NS = 'http://www.w3.org/2000/svg';
      const addLine = (x, y1, y2) => {
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', x);
        l.setAttribute('x2', x);
        l.setAttribute('y1', y1);
        l.setAttribute('y2', y2);
        hatch.appendChild(l);
      };
      for (let x = 563; x < 842; x += 9) {
        const overDoor = (x > 585 && x < 609) || (x > 680 && x < 804);
        addLine(x, 254, overDoor ? 321 : 439);
      }
      for (let x = 176; x < 246; x += 8) addLine(x, 313, 363);
      for (let x = 341; x < 405; x += 8) addLine(x, 313, 363);
    }
    strokes = [...plan.querySelectorAll('.ln')];
    photo = plan.querySelector('[data-draw-photo]');
    beam = plan.querySelector('[data-draw-beam]');
    services = [...plan.querySelectorAll('[data-service]')];
    list = plan.querySelector('[data-draw-list]');
  }

  if (reducedMotion) {
    methodSteps.forEach((s) => s.classList.add('is-reached'));
    services.forEach((s) => s.classList.add('is-current'));
    if (photo) photo.style.setProperty('--w', '50%');
    return;
  }
  document.documentElement.classList.add('is-scroll-craft');

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    // Photographs open like a window: a vertical slit widening to the full frame.
    wins.forEach((w) => {
      const r = w.getBoundingClientRect();
      const p = out3(clamp((vh - r.top) / (vh * 0.75), 0, 1));
      w.style.setProperty('--side', `${((1 - p) * 34).toFixed(2)}%`);
      w.style.setProperty('--z', (1 + (1 - p) * 0.12).toFixed(4));
    });

    // Manifesto lines light up as they cross the middle of the screen, and stay lit.
    lines.forEach((l) => {
      const r = l.getBoundingClientRect();
      const c = r.top + r.height / 2;
      const d = c < vh * 0.5 ? 1 : clamp(1 - (c - vh * 0.5) / (vh * 0.4), 0, 1);
      l.style.setProperty('--lit', (0.2 + 0.8 * d).toFixed(3));
    });

    if (portrait) {
      const r = portrait.getBoundingClientRect();
      const p = out3(clamp((vh - r.top) / (vh * 0.8), 0, 1));
      portrait.style.setProperty('--rv', `${((1 - p) * 55).toFixed(2)}%`);
    }

    if (method) {
      const r = method.getBoundingClientRect();
      const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.2), 0, 1);
      method.style.setProperty('--p', p.toFixed(3));
      methodSteps.forEach((s, i) => s.classList.toggle('is-reached', p >= i / methodSteps.length + 0.02));
    }

    if (plan && list) {
      const r = list.getBoundingClientRect();
      const P = clamp((vh * 0.6 - r.top) / Math.max(r.height - vh * 0.3, 1), 0, 1);
      const n = strokes.length;
      strokes.forEach((s, i) => {
        const start = (i / n) * 0.48;
        s.style.setProperty('--o', (1 - clamp((P - start) / 0.1, 0, 1)).toFixed(3));
      });
      if (hatch) hatch.style.opacity = clamp((P - 0.45) / 0.12, 0, 1).toFixed(3);
      const W = clamp((P - 0.62) / 0.3, 0, 1);
      if (photo) photo.style.setProperty('--w', `${((1 - W) * 100).toFixed(2)}%`);
      if (beam) beam.style.setProperty('--beam', W > 0.001 && W < 0.999 ? '1' : '0');
      const idx = Math.min(services.length - 1, Math.floor(P * services.length));
      services.forEach((s, i) => s.classList.toggle('is-current', i === idx));
    }
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
    // rAF is suspended in hidden tabs and some embedded renderers: never leave the page stale.
    setTimeout(() => {
      if (ticking) update();
    }, 120);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- reviews: one quote at a time ---------- */
(() => {
  const root = document.querySelector('[data-reviews]');
  if (!root) return;
  const items = [...root.querySelectorAll('[data-review]')];
  if (items.length < 2) return;
  const count = document.querySelector('[data-review-count]');
  const prev = root.querySelector('[data-review-prev]');
  const next = root.querySelector('[data-review-next]');
  const pad = (n) => String(n).padStart(2, '0');
  let current = 0;
  const show = (n) => {
    current = (n + items.length) % items.length;
    items.forEach((it, k) => {
      it.hidden = k !== current;
    });
    if (count) count.textContent = `${pad(current + 1)} / ${pad(items.length)}`;
  };
  prev.hidden = false;
  next.hidden = false;
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  show(0);
})();
