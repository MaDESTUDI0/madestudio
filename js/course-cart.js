/**
 * Wires real prices + "Добавить в корзину" onto the existing course-card
 * (whole course) and module-offer cards on courses.html, sourced from
 * /api/lekala-items (product_type 'course_full' / 'course_module').
 * Replaces the static "По запросу" + WhatsApp link with a price + cart
 * button once a matching product exists; cards with no matching product
 * are left exactly as they were. Checkout itself happens from the
 * header cart (js/cart.js), not here.
 */
(function(){
  if (!window.MadeCart) return;

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

  function buildButton(item) {
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
      else window.MadeCart.add(item);
    });
    document.addEventListener('made:cart-changed', refresh);
    refresh();
    return btn;
  }

  function injectButton(footer, item) {
    var isCourseCard = footer.classList.contains('course-card-footer');
    footer.innerHTML = '';

    var priceEl = document.createElement('span');
    priceEl.className = isCourseCard ? 'course-price' : 'module-offer-price';
    priceEl.textContent = money(item.price);

    if (isCourseCard) {
      var priceWrap = document.createElement('div');
      priceWrap.appendChild(priceEl);
      footer.appendChild(priceWrap);
    } else {
      footer.appendChild(priceEl);
    }
    footer.appendChild(buildButton(item));
  }

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
          injectButton(card.querySelector('.course-card-footer'), { id: item.id, label: item.label, price: item.price });
        } else if (item.productType === 'course_module' && item.moduleKey) {
          var mod = document.querySelector('[data-module-key="' + item.moduleKey + '"]');
          if (!mod) return;
          injectButton(mod.querySelector('.module-offer-footer'), { id: item.id, label: item.label, price: item.price });
        }
      });
    })
    .catch(function(){
      // No backend / nothing added yet — cards keep their static
      // "По запросу" + WhatsApp fallback, nothing to do here.
    });
})();
