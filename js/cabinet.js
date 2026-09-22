/**
 * Gates cabinet.html behind an active session AND paid course access:
 *   - logged out            -> "войдите / зарегистрируйтесь"
 *   - logged in, no access  -> "купить курс" (or waiting, if requested)
 *   - access granted        -> full curriculum
 */
(function(){
  var gate = document.getElementById('cabinetGate');
  var content = document.getElementById('cabinetContent');
  if (!gate || !content) return;

  var API_BASE = window.MADE_API_BASE || '';
  var gateLoggedOut = document.getElementById('gateLoggedOut');
  var gateNotPurchased = document.getElementById('gateNotPurchased');
  var gatePending = document.getElementById('gatePending');
  var buyBtn = document.getElementById('buyCourseBtn');
  var buyError = document.getElementById('buyCourseError');

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
    gatePending.hidden = which !== 'pending';
    content.hidden = true;
    gate.hidden = false;
  }

  function showContent() {
    gate.hidden = true;
    content.hidden = false;
    if (typeof window.MADE_APPLY_LANG === 'function') {
      window.MADE_APPLY_LANG(document.documentElement.lang || 'ru');
    }
  }

  api('/api/me')
    .then(function(){
      return api('/api/course-access');
    })
    .then(function(status){
      if (status.access) {
        showContent();
      } else if (status.requested) {
        showGateState('pending');
      } else {
        showGateState('notPurchased');
      }
    })
    .catch(function(){
      showGateState('loggedOut');
    });

  if (buyBtn) {
    buyBtn.addEventListener('click', function(){
      buyBtn.disabled = true;
      buyError.textContent = '';
      api('/api/course-access/request', { method: 'POST' })
        .then(function(status){
          if (status.access) showContent();
          else showGateState('pending');
        })
        .catch(function(){
          buyBtn.disabled = false;
          buyError.textContent = 'Что-то пошло не так, попробуйте ещё раз.';
        });
    });
  }
})();
