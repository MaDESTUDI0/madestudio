/**
 * Toggles the "Все работы / Работы MaDE / Работы учениц" filter on
 * gallery.html: shows/hides .gallery-item elements by their
 * data-category, cross-fading between states, and marks the active
 * filter button.
 */
(function(){
  var FADE_MS = 280;

  var buttons = document.querySelectorAll('.gallery-filter');
  var items = document.querySelectorAll('.gallery-item');
  if (!buttons.length || !items.length) return;

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
          // Force a reflow so the browser registers the opacity:0
          // start before we transition to 1, instead of skipping
          // straight to the end state.
          void item.offsetWidth;
          item.style.opacity = '1';
        } else if (!willShow && isShown) {
          item.style.opacity = '0';
          setTimeout(function(){ item.style.display = 'none'; }, FADE_MS);
        }
      });
    });
  });
})();
