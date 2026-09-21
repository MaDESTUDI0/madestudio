/**
 * gallery.html: renders the extra photos MaDE's owner uploaded via
 * the admin panel (/api/gallery-photos) alongside the static ones
 * already baked into the page, then wires up the
 * "Все работы / Работы MaDE / Работы учениц" filter — including
 * cross-fading every time you switch, not just the first click.
 */
(function(){
  var FADE_MS = 280;
  var API_BASE = window.MADE_API_BASE || '';

  var grid = document.querySelector('.gallery-grid');
  var buttons = document.querySelectorAll('.gallery-filter');
  if (!grid || !buttons.length) return;

  // A live-tracked list, not a static querySelectorAll snapshot —
  // photos fetched from the admin-uploaded set get pushed in here
  // once they're added to the DOM, so the filter buttons pick them
  // up too, not just the items baked into the HTML.
  var items = Array.prototype.slice.call(grid.querySelectorAll('.gallery-item'));
  var activeFilter = 'all';

  function wireItem(item) {
    item.style.transition = 'opacity ' + FADE_MS + 'ms ease';
  }
  items.forEach(wireItem);

  function applyFilterTo(item) {
    var willShow = activeFilter === 'all' || item.getAttribute('data-category') === activeFilter;
    item.style.display = willShow ? '' : 'none';
    item.style.opacity = willShow ? '1' : '0';
  }

  function addItem(category, imgSrc, alt) {
    var item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('data-category', category);
    var img = document.createElement('img');
    img.src = imgSrc;
    img.alt = alt || '';
    img.loading = 'lazy';
    item.appendChild(img);
    grid.appendChild(item);
    wireItem(item);
    applyFilterTo(item);
    items.push(item);
  }

  fetch(API_BASE + '/api/gallery-photos', { credentials: 'omit' })
    .then(function(res){
      if (!res.ok) throw new Error('gallery photos unavailable');
      return res.json();
    })
    .then(function(photos){
      photos.forEach(function(photo){
        addItem(photo.category, API_BASE + '/api/gallery-photos/' + photo.id + '/image', photo.alt);
      });
    })
    .catch(function(){
      // No backend reachable, or nothing uploaded yet — the
      // baked-in photos already on the page are enough on their own.
    });

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      if (btn.classList.contains('active')) return;
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');

      activeFilter = btn.getAttribute('data-filter');

      items.forEach(function(item){
        var willShow = activeFilter === 'all' || item.getAttribute('data-category') === activeFilter;
        var isShown = item.style.display !== 'none';

        if (willShow && !isShown) {
          item.style.display = '';
          item.style.opacity = '0';
          // Two rAFs (not just one, and not offsetWidth) reliably
          // land the opacity:0 start-state in a separate paint from
          // the opacity:1 end-state on every call, not just the
          // first — a single forced reflow can still get coalesced
          // with the next style write on repeat clicks.
          requestAnimationFrame(function(){
            requestAnimationFrame(function(){
              item.style.opacity = '1';
            });
          });
        } else if (!willShow && isShown) {
          item.style.opacity = '0';
          setTimeout(function(){ item.style.display = 'none'; }, FADE_MS);
        }
      });
    });
  });
})();
