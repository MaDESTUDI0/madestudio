/**
 * Wires real prices + "add to cart" onto the existing course-card
 * (whole course) and module-offer cards on courses.html, sourced from
 * /api/lekala-items (product_type 'course_full' / 'course_module').
 * Replaces the static "По запросу" + WhatsApp link with a checkbox
 * once a matching product exists; cards with no matching product are
 * left exactly as they were (still "По запросу" + WhatsApp).
 *
 * "Оформить заказ" creates a real order (same /api/orders endpoint as
 * the shop cart) — payment is a stub for now: no live Kaspi API, so
 * the order is created and the customer is pointed at the Kaspi
 * payment link, then waits. Nothing is delivered automatically yet.
 */
(function(){
  var cartBar = document.getElementById('courseCartBar');
  if (!cartBar) return;

  var API_BASE = window.MADE_API_BASE || '';
  var cartTotal = document.getElementById('courseCartTotal');
  var orderBtn = document.getElementById('courseOrderBtn');
  var orderStatus = document.getElementById('courseOrderStatus');
  var KASPI_LINK = 'https://pay.kaspi.kz/pay/75lrsqpf';

  var selected = {};
  var itemsById = {};

  function lang() {
    return document.documentElement.lang === 'kk' ? 'kk' : 'ru';
  }

  var STRINGS = {
    ru: {
      order: 'Оформить заказ',
      sending: 'Отправляем…',
      needLogin: 'Чтобы оформить заказ, сначала войдите или зарегистрируйтесь.',
      login: 'Войти',
      register: 'Регистрация',
      success: 'Заказ создан. Оплатите по ссылке Kaspi — после оплаты мы подтвердим заказ, и курс откроется в личном кабинете.',
      pay: 'Оплатить через Kaspi',
      fail: 'Не получилось оформить заказ, попробуйте ещё раз.',
      total: 'Итого',
      add: 'Добавить в заказ'
    },
    kk: {
      order: 'Тапсырыс беру',
      sending: 'Жіберілуде…',
      needLogin: 'Тапсырыс беру үшін алдымен кіріңіз немесе тіркеліңіз.',
      login: 'Кіру',
      register: 'Тіркелу',
      success: 'Тапсырыс жасалды. Kaspi сілтемесі арқылы төлеңіз — төлемнен кейін тапсырысты растаймыз, курс жеке кабинетте ашылады.',
      pay: 'Kaspi арқылы төлеу',
      fail: 'Тапсырысты рәсімдеу сәтсіз аяқталды, қайталап көріңіз.',
      total: 'Барлығы',
      add: 'Тапсырысқа қосу'
    }
  };

  function money(n) {
    return Number(n).toLocaleString('ru-RU') + ' ₸';
  }

  function updateCartBar() {
    var ids = Object.keys(selected).filter(function(id){ return selected[id]; });
    var total = ids.reduce(function(sum, id){ return sum + (Number(itemsById[id].price) || 0); }, 0);
    orderBtn.disabled = !ids.length;
    cartTotal.textContent = ids.length
      ? STRINGS[lang()].total + ': ' + money(total) + ' (' + ids.length + ')'
      : '';
  }

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

  function injectCheckbox(footer, item) {
    var isCourseCard = footer.classList.contains('course-card-footer');
    footer.innerHTML = '';

    var priceEl = document.createElement('span');
    priceEl.className = isCourseCard ? 'course-price' : 'module-offer-price';
    priceEl.textContent = money(item.price);

    var label = document.createElement('label');
    label.className = 'course-cart-pick';
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', function(){
      selected[item.id] = checkbox.checked;
      updateCartBar();
    });
    var text = document.createElement('span');
    text.textContent = STRINGS[lang()].add;
    label.appendChild(checkbox);
    label.appendChild(text);

    if (isCourseCard) {
      var priceWrap = document.createElement('div');
      priceWrap.appendChild(priceEl);
      footer.appendChild(priceWrap);
    } else {
      footer.appendChild(priceEl);
    }
    footer.appendChild(label);
  }

  orderBtn.addEventListener('click', function(){
    var ids = Object.keys(selected).filter(function(id){ return selected[id]; }).map(Number);
    if (!ids.length) return;

    orderBtn.disabled = true;
    orderBtn.textContent = STRINGS[lang()].sending;
    orderStatus.className = 'lekala-order-status';
    orderStatus.textContent = '';

    api('/api/orders', { method: 'POST', body: JSON.stringify({ itemIds: ids }) })
      .then(function(){
        orderStatus.innerHTML = STRINGS[lang()].success +
          ' <a class="btn btn-solid" href="' + KASPI_LINK + '" target="_blank" rel="noopener">' + STRINGS[lang()].pay + '</a>';
        orderStatus.className = 'lekala-order-status ok';
        selected = {};
        document.querySelectorAll('.course-cart-pick input[type="checkbox"]').forEach(function(cb){ cb.checked = false; });
        updateCartBar();
        orderBtn.textContent = STRINGS[lang()].order;
      })
      .catch(function(err){
        if (err && err.unauthorized) {
          orderStatus.innerHTML = STRINGS[lang()].needLogin +
            ' <a href="login.html">' + STRINGS[lang()].login + '</a> · ' +
            '<a href="register.html">' + STRINGS[lang()].register + '</a>';
          orderStatus.className = 'lekala-order-status err';
        } else {
          orderStatus.textContent = STRINGS[lang()].fail;
          orderStatus.className = 'lekala-order-status err';
        }
        orderBtn.disabled = false;
        orderBtn.textContent = STRINGS[lang()].order;
      });
  });

  fetch(API_BASE + '/api/lekala-items', { credentials: 'omit' })
    .then(function(res){
      if (!res.ok) throw new Error('items unavailable');
      return res.json();
    })
    .then(function(items){
      items.forEach(function(item){
        if (item.productType === 'course_full') {
          var card = document.querySelector('[data-product-type="course_full"]');
          if (!card) return;
          itemsById[item.id] = item;
          injectCheckbox(card.querySelector('.course-card-footer'), item);
        } else if (item.productType === 'course_module' && item.moduleKey) {
          var mod = document.querySelector('[data-module-key="' + item.moduleKey + '"]');
          if (!mod) return;
          itemsById[item.id] = item;
          injectCheckbox(mod.querySelector('.module-offer-footer'), item);
        }
      });
      if (Object.keys(itemsById).length) cartBar.hidden = false;
      orderBtn.textContent = STRINGS[lang()].order;
    })
    .catch(function(){
      // No backend / nothing added yet — cards keep their static
      // "По запросу" + WhatsApp fallback, nothing to do here.
    });
})();
