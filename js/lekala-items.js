/**
 * Renders the growing "Наборы лекал" list on shop.html from
 * /api/lekala-items (public, read-only). No backend reachable or
 * nothing added yet -> the list just stays hidden.
 */
(function(){
  var list = document.getElementById('lekalaItemsList');
  if (!list) return;

  var API_BASE = window.MADE_API_BASE || '';

  fetch(API_BASE + '/api/lekala-items', { credentials: 'omit' })
    .then(function(res){
      if (!res.ok) throw new Error('lekala items unavailable');
      return res.json();
    })
    .then(function(items){
      if (!items || !items.length) return;
      items.forEach(function(item){
        var li = document.createElement('li');
        li.className = 'course-tag';
        li.textContent = item.label;
        list.appendChild(li);
      });
      list.hidden = false;
    })
    .catch(function(){
      // No backend / nothing added yet — stays hidden.
    });
})();
