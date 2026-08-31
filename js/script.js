/* =========================================================
   Sikie's Homemade Bakery — Shared front-end interactivity
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
   CART
   ========================================================= */
const BakeryCart = (function(){
  let items = JSON.parse(localStorage.getItem('sikies_cart')) || {}; 

  function save(){
    localStorage.setItem('sikies_cart', JSON.stringify(items));
  }

  function add(id, name, price){
    if(!items[id]) items[id] = { name, price, qty: 0 };
    items[id].qty += 1;
    save();
    render();
  }
  
  function remove(id){
    if(!items[id]) return;
    items[id].qty -= 1;
    if(items[id].qty <= 0) delete items[id];
    save();
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
              <div class="cart-controls">
                <button class="cart-minus" data-id="${id}">−</button>
                <span>${item.qty}</span>
                <button class="cart-plus" data-id="${id}">+</button>
                <button class="cart-remove-btn" data-id="${id}">✕</button>
              </div>
              <span class="cart-price-each">R${item.price.toFixed(2)} each</span>
            </div>
            <strong class="cart-item-total">R${(item.price * item.qty).toFixed(2)}</strong>
          </div>
        `).join('');

        // Attach events to the new buttons
        list.querySelectorAll('.cart-plus').forEach(btn => {
          btn.onclick = () => {
            const id = btn.dataset.id;
            if(items[id]) {
              items[id].qty += 1;
              save();
              render();
            }
          };
        });

        list.querySelectorAll('.cart-minus').forEach(btn => {
          btn.onclick = () => {
            const id = btn.dataset.id;
            if(items[id]) {
              items[id].qty -= 1;
              if(items[id].qty <= 0) delete items[id];
              save();
              render();
            }
          };
        });

        list.querySelectorAll('.cart-remove-btn').forEach(btn => {
          btn.onclick = () => {
            const id = btn.dataset.id;
            delete items[id];
            save();
            render();
          };
        });
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
      localStorage.setItem('sikies_cart', JSON.stringify(BakeryCart.items()));
      window.location.href = 'checkout.html';
    });
  }
})();

/* =========================================================
   LOGIN
   ========================================================= */
(function initLogin(){
  const form = document.querySelector('#login-form');
  if(!form) return;

  const DEMO_USER = { email: 'sikie-admin', password: 'staff2026' }; 

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('#login-email');
    const password = form.querySelector('#login-password');
    const errorBox = document.querySelector('#login-error');
    const btn = form.querySelector('button[type="submit"]');

    if(!email.value.trim() || !password.value.trim()){
      return;
    }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Signing in…';
    errorBox.style.display = 'none';

    setTimeout(() => {
      if(email.value.trim().toLowerCase() === DEMO_USER.email && password.value === DEMO_USER.password){
        sessionStorage.setItem('isStaff', 'true');
        btn.textContent = 'Success — redirecting…';
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
      } else {
        errorBox.style.display = 'flex';
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }, 700);
  });
})();

/* =========================================================
   CONTACT FORM
   ========================================================= */
(function initContactForm(){
  const form = document.querySelector('#contact-form');
  if(!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
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
   MENU FILTER
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

/* ---------- Newsletter ---------- */
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

/* ---------- Set active nav link ---------- */
(function markActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if(href === path) a.classList.add('active');
  });
})();
