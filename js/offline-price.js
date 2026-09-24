/**
 * courses.html — the offline course/module prices are plain text (no
 * cart there, enrollment stays a WhatsApp conversation), so they can't
 * bind to a product_type/module_key like the online ones do. Instead
 * they read the same lekala_items catalog by slug (offline-full,
 * offline-m2..m4) — the owner adds/edits them in the admin panel just
 * like any other product, no page-source editing needed.
 *
 * No matching product yet for a given slug -> that element keeps
 * whatever static price is already in the HTML.
 */
(function(){
  var targets = document.querySelectorAll('[data-price-slug]');
  if (!targets.length) return;

  var API_BASE = window.MADE_API_BASE || '';

  function money(n) {
    return Number(n).toLocaleString('ru-RU') + ' ₸';
  }

  fetch(API_BASE + '/api/lekala-items', { credentials: 'omit' })
    .then(function(res){
      if (!res.ok) throw new Error('lekala items unavailable');
      return res.json();
    })
    .then(function(items){
      var bySlug = {};
      (items || []).forEach(function(item){
        if (item.slug) bySlug[item.slug] = item;
      });
      targets.forEach(function(el){
        var item = bySlug[el.dataset.priceSlug];
        if (item && item.price) el.textContent = money(item.price);
      });
    })
    .catch(function(){
      // No backend reachable — the static price already in the page stays.
    });
})();
