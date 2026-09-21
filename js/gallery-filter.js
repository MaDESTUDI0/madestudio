/**
 * Toggles the "Все работы / Работы MaDE / Работы учениц" filter on
 * gallery.html: shows/hides .gallery-item elements by their
 * data-category, cross-fading between states every time (not just
 * the first click), and marks the active filter button.
 *
 * The fade transition is set inline (highest specificity) rather
 * than via a CSS class, so it can't lose the cascade to the
 * .reveal / .reveal-dN scroll-entrance rules that already declare
 * their own opacity transition + delay on the same elements.
 */
(function(){
  var FADE_MS = 280;

  var buttons = document.querySelectorAll('.gallery-filter');
  var items = document.querySelectorAll('.gallery-item');
  if (!buttons.length || !items.length) return;

  items.forEach(function(item){
    item.style.transition = 'opacity ' + FADE_MS + 'ms ease';
  });

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      if (btn.classList.contains('active')) return;
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');

      var filter = btn.getAttribute('data-filter');

      items.forEach(function(item){
        var willShow = filter === 'all' || item.getAttribute('data-category') === filter;
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
