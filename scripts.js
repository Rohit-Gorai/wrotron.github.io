/**
 * Wrotron — site interactions
 * Navigation, photo fallbacks, tabs, carousel, coverage picker, enquiry form.
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const WHATSAPP_NUMBER = '918969309787';

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

let ticking = false;
const onScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 8);
  // Mobile quick-contact bar appears once the hero's own buttons are out of view
  mbar?.classList.toggle('show', window.scrollY > hero.offsetHeight * 0.7);
  ticking = false;
};
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

// Highlight the nav link for the section in view (none for sections not in the menu)
const navLinks = new Map($$('#nav-links a').map((a) => [a.getAttribute('href').slice(1), a]));
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.remove('active'));
    navLinks.get(entry.target.id)?.classList.add('active');
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => sectionObserver.observe(s));

/* ---------------------------------------------------------------
   Scroll reveal
   Any sliver of an element on screen reveals it (threshold 0), so tall
   blocks like the enquiry form can never get stuck invisible.
---------------------------------------------------------------- */
const reveals = $$('.reveal');
const revealAll = () => reveals.forEach((el) => el.classList.add('in'));
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
reveals.forEach((el) => {
  // Stagger siblings that sit in the same grid
  const siblings = $$(':scope > .reveal', el.parentElement);
  const idx = siblings.indexOf(el);
  if (siblings.length > 1 && idx > 0) el.style.transitionDelay = `${Math.min(idx * 70, 350)}ms`;
  revealObserver.observe(el);
});

/* ---------------------------------------------------------------
   Deep links (e.g. wrotron.in/#contact)
   The browser jumps to the section before fonts and photos finish
   loading, which can shift it. Show content straight away and settle
   on the right spot again once the page is ready, unless the visitor
   has started scrolling themselves.
---------------------------------------------------------------- */
const hashTarget = () => {
  try { return location.hash.length > 1 ? document.querySelector(decodeURIComponent(location.hash)) : null; } catch { return null; }
};
if (hashTarget()) {
  revealAll();
  let userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) =>
    window.addEventListener(ev, () => { userMoved = true; }, { once: true, passive: true }));
  const settle = () => { const t = hashTarget(); if (t && !userMoved) t.scrollIntoView({ block: 'start' }); };
  document.fonts?.ready.then(settle);
  window.addEventListener('load', () => { settle(); setTimeout(settle, 400); });
}

/* ---------------------------------------------------------------
   Machine tabs
---------------------------------------------------------------- */
const tabs = $$('[role="tab"]');
const indicator = $('.tabs-ind');
const moveIndicator = (tab) => {
  if (!indicator || !tab) return;
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
    const step = card ? card.offsetWidth + 18 : carousel.clientWidth * 0.8;
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

const goToContact = (focusEl) => {
  $('#contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  if (focusEl) setTimeout(() => focusEl.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
};
const statesWall = $('#states');
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
note.textContent = 'Dashed outline: union territories';
statesWall.appendChild(note);

/* ---------------------------------------------------------------
   Enquiry form
---------------------------------------------------------------- */
const form = $('#lead-form');
const statusEl = $('#form-status');
const submitBtn = $('#submit');
const SUBMIT_LABEL = submitBtn.textContent;

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
    submitBtn.textContent = SUBMIT_LABEL;
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
