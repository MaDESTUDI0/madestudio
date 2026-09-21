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
  var ORDERS_ID = 'orders-view';

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
  var ordersView = document.getElementById('ordersView');
  var ordersList = document.getElementById('ordersList');

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

    var ordersBtn = document.createElement('button');
    ordersBtn.type = 'button';
    ordersBtn.textContent = 'Заказы';
    ordersBtn.dataset.page = ORDERS_ID;
    if (currentPage === ORDERS_ID) ordersBtn.classList.add('active');
    ordersBtn.addEventListener('click', openOrders);
    pageNav.appendChild(ordersBtn);
  }

  function fieldLabel(key) {
    return key;
  }

  // Keys follow a "<landmark>.<n>" convention (e.g. "columns.4",
  // "enroll.2") that maps directly onto the page's own sections —
  // grouping by that landmark turns a flat wall of 50-80 identical
  // boxes into a handful of collapsible sections instead.
  function splitKey(key) {
    var dot = key.lastIndexOf('.');
    if (dot === -1) return { group: key, num: 0 };
    return { group: key.slice(0, dot), num: parseInt(key.slice(dot + 1), 10) || 0 };
  }

  function renderFields(content) {
    fieldsList.innerHTML = '';
    var keys = Object.keys(content);
    if (!keys.length) {
      fieldsList.innerHTML = '<p class="empty-note">На этой странице пока нет полей.</p>';
      return;
    }

    // Sort numerically within each group (plain string sort would
    // put "modules.10" before "modules.2"), then group consecutively.
    keys.sort(function(a, b){
      var sa = splitKey(a), sb = splitKey(b);
      if (sa.group !== sb.group) return sa.group < sb.group ? -1 : 1;
      return sa.num - sb.num;
    });

    var groups = [];
    var byGroup = {};
    keys.forEach(function(key){
      var group = splitKey(key).group;
      if (!byGroup[group]) { byGroup[group] = []; groups.push(group); }
      byGroup[group].push(key);
    });

    groups.forEach(function(group, i){
      var details = document.createElement('details');
      details.className = 'field-group';
      if (i === 0) details.open = true;

      var summary = document.createElement('summary');
      var name = document.createElement('span');
      name.textContent = group;
      var count = document.createElement('span');
      count.className = 'field-group-count';
      count.textContent = byGroup[group].length;
      summary.appendChild(name);
      summary.appendChild(count);
      details.appendChild(summary);

      var body = document.createElement('div');
      body.className = 'field-group-body';

      byGroup[group].forEach(function(key){
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
        body.appendChild(wrap);
      });

      details.appendChild(body);
      fieldsList.appendChild(details);
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
    ordersView.hidden = true;
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
      var bits = [item.label];
      if (item.price) bits.push(Number(item.price).toLocaleString('ru-RU') + ' ₸');
      bits.push(item.hasFile ? 'файл есть' : 'без файла');
      span.textContent = bits.join(' — ');
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
    ordersView.hidden = true;
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
    ordersView.hidden = true;
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
    var label = lekalaForm.elements.label.value.trim();
    if (!label) return;

    lekalaStatus.textContent = 'Добавляем…';
    lekalaStatus.className = 'save-status';

    var formData = new FormData(lekalaForm);

    fetch(API_BASE + '/api/lekala-items', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })
      .then(function(res){
        if (res.status === 401) throw { unauthorized: true };
        if (!res.ok) throw new Error('add_failed');
        return res.json();
      })
      .then(function(){
        lekalaForm.reset();
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

  function renderOrders(orders) {
    ordersList.innerHTML = '';
    if (!orders.length) {
      ordersList.innerHTML = '<p class="empty-note">Заказов пока нет.</p>';
      return;
    }
    var STATUS_LABEL = { pending: 'Ожидает оплаты', paid: 'Оплачен, файлы отправлены' };
    orders.forEach(function(order){
      var card = document.createElement('div');
      card.className = 'order-card';

      var head = document.createElement('div');
      head.className = 'order-card-head';
      var who = document.createElement('span');
      who.textContent = (order.name ? order.name + ' — ' : '') + order.email;
      var status = document.createElement('span');
      status.className = 'order-status order-status-' + order.status;
      status.textContent = STATUS_LABEL[order.status] || order.status;
      head.appendChild(who);
      head.appendChild(status);
      card.appendChild(head);

      var items = document.createElement('ul');
      items.className = 'order-items';
      var total = 0;
      order.items.forEach(function(item){
        var li = document.createElement('li');
        li.textContent = item.label + (item.price ? ' — ' + Number(item.price).toLocaleString('ru-RU') + ' ₸' : '');
        items.appendChild(li);
        total += Number(item.price) || 0;
      });
      card.appendChild(items);

      if (total) {
        var totalP = document.createElement('p');
        totalP.className = 'order-total';
        totalP.textContent = 'Итого: ' + total.toLocaleString('ru-RU') + ' ₸';
        card.appendChild(totalP);
      }

      if (order.status === 'pending') {
        var confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'btn-solid';
        confirmBtn.textContent = 'Подтвердить оплату';
        confirmBtn.addEventListener('click', function(){
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Отправляем…';
          api('/api/orders/' + order.id + '/confirm', { method: 'POST' })
            .then(loadOrders)
            .catch(function(err){
              if (err && err.unauthorized) { showLogin(); return; }
              confirmBtn.disabled = false;
              confirmBtn.textContent = 'Не получилось, повторить';
            });
        });
        card.appendChild(confirmBtn);
      }

      ordersList.appendChild(card);
    });
  }

  function loadOrders() {
    ordersList.innerHTML = '<p class="empty-note">Загрузка…</p>';
    api('/api/orders')
      .then(renderOrders)
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        ordersList.innerHTML = '<p class="empty-note">Не удалось загрузить заказы.</p>';
      });
  }

  function openOrders() {
    currentPage = ORDERS_ID;
    renderNav();
    editorHead.hidden = true;
    fieldsList.hidden = true;
    lekalaView.hidden = true;
    galleryView.hidden = true;
    ordersView.hidden = false;
    loadOrders();
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
