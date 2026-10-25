/* Login recovery + final login visual fixes. */
(function () {
  function applyLoginDesign() {
    if (document.getElementById('faragello-login-design-fix')) return;
    var style = document.createElement('style');
    style.id = 'faragello-login-design-fix';
    style.textContent = `
      #login #clientLoginToggle {
        background: linear-gradient(100deg,#00c8ff,#0877ff) !important;
        border: 1px solid #29dfff !important;
        color: #fff !important;
        box-shadow: 0 5px 14px rgba(0,160,255,.25) !important;
      }
      #login .login-card > div:last-child {
        color: #8deaff !important;
      }
    `;
    document.head.appendChild(style);

    var footer = Array.from(document.querySelectorAll('#login .login-card > div')).find(function (el) {
      return (el.textContent || '').indexOf('Farag El-Sayed') !== -1;
    });
    if (footer) {
      footer.style.setProperty('color', '#8deaff', 'important');
    }
  }

  function init() {
    applyLoginDesign();

    function recoverChoice(buttonId, role) {
      var button = document.getElementById(buttonId);
      if (!button || button.dataset.recoveryBound === 'yes') return;
      button.dataset.recoveryBound = 'yes';
      button.addEventListener('click', function () {
        try {
          if (typeof window.chooseLogin === 'function') {
            window.chooseLogin(role);
          } else {
            var fields = document.getElementById('loginFields');
            var admin = document.getElementById('adminLoginChoice');
            var client = document.getElementById('clientLoginToggle');
            if (fields) fields.classList.remove('hidden');
            if (admin) admin.classList.add('hidden');
            if (client) client.classList.add('hidden');
            var title = document.getElementById('loginText');
            if (title) title.textContent = role === 'admin' ? 'دخول المشرف — اكتب بياناتك' : 'دخول العميل — اكتب بياناتك';
          }
        } catch (e) {
          var title = document.getElementById('loginText');
          if (title) title.textContent = 'حصل خطأ عند فتح الدخول: ' + (e.message || String(e));
        }
      });
    }

    recoverChoice('adminLoginChoice', 'admin');
    recoverChoice('clientLoginToggle', 'client');

    var submit = document.getElementById('loginSubmit');
    if (submit && submit.dataset.recoveryBound !== 'yes') {
      submit.dataset.recoveryBound = 'yes';
      submit.addEventListener('click', function (event) {
        event.preventDefault();
        var errorBox = document.getElementById('loginErr');
        if (errorBox) errorBox.textContent = 'تم الضغط على زر الدخول، جاري فحص النظام...';
        try {
          if (typeof window.doLogin !== 'function') {
            if (errorBox) errorBox.textContent = 'زر الدخول استجاب، لكن كود تسجيل الدخول الرئيسي لا يعمل.';
            return;
          }
          Promise.resolve(window.doLogin()).catch(function (err) {
            if (errorBox) errorBox.textContent = 'خطأ أثناء الدخول: ' + (err && err.message ? err.message : String(err));
          });
        } catch (err) {
          if (errorBox) errorBox.textContent = 'خطأ أثناء الدخول: ' + (err && err.message ? err.message : String(err));
        }
      });
    }

    window.addEventListener('error', function (event) {
      var box = document.getElementById('loginText');
      if (box && event.message) box.textContent = 'خطأ تشغيل بالموقع: ' + event.message;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();