(function(){
  var API_BASE = window.MADE_API_BASE || '';

  var PAGES = [
    { id: 'index', label: 'Главная' },
    { id: 'courses', label: 'Курсы' },
    { id: 'atelier', label: 'Ателье' },
    { id: 'gallery', label: 'Работы' },
    { id: 'shop', label: 'Магазин' },
    { id: 'reviews', label: 'Отзывы' },
    { id: 'about', label: 'О студии' },
    { id: 'contacts', label: 'Контакты' }
  ];

  var loginScreen = document.getElementById('loginScreen');
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  var app = document.getElementById('app');
  var whoami = document.getElementById('whoami');
  var logoutBtn = document.getElementById('logoutBtn');
  var pageNav = document.getElementById('pageNav');
  var pageTitle = document.getElementById('pageTitle');
  var fieldsList = document.getElementById('fieldsList');
  var saveBtn = document.getElementById('saveBtn');
  var saveStatus = document.getElementById('saveStatus');

  var currentPage = null;
  var originalContent = {};
  var dirtyKeys = {};

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = 'include';
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(API_BASE + path, opts).then(function(res){
      if (res.status === 401) throw { unauthorized: true };
      return res.json().then(function(body){
        if (!res.ok) throw body;
        return body;
      });
    });
  }

  function showApp(username) {
    loginScreen.hidden = true;
    app.hidden = false;
    whoami.textContent = username ? ('вы вошли как ' + username) : '';
  }

  function showLogin() {
    app.hidden = true;
    loginScreen.hidden = false;
  }

  function renderNav() {
    pageNav.innerHTML = '';
    PAGES.forEach(function(p){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = p.label;
      btn.dataset.page = p.id;
      if (p.id === currentPage) btn.classList.add('active');
      btn.addEventListener('click', function(){ loadPage(p.id); });
      pageNav.appendChild(btn);
    });
  }

  function fieldLabel(key) {
    return key;
  }

  function renderFields(content) {
    fieldsList.innerHTML = '';
    var keys = Object.keys(content);
    if (!keys.length) {
      fieldsList.innerHTML = '<p class="empty-note">На этой странице пока нет полей.</p>';
      return;
    }

    keys.forEach(function(key){
      var val = content[key];
      var wrap = document.createElement('div');
      wrap.className = 'field';

      var meta = document.createElement('div');
      meta.className = 'field-meta';
      var keySpan = document.createElement('span');
      keySpan.textContent = fieldLabel(key);
      meta.appendChild(keySpan);
      wrap.appendChild(meta);

      var cols = document.createElement('div');
      cols.className = 'field-cols';

      ['ru', 'kk'].forEach(function(lang){
        var col = document.createElement('div');
        var label = document.createElement('label');
        label.textContent = lang === 'ru' ? 'Русский' : 'Қазақша';
        var ta = document.createElement('textarea');
        ta.value = val[lang] || '';
        ta.dataset.key = key;
        ta.dataset.lang = lang;
        ta.addEventListener('input', function(){
          ta.classList.add('changed');
          dirtyKeys[key] = dirtyKeys[key] || { ru: content[key].ru, kk: content[key].kk };
          dirtyKeys[key][lang] = ta.value;
          updateSaveState();
        });
        col.appendChild(label);
        col.appendChild(ta);
        cols.appendChild(col);
      });

      wrap.appendChild(cols);
      fieldsList.appendChild(wrap);
    });
  }

  function updateSaveState() {
    var hasChanges = Object.keys(dirtyKeys).length > 0;
    saveBtn.disabled = !hasChanges;
    saveStatus.textContent = hasChanges ? 'Есть несохранённые изменения' : '';
    saveStatus.className = 'save-status';
  }

  function loadPage(pageId) {
    currentPage = pageId;
    dirtyKeys = {};
    renderNav();
    var meta = PAGES.find(function(p){ return p.id === pageId; });
    pageTitle.textContent = meta ? meta.label : pageId;
    fieldsList.innerHTML = '<p class="empty-note">Загрузка…</p>';
    updateSaveState();

    api('/api/content/' + encodeURIComponent(pageId))
      .then(function(data){
        originalContent = data;
        renderFields(data);
      })
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        fieldsList.innerHTML = '<p class="empty-note">Не удалось загрузить контент.</p>';
      });
  }

  saveBtn.addEventListener('click', function(){
    if (!Object.keys(dirtyKeys).length) return;
    saveBtn.disabled = true;
    saveStatus.textContent = 'Сохраняем…';
    saveStatus.className = 'save-status';

    api('/api/content/' + encodeURIComponent(currentPage), {
      method: 'PUT',
      body: JSON.stringify(dirtyKeys)
    })
      .then(function(){
        saveStatus.textContent = 'Сохранено';
        saveStatus.className = 'save-status ok';
        dirtyKeys = {};
        document.querySelectorAll('.field textarea.changed').forEach(function(ta){
          ta.classList.remove('changed');
        });
      })
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        saveStatus.textContent = 'Ошибка сохранения';
        saveStatus.className = 'save-status err';
        saveBtn.disabled = false;
      });
  });

  loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    loginError.hidden = true;
    var formData = new FormData(loginForm);
    api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password')
      })
    })
      .then(function(data){
        showApp(data.username);
        loadPage(PAGES[0].id);
      })
      .catch(function(){
        loginError.textContent = 'Неверный логин или пароль.';
        loginError.hidden = false;
      });
  });

  logoutBtn.addEventListener('click', function(){
    api('/api/logout', { method: 'POST' }).finally(function(){
      showLogin();
    });
  });

  // On load, check if already authenticated (existing session cookie)
  api('/api/me')
    .then(function(data){
      showApp(data.username);
      loadPage(PAGES[0].id);
    })
    .catch(function(){
      showLogin();
    });
})();
