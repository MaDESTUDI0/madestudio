/**
 * Wires real prices + "Добавить в корзину" onto shop.html products,
 * sourced from /api/lekala-items (product_type 'file'). Items with a
 * slug bind to one of the fixed static product cards
 * ([data-product-slug]); everything else is appended to the generic
 * "Наборы лекал" list. Checkout happens from the header cart
 * (js/cart.js), not here.
 *
 * No backend reachable, or nothing added for a given card -> that
 * card keeps its static "Цена по запросу / Написать в WhatsApp"
 * fallback already in the page.
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

  function buildCartButton(cartItem) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'course-cart-btn';
    function refresh() {
      var inCart = window.MadeCart.has(cartItem.id);
      btn.textContent = STRINGS[lang()][inCart ? 'inCart' : 'add'];
      btn.classList.toggle('in-cart', inCart);
    }
    btn.addEventListener('click', function(){
      if (window.MadeCart.has(cartItem.id)) window.MadeCart.remove(cartItem.id);
      else window.MadeCart.add(cartItem);
    });
    document.addEventListener('made:cart-changed', refresh);
    refresh();
    return btn;
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

        if (item.slug) {
          var card = document.querySelector('[data-product-slug="' + item.slug + '"]');
          if (!card) return;
          var meta = card.querySelector('.product-meta');
          meta.innerHTML = '';
          var priceEl = document.createElement('span');
          priceEl.className = 'product-price';
          priceEl.textContent = money(item.price);
          meta.appendChild(priceEl);
          meta.appendChild(buildCartButton(cartItem));
          return;
        }

        var li = document.createElement('li');
        li.className = 'course-tag lekala-pick';
        var text = document.createElement('span');
        text.textContent = item.label + (item.price ? ' — ' + money(item.price) : '');
        li.appendChild(text);
        li.appendChild(buildCartButton(cartItem));
        list.appendChild(li);
      });

      list.hidden = false;
      if (fallbackMeta) fallbackMeta.hidden = true;
    })
    .catch(function(){
      // No backend / nothing added yet — the static fallback stays.
    });
})();
