/* Independent login diagnostics; intentionally does not depend on the main app script. */
(function () {
  function initLoginFix() {
    var box = document.getElementById('loginErr');
    var button = document.getElementById('loginSubmit');
    if (!button || button.dataset.loginFixAttached === 'yes') return;
    button.dataset.loginFixAttached = 'yes';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      var errorBox = document.getElementById('loginErr');
      if (errorBox) errorBox.textContent = 'تم الضغط على زر الدخول، جاري فحص النظام...';
      try {
        if (typeof window.doLogin !== 'function') {
          if (errorBox) errorBox.textContent = 'زر الدخول يعمل، لكن كود النظام الرئيسي لم يتم تحميله. أعد تحميل الصفحة؛ لو استمرت الرسالة فالمشكلة في تشغيل كود الموقع.';
          return;
        }
        Promise.resolve(window.doLogin()).catch(function (err) {
          if (errorBox) errorBox.textContent = 'خطأ أثناء الدخول: ' + (err && err.message ? err.message : String(err));
        });
      } catch (err) {
        if (errorBox) errorBox.textContent = 'خطأ أثناء تشغيل الدخول: ' + (err && err.message ? err.message : String(err));
      }
    });
    window.addEventListener('error', function (event) {
      var target = document.getElementById('loginErr');
      if (target && event.message) target.textContent = 'خطأ JavaScript: ' + event.message;
    });
    window.addEventListener('unhandledrejection', function (event) {
      var target = document.getElementById('loginErr');
      var reason = event.reason && event.reason.message ? event.reason.message : String(event.reason || '');
      if (target && reason) target.textContent = 'خطأ أثناء الاتصال: ' + reason;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLoginFix);
  else initLoginFix();
})();