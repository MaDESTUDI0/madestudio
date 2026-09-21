/**
 * Turns a plain video link (set via the admin panel's "Видео" field)
 * into an embedded player. Supports YouTube and Vimeo URLs; any other
 * URL is used as-is as an iframe src (e.g. an already-embed link).
 * The wrapping section stays hidden while no link is set.
 */
(function(){
  function toEmbedUrl(url) {
    url = (url || '').trim();
    if (!url) return null;
    var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    var vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1];
    return url;
  }

  function render() {
    var blocks = document.querySelectorAll('[data-video-embed]');
    blocks.forEach(function(block){
      var url = block.getAttribute('data-ru') || block.getAttribute('data-kk') || '';
      var embedUrl = toEmbedUrl(url);
      var section = block.closest('.course-video-section');

      if (!embedUrl) {
        if (section) section.hidden = true;
        block.innerHTML = '';
        return;
      }

      if (block.getAttribute('data-embedded-src') === embedUrl) return;
      if (section) section.hidden = false;
      block.setAttribute('data-embedded-src', embedUrl);
      block.innerHTML = '<iframe src="' + embedUrl + '" title="Видео курса" loading="lazy" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'allowfullscreen></iframe>';
    });
  }

  render();

  var prevApply = window.MADE_APPLY_LANG;
  window.MADE_APPLY_LANG = function(lang){
    if (prevApply) prevApply(lang);
    render();
  };
})();
