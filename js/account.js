(function(){
  var loginForm = document.getElementById('accountLoginForm');
  if (!loginForm) return; // not on the login page

  var API_BASE = window.MADE_API_BASE || '';
  var loggedOutView = document.getElementById('loggedOutView');
  var loggedInView = document.getElementById('loggedInView');
  var errorEl = document.getElementById('accountLoginError');
  var usernameEl = document.getElementById('accountUsername');
  var avatarEl = document.getElementById('accountAvatarBig');
  var logoutBtn = document.getElementById('accountLogoutBtn');

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = 'include';
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(API_BASE + path, opts).then(function(res){
      return res.json().then(function(body){
        if (!res.ok) throw body;
        return body;
      });
    });
  }

  function showLoggedIn(data) {
    loggedOutView.style.display = 'none';
    loggedInView.classList.add('visible');
    var label = data.name || data.username || '';
    usernameEl.textContent = label;
    if (avatarEl) avatarEl.textContent = label.trim().charAt(0).toUpperCase() || '?';
  }

  function showLoggedOut() {
    loggedOutView.style.display = '';
    loggedInView.classList.remove('visible');
  }

  loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    errorEl.classList.remove('visible');
    var formData = new FormData(loginForm);

    api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password')
      })
    })
      .then(function(data){
        showLoggedIn(data);
        if (typeof window.MADE_REFRESH_AUTH === 'function') window.MADE_REFRESH_AUTH();
      })
      .catch(function(){ errorEl.classList.add('visible'); });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(){
      api('/api/logout', { method: 'POST' }).finally(function(){
        showLoggedOut();
        if (typeof window.MADE_REFRESH_AUTH === 'function') window.MADE_REFRESH_AUTH();
      });
    });
  }

  // If a session cookie is already set (backend deployed + previously
  // logged in), reflect that instead of showing the form.
  api('/api/me').then(showLoggedIn).catch(function(){});
})();
