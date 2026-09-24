/**
 * reviews.html — fetches /api/reviews and renders them as testimonial
 * cards. The "empty state" note already in the page ("Здесь скоро
 * появятся...") is the fallback for no backend / zero reviews yet;
 * this just hides it once there's at least one real review to show.
 */
(function(){
  var section = document.getElementById('reviewsSection');
  var wrap = section && section.querySelector('.wrap');
  var emptyState = document.getElementById('reviewsEmptyState');
  if (!wrap) return;

  var API_BASE = window.MADE_API_BASE || '';

  fetch(API_BASE + '/api/reviews', { credentials: 'omit' })
    .then(function(res){
      if (!res.ok) throw new Error('reviews unavailable');
      return res.json();
    })
    .then(function(reviews){
      if (!reviews || !reviews.length) return;

      var grid = document.createElement('div');
      grid.className = 'testimonial-grid';

      reviews.forEach(function(review){
        var card = document.createElement('div');
        card.className = 'testimonial';

        var mark = document.createElement('span');
        mark.className = 'testimonial-quote-mark';
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = '“';
        card.appendChild(mark);

        var text = document.createElement('p');
        text.className = 'testimonial-text';
        text.textContent = review.text;
        card.appendChild(text);

        var author = document.createElement('div');
        author.className = 'testimonial-author';

        var avatar = document.createElement('div');
        avatar.className = 'testimonial-avatar';
        avatar.textContent = (review.authorName || '?').trim().charAt(0).toUpperCase();
        author.appendChild(avatar);

        var meta = document.createElement('div');
        var name = document.createElement('p');
        name.className = 'testimonial-name';
        name.textContent = review.authorName;
        meta.appendChild(name);
        if (review.courseLabel) {
          var course = document.createElement('p');
          course.className = 'testimonial-course';
          course.textContent = review.courseLabel;
          meta.appendChild(course);
        }
        author.appendChild(meta);
        card.appendChild(author);

        grid.appendChild(card);
      });

      wrap.appendChild(grid);
      if (emptyState) emptyState.hidden = true;
    })
    .catch(function(){
      // No backend reachable, or nothing added yet — the static
      // empty-state note already in the page stays.
    });
})();
