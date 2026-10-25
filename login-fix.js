/* Login recovery + final login visual fixes. */
(function () {
  function addInventoryCountMenu() {
    if (document.getElementById('faragello-inventory-count-nav')) return;
    var navs = document.querySelectorAll('#app .side .nav');
    for (var i = 0; i < navs.length; i++) {
      var text = (navs[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (text.indexOf('المخزون') !== -1 && text.indexOf('الجرد') === -1) {
        var item = document.createElement('button');
        item.id = 'faragello-inventory-count-nav';
        item.className = 'nav';
        item.type = 'button';
        item.textContent = 'الجرد';
        item.style.fontWeight = '800';
        item.style.fontSize = '17px';
        item.style.width = '100%';
        item.style.textAlign = 'right';
        item.style.color = '#e9f4ff';
        item.addEventListener('click', function () {
          var stock = document.querySelector('#app .side .nav');
          var target = document.getElementById('inventory');
          if (target) {
            document.querySelectorAll('#app .side .nav').forEach(function (n) { n.classList.remove('active'); });
            item.classList.add('active');
            document.querySelectorAll('#app main .page').forEach(function (p) { p.classList.add('hidden'); });
            target.classList.remove('hidden');
          } else if (stock) {
            stock.click();
          }
        });
        navs[i].parentNode.insertBefore(item, navs[i].nextSibling);
        break;
      }
    }
  }

  function applyLoginDesign() {
    var old = document.getElementById('faragello-login-design-fix');
    if (old) old.remove();

    var style = document.createElement('style');
    style.id = 'faragello-login-design-fix';
    style.textContent = `
      #login .login-card #clientLoginToggle,
      #login .login-card .btn.gray,
      #login .login-card button:nth-of-type(2) {
        background: linear-gradient(100deg,#00c8ff,#0877ff) !important;
        border: 1px solid #29dfff !important;
        color: #fff !important;
        box-shadow: 0 5px 14px rgba(0,160,255,.25) !important;
      }

      #login .login-card h1,
      #login .login-card h1 *,
      #login .login-card p,
      #login .login-card p *,
      #login .login-card > div:last-child,
      #login .login-card > div:last-child * {
        font-family: Arial, sans-serif !important;
        font-weight: 300 !important;
        font-style: normal !important;
      }

      #login .login-card button {
        font-family: Tahoma, Arial, sans-serif !important;
        font-weight: 600 !important;
      }

      #login .login-card > div:last-child,
      #login .login-card > div:last-child * {
        color: #8deaff !important;
      }

      #app .side .nav,
      #app .side .nav a,
      #app .side .nav button,
      #app .side .nav span,
      #app .side .nav * {
        font-weight: 800 !important;
      }
      #app .side .nav {
        font-size: 17px !important;
      }
      #app .side .logout,
      #app .side .logout * {
        font-weight: 800 !important;
      }
    `;
    document.head.appendChild(style);

    function makeBrandingLight() {
      var nodes = document.querySelectorAll('#login .login-card h1, #login .login-card p, #login .login-card > div:last-child, #login .login-card h1 *, #login .login-card p *, #login .login-card > div:last-child *');
      nodes.forEach(function (el) {
        el.style.setProperty('font-family', 'Arial, sans-serif', 'important');
        el.style.setProperty('font-weight', '300', 'important');
        el.style.setProperty('font-style', 'normal', 'important');
        var text = (el.textContent || '').trim();
        if (text.indexOf('Farag El-Sayed') !== -1 || text.indexOf('سيستم محاسبة') !== -1) {
          el.style.setProperty('color', '#8deaff', 'important');
        }
      });
    }

    makeBrandingLight();

    if (!window.__faragelloLoginObserver) {
      window.__faragelloLoginObserver = new MutationObserver(function () {
        makeBrandingLight();
      });
      var login = document.getElementById('login');
      if (login) window.__faragelloLoginObserver.observe(login, {childList:true,subtree:true,characterData:true});
    }
  }

  function init() {
    applyLoginDesign();
    addInventoryCountMenu();

    if (!window.__faragelloMenuObserver) {
      window.__faragelloMenuObserver = new MutationObserver(function () {
        addInventoryCountMenu();
      });
      var app = document.getElementById('app');
      if (app) window.__faragelloMenuObserver.observe(app, {childList:true,subtree:true});
    }

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