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
    { id: 'contacts', label: 'Контакты' },
    { id: 'login', label: 'Вход' },
    { id: 'register', label: 'Регистрация' }
  ];

  var LEKALA_ID = 'lekala-items';
  var GALLERY_ID = 'gallery-photos-view';

  var loginScreen = document.getElementById('loginScreen');
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  var app = document.getElementById('app');
  var whoami = document.getElementById('whoami');
  var logoutBtn = document.getElementById('logoutBtn');
  var pageNav = document.getElementById('pageNav');
  var pageTitle = document.getElementById('pageTitle');
  var editorHead = document.querySelector('.editor-head');
  var fieldsList = document.getElementById('fieldsList');
  var saveBtn = document.getElementById('saveBtn');
  var saveStatus = document.getElementById('saveStatus');
  var lekalaView = document.getElementById('lekalaView');
  var lekalaList = document.getElementById('lekalaList');
  var lekalaForm = document.getElementById('lekalaForm');
  var lekalaStatus = document.getElementById('lekalaStatus');
  var galleryView = document.getElementById('galleryView');
  var galleryUploadForm = document.getElementById('galleryUploadForm');
  var galleryUploadStatus = document.getElementById('galleryUploadStatus');
  var galleryPhotosGrid = document.getElementById('galleryPhotosGrid');

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

    var divider = document.createElement('div');
    divider.className = 'page-nav-divider';
    pageNav.appendChild(divider);

    var lekalaBtn = document.createElement('button');
    lekalaBtn.type = 'button';
    lekalaBtn.textContent = 'Наборы лекал';
    lekalaBtn.dataset.page = LEKALA_ID;
    if (currentPage === LEKALA_ID) lekalaBtn.classList.add('active');
    lekalaBtn.addEventListener('click', openLekala);
    pageNav.appendChild(lekalaBtn);

    var galleryBtn = document.createElement('button');
    galleryBtn.type = 'button';
    galleryBtn.textContent = 'Фото галереи';
    galleryBtn.dataset.page = GALLERY_ID;
    if (currentPage === GALLERY_ID) galleryBtn.classList.add('active');
    galleryBtn.addEventListener('click', openGalleryView);
    pageNav.appendChild(galleryBtn);
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
    editorHead.hidden = false;
    fieldsList.hidden = false;
    lekalaView.hidden = true;
    galleryView.hidden = true;
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

  function renderLekalaItems(items) {
    lekalaList.innerHTML = '';
    if (!items.length) {
      lekalaList.innerHTML = '<li class="empty-note">Пока нет ни одной позиции.</li>';
      return;
    }
    items.forEach(function(item){
      var li = document.createElement('li');
      li.className = 'lekala-row';
      var span = document.createElement('span');
      span.textContent = item.label;
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'lekala-delete';
      del.textContent = 'Удалить';
      del.addEventListener('click', function(){
        del.disabled = true;
        api('/api/lekala-items/' + item.id, { method: 'DELETE' })
          .then(loadLekalaItems)
          .catch(function(err){
            if (err && err.unauthorized) { showLogin(); return; }
            del.disabled = false;
          });
      });
      li.appendChild(span);
      li.appendChild(del);
      lekalaList.appendChild(li);
    });
  }

  function loadLekalaItems() {
    lekalaList.innerHTML = '<li class="empty-note">Загрузка…</li>';
    api('/api/lekala-items')
      .then(renderLekalaItems)
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        lekalaList.innerHTML = '<li class="empty-note">Не удалось загрузить список.</li>';
      });
  }

  function openLekala() {
    currentPage = LEKALA_ID;
    renderNav();
    editorHead.hidden = true;
    fieldsList.hidden = true;
    lekalaView.hidden = false;
    galleryView.hidden = true;
    lekalaStatus.textContent = '';
    lekalaStatus.className = 'save-status';
    loadLekalaItems();
  }

  function renderGalleryPhotos(photos) {
    galleryPhotosGrid.innerHTML = '';
    if (!photos.length) {
      galleryPhotosGrid.innerHTML = '<p class="empty-note">Пока нет загруженных фото.</p>';
      return;
    }
    var CATEGORY_LABEL = { made: 'MaDE', student: 'Ученицы' };
    photos.forEach(function(photo){
      var card = document.createElement('div');
      card.className = 'gallery-upload-card';

      var img = document.createElement('img');
      img.src = API_BASE + '/api/gallery-photos/' + photo.id + '/image';
      img.alt = photo.alt || '';
      card.appendChild(img);

      var meta = document.createElement('div');
      meta.className = 'gallery-upload-card-meta';
      var label = document.createElement('span');
      label.textContent = CATEGORY_LABEL[photo.category] || photo.category;
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'lekala-delete';
      del.textContent = 'Удалить';
      del.addEventListener('click', function(){
        del.disabled = true;
        api('/api/gallery-photos/' + photo.id, { method: 'DELETE' })
          .then(loadGalleryPhotos)
          .catch(function(err){
            if (err && err.unauthorized) { showLogin(); return; }
            del.disabled = false;
          });
      });
      meta.appendChild(label);
      meta.appendChild(del);
      card.appendChild(meta);

      galleryPhotosGrid.appendChild(card);
    });
  }

  function loadGalleryPhotos() {
    galleryPhotosGrid.innerHTML = '<p class="empty-note">Загрузка…</p>';
    api('/api/gallery-photos')
      .then(renderGalleryPhotos)
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        galleryPhotosGrid.innerHTML = '<p class="empty-note">Не удалось загрузить список.</p>';
      });
  }

  function openGalleryView() {
    currentPage = GALLERY_ID;
    renderNav();
    editorHead.hidden = true;
    fieldsList.hidden = true;
    lekalaView.hidden = true;
    galleryView.hidden = false;
    galleryUploadStatus.textContent = '';
    galleryUploadStatus.className = 'save-status';
    loadGalleryPhotos();
  }

  galleryUploadForm.addEventListener('submit', function(e){
    e.preventDefault();
    var fileInput = galleryUploadForm.elements.photo;
    if (!fileInput.files[0]) return;

    galleryUploadStatus.textContent = 'Загружаем…';
    galleryUploadStatus.className = 'save-status';

    var formData = new FormData(galleryUploadForm);

    fetch(API_BASE + '/api/gallery-photos', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })
      .then(function(res){
        if (res.status === 401) throw { unauthorized: true };
        if (!res.ok) throw new Error('upload_failed');
        return res.json();
      })
      .then(function(){
        galleryUploadForm.reset();
        galleryUploadStatus.textContent = 'Загружено';
        galleryUploadStatus.className = 'save-status ok';
        loadGalleryPhotos();
      })
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        galleryUploadStatus.textContent = 'Не получилось загрузить';
        galleryUploadStatus.className = 'save-status err';
      });
  });

  lekalaForm.addEventListener('submit', function(e){
    e.preventDefault();
    var input = lekalaForm.elements.label;
    var label = input.value.trim();
    if (!label) return;

    lekalaStatus.textContent = 'Добавляем…';
    lekalaStatus.className = 'save-status';

    api('/api/lekala-items', {
      method: 'POST',
      body: JSON.stringify({ label: label })
    })
      .then(function(){
        input.value = '';
        lekalaStatus.textContent = 'Добавлено';
        lekalaStatus.className = 'save-status ok';
        loadLekalaItems();
      })
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        lekalaStatus.textContent = 'Не получилось добавить';
        lekalaStatus.className = 'save-status err';
      });
  });

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
        if (data.role !== 'owner') {
          loginError.textContent = 'У этого аккаунта нет доступа к админ-панели.';
          loginError.hidden = false;
          api('/api/logout', { method: 'POST' });
          return;
        }
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
      if (data.role !== 'owner') { showLogin(); return; }
      showApp(data.username);
      loadPage(PAGES[0].id);
    })
    .catch(function(){
      showLogin();
    });
})();
