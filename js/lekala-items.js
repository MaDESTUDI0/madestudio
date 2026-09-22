/**
 * Renders the growing "Наборы лекал" list on shop.html from
 * /api/lekala-items — each item gets a "Добавить в корзину" button
 * (window.MadeCart, shared with courses.html). Checkout happens from
 * the header cart panel (js/cart.js), not here.
 *
 * No backend reachable, or nothing added yet -> falls back to the
 * static "Цена по запросу / Написать в WhatsApp" block already in
 * the page.
 */
(function(){
  var list = document.getElementById('lekalaItemsList');
  var fallbackMeta = document.getElementById('lekalaFallbackMeta');
  if (!list || !window.MadeCart) return;

  var API_BASE = window.MADE_API_BASE || '';

  function lang() {
    return document.documentElement.lang === 'kk' ? 'kk' : 'ru';
  }

  var STRINGS = {
    ru: { add: 'Добавить в корзину', inCart: 'В корзине ✓' },
    kk: { add: 'Себетке қосу', inCart: 'Себетте ✓' }
  };

  function money(n) {
    return Number(n).toLocaleString('ru-RU') + ' ₸';
  }

  fetch(API_BASE + '/api/lekala-items', { credentials: 'omit' })
    .then(function(res){
      if (!res.ok) throw new Error('lekala items unavailable');
      return res.json();
    })
    .then(function(items){
      items = (items || []).filter(function(item){ return !item.productType || item.productType === 'file'; });
      if (!items.length) return;

      items.forEach(function(item){
        var cartItem = { id: item.id, label: item.label, price: item.price };
        var li = document.createElement('li');
        li.className = 'course-tag lekala-pick';

        var text = document.createElement('span');
        text.textContent = item.label + (item.price ? ' — ' + money(item.price) : '');

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'course-cart-btn';
        function refresh() {
          var inCart = window.MadeCart.has(item.id);
          btn.textContent = STRINGS[lang()][inCart ? 'inCart' : 'add'];
          btn.classList.toggle('in-cart', inCart);
        }
        btn.addEventListener('click', function(){
          if (window.MadeCart.has(item.id)) window.MadeCart.remove(item.id);
          else window.MadeCart.add(cartItem);
        });
        document.addEventListener('made:cart-changed', refresh);
        refresh();

        li.appendChild(text);
        li.appendChild(btn);
        list.appendChild(li);
      });

      list.hidden = false;
      if (fallbackMeta) fallbackMeta.hidden = true;
    })
    .catch(function(){
      // No backend / nothing added yet — the static fallback stays.
    });
})();
