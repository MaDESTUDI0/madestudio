(function(){
  // Preloader (only present on pages that include #preloader)
  var fill = document.getElementById('loadbar-fill');
  var pre = document.getElementById('preloader');

  if(pre && fill){
    var progress = 0;
    var done = false;

    var step = function(){
      if(done) return;
      progress += Math.random()*6 + 2;
      if(progress > 92) progress = 92;
      fill.style.width = progress + '%';
      if(progress < 92){
        setTimeout(step, Math.random()*500 + 350);
      }
    };
    step();

    var finish = function(){
      if(done) return;
      done = true;
      fill.style.width = '100%';
      setTimeout(function(){
        pre.classList.add('hidden');
        document.body.classList.remove('loading');
      }, 250);
    };

    window.addEventListener('load', finish);
    setTimeout(finish, 8000);
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:0.15, rootMargin:'0px 0px -8% 0px'});
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  }else{
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  // Mobile menu
  var burger = document.getElementById('burgerBtn');
  var mobileNav = document.getElementById('mobileNav');
  if(burger && mobileNav){
    burger.addEventListener('click', function(){
      var open = mobileNav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // i18n
  var STRINGS_HTML = document.querySelectorAll('[data-i18n-html]');
  var STRINGS_TEXT = document.querySelectorAll('[data-ru]:not([data-i18n-html])');

  var titles = window.MADE_TITLES || {};

  function applyLang(lang){
    document.documentElement.lang = lang;
    if(titles[lang]) document.title = titles[lang];

    STRINGS_TEXT.forEach(function(el){
      var val = el.getAttribute('data-' + lang);
      if(val !== null) el.textContent = val;
    });
    STRINGS_HTML.forEach(function(el){
      var val = el.getAttribute('data-' + lang);
      if(val !== null) el.innerHTML = val;
    });

    document.querySelectorAll('.lang-switch button').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    try{ localStorage.setItem('made_lang', lang); }catch(e){}
  }

  document.querySelectorAll('.lang-switch button').forEach(function(btn){
    btn.addEventListener('click', function(){
      applyLang(btn.getAttribute('data-lang'));
    });
  });

  var saved = 'ru';
  try{ saved = localStorage.getItem('made_lang') || 'ru'; }catch(e){}
  applyLang(saved);
})();
