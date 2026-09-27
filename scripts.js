/**
 * Wrotron — site interactions
 * Navigation, reveals, proof data, vending demo, business-case estimate, enquiry form.
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const WHATSAPP_NUMBER = '918969309787';
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const num = (n) => Math.round(n).toLocaleString('en-IN');

/* ---------------------------------------------------------------
   Photos — if one fails to load, keep the designed placeholder
---------------------------------------------------------------- */
$$('.photo img').forEach((img) => {
  const fail = () => img.closest('.photo').classList.add('failed');
  if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
  img.addEventListener('error', fail, { once: true });
});

/* ---------------------------------------------------------------
   Navigation
---------------------------------------------------------------- */
const nav = $('#nav');
const navToggle = $('#nav-toggle');
const mbar = $('#mbar');
const hero = $('.hero');

const setNavOpen = (open) => {
  nav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
$$('#nav-links a').forEach((a) => a.addEventListener('click', () => setNavOpen(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNavOpen(false); });

const contact = $('#contact');
let ticking = false;
const onScroll = () => {
  // Mobile action bar: after the hero, hidden again while the form itself is on screen
  const r = contact.getBoundingClientRect();
  const formVisible = r.top < window.innerHeight * 0.6 && r.bottom > 0;
  mbar?.classList.toggle('show', window.scrollY > hero.offsetHeight * 0.8 && !formVisible);
  ticking = false;
};
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

// Highlight the menu link for the section in view (none for sections not in the menu)
const navLinks = new Map($$('#nav-links a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.remove('active'));
    navLinks.get(entry.target.id)?.classList.add('active');
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => sectionObserver.observe(s));

/* ---------------------------------------------------------------
   Scroll reveal — any overlap reveals, so tall blocks never stay hidden
---------------------------------------------------------------- */
const reveals = $$('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
reveals.forEach((el) => {
  const siblings = $$(':scope > .reveal', el.parentElement);
  const idx = siblings.indexOf(el);
  if (siblings.length > 1 && idx > 0) el.style.transitionDelay = `${Math.min(idx * 70, 420)}ms`;
  revealObserver.observe(el);
});

/* ---------------------------------------------------------------
   Deep links (e.g. wrotron.in/#contact): show content straight away and
   settle on the target again once fonts and photos have loaded.
---------------------------------------------------------------- */
const hashTarget = () => {
  try { return location.hash.length > 1 ? document.querySelector(decodeURIComponent(location.hash)) : null; } catch { return null; }
};
if (hashTarget()) {
  reveals.forEach((el) => el.classList.add('in'));
  let userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) =>
    window.addEventListener(ev, () => { userMoved = true; }, { once: true, passive: true }));
  const settle = () => { const t = hashTarget(); if (t && !userMoved) t.scrollIntoView({ block: 'start' }); };
  document.fonts?.ready.then(settle);
  window.addEventListener('load', () => { settle(); setTimeout(settle, 400); });
}

/* ---------------------------------------------------------------
   Proof blocks — rendered only from real data in #site-data
---------------------------------------------------------------- */
let siteData = {};
try { siteData = JSON.parse($('#site-data')?.textContent || '{}'); } catch { siteData = {}; }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

if (siteData.metrics?.length) {
  const el = $('#metrics');
  el.innerHTML = siteData.metrics.map((m) => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('');
  el.hidden = false;
}
if (siteData.clients?.length) {
  $('#clients-row').innerHTML = siteData.clients.map((c) => (c.logo
    ? `<img src="${esc(c.logo)}" alt="${esc(c.name)}" height="32" loading="lazy">`
    : `<span>${esc(c.name)}</span>`)).join('');
  $('#clients').hidden = false;
}
if (siteData.caseStudies?.length) {
  const el = $('#cases');
  el.innerHTML = siteData.caseStudies.map((c) => `
    <article class="case">
      <h3>${esc(c.customer)}</h3>
      ${c.location ? `<p class="fine">${esc(c.location)}</p>` : ''}
      <dl><dt>Challenge</dt><dd>${esc(c.challenge)}</dd><dt>Solution</dt><dd>${esc(c.solution)}</dd></dl>
      ${c.results?.length ? `<div class="case-results">${c.results.map((r) => `<div><b>${esc(r.value)}</b><span>${esc(r.label)}</span></div>`).join('')}</div>` : ''}
    </article>`).join('');
  el.hidden = false;
}

/* ---------------------------------------------------------------
   Vending demo
---------------------------------------------------------------- */
const kiosk = $('#kiosk');
if (kiosk) {
  const views = Object.fromEntries($$('.k-view', kiosk).map((v) => [v.dataset.view, v]));
  const steps = $$('#demo-steps li');
  const tray = $('#k-tray');
  const show = (name, step) => {
    Object.entries(views).forEach(([k, v]) => { v.hidden = k !== name; });
    steps.forEach((s, i) => s.classList.toggle('on', i === step));
  };
  // Decorative QR-style pattern (deterministic)
  const qr = $('#k-qr');
  let seed = 11;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const finder = (x, y) => {
    const f = (a, b) => a >= 0 && a < 7 && b >= 0 && b < 7 && (a === 0 || b === 0 || a === 6 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4));
    const inBox = (a, b) => a >= 0 && a < 7 && b >= 0 && b < 7;
    if (inBox(x, y)) return f(x, y);
    if (inBox(x - 14, y)) return f(x - 14, y);
    if (inBox(x, y - 14)) return f(x, y - 14);
    return null;
  };
  let cells = '';
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const fv = finder(x, y);
    cells += (fv === null ? rand() > 0.52 : fv) ? '<i></i>' : '<b></b>';
  }
  qr.innerHTML = cells;

  let current = null;
  $$('.k-item', kiosk).forEach((b) => b.addEventListener('click', () => {
    current = { name: b.dataset.name, price: Number(b.dataset.price) };
    $('#k-amount').textContent = inr(current.price);
    $('#k-name').textContent = current.name;
    tray.classList.remove('in');
    show('pay', 1);
    $('#k-pay').focus({ preventScroll: true });
  }));
  $('#k-back').addEventListener('click', () => show('choose', 0));
  $('#k-pay').addEventListener('click', () => {
    show('done', 1);
    const bar = $('#k-progress');
    const title = $('#k-done-title');
    const sub = $('#k-done-sub');
    const again = $('#k-again');
    again.hidden = true;
    title.textContent = 'Payment successful';
    sub.textContent = 'Dispensing…';
    bar.style.transition = 'none';
    bar.style.width = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.transition = '';
      bar.style.width = '100%';
    }));
    setTimeout(() => {
      title.textContent = 'Collect your item';
      sub.textContent = `${current.name} is in the tray below.`;
      tray.textContent = current.name;
      tray.classList.add('in');
      steps.forEach((s, i) => s.classList.toggle('on', i === 2));
      again.hidden = false;
    }, reduceMotion ? 0 : 1700);
  });
  $('#k-again').addEventListener('click', () => { tray.classList.remove('in'); show('choose', 0); });
}

/* ---------------------------------------------------------------
   Business-case estimate (illustrative, user-controlled assumptions)
---------------------------------------------------------------- */
const calcFields = ['people', 'share', 'ticket', 'days'];
const calcRecalc = () => {
  const v = Object.fromEntries(calcFields.map((k) => [k, Math.max(0, Number($(`#c-${k}`).value) || 0)]));
  const perDay = v.people * (Math.min(v.share, 100) / 100);
  const perMonth = perDay * Math.min(v.days, 31);
  $('#o-day').textContent = num(perDay);
  $('#o-month').textContent = num(perMonth);
  $('#o-sales').textContent = inr(perMonth * v.ticket);
};
if ($('#calc')) {
  calcFields.forEach((k) => {
    const n = $(`#c-${k}`);
    const r = $(`#c-${k}-r`);
    const fill = () => { r.style.setProperty('--fill', `${((r.value - r.min) / (r.max - r.min)) * 100}%`); };
    r.addEventListener('input', () => { n.value = r.value; fill(); calcRecalc(); });
    n.addEventListener('input', () => { r.value = n.value; fill(); calcRecalc(); });
    fill();
  });
  calcRecalc();
  $('#calc-cta').addEventListener('click', () => {
    const people = Number($('#c-people').value) || 0;
    const band = people < 100 ? 'Under 100' : people <= 500 ? '100 – 500' : people <= 1000 ? '500 – 1,000' : people <= 5000 ? '1,000 – 5,000' : 'Over 5,000';
    const sel = $('#f-people');
    const opt = [...sel.options].find((o) => o.text === band);
    if (opt) sel.value = opt.value || opt.text;
  });
}

/* ---------------------------------------------------------------
   Enquiry form
---------------------------------------------------------------- */
const form = $('#lead-form');
const statusEl = $('#form-status');
const submitBtn = $('#submit');
const SUBMIT_LABEL = submitBtn.textContent;

// CTAs elsewhere on the page pre-fill the form
$$('[data-space]').forEach((a) => a.addEventListener('click', () => { $('#f-type').value = a.dataset.space; }));
$$('[data-interest]').forEach((a) => a.addEventListener('click', () => {
  const box = $$('input[name="stock"]', form).find((c) => c.value === a.dataset.interest);
  if (box) box.checked = true;
}));
$$('[data-note]').forEach((a) => a.addEventListener('click', () => {
  const msg = $('#f-msg');
  if (!msg.value.includes(a.dataset.note)) msg.value = (msg.value ? `${msg.value}\n` : '') + a.dataset.note;
}));

const normalisePhone = (v) => v.replace(/[\s\-()]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, '');

const rules = {
  name: (v) => v.trim().length >= 2 || 'Please enter your name.',
  org_name: (v) => v.trim().length >= 2 || 'Please enter your company or organisation.',
  phone: (v) => /^[6-9]\d{9}$/.test(normalisePhone(v)) || 'Please enter a valid 10-digit Indian mobile number.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
  city: (v) => v.trim().length >= 2 || 'Please enter your city.',
};

function showError(input, message) {
  const field = input.closest('.field');
  field.classList.add('invalid');
  input.setAttribute('aria-invalid', 'true');
  let err = $('.err', field);
  if (!err) {
    err = document.createElement('span');
    err.className = 'err';
    err.id = `${input.id}-err`;
    field.appendChild(err);
    input.setAttribute('aria-describedby', err.id);
  }
  err.textContent = message;
}
function clearError(input) {
  const field = input.closest('.field');
  if (!field) return;
  field.classList.remove('invalid');
  input.removeAttribute('aria-invalid');
  $('.err', field)?.remove();
}
const validateField = (input) => {
  const rule = rules[input.name];
  if (!rule) return true;
  const result = rule(input.value);
  if (result === true) { clearError(input); return true; }
  showError(input, result);
  return false;
};
Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener('blur', () => { if (input.value) validateField(input); });
  input.addEventListener('input', () => { if (input.closest('.field').classList.contains('invalid')) validateField(input); });
});

const readForm = () => {
  const fd = new FormData(form);
  return {
    name: fd.get('name').trim(),
    phone: normalisePhone(fd.get('phone')),
    email: fd.get('email').trim(),
    org_name: fd.get('org_name').trim(),
    org_type: fd.get('org_type') || '',
    stock: fd.getAll('stock'),
    city: fd.get('city').trim(),
    state: '',
    pincode: '',
    footfall: fd.get('footfall') || '',
    message: fd.get('message').trim(),
  };
};

const setStatus = (text, kind = '') => {
  statusEl.textContent = text;
  statusEl.className = `form-status ${kind}`;
};

// Firebase is loaded lazily so the rest of the site never depends on it
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
let firebasePromise;
const loadFirebase = () => {
  firebasePromise ??= (async () => {
    const [{ initializeApp }, fs, { getAuth, signInAnonymously }] = await Promise.all([
      import(`${FB}/firebase-app.js`),
      import(`${FB}/firebase-firestore.js`),
      import(`${FB}/firebase-auth.js`),
    ]);
    const app = initializeApp(firebaseConfig);
    try { await signInAnonymously(getAuth(app)); } catch { /* rules may not require auth */ }
    import(`${FB}/firebase-analytics.js`).then(({ getAnalytics }) => getAnalytics(app)).catch(() => {});
    return { db: fs.getFirestore(app), fs };
  })();
  firebasePromise.catch(() => { firebasePromise = undefined; });
  return firebasePromise;
};
(window.requestIdleCallback || ((cb) => setTimeout(cb, 2000)))(() => loadFirebase().catch(() => {}));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('');
  const invalid = Object.keys(rules).map((n) => form.elements[n]).filter((input) => !validateField(input));
  if (invalid.length) { invalid[0].focus(); return; }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  try {
    const { db, fs } = await loadFirebase();
    await fs.addDoc(fs.collection(db, 'vending_leads'), {
      ...readForm(),
      source: 'website',
      page: location.href,
      submittedAt: fs.serverTimestamp(),
    });
    form.reset();
    setStatus('Thank you — your request is in. We’ll call you shortly to plan the site assessment.', 'ok');
  } catch (err) {
    console.error(err);
    setStatus('Sorry, that didn’t go through. Please try again, send it on WhatsApp, or email admin.team@wrotron.in.', 'bad');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = SUBMIT_LABEL;
  }
});

// Send the same details over WhatsApp instead
$('#wa-send').addEventListener('click', () => {
  const d = readForm();
  const lines = [
    'Hi Wrotron, I’d like a free site assessment.',
    d.name && `Name: ${d.name}`,
    d.org_name && `Organisation: ${d.org_name}${d.org_type ? ` (${d.org_type})` : ''}`,
    d.city && `City: ${d.city}`,
    d.footfall && `People: ${d.footfall}`,
    d.stock.length && `Looking for: ${d.stock.join(', ')}`,
    d.phone && `Phone: ${d.phone}`,
    d.email && `Email: ${d.email}`,
    d.message && `Notes: ${d.message}`,
  ].filter(Boolean);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
});

$('#year').textContent = new Date().getFullYear();
