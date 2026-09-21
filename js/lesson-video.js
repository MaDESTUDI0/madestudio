/**
 * Each lesson row in the cabinet's module lists carries a hidden
 * .lesson-video-url holder (data-key="video-lesson.mN.n", filled in
 * from the admin panel). When a link is set, swap the "Скоро" badge
 * for a "Смотреть" link to the video instead of leaving it a dead
 * placeholder forever.
 */
(function(){
  function render() {
    document.querySelectorAll('.lesson-row').forEach(function(row){
      var holder = row.querySelector('.lesson-video-url');
      var badge = row.querySelector('.lesson-badge');
      if (!holder || !badge) return;

      var url = (holder.getAttribute('data-ru') || holder.getAttribute('data-kk') || '').trim();

      if (!url) {
        if (badge.tagName === 'A') {
          var span = document.createElement('span');
          span.className = 'lesson-badge';
          span.setAttribute('data-ru', 'Скоро');
          span.setAttribute('data-kk', 'Жақында');
          span.textContent = (document.documentElement.lang === 'kk') ? 'Жақында' : 'Скоро';
          badge.replaceWith(span);
        }
        return;
      }

      if (badge.tagName === 'A' && badge.href === url) return;

      var link = document.createElement('a');
      link.className = 'lesson-badge lesson-badge-ready';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('data-ru', 'Смотреть');
      link.setAttribute('data-kk', 'Қарау');
      link.textContent = (document.documentElement.lang === 'kk') ? 'Қарау' : 'Смотреть';
      badge.replaceWith(link);
    });
  }

  render();

  var prevApply = window.MADE_APPLY_LANG;
  window.MADE_APPLY_LANG = function(lang){
    if (prevApply) prevApply(lang);
    render();
  };
})();
