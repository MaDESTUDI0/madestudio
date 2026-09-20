(function(){
  var step1 = document.getElementById('registerStep1');
  if (!step1) return; // not on the register page

  var API_BASE = window.MADE_API_BASE || '';
  var step2 = document.getElementById('registerStep2');
  var success = document.getElementById('registerSuccess');
  var step1Error = document.getElementById('registerStep1Error');
  var step2Error = document.getElementById('registerStep2Error');
  var emailDisplay = document.getElementById('registerEmailDisplay');
  var successEmail = document.getElementById('registerSuccessEmail');
  var successAvatar = document.getElementById('registerAvatarBig');
  var resendBtn = document.getElementById('resendCodeBtn');

  var currentEmail = '';

  var ERROR_MESSAGES = {
    invalid_email: 'Проверьте адрес почты.',
    weak_password: 'Пароль должен быть не короче 8 символов.',
    password_mismatch: 'Пароли не совпадают.',
    already_registered: 'Этот email уже зарегистрирован — попробуйте войти.',
    cooldown: 'Код уже отправлен, подождите минуту перед повторной отправкой.',
    email_send_failed: 'Не получилось отправить письмо. Попробуйте позже.',
    too_many_attempts: 'Слишком много попыток. Начните регистрацию заново.',
    invalid_code: 'Неверный код.',
    code_expired: 'Код устарел — запросите новый.',
    no_pending_registration: 'Сессия регистрации истекла — начните заново.',
    missing_fields: 'Заполните все поля.',
    missing_name: 'Укажите имя.'
  };

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

  function showError(el, code) {
    el.textContent = ERROR_MESSAGES[code && code.error] || 'Что-то пошло не так, попробуйте ещё раз.';
    el.classList.add('visible');
  }

  function clearError(el) {
    el.textContent = '';
    el.classList.remove('visible');
  }

  step1.addEventListener('submit', function(e){
    e.preventDefault();
    clearError(step1Error);

    var formData = new FormData(step1);
    var name = String(formData.get('name') || '').trim();
    var email = String(formData.get('email') || '').trim();
    var password = String(formData.get('password') || '');
    var password2 = String(formData.get('password2') || '');

    if (password !== password2) {
      showError(step1Error, { error: 'password_mismatch' });
      return;
    }

    api('/api/register/start', {
      method: 'POST',
      body: JSON.stringify({ email: email, password: password, name: name })
    })
      .then(function(){
        currentEmail = email.toLowerCase();
        emailDisplay.textContent = currentEmail;
        step1.style.display = 'none';
        step2.style.display = '';
      })
      .catch(function(err){ showError(step1Error, err); });
  });

  step2.addEventListener('submit', function(e){
    e.preventDefault();
    clearError(step2Error);

    var formData = new FormData(step2);
    var code = String(formData.get('code') || '').trim();

    api('/api/register/verify', {
      method: 'POST',
      body: JSON.stringify({ email: currentEmail, code: code })
    })
      .then(function(data){
        step2.style.display = 'none';
        var label = data.name || data.username || '';
        successEmail.textContent = label;
        if (successAvatar) successAvatar.textContent = label.trim().charAt(0).toUpperCase() || '?';
        success.classList.add('visible');
        if (typeof window.MADE_REFRESH_AUTH === 'function') window.MADE_REFRESH_AUTH();
      })
      .catch(function(err){ showError(step2Error, err); });
  });

  var resendCooldown = false;
  resendBtn.addEventListener('click', function(){
    if (resendCooldown) return;
    clearError(step2Error);

    api('/api/register/resend', {
      method: 'POST',
      body: JSON.stringify({ email: currentEmail })
    })
      .then(function(){
        resendCooldown = true;
        var seconds = 60;
        var original = resendBtn.textContent;
        resendBtn.disabled = true;
        var tick = function(){
          resendBtn.textContent = original + ' (' + seconds + ')';
          seconds -= 1;
          if (seconds < 0) {
            clearInterval(interval);
            resendBtn.textContent = original;
            resendBtn.disabled = false;
            resendCooldown = false;
          }
        };
        var interval = setInterval(tick, 1000);
        tick();
      })
      .catch(function(err){ showError(step2Error, err); });
  });
})();
