/**
 * Site-wide shopping cart: a basket icon in the header (desktop nav +
 * mobile bar), same pattern as the account avatar widget. Cart state
 * lives in localStorage (made_cart_v1) so it survives navigating
 * between shop.html and courses.html — a customer can add pattern
 * files AND course modules to the same cart, then check out once.
 *
 * Other scripts add/remove items via window.MadeCart (add/remove/has/
 * getItems/clear) and listen for the 'made:cart-changed' event to
 * update their own "Добавить в корзину" button states.
 */
(function(){
  var STORAGE_KEY = 'made_cart_v1';
  // Kaspi has no merchant API on this account, so the buyer sends the
  // receipt here and the owner confirms the order in the admin panel.
  var RECEIPT_WHATSAPP = window.MADE_RECEIPT_WHATSAPP;

  function lang() {
    return document.documentElement.lang === 'kk' ? 'kk' : 'ru';
  }

  var STRINGS = {
    ru: {
      empty: 'Корзина пуста.',
      total: 'Итого',
      checkout: 'Перейти к оплате',
      remove: 'Убрать',
      // {n} = order number, {sum} = total, {items} = comma-joined labels
      // — the buyer quotes these when sending the receipt so the owner
      // can match it to the order.
      receiptMessage: 'Здравствуйте! Оплатил(а) заказ №{n} на {sum}, отправляю чек.\nСостав заказа: {items}',
      modalTitle: 'Подтверждение оплаты',
      modalBody: 'Напишите нам в WhatsApp и приложите скриншот чека об оплате — укажите номер заказа и что купили, так мы быстрее его найдём.',
      modalOrder: 'Заказ №{n} — {items} — {sum}',
      modalWaBtn: 'Написать в WhatsApp',
      title: 'Корзина'
    },
    kk: {
      empty: 'Себет бос.',
      total: 'Барлығы',
      checkout: 'Төлеуге өту',
      remove: 'Алып тастау',
      receiptMessage: 'Сәлеметсіз бе! №{n} тапсырысты ({sum}) төледім, түбіртекті жіберіп отырмын.\nТапсырыс құрамы: {items}',
      modalTitle: 'Төлемді растау',
      modalBody: 'WhatsApp-қа жазып, төлем түбіртегінің скриншотын салыңыз — тапсырыс нөмірін және не сатып алғаныңызды көрсетіңіз, солай жылдам табамыз.',
      modalOrder: 'Тапсырыс №{n} — {items} — {sum}',
      modalWaBtn: 'WhatsApp-қа жазу',
      title: 'Себет'
    }
  };

  function money(n) {
    return Number(n).toLocaleString('ru-RU') + ' ₸';
  }

  function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, function(_, key){
      return vars[key] != null ? vars[key] : '';
    });
  }

  function readCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
  }
  function writeCart(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('made:cart-changed'));
  }

  var Cart = {
    getItems: readCart,
    has: function(id) { return readCart().some(function(i){ return i.id === id; }); },
    add: function(item) {
      var items = readCart();
      if (items.some(function(i){ return i.id === item.id; })) return;
      items.push(item);
      writeCart(items);
    },
    remove: function(id) {
      writeCart(readCart().filter(function(i){ return i.id !== id; }));
    },
    clear: function() { writeCart([]); }
  };
  window.MadeCart = Cart;

  var BASKET_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
    '<path d="M3 7h18l-1.5 12.3a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 7Z"/>' +
    '<path d="M8 7V5.5a4 4 0 0 1 8 0V7"/></svg>';

  function buildWidget(extraClass) {
    var wrap = document.createElement('div');
    wrap.className = 'cart-widget ' + extraClass;
    wrap.innerHTML =
      '<button type="button" class="cart-btn" aria-haspopup="true" aria-expanded="false" aria-label="Корзина">' +
        BASKET_ICON +
        '<span class="cart-badge" hidden>0</span>' +
      '</button>' +
      '<div class="cart-panel">' +
        '<div class="cart-panel-title"></div>' +
        '<div class="cart-panel-items"></div>' +
        '<div class="cart-panel-total"></div>' +
        '<button type="button" class="btn btn-solid cart-checkout-btn"></button>' +
        '<p class="cart-panel-status"></p>' +
      '</div>';
    return wrap;
  }

  // Single shared "confirm payment" modal, reused by every cart widget —
  // simpler than one per widget, and it lives at the body level so it
  // isn't clipped by the cart panel's own small popover box.
  var payModal = document.createElement('div');
  payModal.className = 'pay-modal-overlay';
  payModal.hidden = true;
  payModal.innerHTML =
    '<div class="pay-modal" role="dialog" aria-modal="true">' +
      '<button type="button" class="pay-modal-close" aria-label="Закрыть"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6 18 18M18 6 6 18"/></svg></button>' +
      '<h3 class="pay-modal-title"></h3>' +
      '<p class="pay-modal-body"></p>' +
      '<p class="pay-modal-order"></p>' +
      '<a class="btn btn-solid pay-modal-wa" target="_blank" rel="noopener"></a>' +
    '</div>';
  document.body.appendChild(payModal);

  function closePayModal() { payModal.hidden = true; }
  payModal.addEventListener('click', function(e){
    if (e.target === payModal) closePayModal();
  });
  payModal.querySelector('.pay-modal-close').addEventListener('click', closePayModal);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closePayModal();
  });

  function openPayModal(vars) {
    var s = STRINGS[lang()];
    payModal.querySelector('.pay-modal-title').textContent = s.modalTitle;
    payModal.querySelector('.pay-modal-body').textContent = s.modalBody;
    payModal.querySelector('.pay-modal-order').textContent = fill(s.modalOrder, vars);
    var waLink = payModal.querySelector('.pay-modal-wa');
    waLink.href = RECEIPT_WHATSAPP + '?text=' + encodeURIComponent(fill(s.receiptMessage, vars));
    waLink.textContent = s.modalWaBtn;
    payModal.hidden = false;
  }

  // Exposed so checkout.js (a separate page, its own script) can reuse
  // the same modal and formatting instead of duplicating them.
  Cart.money = money;
  Cart.fill = fill;
  Cart.openPayModal = openPayModal;

  var mainNav = document.querySelector('nav.main-nav');
  var mobileBar = document.querySelector('.mobile-bar');
  if (!mainNav && !mobileBar) return;

  var widgets = [];

  if (mainNav) {
    var desktopWidget = buildWidget('cart-widget-desktop');
    var signupBtn = mainNav.querySelector('a[href="courses.html#signup"]');
    var authWidget = mainNav.querySelector('.auth-widget');
    if (authWidget) mainNav.insertBefore(desktopWidget, authWidget);
    else if (signupBtn) mainNav.insertBefore(desktopWidget, signupBtn);
    else mainNav.appendChild(desktopWidget);
    widgets.push(desktopWidget);
  }

  if (mobileBar) {
    var mobileWidget = buildWidget('cart-widget-mobile');
    var burger = mobileBar.querySelector('.burger');
    if (burger) mobileBar.insertBefore(mobileWidget, burger);
    else mobileBar.appendChild(mobileWidget);
    widgets.push(mobileWidget);
  }

  function closeAllPanels() {
    widgets.forEach(function(w){
      w.classList.remove('is-open');
      w.querySelector('.cart-btn').setAttribute('aria-expanded', 'false');
    });
  }

  function renderPanel(widget) {
    var s = STRINGS[lang()];
    var items = readCart();
    var itemsEl = widget.querySelector('.cart-panel-items');
    var totalEl = widget.querySelector('.cart-panel-total');
    var checkoutBtn = widget.querySelector('.cart-checkout-btn');
    var titleEl = widget.querySelector('.cart-panel-title');
    var statusEl = widget.querySelector('.cart-panel-status');

    titleEl.textContent = s.title;
    checkoutBtn.textContent = s.checkout;
    statusEl.textContent = '';
    statusEl.className = 'cart-panel-status';

    itemsEl.innerHTML = '';
    if (!items.length) {
      itemsEl.innerHTML = '<p class="cart-empty">' + s.empty + '</p>';
      totalEl.textContent = '';
      checkoutBtn.hidden = true;
      return;
    }
    checkoutBtn.hidden = false;

    var total = 0;
    items.forEach(function(item){
      total += Number(item.price) || 0;
      var row = document.createElement('div');
      row.className = 'cart-item';
      var label = document.createElement('span');
      label.textContent = item.label + ' — ' + money(item.price);
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'cart-item-remove';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', s.remove);
      removeBtn.addEventListener('click', function(){ Cart.remove(item.id); });
      row.appendChild(label);
      row.appendChild(removeBtn);
      itemsEl.appendChild(row);
    });
    totalEl.textContent = s.total + ': ' + money(total);
  }

  function renderBadge(widget) {
    var count = readCart().length;
    var badge = widget.querySelector('.cart-badge');
    badge.textContent = count;
    badge.hidden = !count;
  }

  function renderAll() {
    widgets.forEach(function(w){ renderPanel(w); renderBadge(w); });
  }

  function wireWidget(widget) {
    var btn = widget.querySelector('.cart-btn');
    var panel = widget.querySelector('.cart-panel');
    var checkoutBtn = widget.querySelector('.cart-checkout-btn');

    panel.addEventListener('click', function(e){ e.stopPropagation(); });

    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = widget.classList.contains('is-open');
      closeAllPanels();
      if (!isOpen) {
        widget.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    // The actual order (contact details, review, submit) happens on
    // its own page now — this button just takes the cart there.
    checkoutBtn.addEventListener('click', function(){
      if (!readCart().length) return;
      window.location.href = 'checkout.html';
    });
  }

  widgets.forEach(wireWidget);
  document.addEventListener('click', closeAllPanels);
  document.addEventListener('made:cart-changed', renderAll);

  renderAll();
})();
