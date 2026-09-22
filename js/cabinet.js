/**
 * Gates cabinet.html behind an active session AND per-module paid
 * access (modules are bought individually or as the whole course —
 * see courses.html):
 *   - logged out                -> "войдите / зарегистрируйтесь"
 *   - logged in, no modules yet -> "курс ещё не куплен" + link to courses.html
 *   - at least one module owned -> full page shown, but each
 *     <details class="module" data-module-key="mN"> the buyer doesn't
 *     own gets its body replaced with a "buy this module" prompt.
 */
(function(){
  var gate = document.getElementById('cabinetGate');
  var content = document.getElementById('cabinetContent');
  if (!gate || !content) return;

  var API_BASE = window.MADE_API_BASE || '';
  var gateLoggedOut = document.getElementById('gateLoggedOut');
  var gateNotPurchased = document.getElementById('gateNotPurchased');

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = 'include';
    return fetch(API_BASE + path, opts).then(function(res){
      return res.json().then(function(body){
        if (!res.ok) throw body;
        return body;
      });
    });
  }

  function showGateState(which) {
    gateLoggedOut.hidden = which !== 'loggedOut';
    gateNotPurchased.hidden = which !== 'notPurchased';
    content.hidden = true;
    gate.hidden = false;
  }

  function lockModule(details) {
    var body = details.querySelector(':scope > .module-body');
    if (!body || body.dataset.locked) return;
    body.dataset.locked = '1';
    body.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'note';
    p.textContent = 'Этот модуль ещё не куплен.';
    var a = document.createElement('a');
    a.href = 'courses.html';
    a.className = 'btn btn-outline';
    a.style.marginTop = '12px';
    a.style.display = 'inline-block';
    a.textContent = 'Купить модуль';
    body.appendChild(p);
    body.appendChild(a);
    details.removeAttribute('open');
  }

  function showContent(ownedModules) {
    gate.hidden = true;
    content.hidden = false;
    document.querySelectorAll('.module[data-module-key]').forEach(function(details){
      var key = details.getAttribute('data-module-key');
      if (ownedModules.indexOf(key) === -1) lockModule(details);
    });
    if (typeof window.MADE_APPLY_LANG === 'function') {
      window.MADE_APPLY_LANG(document.documentElement.lang || 'ru');
    }
  }

  api('/api/me')
    .then(function(){
      return api('/api/course-access');
    })
    .then(function(status){
      var modules = status.modules || [];
      if (modules.length) showContent(modules);
      else showGateState('notPurchased');
    })
    .catch(function(){
      showGateState('loggedOut');
    });
})();
