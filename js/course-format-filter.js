/**
 * Toggles the "Офлайн-курс / Онлайн-курс" format switch on
 * courses.html — shows/hides the matching [data-format] sections
 * with a cross-fade, mirroring gallery-filter.js's approach.
 */
(function(){
  var FADE_MS = 280;

  var buttons = document.querySelectorAll('.gallery-filter[data-filter="offline"], .gallery-filter[data-filter="online"]');
  var panels = document.querySelectorAll('[data-format]');
  if (!buttons.length || !panels.length) return;

  panels.forEach(function(panel){
    panel.style.transition = 'opacity ' + FADE_MS + 'ms ease';
  });

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      if (btn.classList.contains('active')) return;
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');

      var format = btn.getAttribute('data-filter');

      panels.forEach(function(panel){
        var willShow = panel.getAttribute('data-format') === format;
        // Checking style.display alone isn't enough: the initially-
        // hidden panel is hidden via the `hidden` attribute, not an
        // inline style, so it would otherwise be misread as "shown".
        var isShown = !panel.hidden && panel.style.display !== 'none';

        if (willShow && !isShown) {
          panel.hidden = false;
          panel.style.display = '';
          panel.style.opacity = '0';
          requestAnimationFrame(function(){
            requestAnimationFrame(function(){
              panel.style.opacity = '1';
            });
          });
        } else if (!willShow && isShown) {
          panel.style.opacity = '0';
          setTimeout(function(){
            panel.style.display = 'none';
            panel.hidden = true;
          }, FADE_MS);
        }
      });
    });
  });
})();
