/**
 * Shows an account avatar in the header (desktop nav + mobile bar) when
 * a session is active, hiding the "Войти"/"Регистрация" links in both
 * the header and the mobile dropdown menu. Runs on every page.
 */
(function(){
  var API_BASE = window.MADE_API_BASE || '';

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

  function maskEmail(email) {
    if (!email) return '';
    return email.replace(/[^@.]/g, '•');
  }

  var EYE_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_CLOSED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 4.24A11 11 0 0 1 12 4c7 0 11 8 11 8a17.7 17.7 0 0 1-3.16 4.13M6.5 6.5C3.6 8.3 1 12 1 12s4 8 11 8c1.6 0 3-.34 4.24-.9"/></svg>';

  function buildWidget(extraClass) {
    var wrap = document.createElement('div');
    wrap.className = 'auth-widget ' + extraClass;

    wrap.innerHTML =
      '<button type="button" class="avatar-btn" aria-haspopup="true" aria-expanded="false"><span class="avatar-letter"></span></button>' +
      '<div class="avatar-panel">' +
        '<div class="avatar-panel-name"></div>' +
        '<div class="avatar-panel-row">' +
          '<span class="avatar-panel-label" data-ru="Email" data-kk="Email">Email</span>' +
          '<span class="avatar-panel-value avatar-email"></span>' +
          '<button type="button" class="eye-toggle email-eye" aria-label="Показать" title="Показать">' + EYE_OPEN + '</button>' +
        '</div>' +
        '<button type="button" class="btn btn-outline widget-logout" data-ru="Выйти" data-kk="Шығу">Выйти</button>' +
      '</div>';

    return wrap;
  }

  var mainNav = document.querySelector('nav.main-nav');
  var mobileBar = document.querySelector('.mobile-bar');
  if (!mainNav && !mobileBar) return;

  var widgets = [];

  if (mainNav) {
    var desktopWidget = buildWidget('auth-widget-desktop');
    var signupBtn = mainNav.querySelector('a[href="courses.html#signup"]');
    if (signupBtn) mainNav.insertBefore(desktopWidget, signupBtn);
    else mainNav.appendChild(desktopWidget);
    widgets.push(desktopWidget);
  }

  if (mobileBar) {
    var mobileWidget = buildWidget('auth-widget-mobile');
    var burger = mobileBar.querySelector('.burger');
    if (burger) mobileBar.insertBefore(mobileWidget, burger);
    else mobileBar.appendChild(mobileWidget);
    widgets.push(mobileWidget);
  }

  function closeAllPanels() {
    widgets.forEach(function(w){
      w.classList.remove('is-open');
      w.querySelector('.avatar-btn').setAttribute('aria-expanded', 'false');
    });
  }

  function wireWidget(widget) {
    var btn = widget.querySelector('.avatar-btn');
    var panel = widget.querySelector('.avatar-panel');
    var email = widget.querySelector('.avatar-email');
    var emailEye = widget.querySelector('.email-eye');
    var logoutBtn = widget.querySelector('.widget-logout');
    var emailRevealed = false;

    // Without this, any click inside the panel (the eye toggles, form
    // fields, the submit button) bubbles up to the document-level
    // closeAllPanels() listener below and closes the panel instantly.
    panel.addEventListener('click', function(e){ e.stopPropagation(); });

    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = widget.classList.contains('is-open');
      closeAllPanels();
      if (!isOpen) {
        widget.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    emailEye.addEventListener('click', function(){
      emailRevealed = !emailRevealed;
      email.textContent = emailRevealed ? widget._fullEmail : maskEmail(widget._fullEmail);
      emailEye.innerHTML = emailRevealed ? EYE_CLOSED : EYE_OPEN;
      emailEye.setAttribute('aria-label', emailRevealed ? 'Скрыть' : 'Показать');
    });

    logoutBtn.addEventListener('click', function(){
      api('/api/logout', { method: 'POST' }).finally(refresh);
    });
  }

  widgets.forEach(wireWidget);

  document.addEventListener('click', closeAllPanels);

  function applyState(data) {
    var loggedIn = !!(data && data.username);
    var headerLinks = document.querySelectorAll(
      'header a[href="login.html"], header a[href="register.html"]'
    );

    headerLinks.forEach(function(el){ el.style.display = loggedIn ? 'none' : ''; });

    widgets.forEach(function(widget){
      widget.classList.toggle('is-visible', loggedIn);
      if (!loggedIn) {
        widget.classList.remove('is-open');
        return;
      }
      var label = data.name || data.username || '';
      var letter = label.trim().charAt(0).toUpperCase() || '?';
      widget.querySelector('.avatar-letter').textContent = letter;
      widget.querySelector('.avatar-panel-name').textContent = label;
      widget._fullEmail = data.username || '';
      var emailEl = widget.querySelector('.avatar-email');
      emailEl.textContent = maskEmail(widget._fullEmail);
      var emailEye = widget.querySelector('.email-eye');
      emailEye.innerHTML = EYE_OPEN;
      emailEye.setAttribute('aria-label', 'Показать');
    });

    if (typeof window.MADE_APPLY_LANG === 'function') {
      window.MADE_APPLY_LANG(document.documentElement.lang || 'ru');
    }
  }

  function refresh() {
    api('/api/me').then(applyState).catch(function(){ applyState(null); });
  }

  window.MADE_REFRESH_AUTH = refresh;
  refresh();
})();
