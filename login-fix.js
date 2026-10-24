/* Independent login diagnostics for the Faragello site. */
(function () {
  function initLoginFix() {
    var status = document.getElementById('loginText');
    var admin = document.getElementById('adminLoginChoice');
    var client = document.getElementById('clientLoginToggle');
    var errorBox = document.getElementById('loginErr');

    function showStatus(message) {
      if (status) status.textContent = message;
    }
    function wireChoice(button, role) {
      if (!button || button.dataset.loginFixAttached === 'yes') return;
      button.dataset.loginFixAttached = 'yes';
      button.addEventListener('click', function () {
        window.setTimeout(function () {
          var fields = document.getElementById('loginFields');
          if (fields && !fields.classList.contains('hidden')) {
            showStatus(role === 'admin' ? 'دخول المشرف — اكتب اسم المستخدم وكلمة المرور' : 'دخول العميل — اكتب اسم المستخدم وكلمة المرور');
          } else {
            showStatus('تم الضغط على زر الدخول، لكن دالة اختيار الحساب لم تعمل. أرسل هذه الرسالة للدعم.');
          }
        }, 100);
      });
    }
    wireChoice(admin, 'admin');
    wireChoice(client, 'client');

    var submit = document.getElementById('loginSubmit');
    if (submit && submit.dataset.loginFixAttached !== 'yes') {
      submit.dataset.loginFixAttached = 'yes';
      submit.addEventListener('click', function (event) {
        event.preventDefault();
        if (errorBox) errorBox.textContent = 'تم الضغط على زر الدخول، جاري فحص النظام...';
        try {
          if (typeof window.doLogin !== 'function') {
            if (errorBox) errorBox.textContent = 'زر الدخول يعمل، لكن كود النظام الرئيسي لم يتم تحميله.';
            return;
          }
          Promise.resolve(window.doLogin()).catch(function (err) {
            if (errorBox) errorBox.textContent = 'خطأ أثناء الدخول: ' + (err && err.message ? err.message : String(err));
          });
        } catch (err) {
          if (errorBox) errorBox.textContent = 'خطأ أثناء تشغيل الدخول: ' + (err && err.message ? err.message : String(err));
        }
      });
    }

    window.addEventListener('error', function (event) {
      var target = document.getElementById('loginErr');
      if (target && event.message) target.textContent = 'خطأ JavaScript: ' + event.message;
      if (event.message) showStatus('خطأ تشغيل بالموقع: ' + event.message);
    });
    window.addEventListener('unhandledrejection', function (event) {
      var reason = event.reason && event.reason.message ? event.reason.message : String(event.reason || '');
      if (errorBox && reason) errorBox.textContent = 'خطأ أثناء الاتصال: ' + reason;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLoginFix);
  else initLoginFix();
})();