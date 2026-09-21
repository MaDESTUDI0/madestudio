/**
 * Renders the growing "Наборы лекал" list on shop.html from
 * /api/lekala-items as a pick-and-order cart: select one or more
 * fasons, "Оформить заказ" creates an order (requires login — no
 * payment gateway, so the customer still pays by hand and the owner
 * confirms it in the admin panel, which is what actually triggers
 * the automatic email with the files).
 *
 * No backend reachable, or nothing added yet -> falls back to the
 * static "Цена по запросу / Написать в WhatsApp" block already in
 * the page.
 */
(function(){
  var list = document.getElementById('lekalaItemsList');
  var cartBar = document.getElementById('lekalaCartBar');
  var cartTotal = document.getElementById('lekalaCartTotal');
  var orderBtn = document.getElementById('lekalaOrderBtn');
  var orderStatus = document.getElementById('lekalaOrderStatus');
  var fallbackMeta = document.getElementById('lekalaFallbackMeta');
  if (!list) return;

  var API_BASE = window.MADE_API_BASE || '';
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
      success: 'Заказ отправлен! Оплатите переводом — реквизиты пришлём в WhatsApp, после оплаты вы получите файлы на почту.',
      fail: 'Не получилось оформить заказ, попробуйте ещё раз.',
      total: 'Итого'
    },
    kk: {
      order: 'Тапсырыс беру',
      sending: 'Жіберілуде…',
      needLogin: 'Тапсырыс беру үшін алдымен кіріңіз немесе тіркеліңіз.',
      login: 'Кіру',
      register: 'Тіркелу',
      success: 'Тапсырыс жіберілді! Аударыммен төлеңіз — деректемелерді WhatsApp-қа жібереміз, төлемнен кейін файлдар поштаңызға келеді.',
      fail: 'Тапсырысты рәсімдеу сәтсіз аяқталды, қайталап көріңіз.',
      total: 'Барлығы'
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

  orderBtn.addEventListener('click', function(){
    var ids = Object.keys(selected).filter(function(id){ return selected[id]; }).map(Number);
    if (!ids.length) return;

    orderBtn.disabled = true;
    orderBtn.textContent = STRINGS[lang()].sending;
    orderStatus.className = 'lekala-order-status';
    orderStatus.textContent = '';

    api('/api/orders', { method: 'POST', body: JSON.stringify({ itemIds: ids }) })
      .then(function(){
        orderStatus.textContent = STRINGS[lang()].success;
        orderStatus.className = 'lekala-order-status ok';
        selected = {};
        list.querySelectorAll('input[type="checkbox"]').forEach(function(cb){ cb.checked = false; });
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
      if (!res.ok) throw new Error('lekala items unavailable');
      return res.json();
    })
    .then(function(items){
      if (!items || !items.length) return;

      items.forEach(function(item){
        itemsById[item.id] = item;
        var li = document.createElement('li');
        li.className = 'course-tag lekala-pick';
        var labelEl = document.createElement('label');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', function(){
          selected[item.id] = checkbox.checked;
          updateCartBar();
        });
        labelEl.appendChild(checkbox);
        var text = document.createElement('span');
        text.textContent = item.label + (item.price ? ' — ' + money(item.price) : '');
        labelEl.appendChild(text);
        li.appendChild(labelEl);
        list.appendChild(li);
      });

      list.hidden = false;
      cartBar.hidden = false;
      orderBtn.textContent = STRINGS[lang()].order;
      if (fallbackMeta) fallbackMeta.hidden = true;
    })
    .catch(function(){
      // No backend / nothing added yet — the static fallback stays.
    });
})();
