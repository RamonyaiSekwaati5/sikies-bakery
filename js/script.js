/* =========================================================
   Sikie's Homemade Bakery — Shared front-end interactivity
   No backend / no database — all state lives in memory (JS)
   ========================================================= */

/* ---------- Mobile nav ---------- */
(function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(!toggle || !links) return;
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
})();

/* ---------- Scroll reveal ---------- */
(function initReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length || typeof IntersectionObserver === 'undefined') return;
  try{
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){ e.target.classList.add('in'); e.target.classList.remove('pre'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(el => {
      el.classList.add('pre');
      io.observe(el);
      // Safety net: if the observer never fires (e.g. odd layout), reveal anyway.
      setTimeout(() => el.classList.add('in'), 2500);
    });
  } catch(err){
    items.forEach(el => el.classList.add('in'));
  }
})();

/* ---------- Toast helper ---------- */
function showToast(message){
  let toast = document.querySelector('.toast');
  if(!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg><span></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}
window.showToast = showToast;

/* =========================================================
   CART — in-memory only (no localStorage / backend)
   Shared across the menu page via a simple module pattern.
   ========================================================= */
const BakeryCart = (function(){
  let items = {}; // id -> {name, price, qty}

  function add(id, name, price){
    if(!items[id]) items[id] = { name, price, qty: 0 };
    items[id].qty += 1;
    render();
  }
  function remove(id){
    if(!items[id]) return;
    items[id].qty -= 1;
    if(items[id].qty <= 0) delete items[id];
    render();
  }
  function count(){
    return Object.values(items).reduce((s,i) => s + i.qty, 0);
  }
  function total(){
    return Object.values(items).reduce((s,i) => s + i.qty * i.price, 0);
  }
  function render(){
    const countEls = document.querySelectorAll('.cart-count');
    countEls.forEach(el => el.textContent = count());

    document.querySelectorAll('.qty-display').forEach(el => {
      const id = el.dataset.id;
      el.textContent = items[id] ? items[id].qty : 0;
    });

    const list = document.querySelector('.cart-items');
    if(list){
      const entries = Object.entries(items);
      if(!entries.length){
        list.innerHTML = `<p class="cart-empty">Your basket is empty.<br>Add something warm from the menu ✨</p>`;
      } else {
        list.innerHTML = entries.map(([id, item]) => `
          <div class="cart-line">
            <div>
              <strong>${item.name}</strong>
              <span>R${item.price.toFixed(2)} × ${item.qty}</span>
            </div>
            <strong>R${(item.price * item.qty).toFixed(2)}</strong>
          </div>
        `).join('');
      }
    }
    const totalEl = document.querySelector('.cart-total-value');
    if(totalEl) totalEl.textContent = `R${total().toFixed(2)}`;
  }

  return { add, remove, count, total, render, items: () => items };
})();
window.BakeryCart = BakeryCart;

/* ---------- Menu item quantity buttons ---------- */
(function initMenuButtons(){
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { id, name, price } = btn.dataset;
      BakeryCart.add(id, name, parseFloat(price));
      showToast(`Added ${name} to your basket`);
    });
  });
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => BakeryCart.remove(btn.dataset.id));
  });
  BakeryCart.render();
})();

/* ---------- Cart drawer ---------- */
(function initCartDrawer(){
  const fab = document.querySelector('.cart-fab');
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.overlay');
  const closeBtn = document.querySelector('.cart-close');
  if(!fab || !drawer) return;

  const open = () => { drawer.classList.add('open'); overlay.classList.add('open'); };
  const close = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };

  fab.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  overlay && overlay.addEventListener('click', close);

  const checkoutBtn = document.querySelector('.cart-checkout');
  if(checkoutBtn){
    checkoutBtn.addEventListener('click', () => {
      if(BakeryCart.count() === 0){
        showToast('Your basket is empty');
        return;
      }
      showToast('Demo order placed — thank you! 🍞');
      close();
    });
  }
})();

/* =========================================================
   LOGIN — demo-only credential check, in-memory
   ========================================================= */
(function initLogin(){
  const form = document.querySelector('#login-form');
  if(!form) return;

  const DEMO_USER = { email: 'demo@sikies.co.za', password: 'bakery123' };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('#login-email');
    const password = form.querySelector('#login-password');
    const errorBox = document.querySelector('#login-error');
    const btn = form.querySelector('button[type="submit"]');

    let valid = true;
    [email, password].forEach(input => {
      const field = input.closest('.field');
      if(!input.value.trim()){
        field.classList.add('invalid');
        valid = false;
      } else {
        field.classList.remove('invalid');
      }
    });
    if(!valid) return;

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Signing in…';
    errorBox.style.display = 'none';

    setTimeout(() => {
      if(email.value.trim().toLowerCase() === DEMO_USER.email && password.value === DEMO_USER.password){
        btn.textContent = 'Success — redirecting…';
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
      } else {
        errorBox.style.display = 'flex';
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }, 700);
  });

  const fillDemo = document.querySelector('#fill-demo');
  if(fillDemo){
    fillDemo.addEventListener('click', () => {
      form.querySelector('#login-email').value = DEMO_USER.email;
      form.querySelector('#login-password').value = DEMO_USER.password;
      showToast('Demo credentials filled in');
    });
  }
})();

/* =========================================================
   CONTACT FORM — front-end only validation + confirmation
   ========================================================= */
(function initContactForm(){
  const form = document.querySelector('#contact-form');
  if(!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    const requiredFields = form.querySelectorAll('[data-required]');
    requiredFields.forEach(input => {
      const field = input.closest('.field');
      const isEmail = input.type === 'email';
      const filled = input.value.trim().length > 0;
      const emailOk = !isEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if(!filled || !emailOk){
        field.classList.add('invalid');
        valid = false;
      } else {
        field.classList.remove('invalid');
      }
    });
    if(!valid) return;

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    setTimeout(() => {
      btn.textContent = 'Message sent ✓';
      showToast('Thanks! Sikie will reply to your message shortly.');
      form.reset();
      setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 1800);
    }, 800);
  });
})();

/* =========================================================
   DASHBOARD — demo order status interactivity
   ========================================================= */
(function initDashboard(){
  const buttons = document.querySelectorAll('[data-advance-order]');
  if(!buttons.length) return;

  const stages = ['preparing', 'baking', 'ready', 'delivered'];
  const labels = { preparing: 'Preparing', baking: 'Baking', ready: 'Ready for pickup', delivered: 'Delivered' };
  const widths = { preparing: '25%', baking: '55%', ready: '85%', delivered: '100%' };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const pill = row.querySelector('.status-pill');
      const fill = row.querySelector('.progress-fill');
      let current = stages.findIndex(s => pill.classList.contains(`status-${s}`));
      if(current < stages.length - 1){
        pill.classList.remove(`status-${stages[current]}`);
        current += 1;
        pill.classList.add(`status-${stages[current]}`);
        pill.textContent = labels[stages[current]];
        if(fill) fill.style.width = widths[stages[current]];
        showToast(`Order updated to “${labels[stages[current]]}”`);
      }
      if(current === stages.length - 1){
        btn.disabled = true;
        btn.textContent = 'Completed';
      }
    });
  });

  /* Sidebar tab switching (demo sections) */
  const tabs = document.querySelectorAll('[data-dash-tab]');
  const panels = document.querySelectorAll('[data-dash-panel]');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.dashTab;
      panels.forEach(p => p.style.display = (p.dataset.dashPanel === target) ? 'block' : 'none');
    });
  });
})();

/* =========================================================
   MENU FILTER — category pills
   ========================================================= */
(function initMenuFilter(){
  const pills = document.querySelectorAll('[data-filter]');
  const items = document.querySelectorAll('[data-category]');
  if(!pills.length) return;

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;
      items.forEach(item => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.style.display = show ? '' : 'none';
      });
    });
  });
})();

/* ---------- Newsletter (footer) demo ---------- */
(function initNewsletter(){
  const form = document.querySelector('#newsletter-form');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input');
    if(!input.value.trim()){ return; }
    showToast('Subscribed! Fresh bread news is on its way 🌾');
    form.reset();
  });
})();

/* ---------- Set active nav link based on current page ---------- */
(function markActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if(href === path) a.classList.add('active');
  });
})();
