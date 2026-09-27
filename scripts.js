/**
 * Wrotron — site interactions
 * Navigation, hero machine, tabs, carousel, coverage picker, enquiry form.
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG_NS = 'http://www.w3.org/2000/svg';
const WHATSAPP_NUMBER = '918969309787';

/* ---------------------------------------------------------------
   Navigation
---------------------------------------------------------------- */
const nav = $('#nav');
const navToggle = $('#nav-toggle');

const setNavOpen = (open) => {
  nav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
$$('#nav-links a').forEach((a) => a.addEventListener('click', () => setNavOpen(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNavOpen(false); });

const machine = $('.machine');
let ticking = false;
const onScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 8);
  if (!reduceMotion && machine && window.scrollY < window.innerHeight * 1.5) {
    machine.style.setProperty('--lift', `${Math.min(window.scrollY * -0.08, 0)}px`);
  }
  ticking = false;
};
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

// Highlight the nav link for the section in view
const navLinks = new Map($$('#nav-links a').map((a) => [a.getAttribute('href').slice(1), a]));
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.remove('active'));
    navLinks.get(entry.target.id)?.classList.add('active');
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach((_, id) => { const s = document.getElementById(id); if (s) sectionObserver.observe(s); });

/* ---------------------------------------------------------------
   Scroll reveal
---------------------------------------------------------------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach((el, i) => {
  // Stagger siblings that sit in the same grid
  const siblings = $$(':scope > .reveal', el.parentElement);
  const idx = siblings.indexOf(el);
  if (siblings.length > 1 && idx > 0) el.style.transitionDelay = `${Math.min(idx * 80, 400)}ms`;
  revealObserver.observe(el);
});

/* ---------------------------------------------------------------
   Hero machine — shelves, QR, keypad, screen
---------------------------------------------------------------- */
const svgEl = (tag, attrs) => {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

const shelves = $('#shelves');
if (shelves) {
  const palette = ['#f56300', '#0a84ff', '#ffd60a', '#34c759', '#ff375f', '#bf5af2', '#64d2ff', '#ff9f0a'];
  for (let row = 0; row < 5; row++) {
    const shelfY = 56 + 80 * (row + 1) - 8;
    shelves.appendChild(svgEl('rect', { x: 40, y: shelfY, width: 206, height: 4, fill: '#2c2c2e' }));
    for (let col = 0; col < 4; col++) {
      if (row === 1 && col === 2) continue; // this slot "drops" in the animation
      const x = 52 + col * 48;
      const h = [46, 40, 52, 44][(row + col) % 4];
      const color = palette[(row * 3 + col) % palette.length];
      const g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x, y: shelfY - h, width: 30, height: h, rx: 7, fill: color }));
      g.appendChild(svgEl('rect', { x: x + 5, y: shelfY - h + 6, width: 4, height: h - 12, rx: 2, fill: '#fff', opacity: 0.3 }));
      shelves.appendChild(g);
    }
  }
}

const qr = $('#qr');
if (qr) {
  // Decorative QR-style pattern (deterministic)
  const n = 17, s = 2;
  let seed = 7;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const finder = (x, y) => (x < 5 && y < 5) || (x > n - 6 && y < 5) || (x < 5 && y > n - 6);
  qr.appendChild(svgEl('rect', { x: -3, y: -3, width: n * s + 6, height: n * s + 6, rx: 3, fill: '#fff' }));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let on;
      if (finder(x, y)) {
        const lx = x > n - 6 ? x - (n - 5) : x;
        const ly = y > n - 6 ? y - (n - 5) : y;
        on = lx === 0 || ly === 0 || lx === 4 || ly === 4 || (lx === 2 && ly === 2);
      } else {
        on = rand() > 0.55;
      }
      if (on) qr.appendChild(svgEl('rect', { x: x * s, y: y * s, width: s, height: s, fill: '#1d1d1f' }));
    }
  }
}

const keypad = $('#keypad');
if (keypad) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      keypad.appendChild(svgEl('circle', { cx: 277 + c * 14, cy: 196 + r * 16, r: 5 }));
    }
  }
  keypad.appendChild(svgEl('rect', { x: 272, y: 276, width: 38, height: 6, rx: 3, fill: '#0b0b0d' }));
}

const screenText = $('#screen-text');
if (screenText && !reduceMotion) {
  const states = ['Choose', 'Scan to pay', 'Paid ✓', 'Enjoy!'];
  let i = 0;
  setInterval(() => { i = (i + 1) % states.length; screenText.textContent = states[i]; }, 1500);
}

/* ---------------------------------------------------------------
   Machine tabs
---------------------------------------------------------------- */
const tabs = $$('[role="tab"]');
const indicator = $('.tabs-ind');
const moveIndicator = (tab) => {
  if (!indicator) return;
  indicator.style.width = `${tab.offsetWidth}px`;
  indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
};
const selectTab = (tab, focus = false) => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  moveIndicator(tab);
  if (focus) tab.focus();
};
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    selectTab(next, true);
  });
});
if (tabs.length) {
  const initTabs = () => moveIndicator(tabs.find((t) => t.getAttribute('aria-selected') === 'true'));
  initTabs();
  window.addEventListener('resize', initTabs);
  document.fonts?.ready.then(initTabs);
}

/* ---------------------------------------------------------------
   Industries carousel
---------------------------------------------------------------- */
const carousel = $('#carousel');
const carButtons = $$('.car-btn');
const updateCarButtons = () => {
  const max = carousel.scrollWidth - carousel.clientWidth - 2;
  carButtons.forEach((b) => {
    b.disabled = b.dataset.dir === '-1' ? carousel.scrollLeft <= 2 : carousel.scrollLeft >= max;
  });
};
if (carousel) {
  carButtons.forEach((b) => b.addEventListener('click', () => {
    const card = $('.ind', carousel);
    const step = card ? card.offsetWidth + 20 : carousel.clientWidth * 0.8;
    carousel.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  carousel.addEventListener('scroll', updateCarButtons, { passive: true });
  window.addEventListener('resize', updateCarButtons);
  updateCarButtons();
}

/* ---------------------------------------------------------------
   Coverage — states & union territories of India
---------------------------------------------------------------- */
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];
const UTS = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const stateSelect = $('#f-state');
const addOptions = (label, list) => {
  const group = document.createElement('optgroup');
  group.label = label;
  list.forEach((name) => group.appendChild(new Option(name, name)));
  stateSelect.appendChild(group);
};
addOptions('States', STATES);
addOptions('Union Territories', UTS);

const statesWall = $('#states');
const goToContact = (focusEl) => {
  $('#contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  if (focusEl) setTimeout(() => focusEl.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
};
[...STATES.map((n) => [n, false]), ...UTS.map((n) => [n, true])].forEach(([name, isUT]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = name;
  b.setAttribute('role', 'listitem');
  if (isUT) b.className = 'ut';
  b.addEventListener('click', () => {
    stateSelect.value = name;
    clearError(stateSelect);
    goToContact($('#f-city'));
  });
  statesWall.appendChild(b);
});
const note = document.createElement('p');
note.className = 'states-note';
note.textContent = 'Outlined: union territories';
statesWall.appendChild(note);

/* ---------------------------------------------------------------
   Enquiry form
---------------------------------------------------------------- */
const form = $('#lead-form');
const statusEl = $('#form-status');
const submitBtn = $('#submit');

// CTAs elsewhere on the page pre-fill the form
$$('[data-space]').forEach((a) => a.addEventListener('click', () => {
  const radio = $$('input[name="org_type"]', form).find((r) => r.value === a.dataset.space);
  if (radio) radio.checked = true;
}));
$$('[data-stock]').forEach((a) => a.addEventListener('click', () => {
  $$('input[name="stock"]', form).forEach((c) => { c.checked = c.value === a.dataset.stock; });
  $('#stock-chips').classList.remove('invalid');
}));
$$('[data-note]').forEach((a) => a.addEventListener('click', () => {
  const msg = $('#f-msg');
  if (!msg.value.includes(a.dataset.note)) msg.value = (msg.value ? `${msg.value}\n` : '') + a.dataset.note;
}));

const normalisePhone = (v) => v.replace(/[\s\-()]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, '');

const rules = {
  name: (v) => v.trim().length >= 2 || 'Please enter your name.',
  phone: (v) => /^[6-9]\d{9}$/.test(normalisePhone(v)) || 'Please enter a valid 10-digit Indian mobile number.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
  org_name: (v) => v.trim().length >= 2 || 'Please enter your organisation’s name.',
  city: (v) => v.trim().length >= 2 || 'Please enter your city.',
  state: (v) => v !== '' || 'Please select your state or UT.',
  pincode: (v) => /^[1-9]\d{5}$/.test(v.trim()) || 'Please enter a valid 6-digit PIN code.',
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
$('#f-pin').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
$$('input[name="stock"]', form).forEach((c) => c.addEventListener('change', () => $('#stock-chips').classList.remove('invalid')));

const readForm = () => {
  const fd = new FormData(form);
  return {
    name: fd.get('name').trim(),
    phone: normalisePhone(fd.get('phone')),
    email: fd.get('email').trim(),
    org_name: fd.get('org_name').trim(),
    org_type: fd.get('org_type'),
    stock: fd.getAll('stock'),
    city: fd.get('city').trim(),
    state: fd.get('state'),
    pincode: fd.get('pincode').trim(),
    footfall: fd.get('footfall'),
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
// Warm up once the page is idle
(window.requestIdleCallback || ((cb) => setTimeout(cb, 2000)))(() => loadFirebase().catch(() => {}));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('');

  const invalid = Object.keys(rules).map((n) => form.elements[n]).filter((input) => !validateField(input));
  const stockOk = $$('input[name="stock"]:checked', form).length > 0;
  $('#stock-chips').classList.toggle('invalid', !stockOk);
  if (!stockOk) setStatus('Please choose at least one type of machine.', 'bad');
  if (invalid.length) { invalid[0].focus(); return; }
  if (!stockOk) return;

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
    setStatus('Thank you — your request is in. Our team will get in touch with you shortly.', 'ok');
  } catch (err) {
    console.error(err);
    setStatus('Sorry, that didn’t go through. Please try again, send it via WhatsApp, or email admin.team@wrotron.in.', 'bad');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Request my free survey';
  }
});

// Send the same details over WhatsApp instead
$('#wa-send').addEventListener('click', () => {
  const d = readForm();
  const lines = [
    'Hi Wrotron, I’d like a free site survey.',
    d.name && `Name: ${d.name}`,
    d.org_name && `Organisation: ${d.org_name} (${d.org_type})`,
    d.stock.length && `Interested in: ${d.stock.join(', ')}`,
    (d.city || d.state) && `Location: ${[d.city, d.state, d.pincode].filter(Boolean).join(', ')}`,
    d.footfall && `Daily footfall: ${d.footfall}`,
    d.phone && `Phone: ${d.phone}`,
    d.email && `Email: ${d.email}`,
    d.message && `Notes: ${d.message}`,
  ].filter(Boolean);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
});

/* ---------------------------------------------------------------
   Footer year
---------------------------------------------------------------- */
$('#year').textContent = new Date().getFullYear();
