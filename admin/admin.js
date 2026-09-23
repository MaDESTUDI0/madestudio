(function(){
  var API_BASE = window.MADE_API_BASE || '';

  var STRINGS = {
    ru: {
      adminPanel: 'Админ-панель',
      loginLabel: 'Логин',
      passwordLabel: 'Пароль',
      loginBtn: 'Войти',
      wrongCredentials: 'Неверный логин или пароль.',
      noAccess: 'У этого аккаунта нет доступа к админ-панели.',
      headerBrand: 'MaDE · Админка',
      loggedInAs: 'вы вошли как ',
      logout: 'Выйти',
      saveChanges: 'Сохранить изменения',
      unsavedChanges: 'Есть несохранённые изменения',
      saving: 'Сохраняем…',
      saved: 'Сохранено',
      saveError: 'Ошибка сохранения',
      loading: 'Загрузка…',
      noFieldsOnPage: 'На этой странице пока нет полей.',
      loadContentError: 'Не удалось загрузить контент.',
      russian: 'Русский',
      kazakh: 'Қазақша',
      pageLabels: {
        index: 'Главная', courses: 'Курсы', atelier: 'Ателье', gallery: 'Работы',
        shop: 'Магазин', reviews: 'Отзывы', about: 'О студии', contacts: 'Контакты',
        login: 'Вход', register: 'Регистрация', cabinet: 'Личный кабинет'
      },
      groupLabels: {
        'nav': 'Меню (десктоп)',
        'mobile-nav': 'Меню (мобильное)',
        'hero': 'Главный экран',
        'directions': 'Направления',
        'enroll': 'Блок записи',
        'footer': 'Подвал сайта',
        'location': 'Как нас найти',
        'page-hero': 'Заголовок страницы',
        'card': 'Карточка курса',
        'intro': 'Вводный блок',
        'modules': 'Модули курса',
        'program': 'Программа курса',
        'section': 'Блок страницы',
        'columns': 'Колонки',
        'shop': 'Товары',
        'contacts': 'Контакты',
        'empty': 'Пустое состояние',
        'video': 'Видео (ссылка)',
        'video-lesson-m1': 'Видео уроков — Модуль 1',
        'video-lesson-m2': 'Видео уроков — Модуль 2',
        'video-lesson-m3': 'Видео уроков — Модуль 3',
        'video-lesson-m4': 'Видео уроков — Модуль 4'
      },
      lekalaNav: 'Товары и курс',
      galleryNav: 'Фото галереи',
      ordersNav: 'Заказы',
      courseAccessNav: 'Доступ к курсу',
      lekalaHint: 'Позиции набора лекал — фасон и размеры одной строкой, например «Рубашка, 44–60 размер». Показываются на сайте в карточке «Наборы лекал», покупатели могут собрать несколько в заказ. Файл — то, что автоматически уйдёт покупателю на почту после того, как вы подтвердите оплату в разделе «Заказы».',
      lekalaLabelPlaceholder: 'Например: Платье, 42–50 размер',
      lekalaPricePlaceholder: 'Цена, ₸',
      add: 'Добавить',
      noItemsYet: 'Пока нет ни одной позиции.',
      loadListError: 'Не удалось загрузить список.',
      hasFile: 'файл есть',
      noFile: 'без файла',
      typeCourseModule: 'модуль курса',
      typeCourseFull: 'весь курс',
      del: 'Удалить',
      adding: 'Добавляем…',
      added: 'Добавлено',
      addError: 'Не получилось добавить',
      ordersHint: 'Все заказы — товары и курс вместе. Покупатель оплачивает по ссылке Kaspi и присылает вам чек в WhatsApp. В сообщении он указывает номер заказа — найдите этот номер здесь и нажмите «Подтвердить оплату»: файлы уйдут покупателю на почту, а доступ к курсу/модулю откроется у него сам.',
      noOrders: 'Заказов пока нет.',
      loadOrdersError: 'Не удалось загрузить заказы.',
      statusPending: 'Ждёт подтверждения',
      statusPaid: 'Оплачен, доступ выдан',
      total: 'Итого',
      orderNo: 'Заказ №',
      orderPlaced: 'Оформлен',
      orderConfirmed: 'Подтверждён',
      ordersSummary: 'Всего заказов',
      ordersPendingCount: 'ждут подтверждения',
      confirmPayment: 'Подтвердить оплату',
      sending: 'Отправляем…',
      retryFailed: 'Не получилось, повторить',
      galleryHint: 'Фото, которые вы сюда добавите, появятся на странице «Работы» — в разделе «Работы MaDE» или «Работы учениц», в зависимости от выбора.',
      sectionLabel: 'Раздел',
      madeWorks: 'Работы MaDE',
      studentWorks: 'Работы учениц',
      captionLabel: 'Подпись (необязательно)',
      captionPlaceholder: 'Например: Вечернее платье с вышивкой',
      photoLabel: 'Фото',
      upload: 'Загрузить',
      uploading: 'Загружаем…',
      uploaded: 'Загружено',
      uploadError: 'Не получилось загрузить',
      noPhotosYet: 'Пока нет загруженных фото.',
      photosListError: 'Не удалось загрузить список.',
      categoryMade: 'MaDE',
      categoryStudent: 'Ученицы',
      videoLinkLabel: 'Ссылка на видео',
      videoLinkPlaceholder: 'https://youtube.com/...'
    },
    kk: {
      adminPanel: 'Әкімші панелі',
      loginLabel: 'Логин',
      passwordLabel: 'Құпия сөз',
      loginBtn: 'Кіру',
      wrongCredentials: 'Логин немесе құпия сөз қате.',
      noAccess: 'Бұл аккаунттың әкімші панеліне қатынасы жоқ.',
      headerBrand: 'MaDE · Әкімші',
      loggedInAs: 'сіз кірдіңіз: ',
      logout: 'Шығу',
      saveChanges: 'Өзгерістерді сақтау',
      unsavedChanges: 'Сақталмаған өзгерістер бар',
      saving: 'Сақталуда…',
      saved: 'Сақталды',
      saveError: 'Сақтау қатесі',
      loading: 'Жүктелуде…',
      noFieldsOnPage: 'Бұл бетте әзірге ешқандай өріс жоқ.',
      loadContentError: 'Мазмұнды жүктеу мүмкін болмады.',
      russian: 'Орысша',
      kazakh: 'Қазақша',
      pageLabels: {
        index: 'Басты бет', courses: 'Курстар', atelier: 'Ателье', gallery: 'Жұмыстар',
        shop: 'Дүкен', reviews: 'Пікірлер', about: 'Студия туралы', contacts: 'Байланыс',
        login: 'Кіру', register: 'Тіркелу', cabinet: 'Жеке кабинет'
      },
      groupLabels: {
        'nav': 'Мәзір (десктоп)',
        'mobile-nav': 'Мәзір (мобильді)',
        'hero': 'Басты экран',
        'directions': 'Бағыттар',
        'enroll': 'Жазылу блогы',
        'footer': 'Сайттың төменгі бөлігі',
        'location': 'Бізді қалай табуға болады',
        'page-hero': 'Бет тақырыбы',
        'card': 'Курс карточкасы',
        'intro': 'Кіріспе блогы',
        'modules': 'Курс модульдері',
        'program': 'Курс бағдарламасы',
        'section': 'Бет блогы',
        'columns': 'Бағандар',
        'shop': 'Тауарлар',
        'contacts': 'Байланыс',
        'empty': 'Бос күй',
        'video': 'Бейне (сілтеме)',
        'video-lesson-m1': 'Сабақ бейнелері — 1-модуль',
        'video-lesson-m2': 'Сабақ бейнелері — 2-модуль',
        'video-lesson-m3': 'Сабақ бейнелері — 3-модуль',
        'video-lesson-m4': 'Сабақ бейнелері — 4-модуль'
      },
      lekalaNav: 'Лекал жинақтары',
      galleryNav: 'Галерея фотосуреттері',
      ordersNav: 'Тапсырыстар',
      courseAccessNav: 'Курсқа қолжетімділік',
      lekalaHint: 'Лекал жинағының позициялары — фасон мен өлшемдер бір жолда, мысалы «Көйлек, 44–60 өлшем». Сайтта «Лекал жинақтары» карточкасында көрсетіледі, сатып алушылар бірнешеуін тапсырысқа жинай алады. Файл — «Тапсырыстар» бөлімінде төлемді растағаннан кейін сатып алушыға автоматты түрде поштаға кететін нәрсе.',
      lekalaLabelPlaceholder: 'Мысалы: Көйлек, 42–50 өлшем',
      lekalaPricePlaceholder: 'Бағасы, ₸',
      add: 'Қосу',
      noItemsYet: 'Әзірге бірде-бір позиция жоқ.',
      loadListError: 'Тізімді жүктеу мүмкін болмады.',
      hasFile: 'файл бар',
      noFile: 'файлсыз',
      typeCourseModule: 'курс модулі',
      typeCourseFull: 'толық курс',
      del: 'Жою',
      adding: 'Қосылуда…',
      added: 'Қосылды',
      addError: 'Қосу мүмкін болмады',
      ordersHint: 'Барлық тапсырыстар — тауарлар мен курс бірге. Сатып алушы Kaspi сілтемесі арқылы төлеп, түбіртекті WhatsApp-қа жібереді. Хабарламада тапсырыс нөмірі көрсетіледі — сол нөмірді осы жерден тауып, «Төлемді растау» түймесін басыңыз: файлдар поштаға кетеді, курсқа/модульге қолжетімділік өзі ашылады.',
      noOrders: 'Әзірге тапсырыстар жоқ.',
      loadOrdersError: 'Тапсырыстарды жүктеу мүмкін болмады.',
      statusPending: 'Растауды күтуде',
      statusPaid: 'Төленді, қолжетімділік берілді',
      total: 'Барлығы',
      orderNo: 'Тапсырыс №',
      orderPlaced: 'Рәсімделді',
      orderConfirmed: 'Расталды',
      ordersSummary: 'Барлық тапсырыс',
      ordersPendingCount: 'растауды күтуде',
      confirmPayment: 'Төлемді растау',
      sending: 'Жіберілуде…',
      retryFailed: 'Сәтсіз аяқталды, қайталаңыз',
      galleryHint: 'Осында қосатын фотосуреттер «Жұмыстар» бетінде — «MaDE жұмыстары» немесе «Оқушылардың жұмыстары» бөлімінде, таңдауыңызға байланысты пайда болады.',
      sectionLabel: 'Бөлім',
      madeWorks: 'MaDE жұмыстары',
      studentWorks: 'Оқушылардың жұмыстары',
      captionLabel: 'Жазба (міндетті емес)',
      captionPlaceholder: 'Мысалы: Кестелі кешкі көйлек',
      photoLabel: 'Фотосурет',
      upload: 'Жүктеу',
      uploading: 'Жүктелуде…',
      uploaded: 'Жүктелді',
      uploadError: 'Жүктеу мүмкін болмады',
      noPhotosYet: 'Әзірге жүктелген фотосурет жоқ.',
      photosListError: 'Тізімді жүктеу мүмкін болмады.',
      categoryMade: 'MaDE',
      categoryStudent: 'Оқушылар',
      videoLinkLabel: 'Бейне сілтемесі',
      videoLinkPlaceholder: 'https://youtube.com/...'
    }
  };

  var lang = 'ru';
  try { lang = localStorage.getItem('made_admin_lang') || 'ru'; } catch (e) {}

  function t(key) {
    return STRINGS[lang][key];
  }

  var PAGE_IDS = ['index', 'courses', 'atelier', 'gallery', 'shop', 'reviews', 'about', 'contacts', 'login', 'register', 'cabinet'];

  var LEKALA_ID = 'lekala-items';
  var GALLERY_ID = 'gallery-photos-view';
  var ORDERS_ID = 'orders-view';
  var COURSE_ACCESS_ID = 'course-access-view';

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
  var lekalaTypeInput = document.getElementById('lekalaTypeInput');
  var lekalaModuleInput = document.getElementById('lekalaModuleInput');
  var lekalaFileInput = document.getElementById('lekalaFileInput');
  var lekalaSlugInput = document.getElementById('lekalaSlugInput');
  var galleryView = document.getElementById('galleryView');
  var galleryUploadForm = document.getElementById('galleryUploadForm');
  var galleryUploadStatus = document.getElementById('galleryUploadStatus');
  var galleryPhotosGrid = document.getElementById('galleryPhotosGrid');
  var ordersView = document.getElementById('ordersView');
  var ordersList = document.getElementById('ordersList');
  var courseAccessView = document.getElementById('courseAccessView');
  var courseAccessList = document.getElementById('courseAccessList');

  var currentPage = null;
  var originalContent = {};
  var dirtyKeys = {};
  var lastUsername = null;

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

  // Applies the current `lang` to every static UI string (the login
  // screen, header chrome, form labels/placeholders) and re-renders
  // whichever view is currently open so its dynamically generated
  // text (nav, field groups, lists) picks up the new language too.
  function applyLang() {
    document.querySelectorAll('.lang-switch button').forEach(function(btn){
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.getElementById('loginSub').textContent = t('adminPanel');
    document.getElementById('loginLabelText').textContent = t('loginLabel');
    document.getElementById('passwordLabelText').textContent = t('passwordLabel');
    document.getElementById('loginSubmitBtn').textContent = t('loginBtn');
    document.getElementById('headerBrand').textContent = t('headerBrand');
    logoutBtn.textContent = t('logout');
    saveBtn.textContent = t('saveChanges');
    document.getElementById('lekalaHint').textContent = t('lekalaHint');
    document.getElementById('lekalaLabelInput').placeholder = t('lekalaLabelPlaceholder');
    document.getElementById('lekalaPriceInput').placeholder = t('lekalaPricePlaceholder');
    document.getElementById('lekalaAddBtn').textContent = t('add');
    document.getElementById('ordersHint').textContent = t('ordersHint');
    document.getElementById('galleryHint').textContent = t('galleryHint');
    document.getElementById('gallerySectionLabel').textContent = t('sectionLabel');
    document.getElementById('galleryOptMade').textContent = t('madeWorks');
    document.getElementById('galleryOptStudent').textContent = t('studentWorks');
    document.getElementById('galleryCaptionLabel').textContent = t('captionLabel');
    document.getElementById('galleryAltInput').placeholder = t('captionPlaceholder');
    document.getElementById('galleryPhotoLabel').textContent = t('photoLabel');
    document.getElementById('galleryUploadBtn').textContent = t('upload');

    if (whoami.dataset.username) {
      whoami.textContent = t('loggedInAs') + whoami.dataset.username;
    }

    if (currentPage && PAGE_IDS.indexOf(currentPage) !== -1) {
      loadPage(currentPage);
    } else if (currentPage === LEKALA_ID) {
      openLekala();
    } else if (currentPage === GALLERY_ID) {
      openGalleryView();
    } else if (currentPage === ORDERS_ID) {
      openOrders();
    } else if (currentPage === COURSE_ACCESS_ID) {
      openCourseAccess();
    } else {
      renderNav();
    }
  }

  document.querySelectorAll('.lang-switch').forEach(function(group){
    group.addEventListener('click', function(e){
      var btn = e.target.closest('button[data-lang]');
      if (!btn) return;
      lang = btn.dataset.lang;
      try { localStorage.setItem('made_admin_lang', lang); } catch (err) {}
      applyLang();
    });
  });

  function showApp(username) {
    loginScreen.hidden = true;
    app.hidden = false;
    whoami.dataset.username = username || '';
    whoami.textContent = username ? (t('loggedInAs') + username) : '';
  }

  function showLogin() {
    app.hidden = true;
    loginScreen.hidden = false;
  }

  function renderNav() {
    pageNav.innerHTML = '';
    PAGE_IDS.forEach(function(id){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = STRINGS[lang].pageLabels[id];
      btn.dataset.page = id;
      if (id === currentPage) btn.classList.add('active');
      btn.addEventListener('click', function(){ loadPage(id); });
      pageNav.appendChild(btn);
    });

    var divider = document.createElement('div');
    divider.className = 'page-nav-divider';
    pageNav.appendChild(divider);

    var lekalaBtn = document.createElement('button');
    lekalaBtn.type = 'button';
    lekalaBtn.textContent = t('lekalaNav');
    lekalaBtn.dataset.page = LEKALA_ID;
    if (currentPage === LEKALA_ID) lekalaBtn.classList.add('active');
    lekalaBtn.addEventListener('click', openLekala);
    pageNav.appendChild(lekalaBtn);

    var galleryBtn = document.createElement('button');
    galleryBtn.type = 'button';
    galleryBtn.textContent = t('galleryNav');
    galleryBtn.dataset.page = GALLERY_ID;
    if (currentPage === GALLERY_ID) galleryBtn.classList.add('active');
    galleryBtn.addEventListener('click', openGalleryView);
    pageNav.appendChild(galleryBtn);

    var ordersBtn = document.createElement('button');
    ordersBtn.type = 'button';
    ordersBtn.textContent = t('ordersNav');
    ordersBtn.dataset.page = ORDERS_ID;
    if (currentPage === ORDERS_ID) ordersBtn.classList.add('active');
    ordersBtn.addEventListener('click', openOrders);
    pageNav.appendChild(ordersBtn);

    var courseAccessBtn = document.createElement('button');
    courseAccessBtn.type = 'button';
    courseAccessBtn.textContent = t('courseAccessNav');
    courseAccessBtn.dataset.page = COURSE_ACCESS_ID;
    if (currentPage === COURSE_ACCESS_ID) courseAccessBtn.classList.add('active');
    courseAccessBtn.addEventListener('click', openCourseAccess);
    pageNav.appendChild(courseAccessBtn);
  }

  // Lesson titles for the cabinet's "video-lesson-mN.n" fields, so each
  // of the ~86 individual video-link fields shows its actual lesson
  // name instead of just a bare key + number.
  var LESSON_TITLES = {
    "video-lesson-m1.1": "Швейная машина и оверлок",
    "video-lesson-m1.2": "Иглы и нитки, виды молний — как выбирать фурнитуру и оборудование",
    "video-lesson-m1.3": "Основные виды швов — практика",
    "video-lesson-m1.4": "Ровная строчка, расечки, закрепка",
    "video-lesson-m1.5": "Обработка срезов",
    "video-lesson-m1.6": "Французский шов",
    "video-lesson-m1.7": "Московский шов",
    "video-lesson-m1.8": "Роликовый шов",
    "video-lesson-m1.9": "Кант",
    "video-lesson-m1.10": "Обработка косой бейкой",
    "video-lesson-m1.11": "Раскрой ткани. Долевая, поперечная и косая нить",
    "video-lesson-m2.1": "Снятие мерок по юбке",
    "video-lesson-m2.2": "Конструкция юбки",
    "video-lesson-m2.3": "Моделирование юбки-трапеции",
    "video-lesson-m2.4": "Раскрой ткани и сборка изделия на примерку. ВТО",
    "video-lesson-m2.5": "Обработка на оверлоке и сборка на швейной машине. Выточка",
    "video-lesson-m2.6": "Обработка потайной молнии",
    "video-lesson-m2.7": "Обработка шлицы",
    "video-lesson-m2.8": "Обработка пояса",
    "video-lesson-m2.9": "Расчёт радиуса юбки-полусолнце. Раскрой ткани: нюансы и особенности",
    "video-lesson-m2.10": "Расчёт коэффициента растяжения резинки. Установка и обработка резинки",
    "video-lesson-m2.11": "Моделирование юбки-трапеции",
    "video-lesson-m2.12": "Моделирование юбки-солнце",
    "video-lesson-m2.13": "Моделирование юбки-полусолнце",
    "video-lesson-m2.14": "Моделирование юбки на запах",
    "video-lesson-m2.15": "Моделирование юбки с драпировкой",
    "video-lesson-m2.16": "Моделирование юбки по косой",
    "video-lesson-m2.17": "Моделирование юбки-карандаш",
    "video-lesson-m2.18": "Моделирование ярусной юбки",
    "video-lesson-m2.19": "Моделирование юбки-годе",
    "video-lesson-m2.20": "Моделирование классической юбки",
    "video-lesson-m3.1": "Снятие мерок для брюк",
    "video-lesson-m3.2": "Построение конструкции брюк",
    "video-lesson-m3.3": "Моделирование брюк палаццо. Работа со складками",
    "video-lesson-m3.4": "Раскрой ткани и сборка изделия на примерку. Долевая нить",
    "video-lesson-m3.5": "Передние боковые карманы",
    "video-lesson-m3.6": "Задний карман с листочкой. Подзор",
    "video-lesson-m3.7": "Сборка брюк",
    "video-lesson-m3.8": "Обработка застёжки. Гульфик и молния",
    "video-lesson-m3.9": "Пояс и шлёвки",
    "video-lesson-m3.10": "Обработка низа брюк. Потайной шов",
    "video-lesson-m3.11": "Моделирование прямых джинсов",
    "video-lesson-m3.12": "Раскрой ткани и сборка изделия на примерку",
    "video-lesson-m3.13": "Обработка передних карманов",
    "video-lesson-m3.14": "Обработка задних накладных карманов",
    "video-lesson-m3.15": "Сборка джинсов. Двойной шаговый шов",
    "video-lesson-m3.16": "Обработка швов на оверлоке",
    "video-lesson-m3.17": "Пояс и шлёвки",
    "video-lesson-m3.18": "Обработка низа джинсов",
    "video-lesson-m3.19": "Моделирование брюк палаццо — 2 варианта",
    "video-lesson-m3.20": "Моделирование брюк клёш",
    "video-lesson-m3.21": "Моделирование брюк-бананов",
    "video-lesson-m3.22": "Моделирование брюк-кюлотов",
    "video-lesson-m4.1": "Снятие мерок для плечевых изделий и рукава",
    "video-lesson-m4.2": "Построение полочки",
    "video-lesson-m4.3": "Построение спинки",
    "video-lesson-m4.4": "Построение рукава",
    "video-lesson-m4.5": "Моделирование платья-трапеции с рельефом",
    "video-lesson-m4.6": "Раскрой и сборка изделия на примерку",
    "video-lesson-m4.7": "Боковые карманы в шве",
    "video-lesson-m4.8": "Сборка изделия",
    "video-lesson-m4.9": "Притачивание рукава с посадкой",
    "video-lesson-m4.10": "Обработка потайной молнии на спинке",
    "video-lesson-m4.11": "Обработка обтачкой и обработка низа изделия",
    "video-lesson-m4.12": "Моделирование оверсайз-рубашки с кокеткой и планкой",
    "video-lesson-m4.13": "Моделирование и построение рукава",
    "video-lesson-m4.14": "Подготовка ткани, ВТО и раскрой деталей. Сборка на примерку",
    "video-lesson-m4.15": "Построение воротника",
    "video-lesson-m4.16": "Раскрой воротника и манжет",
    "video-lesson-m4.17": "Сборка изделия с рукавом",
    "video-lesson-m4.18": "Установка планки",
    "video-lesson-m4.19": "Установка воротника",
    "video-lesson-m4.20": "Обработка разреза рукава",
    "video-lesson-m4.21": "Установка манжет",
    "video-lesson-m4.22": "Нагрудный накладной карман",
    "video-lesson-m4.23": "Обработка низа рубашки",
    "video-lesson-m4.24": "Обработка петель",
    "video-lesson-m4.25": "Пришивание пуговиц",
    "video-lesson-m4.26": "Моделирование платья-трапеции",
    "video-lesson-m4.27": "Моделирование платья на запах",
    "video-lesson-m4.28": "Моделирование платья с драпировкой",
    "video-lesson-m4.29": "Моделирование рубашки",
    "video-lesson-m4.30": "Моделирование футболки с опущенным рукавом. Оверсайз",
    "video-lesson-m4.31": "Моделирование свитшота с рукавом реглан",
    "video-lesson-m4.32": "Моделирование платья с рельефами",
    "video-lesson-m4.33": "Разные варианты моделирования рукава"
  };

  function fieldLabel(key) {
    if (LESSON_TITLES[key]) return LESSON_TITLES[key];
    return key;
  }

  // Video-link fields (the single course video, and every per-lesson
  // video in the cabinet) hold a URL, not translated copy — one field
  // is enough, and it's written into both ru/kk on save so the rest of
  // the content pipeline (which always reads/writes both) keeps working.
  function isVideoLinkKey(key) {
    var group = splitKey(key).group;
    return group === 'video' || group.indexOf('video-lesson') === 0;
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
      fieldsList.innerHTML = '<p class="empty-note">' + t('noFieldsOnPage') + '</p>';
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
      name.textContent = STRINGS[lang].groupLabels[group] || group;
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

        if (isVideoLinkKey(key)) {
          cols.classList.add('field-cols-single');
          var col = document.createElement('div');
          var label = document.createElement('label');
          label.textContent = t('videoLinkLabel');
          var input = document.createElement('input');
          input.type = 'url';
          input.placeholder = t('videoLinkPlaceholder');
          input.value = val.ru || val.kk || '';
          input.dataset.key = key;
          input.addEventListener('input', function(){
            input.classList.add('changed');
            dirtyKeys[key] = dirtyKeys[key] || { ru: content[key].ru, kk: content[key].kk };
            dirtyKeys[key].ru = input.value;
            dirtyKeys[key].kk = input.value;
            updateSaveState();
          });
          col.appendChild(label);
          col.appendChild(input);
          cols.appendChild(col);
          wrap.appendChild(cols);
          body.appendChild(wrap);
          return;
        }

        ['ru', 'kk'].forEach(function(fieldLang){
          var col = document.createElement('div');
          var label = document.createElement('label');
          label.textContent = fieldLang === 'ru' ? t('russian') : t('kazakh');
          var ta = document.createElement('textarea');
          ta.value = val[fieldLang] || '';
          ta.dataset.key = key;
          ta.dataset.lang = fieldLang;
          ta.addEventListener('input', function(){
            ta.classList.add('changed');
            dirtyKeys[key] = dirtyKeys[key] || { ru: content[key].ru, kk: content[key].kk };
            dirtyKeys[key][fieldLang] = ta.value;
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
    saveStatus.textContent = hasChanges ? t('unsavedChanges') : '';
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
    courseAccessView.hidden = true;
    pageTitle.textContent = STRINGS[lang].pageLabels[pageId] || pageId;
    fieldsList.innerHTML = '<p class="empty-note">' + t('loading') + '</p>';
    updateSaveState();

    api('/api/content/' + encodeURIComponent(pageId))
      .then(function(data){
        originalContent = data;
        renderFields(data);
      })
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        fieldsList.innerHTML = '<p class="empty-note">' + t('loadContentError') + '</p>';
      });
  }

  function renderLekalaItems(items) {
    lekalaList.innerHTML = '';
    if (!items.length) {
      lekalaList.innerHTML = '<li class="empty-note">' + t('noItemsYet') + '</li>';
      return;
    }
    items.forEach(function(item){
      var li = document.createElement('li');
      li.className = 'lekala-row';
      var span = document.createElement('span');
      var bits = [item.label];
      if (item.price) bits.push(Number(item.price).toLocaleString('ru-RU') + ' ₸');
      if (item.productType === 'course_module') bits.push(t('typeCourseModule') + ' ' + item.moduleKey);
      else if (item.productType === 'course_full') bits.push(t('typeCourseFull'));
      else bits.push(item.hasFile ? t('hasFile') : t('noFile'));
      span.textContent = bits.join(' — ');
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'lekala-delete';
      del.textContent = t('del');
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
    lekalaList.innerHTML = '<li class="empty-note">' + t('loading') + '</li>';
    api('/api/lekala-items')
      .then(renderLekalaItems)
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        lekalaList.innerHTML = '<li class="empty-note">' + t('loadListError') + '</li>';
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
    courseAccessView.hidden = true;
    lekalaStatus.textContent = '';
    lekalaStatus.className = 'save-status';
    loadLekalaItems();
  }

  function renderGalleryPhotos(photos) {
    galleryPhotosGrid.innerHTML = '';
    if (!photos.length) {
      galleryPhotosGrid.innerHTML = '<p class="empty-note">' + t('noPhotosYet') + '</p>';
      return;
    }
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
      label.textContent = photo.category === 'made' ? t('categoryMade') : (photo.category === 'student' ? t('categoryStudent') : photo.category);
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'lekala-delete';
      del.textContent = t('del');
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
    galleryPhotosGrid.innerHTML = '<p class="empty-note">' + t('loading') + '</p>';
    api('/api/gallery-photos')
      .then(renderGalleryPhotos)
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        galleryPhotosGrid.innerHTML = '<p class="empty-note">' + t('photosListError') + '</p>';
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
    courseAccessView.hidden = true;
    galleryUploadStatus.textContent = '';
    galleryUploadStatus.className = 'save-status';
    loadGalleryPhotos();
  }

  galleryUploadForm.addEventListener('submit', function(e){
    e.preventDefault();
    var fileInput = galleryUploadForm.elements.photo;
    if (!fileInput.files[0]) return;

    galleryUploadStatus.textContent = t('uploading');
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
        galleryUploadStatus.textContent = t('uploaded');
        galleryUploadStatus.className = 'save-status ok';
        loadGalleryPhotos();
      })
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        galleryUploadStatus.textContent = t('uploadError');
        galleryUploadStatus.className = 'save-status err';
      });
  });

  if (lekalaTypeInput) {
    lekalaTypeInput.addEventListener('change', function(){
      var isModule = lekalaTypeInput.value === 'course_module';
      var isFile = lekalaTypeInput.value === 'file';
      lekalaModuleInput.hidden = !isModule;
      lekalaFileInput.hidden = !isFile;
      if (lekalaSlugInput) lekalaSlugInput.hidden = !isFile;
    });
  }

  lekalaForm.addEventListener('submit', function(e){
    e.preventDefault();
    var label = lekalaForm.elements.label.value.trim();
    if (!label) return;

    lekalaStatus.textContent = t('adding');
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
        if (lekalaModuleInput) lekalaModuleInput.hidden = true;
        if (lekalaFileInput) lekalaFileInput.hidden = false;
        lekalaStatus.textContent = t('added');
        lekalaStatus.className = 'save-status ok';
        loadLekalaItems();
      })
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        lekalaStatus.textContent = t('addError');
        lekalaStatus.className = 'save-status err';
      });
  });

  function money(value) {
    return Number(value || 0).toLocaleString('ru-RU') + ' ₸';
  }

  // "23.09.2026, 19:40" — the owner needs to tell one order from another
  // when a customer writes "я оплатил" without saying what exactly.
  function formatWhen(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function renderOrders(orders) {
    ordersList.innerHTML = '';
    if (!orders.length) {
      ordersList.innerHTML = '<p class="empty-note">' + t('noOrders') + '</p>';
      return;
    }

    var pending = orders.filter(function(o){ return o.status === 'pending'; }).length;
    var summary = document.createElement('p');
    summary.className = 'orders-summary';
    summary.textContent = t('ordersSummary') + ': ' + orders.length +
      (pending ? ' · ' + pending + ' ' + t('ordersPendingCount') : '');
    ordersList.appendChild(summary);

    orders.forEach(function(order){
      var card = document.createElement('div');
      card.className = 'order-card order-card-' + order.status;

      var head = document.createElement('div');
      head.className = 'order-card-head';
      var no = document.createElement('span');
      no.className = 'order-no';
      no.textContent = t('orderNo') + order.id;
      var status = document.createElement('span');
      status.className = 'order-status order-status-' + order.status;
      status.textContent = order.status === 'paid' ? t('statusPaid') : (order.status === 'pending' ? t('statusPending') : order.status);
      head.appendChild(no);
      head.appendChild(status);
      card.appendChild(head);

      var meta = document.createElement('p');
      meta.className = 'order-meta';
      meta.textContent = t('orderPlaced') + ': ' + formatWhen(order.created_at);
      if (order.status === 'paid' && order.confirmed_at) {
        meta.textContent += ' · ' + t('orderConfirmed') + ': ' + formatWhen(order.confirmed_at);
      }
      card.appendChild(meta);

      var who = document.createElement('p');
      who.className = 'order-buyer';
      if (order.name) who.appendChild(document.createTextNode(order.name + ' — '));
      var mail = document.createElement('a');
      mail.href = 'mailto:' + order.email;
      mail.textContent = order.email;
      who.appendChild(mail);
      card.appendChild(who);

      var items = document.createElement('ul');
      items.className = 'order-items';
      var total = 0;
      order.items.forEach(function(item){
        var li = document.createElement('li');
        var name = document.createElement('span');
        name.textContent = item.label;
        var price = document.createElement('span');
        price.className = 'order-item-price';
        price.textContent = money(item.price);
        li.appendChild(name);
        li.appendChild(price);
        items.appendChild(li);
        total += Number(item.price) || 0;
      });
      card.appendChild(items);

      var totalP = document.createElement('p');
      totalP.className = 'order-total';
      totalP.textContent = t('total') + ': ' + money(total);
      card.appendChild(totalP);

      if (order.status === 'pending') {
        var confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'btn-solid';
        confirmBtn.textContent = t('confirmPayment');
        confirmBtn.addEventListener('click', function(){
          confirmBtn.disabled = true;
          confirmBtn.textContent = t('sending');
          api('/api/orders/' + order.id + '/confirm', { method: 'POST' })
            .then(loadOrders)
            .catch(function(err){
              if (err && err.unauthorized) { showLogin(); return; }
              confirmBtn.disabled = false;
              confirmBtn.textContent = t('retryFailed');
            });
        });
        card.appendChild(confirmBtn);
      }

      ordersList.appendChild(card);
    });
  }

  function loadOrders() {
    ordersList.innerHTML = '<p class="empty-note">' + t('loading') + '</p>';
    api('/api/orders')
      .then(renderOrders)
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        ordersList.innerHTML = '<p class="empty-note">' + t('loadOrdersError') + '</p>';
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
    courseAccessView.hidden = true;
    loadOrders();
  }

  var MODULE_LABELS = { m1: 'Модуль 1', m2: 'Модуль 2', m3: 'Модуль 3', m4: 'Модуль 4' };

  function renderCourseAccess(rows) {
    courseAccessList.innerHTML = '';
    if (!rows.length) {
      courseAccessList.innerHTML = '<p class="empty-note">' + t('noOrders') + '</p>';
      return;
    }
    rows.forEach(function(row){
      var card = document.createElement('div');
      card.className = 'order-card';

      var head = document.createElement('div');
      head.className = 'order-card-head';
      var who = document.createElement('span');
      who.textContent = (row.name ? row.name + ' — ' : '') + row.email;
      var status = document.createElement('span');
      status.className = 'order-status order-status-paid';
      var modules = row.modules || [];
      status.textContent = modules.length === 4
        ? t('typeCourseFull')
        : modules.map(function(m){ return MODULE_LABELS[m] || m; }).join(', ');
      head.appendChild(who);
      head.appendChild(status);
      card.appendChild(head);

      courseAccessList.appendChild(card);
    });
  }

  function loadCourseAccess() {
    courseAccessList.innerHTML = '<p class="empty-note">' + t('loading') + '</p>';
    api('/api/course-access/all')
      .then(renderCourseAccess)
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        courseAccessList.innerHTML = '<p class="empty-note">' + t('loadOrdersError') + '</p>';
      });
  }


  function openCourseAccess() {
    currentPage = COURSE_ACCESS_ID;
    renderNav();
    editorHead.hidden = true;
    fieldsList.hidden = true;
    lekalaView.hidden = true;
    galleryView.hidden = true;
    ordersView.hidden = true;
    courseAccessView.hidden = false;
    loadCourseAccess();
  }

  saveBtn.addEventListener('click', function(){
    if (!Object.keys(dirtyKeys).length) return;
    saveBtn.disabled = true;
    saveStatus.textContent = t('saving');
    saveStatus.className = 'save-status';

    api('/api/content/' + encodeURIComponent(currentPage), {
      method: 'PUT',
      body: JSON.stringify(dirtyKeys)
    })
      .then(function(){
        saveStatus.textContent = t('saved');
        saveStatus.className = 'save-status ok';
        dirtyKeys = {};
        document.querySelectorAll('.field textarea.changed').forEach(function(ta){
          ta.classList.remove('changed');
        });
      })
      .catch(function(err){
        if (err && err.unauthorized) { showLogin(); return; }
        saveStatus.textContent = t('saveError');
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
          loginError.textContent = t('noAccess');
          loginError.hidden = false;
          api('/api/logout', { method: 'POST' });
          return;
        }
        showApp(data.username);
        loadPage(PAGE_IDS[0]);
      })
      .catch(function(){
        loginError.textContent = t('wrongCredentials');
        loginError.hidden = false;
      });
  });

  logoutBtn.addEventListener('click', function(){
    api('/api/logout', { method: 'POST' }).finally(function(){
      showLogin();
    });
  });

  applyLang();

  // On load, check if already authenticated (existing session cookie)
  api('/api/me')
    .then(function(data){
      if (data.role !== 'owner') { showLogin(); return; }
      showApp(data.username);
      loadPage(PAGE_IDS[0]);
    })
    .catch(function(){
      showLogin();
    });
})();
