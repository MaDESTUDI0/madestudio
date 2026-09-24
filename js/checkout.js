/**
 * checkout.html — reads the shared cart (window.MadeCart, same
 * localStorage the header widget uses), shows an editable order
 * summary, collects ФИО/телефон, and places the order. Reuses
 * js/cart.js's money/fill/openPayModal so the post-purchase "Оплатили?"
 * modal is identical to what it used to be inline in the cart panel.
 */
(function(){
  if (!window.MadeCart) return;

  var API_BASE = window.MADE_API_BASE || '';
  var KASPI_LINK = window.MADE_KASPI_LINK;

  function lang() {
    return document.documentElement.lang === 'kk' ? 'kk' : 'ru';
  }

  var STRINGS = {
    ru: {
      total: 'Итого',
      remove: 'Убрать',
      submitting: 'Оформляем…',
      submit: 'Оформить заказ',
      needLogin: 'Чтобы оформить заказ, сначала войдите или зарегистрируйтесь.',
      login: 'Войти',
      register: 'Регистрация',
      missingContact: 'Укажите ФИО и телефон.',
      fail: 'Не получилось оформить заказ, попробуйте ещё раз.',
      success: 'Заказ №{n} на {sum} создан. 1) Оплатите по ссылке Kaspi. 2) Пришлите нам чек в WhatsApp, указав номер заказа. После проверки откроем доступ к курсу и отправим файлы на почту.',
      pay: 'Оплатить через Kaspi',
      paidBtn: 'Оплатили?'
    },
    kk: {
      total: 'Барлығы',
      remove: 'Алып тастау',
      submitting: 'Рәсімделуде…',
      submit: 'Тапсырысты рәсімдеу',
      needLogin: 'Тапсырыс беру үшін алдымен кіріңіз немесе тіркеліңіз.',
      login: 'Кіру',
      register: 'Тіркелу',
      missingContact: 'Аты-жөніңіз бен телефоныңызды көрсетіңіз.',
      fail: 'Тапсырысты рәсімдеу сәтсіз аяқталды, қайталап көріңіз.',
      success: '№{n} тапсырыс ({sum}) жасалды. 1) Kaspi сілтемесі арқылы төлеңіз. 2) Тапсырыс нөмірін көрсетіп, түбіртекті WhatsApp-қа жіберіңіз. Тексергеннен кейін курсқа қолжетімділік ашылады, файлдар поштаға жіберіледі.',
      pay: 'Kaspi арқылы төлеу',
      paidBtn: 'Төледіңіз бе?'
    }
  };

  var itemsEl = document.getElementById('checkoutItems');
  var totalEl = document.getElementById('checkoutTotal');
  var emptyEl = document.getElementById('checkoutEmpty');
  var form = document.getElementById('checkoutForm');
  var submitBtn = document.getElementById('checkoutSubmitBtn');
  var errorEl = document.getElementById('checkoutError');
  var successEl = document.getElementById('checkoutSuccess');
  var successMsgEl = document.getElementById('checkoutSuccessMsg');
  var kaspiBtn = document.getElementById('checkoutKaspiBtn');
  var paidBtn = document.getElementById('checkoutPaidBtn');
  if (!form) return;

  function money(n) { return window.MadeCart.money(n); }
  function fill(t, v) { return window.MadeCart.fill(t, v); }

  function renderSummary() {
    var s = STRINGS[lang()];
    var items = window.MadeCart.getItems();
    itemsEl.innerHTML = '';

    if (!items.length) {
      emptyEl.hidden = false;
      totalEl.textContent = '';
      form.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    form.hidden = false;

    var total = 0;
    items.forEach(function(item){
      total += Number(item.price) || 0;
      var row = document.createElement('div');
      row.className = 'checkout-item';
      var label = document.createElement('span');
      label.textContent = item.label;
      var price = document.createElement('span');
      price.className = 'checkout-item-price';
      price.textContent = money(item.price);
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'checkout-item-remove';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', s.remove);
      removeBtn.addEventListener('click', function(){ window.MadeCart.remove(item.id); });
      row.appendChild(label);
      row.appendChild(price);
      row.appendChild(removeBtn);
      itemsEl.appendChild(row);
    });
    totalEl.textContent = s.total + ': ' + money(total);
  }

  submitBtn.textContent = STRINGS[lang()].submit;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var s = STRINGS[lang()];
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();
    var ids = window.MadeCart.getItems().map(function(i){ return i.id; });
    if (!ids.length) return;

    errorEl.textContent = '';
    errorEl.classList.remove('visible');

    if (!name || !phone) {
      errorEl.textContent = s.missingContact;
      errorEl.classList.add('visible');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = s.submitting;

    fetch(API_BASE + '/api/orders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds: ids, name: name, phone: phone })
    })
      .then(function(res){
        if (res.status === 401) throw { unauthorized: true };
        return res.json().then(function(body){
          if (!res.ok) throw body;
          return body;
        });
      })
      .then(function(order){
        window.MadeCart.clear();
        // Total from the server's reply, not the local cart — the
        // price in the order is whatever the catalog says right now.
        var serverItems = (order && order.items) || [];
        var total = serverItems.reduce(function(sum, i){ return sum + (Number(i.price) || 0); }, 0);
        var itemLabels = serverItems.map(function(i){ return i.label; }).join(', ');
        var vars = { n: order && order.id ? order.id : '', sum: money(total), items: itemLabels };

        form.hidden = true;
        successEl.hidden = false;
        successMsgEl.textContent = fill(s.success, vars);
        kaspiBtn.href = KASPI_LINK;
        kaspiBtn.textContent = s.pay;
        paidBtn.textContent = s.paidBtn;
        paidBtn.onclick = function(){ window.MadeCart.openPayModal(vars); };
      })
      .catch(function(err){
        if (err && err.unauthorized) {
          errorEl.innerHTML = s.needLogin + ' <a href="login.html">' + s.login + '</a> · <a href="register.html">' + s.register + '</a>';
        } else {
          errorEl.textContent = s.fail;
        }
        errorEl.classList.add('visible');
      })
      .finally(function(){
        submitBtn.disabled = false;
        submitBtn.textContent = s.submit;
      });
  });

  document.addEventListener('made:cart-changed', renderSummary);
  renderSummary();
})();
