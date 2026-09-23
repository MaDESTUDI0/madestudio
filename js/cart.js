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
  var API_BASE = window.MADE_API_BASE || '';
  var KASPI_LINK = 'https://pay.kaspi.kz/pay/75lrsqpf';
  // Kaspi has no merchant API on this account, so the buyer sends the
  // receipt here and the owner confirms the order in the admin panel.
  var RECEIPT_WHATSAPP = 'https://wa.me/77786721798';

  function lang() {
    return document.documentElement.lang === 'kk' ? 'kk' : 'ru';
  }

  var STRINGS = {
    ru: {
      empty: 'Корзина пуста.',
      total: 'Итого',
      checkout: 'Перейти к оплате',
      sending: 'Оформляем…',
      remove: 'Убрать',
      needLogin: 'Чтобы оформить заказ, сначала войдите или зарегистрируйтесь.',
      login: 'Войти',
      register: 'Регистрация',
      // {n} = order number, {sum} = total — the buyer quotes both when
      // sending the receipt so the owner can match it to the order.
      success: 'Заказ №{n} на {sum} создан. 1) Оплатите по ссылке Kaspi. 2) Пришлите нам чек в WhatsApp, указав номер заказа. После проверки откроем доступ к курсу и отправим файлы на почту.',
      pay: 'Оплатить через Kaspi',
      sendReceipt: 'Отправить чек в WhatsApp',
      receiptMessage: 'Здравствуйте! Оплатил(а) заказ №{n} на {sum}, отправляю чек.',
      fail: 'Не получилось оформить заказ, попробуйте ещё раз.',
      title: 'Корзина'
    },
    kk: {
      empty: 'Себет бос.',
      total: 'Барлығы',
      checkout: 'Төлеуге өту',
      sending: 'Рәсімделуде…',
      remove: 'Алып тастау',
      needLogin: 'Тапсырыс беру үшін алдымен кіріңіз немесе тіркеліңіз.',
      login: 'Кіру',
      register: 'Тіркелу',
      success: '№{n} тапсырыс ({sum}) жасалды. 1) Kaspi сілтемесі арқылы төлеңіз. 2) Тапсырыс нөмірін көрсетіп, түбіртекті WhatsApp-қа жіберіңіз. Тексергеннен кейін курсқа қолжетімділік ашылады, файлдар поштаға жіберіледі.',
      pay: 'Kaspi арқылы төлеу',
      sendReceipt: 'Түбіртекті WhatsApp-қа жіберу',
      receiptMessage: 'Сәлеметсіз бе! №{n} тапсырысты ({sum}) төледім, түбіртекті жіберіп отырмын.',
      fail: 'Тапсырысты рәсімдеу сәтсіз аяқталды, қайталап көріңіз.',
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

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, function(ch){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
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

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = 'include';
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(API_BASE + path, opts).then(function(res){
      if (res.status === 401) throw { unauthorized: true };
      return res.json().then(function(body){
        if (!res.ok) throw body;
        return body;
      });
    });
  }

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
    var statusEl = widget.querySelector('.cart-panel-status');

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

    checkoutBtn.addEventListener('click', function(){
      var s = STRINGS[lang()];
      var ids = readCart().map(function(i){ return i.id; });
      if (!ids.length) return;

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = s.sending;
      statusEl.textContent = '';
      statusEl.className = 'cart-panel-status';

      api('/api/orders', { method: 'POST', body: JSON.stringify({ itemIds: ids }) })
        .then(function(order){
          Cart.clear();
          // Total comes from the server's reply, not the local cart: the
          // price in the order is whatever the catalog says right now.
          var serverItems = (order && order.items) || [];
          var total = serverItems.reduce(function(sum, i){ return sum + (Number(i.price) || 0); }, 0);
          var vars = { n: order && order.id ? order.id : '', sum: money(total) };
          var waHref = RECEIPT_WHATSAPP + '?text=' + encodeURIComponent(fill(s.receiptMessage, vars));
          statusEl.innerHTML = escapeHtml(fill(s.success, vars)) +
            ' <a class="btn btn-solid" href="' + KASPI_LINK + '" target="_blank" rel="noopener">' + s.pay + '</a>' +
            ' <a class="btn btn-outline" href="' + waHref + '" target="_blank" rel="noopener">' + s.sendReceipt + '</a>';
          statusEl.className = 'cart-panel-status ok';
        })
        .catch(function(err){
          if (err && err.unauthorized) {
            statusEl.innerHTML = s.needLogin + ' <a href="login.html">' + s.login + '</a> · <a href="register.html">' + s.register + '</a>';
          } else {
            statusEl.textContent = s.fail;
          }
          statusEl.className = 'cart-panel-status err';
        })
        .finally(function(){
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = s.checkout;
        });
    });
  }

  widgets.forEach(wireWidget);
  document.addEventListener('click', closeAllPanels);
  document.addEventListener('made:cart-changed', renderAll);

  renderAll();
})();
