/**
 * Wrotron — interactions
 * Motion is slow, precise and optional: everything degrades to a static page
 * under prefers-reduced-motion or without IntersectionObserver.
 */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const WHATSAPP_NUMBER = '918969309787';
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const num = (n) => Math.round(n).toLocaleString('en-IN');

/* Photos: keep the designed placeholder if one fails */
$$('.photo img').forEach((img) => {
  const fail = () => img.closest('.photo').classList.add('failed');
  if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
  img.addEventListener('error', fail, { once: true });
});

/* ---------------- Navigation ---------------- */
const nav = $('#nav');
const toggle = $('#nav-toggle');
const setOpen = (open) => {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
};
toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
$$('#nav-links a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

const darkSections = $$('.dark, .bleed');
const hero = $('.hero');
const heroMachine = $('#hero-machine');
const bleedImg = $('.bleed-photo img');
const bleed = $('.bleed');
const mbar = $('#mbar');
const contact = $('#contact');

let ticking = false;
const onScroll = () => {
  const y = window.scrollY;
  const probe = $('#nav').offsetHeight / 2;
  nav.classList.toggle('solid', y > 12);
  // The bar adapts to whatever is underneath it
  nav.classList.toggle('on-dark', darkSections.some((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; }));

  if (!reduce) {
    // Hero: the machine settles back as the headline scrolls away
    const h = hero.offsetHeight;
    if (y < h) {
      const p = y / h;
      heroMachine.style.transform = `translateY(${p * 40}px) scale(${1 - p * 0.06})`;
    }
    // Full-bleed photo: gentle parallax
    if (bleed) {
      const r = bleed.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) bleedImg.style.setProperty('--py', `${(r.top / innerHeight) * -40}px`);
    }
  }
  if (mbar) {
    const c = contact.getBoundingClientRect();
    mbar.classList.toggle('show', y > hero.offsetHeight * 0.75 && !(c.top < innerHeight * 0.7 && c.bottom > 0));
  }
  ticking = false;
};
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// Active menu link
const links = new Map($$('#nav-links a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
const secObs = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  links.forEach((a) => a.classList.remove('active'));
  links.get(e.target.id)?.classList.add('active');
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => secObs.observe(s));

/* ---------------- Reveals ---------------- */
const once = (els, cb, opts = { threshold: 0, rootMargin: '0px 0px -8% 0px' }) => {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); }
  }), opts);
  els.forEach((el) => io.observe(el));
};
const reveals = $$('.reveal');
reveals.forEach((el) => {
  const sib = $$(':scope > .reveal', el.parentElement);
  const i = sib.indexOf(el);
  if (sib.length > 1 && i > 0) el.style.transitionDelay = `${Math.min(i * 90, 450)}ms`;
});
once(reveals, (el) => el.classList.add('in'));
once($$('.ev-row'), (el) => el.classList.add('in'), { threshold: .6 });
once($$('#day-line'), (el) => el.classList.add('in'), { threshold: .3 });

// Deep links such as /#contact: show everything and settle on the target once loaded
const hashTarget = () => { try { return location.hash.length > 1 ? document.querySelector(decodeURIComponent(location.hash)) : null; } catch { return null; } };
if (hashTarget()) {
  reveals.forEach((el) => el.classList.add('in'));
  $$('.ev-row').forEach((el) => el.classList.add('in'));
  let moved = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.addEventListener(ev, () => { moved = true; }, { once: true, passive: true }));
  const settle = () => { const t = hashTarget(); if (t && !moved) t.scrollIntoView({ block: 'start' }); };
  document.fonts?.ready.then(settle);
  window.addEventListener('load', () => { settle(); setTimeout(settle, 400); });
}

/* ---------------- Scan. Tap. Done. ---------------- */
const scene = $('#pay-scene');
if (scene && !reduce) {
  new IntersectionObserver((entries) => entries.forEach((e) => scene.classList.toggle('play', e.isIntersecting)), { threshold: .35 }).observe(scene);
}

/* ---------------- We do the rest: steps drive the machine view ---------------- */
const states = {
  installed: { status: 'Online', inv: 100, low: 'None', svc: 'Installed today', rep: 'Monthly' },
  stocked: { status: 'Online', inv: 96, low: 'None', svc: 'Today', rep: 'Monthly' },
  monitored: { status: 'Online', inv: 31, low: '3 items', svc: 'Refill due', rep: 'Monthly', lowBar: true },
  serviced: { status: 'Online', inv: 98, low: 'None', svc: 'Serviced today', rep: 'Monthly' },
  reported: { status: 'Online', inv: 88, low: 'None', svc: 'Today', rep: 'Sent ✓' },
};
const steps = $$('#handled-steps li');
const setState = (key) => {
  const s = states[key];
  if (!s) return;
  $('#ops-status').textContent = s.status;
  $('#ops-inv').textContent = `${s.inv}%`;
  const bar = $('#ops-bar');
  bar.style.setProperty('--v', `${s.inv}%`);
  bar.classList.toggle('low', !!s.lowBar);
  $('#ops-low').textContent = s.low;
  $('#ops-svc').textContent = s.svc;
  $('#ops-rep').textContent = s.rep;
};
if (steps.length) {
  const stepObs = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    steps.forEach((s) => s.classList.toggle('on', s === e.target));
    setState(e.target.dataset.state);
  }), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => stepObs.observe(s));
  steps[0].classList.add('on');
}

/* ---------------- Meet the machine: points light up their hotspot ---------------- */
const hots = $$('.hot');
const points = $$('.meet-points li');
if (points.length) {
  const hotObs = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const k = e.target.dataset.hot;
    points.forEach((p) => p.classList.toggle('on', p === e.target));
    hots.forEach((h) => h.classList.toggle('on', h.dataset.hot === k));
  }), { rootMargin: '-40% 0px -50% 0px' });
  points.forEach((p) => hotObs.observe(p));
  hots.forEach((h) => h.addEventListener('mouseenter', () => {
    points.forEach((p) => p.classList.toggle('on', p.dataset.hot === h.dataset.hot));
    hots.forEach((x) => x.classList.toggle('on', x === h));
  }));
}

/* ---------------- Industries rail ---------------- */
const rail = $('#rail');
const railBtns = $$('.car-btn');
const railUpdate = () => {
  const max = rail.scrollWidth - rail.clientWidth - 2;
  railBtns.forEach((b) => { b.disabled = b.dataset.dir === '-1' ? rail.scrollLeft <= 2 : rail.scrollLeft >= max; });
};
if (rail) {
  railBtns.forEach((b) => b.addEventListener('click', () => {
    const card = $('.story', rail);
    rail.scrollBy({ left: (card.offsetWidth + 20) * Number(b.dataset.dir), behavior: reduce ? 'auto' : 'smooth' });
  }));
  rail.addEventListener('scroll', railUpdate, { passive: true });
  window.addEventListener('resize', railUpdate);
  railUpdate();
}

/* ---------------- FAQ: smooth accordion ---------------- */
$$('#faq-list details').forEach((d) => {
  const sum = $('summary', d);
  const body = $('.faq-a', d);
  sum.addEventListener('click', (e) => {
    if (reduce) return;
    e.preventDefault();
    if (d.dataset.anim) return;
    d.dataset.anim = '1';
    if (!d.open) {
      d.open = true;
      const h = body.scrollHeight;
      body.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.22,.61,.21,1)' }).onfinish = () => { delete d.dataset.anim; };
    } else {
      const h = body.scrollHeight;
      body.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.22,.61,.21,1)' }).onfinish = () => { d.open = false; delete d.dataset.anim; };
    }
  });
});

/* ---------------- Proof blocks (only from real data) ---------------- */
let data = {};
try { data = JSON.parse($('#site-data')?.textContent || '{}'); } catch { data = {}; }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
if (data.metrics?.length) {
  const el = $('#metrics');
  el.innerHTML = data.metrics.map((m) => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('');
  el.hidden = false;
}
if (data.clients?.length) {
  $('#clients-row').innerHTML = data.clients.map((c) => (c.logo ? `<img src="${esc(c.logo)}" alt="${esc(c.name)}" height="30" loading="lazy">` : `<span>${esc(c.name)}</span>`)).join('');
  $('#clients').hidden = false;
}
if (data.caseStudies?.length) {
  const el = $('#cases');
  el.innerHTML = data.caseStudies.map((c) => `<article class="case"><h3>${esc(c.customer)}</h3>${c.location ? `<p class="fine">${esc(c.location)}</p>` : ''}
    <dl><dt>Challenge</dt><dd>${esc(c.challenge)}</dd><dt>Solution</dt><dd>${esc(c.solution)}</dd></dl>
    ${c.results?.length ? `<div class="case-results">${c.results.map((r) => `<div><b>${esc(r.value)}</b><span>${esc(r.label)}</span></div>`).join('')}</div>` : ''}</article>`).join('');
  el.hidden = false;
}
if (data.founderPhoto) {
  const img = $('#founder-photo');
  img.src = data.founderPhoto;
  img.hidden = false;
}

/* ---------------- Business-case estimate ---------------- */
const keys = ['people', 'share', 'ticket', 'days'];
const recalc = () => {
  const v = Object.fromEntries(keys.map((k) => [k, Math.max(0, Number($(`#c-${k}`).value) || 0)]));
  const day = v.people * (Math.min(v.share, 100) / 100);
  const month = day * Math.min(v.days, 31);
  $('#o-day').textContent = num(day);
  $('#o-month').textContent = num(month);
  $('#o-sales').textContent = inr(month * v.ticket);
};
if ($('#calc')) {
  keys.forEach((k) => {
    const n = $(`#c-${k}`);
    const r = $(`#c-${k}-r`);
    const fill = () => r.style.setProperty('--fill', `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
    r.addEventListener('input', () => { n.value = r.value; fill(); recalc(); });
    n.addEventListener('input', () => { r.value = n.value; fill(); recalc(); });
    fill();
  });
  recalc();
  $('#calc-cta').addEventListener('click', () => {
    const p = Number($('#c-people').value) || 0;
    const band = p < 100 ? 'Under 100' : p <= 500 ? '100 – 500' : p <= 1000 ? '500 – 1,000' : p <= 5000 ? '1,000 – 5,000' : 'Over 5,000';
    $('#f-people').value = band;
  });
}

/* ---------------- Enquiry form ---------------- */
const form = $('#lead-form');
const statusEl = $('#form-status');
const submit = $('#submit');
const LABEL = submit.textContent;

$$('[data-space]').forEach((a) => a.addEventListener('click', () => { $('#f-type').value = a.dataset.space; }));
$$('[data-note]').forEach((a) => a.addEventListener('click', () => {
  const m = $('#f-msg');
  if (!m.value.includes(a.dataset.note)) m.value = (m.value ? `${m.value}\n` : '') + a.dataset.note;
}));

const normalisePhone = (v) => v.replace(/[\s\-()]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, '');
const rules = {
  name: (v) => v.trim().length >= 2 || 'Please enter your name.',
  org_name: (v) => v.trim().length >= 2 || 'Please enter your company or organisation.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
  phone: (v) => /^[6-9]\d{9}$/.test(normalisePhone(v)) || 'Please enter a valid 10-digit Indian mobile number.',
  city: (v) => v.trim().length >= 2 || 'Please enter your city.',
};
function showError(input, msg) {
  const f = input.closest('.field');
  f.classList.add('invalid');
  input.setAttribute('aria-invalid', 'true');
  let err = $('.err', f);
  if (!err) {
    err = document.createElement('span');
    err.className = 'err';
    err.id = `${input.id}-err`;
    f.appendChild(err);
    input.setAttribute('aria-describedby', err.id);
  }
  err.textContent = msg;
}
function clearError(input) {
  const f = input.closest('.field');
  f.classList.remove('invalid');
  input.removeAttribute('aria-invalid');
  $('.err', f)?.remove();
}
const validate = (input) => {
  const r = rules[input.name](input.value);
  if (r === true) { clearError(input); return true; }
  showError(input, r);
  return false;
};
Object.keys(rules).forEach((n) => {
  const i = form.elements[n];
  i.addEventListener('blur', () => { if (i.value) validate(i); });
  i.addEventListener('input', () => { if (i.closest('.field').classList.contains('invalid')) validate(i); });
});

const read = () => {
  const fd = new FormData(form);
  return {
    name: fd.get('name').trim(),
    phone: normalisePhone(fd.get('phone')),
    email: fd.get('email').trim(),
    org_name: fd.get('org_name').trim(),
    org_type: fd.get('org_type') || '',
    stock: [],
    city: fd.get('city').trim(),
    state: '',
    pincode: '',
    footfall: fd.get('footfall') || '',
    message: fd.get('message').trim(),
  };
};
const setStatus = (t, k = '') => { statusEl.textContent = t; statusEl.className = `form-status ${k}`; };

const firebaseConfig = {
  apiKey: 'AIzaSyCAQGSP6chmETveZ-vuUaaNPKT2wVUvE_o',
  authDomain: 'wrotron-e2ded.firebaseapp.com',
  projectId: 'wrotron-e2ded',
  storageBucket: 'wrotron-e2ded.appspot.com',
  messagingSenderId: '440892226154',
  appId: '1:440892226154:web:09bdd38649631fbba66813',
  measurementId: 'G-TJGGE3CB57',
};
const FB = 'https://www.gstatic.com/firebasejs/11.6.1';
let fbp;
const loadFirebase = () => {
  fbp ??= (async () => {
    const [{ initializeApp }, fs, { getAuth, signInAnonymously }] = await Promise.all([
      import(`${FB}/firebase-app.js`), import(`${FB}/firebase-firestore.js`), import(`${FB}/firebase-auth.js`),
    ]);
    const app = initializeApp(firebaseConfig);
    try { await signInAnonymously(getAuth(app)); } catch { /* rules may not require auth */ }
    import(`${FB}/firebase-analytics.js`).then(({ getAnalytics }) => getAnalytics(app)).catch(() => {});
    return { db: fs.getFirestore(app), fs };
  })();
  fbp.catch(() => { fbp = undefined; });
  return fbp;
};
(window.requestIdleCallback || ((cb) => setTimeout(cb, 2000)))(() => loadFirebase().catch(() => {}));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('');
  const bad = Object.keys(rules).map((n) => form.elements[n]).filter((i) => !validate(i));
  if (bad.length) { bad[0].focus(); return; }
  submit.disabled = true;
  submit.textContent = 'Sending…';
  try {
    const { db, fs } = await loadFirebase();
    await fs.addDoc(fs.collection(db, 'vending_leads'), { ...read(), source: 'website', page: location.href, submittedAt: fs.serverTimestamp() });
    form.reset();
    setStatus('Thank you — your request is in. We’ll call you shortly to plan the site survey.', 'ok');
  } catch (err) {
    console.error(err);
    setStatus('Sorry, that didn’t go through. Please try again, send it on WhatsApp, or email admin.team@wrotron.in.', 'bad');
  } finally {
    submit.disabled = false;
    submit.textContent = LABEL;
  }
});

$('#wa-send').addEventListener('click', () => {
  const d = read();
  const lines = [
    'Hi Wrotron, I’d like a free site survey.',
    d.name && `Name: ${d.name}`,
    d.org_name && `Company: ${d.org_name}${d.org_type ? ` (${d.org_type})` : ''}`,
    d.city && `City: ${d.city}`,
    d.footfall && `People: ${d.footfall}`,
    d.phone && `Phone: ${d.phone}`,
    d.email && `Email: ${d.email}`,
    d.message && `Notes: ${d.message}`,
  ].filter(Boolean);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
});

$('#year').textContent = new Date().getFullYear();
