/**
 * Toggles the "Все работы / Работы MaDE / Работы учениц" filter on
 * gallery.html: shows/hides .gallery-item elements by their
 * data-category and marks the active filter button.
 */
(function(){
  var buttons = document.querySelectorAll('.gallery-filter');
  var items = document.querySelectorAll('.gallery-item');
  if (!buttons.length || !items.length) return;

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');

      var filter = btn.getAttribute('data-filter');
      items.forEach(function(item){
        var match = filter === 'all' || item.getAttribute('data-category') === filter;
        item.style.display = match ? '' : 'none';
      });
    });
  });
})();
