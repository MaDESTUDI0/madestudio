/**
 * Gates cabinet.html behind an active session: shows the "Программа
 * курса доступна ученикам после входа" prompt by default, and swaps
 * in the full curriculum once /api/me confirms a logged-in user.
 */
(function(){
  var gate = document.getElementById('cabinetGate');
  var content = document.getElementById('cabinetContent');
  if (!gate || !content) return;

  var API_BASE = window.MADE_API_BASE || '';

  fetch(API_BASE + '/api/me', { credentials: 'include' })
    .then(function(res){
      if (!res.ok) throw new Error('unauthorized');
      return res.json();
    })
    .then(function(){
      gate.hidden = true;
      content.hidden = false;
      if (typeof window.MADE_APPLY_LANG === 'function') {
        window.MADE_APPLY_LANG(document.documentElement.lang || 'ru');
      }
    })
    .catch(function(){
      // Not logged in (or API unreachable) — the gate is already the
      // default visible state, nothing to do.
    });
})();
