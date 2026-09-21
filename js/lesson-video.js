/**
 * Each lesson row in the cabinet's module lists carries a hidden
 * .lesson-video-url holder (data-key="video-lesson-mN.n", filled in
 * from the admin panel). When a link is set, the "Скоро" badge becomes
 * a "Смотреть" toggle button that slides an embedded player open right
 * under the row — no navigating away to watch a lesson.
 */
(function(){
  var DURATION = 380;

  function toEmbedUrl(url) {
    url = (url || '').trim();
    if (!url) return null;
    var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    var vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1];
    return url;
  }

  function watchLabel() {
    return document.documentElement.lang === 'kk' ? 'Қарау' : 'Смотреть';
  }
  function hideLabel() {
    return document.documentElement.lang === 'kk' ? 'Жасыру' : 'Скрыть';
  }
  function soonLabel() {
    return document.documentElement.lang === 'kk' ? 'Жақында' : 'Скоро';
  }

  function makePanel(embedUrl) {
    var panel = document.createElement('div');
    panel.className = 'lesson-video-panel';
    panel.style.maxHeight = '0px';
    panel.style.overflow = 'hidden';
    panel.style.transition = 'max-height ' + DURATION + 'ms cubic-bezier(.16,1,.3,1)';

    var inner = document.createElement('div');
    inner.className = 'lesson-video-panel-inner';
    panel.appendChild(inner);

    panel.dataset.embedUrl = embedUrl;
    panel.dataset.open = 'false';
    return panel;
  }

  function openPanel(panel) {
    var inner = panel.querySelector('.lesson-video-panel-inner');
    inner.innerHTML = '<iframe src="' + panel.dataset.embedUrl + '" title="Видео урока" loading="lazy" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
      'allowfullscreen></iframe>';
    var target = panel.scrollHeight;
    panel.style.maxHeight = '0px';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        panel.style.maxHeight = target + 'px';
      });
    });
    panel.dataset.open = 'true';
    setTimeout(function(){
      if (panel.dataset.open === 'true') panel.style.maxHeight = 'none';
    }, DURATION);
  }

  function closePanel(panel) {
    var inner = panel.querySelector('.lesson-video-panel-inner');
    panel.style.maxHeight = panel.scrollHeight + 'px';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        panel.style.maxHeight = '0px';
      });
    });
    panel.dataset.open = 'false';
    setTimeout(function(){
      if (panel.dataset.open === 'false') inner.innerHTML = '';
    }, DURATION);
  }

  function render() {
    document.querySelectorAll('.lesson-row').forEach(function(row){
      var holder = row.querySelector('.lesson-video-url');
      var badge = row.querySelector('.lesson-badge');
      if (!holder || !badge) return;

      var url = (holder.getAttribute('data-ru') || holder.getAttribute('data-kk') || '').trim();
      var embedUrl = toEmbedUrl(url);
      var panel = row.nextElementSibling && row.nextElementSibling.classList.contains('lesson-video-panel')
        ? row.nextElementSibling : null;

      if (!embedUrl) {
        if (panel) panel.remove();
        if (badge.tagName !== 'SPAN' || !badge.classList.contains('lesson-badge') || badge.classList.contains('lesson-badge-ready')) {
          var span = document.createElement('span');
          span.className = 'lesson-badge';
          span.setAttribute('data-ru', 'Скоро');
          span.setAttribute('data-kk', 'Жақында');
          span.textContent = soonLabel();
          badge.replaceWith(span);
        }
        return;
      }

      if (!panel) {
        panel = makePanel(embedUrl);
        row.insertAdjacentElement('afterend', panel);
      } else if (panel.dataset.embedUrl !== embedUrl) {
        panel.dataset.embedUrl = embedUrl;
        if (panel.dataset.open === 'true') panel.querySelector('.lesson-video-panel-inner').innerHTML =
          '<iframe src="' + embedUrl + '" title="Видео урока" loading="lazy" allowfullscreen></iframe>';
      }

      if (badge.tagName !== 'BUTTON') {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lesson-badge lesson-badge-ready';
        btn.textContent = watchLabel();
        btn.addEventListener('click', function(){
          var p = row.nextElementSibling;
          if (!p || !p.classList.contains('lesson-video-panel')) return;
          if (p.dataset.open === 'true') {
            closePanel(p);
            btn.textContent = watchLabel();
            btn.classList.remove('is-open');
          } else {
            openPanel(p);
            btn.textContent = hideLabel();
            btn.classList.add('is-open');
          }
        });
        badge.replaceWith(btn);
      } else {
        badge.textContent = panel.dataset.open === 'true' ? hideLabel() : watchLabel();
      }
    });
  }

  render();

  var prevApply = window.MADE_APPLY_LANG;
  window.MADE_APPLY_LANG = function(lang){
    if (prevApply) prevApply(lang);
    render();
  };
})();
