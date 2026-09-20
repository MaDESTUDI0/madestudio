/**
 * Optional enhancement layer: if a backend (server/) is deployed and
 * reachable, pull the latest admin-edited copy for this page and patch
 * it in before re-rendering. On plain GitHub Pages (no backend) the
 * fetch fails or 404s and the page just keeps its baked-in RU/KK text —
 * nothing breaks.
 *
 * Set window.MADE_API_BASE before this script runs if the API is
 * hosted on a different origin than the static site, e.g.:
 *   <script>window.MADE_API_BASE = 'https://api.madestudio.kz';</script>
 */
(function(){
  var page = document.body.getAttribute('data-page');
  if(!page) return;

  var base = window.MADE_API_BASE || '';

  fetch(base + '/api/content/' + encodeURIComponent(page), { credentials: 'omit' })
    .then(function(res){
      if(!res.ok) throw new Error('content api unavailable');
      return res.json();
    })
    .then(function(data){
      Object.keys(data).forEach(function(key){
        var val = data[key];
        if(!val) return;
        var els = document.querySelectorAll('[data-key="' + CSS.escape(key) + '"]');
        els.forEach(function(el){
          if(val.ru) el.setAttribute('data-ru', val.ru);
          if(val.kk) el.setAttribute('data-kk', val.kk);
        });
      });
      if(typeof window.MADE_APPLY_LANG === 'function'){
        window.MADE_APPLY_LANG(document.documentElement.lang || 'ru');
      }
    })
    .catch(function(){
      // No backend reachable — the static, baked-in content already
      // rendered by site.js stands as-is.
    });
})();
