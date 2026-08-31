/* =========================================================
   Sikie's Homemade Bakery — Front-end interactivity
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

/* ---------- Menu buttons ---------- */
(function initMenuButtons(){
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { id, name, price } = btn.dataset;
      BakeryCart.add(id, name, parseFloat(price));
      showToast(`Added ${name} to your basket`);
    });
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

    if(email.value.trim().toLowerCase() === DEMO_USER.email && password.value === DEMO_USER.password){
      sessionStorage.setItem('isStaff', 'true');
      btn.textContent = 'Success — redirecting…';
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    } else {
      errorBox.style.display = 'flex';
    }
  });
})();

/* ---------- Menu filter ---------- */
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
