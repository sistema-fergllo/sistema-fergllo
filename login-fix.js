/* Login recovery + final login visual fixes. */
(function () {
  function addInventoryCountMenu() {
    var side = document.querySelector('#app .side');
    if (!side) return;
    if (document.getElementById('faragello-inventory-count-nav')) return;
    var navs = Array.prototype.slice.call(side.querySelectorAll('.nav'));
    var inventory = navs.find(function (el) {
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return t.indexOf('المخزون') !== -1 && t.indexOf('الجرد') === -1;
    });
    if (!inventory) return;

    var item = document.createElement('button');
    item.id = 'faragello-inventory-count-nav';
    item.className = 'nav';
    item.type = 'button';
    item.textContent = 'الجرد';
    item.setAttribute('aria-label', 'الجرد');
    item.style.cssText = 'font-weight:800!important;font-size:17px!important;width:100%;text-align:right;color:#e9f4ff;display:block;visibility:visible;opacity:1;';

    item.addEventListener('click', function () {
      var target = document.getElementById('inventoryCount') || document.getElementById('inventory-count') || document.getElementById('count');
      if (target) {
        document.querySelectorAll('#app .side .nav').forEach(function (n) { n.classList.remove('active'); });
        item.classList.add('active');
        document.querySelectorAll('#app main .page').forEach(function (p) { p.classList.add('hidden'); });
        target.classList.remove('hidden');
      } else if (inventory) {
        inventory.click();
      }
    });

    inventory.parentNode.insertBefore(item, inventory.nextSibling);
  }

  function startMenuRecovery() {
    addInventoryCountMenu();
    setTimeout(addInventoryCountMenu, 100);
    setTimeout(addInventoryCountMenu, 500);
    setTimeout(addInventoryCountMenu, 1000);
    setTimeout(addInventoryCountMenu, 2000);
    setTimeout(addInventoryCountMenu, 4000);
    if (!window.__faragelloMenuObserver) {
      window.__faragelloMenuObserver = new MutationObserver(function () { addInventoryCountMenu(); });
      var app = document.getElementById('app');
      if (app) window.__faragelloMenuObserver.observe(app, {childList:true,subtree:true});
    }
  }

  function applyLoginDesign() {
    var old = document.getElementById('faragello-login-design-fix');
    if (old) old.remove();
    var style = document.createElement('style');
    style.id = 'faragello-login-design-fix';
    style.textContent = `
      #login .login-card #clientLoginToggle,#login .login-card .btn.gray,#login .login-card button:nth-of-type(2){background:linear-gradient(100deg,#00c8ff,#0877ff)!important;border:1px solid #29dfff!important;color:#fff!important;box-shadow:0 5px 14px rgba(0,160,255,.25)!important}
      #login .login-card h1,#login .login-card h1 *,#login .login-card p,#login .login-card p *,#login .login-card > div:last-child,#login .login-card > div:last-child *{font-family:Arial,sans-serif!important;font-weight:300!important;font-style:normal!important}
      #login .login-card button{font-family:Tahoma,Arial,sans-serif!important;font-weight:600!important}
      #login .login-card > div:last-child,#login .login-card > div:last-child *{color:#8deaff!important}
      #app .side .nav,#app .side .nav a,#app .side .nav button,#app .side .nav span,#app .side .nav *{font-weight:800!important}
      #app .side .nav{font-size:17px!important}
      #app .side .logout,#app .side .logout *{font-weight:800!important}
      #app .side #faragello-inventory-count-nav{font-weight:800!important;font-size:17px!important;display:block!important;visibility:visible!important;opacity:1!important}
    `;
    document.head.appendChild(style);
    function makeBrandingLight(){
      var nodes=document.querySelectorAll('#login .login-card h1,#login .login-card p,#login .login-card > div:last-child,#login .login-card h1 *,#login .login-card p *,#login .login-card > div:last-child *');
      nodes.forEach(function(el){el.style.setProperty('font-family','Arial,sans-serif','important');el.style.setProperty('font-weight','300','important');el.style.setProperty('font-style','normal','important');var text=(el.textContent||'').trim();if(text.indexOf('Farag El-Sayed')!==-1||text.indexOf('سيستم محاسبة')!==-1)el.style.setProperty('color','#8deaff','important')});
    }
    makeBrandingLight();
    if(!window.__faragelloLoginObserver){window.__faragelloLoginObserver=new MutationObserver(function(){makeBrandingLight()});var login=document.getElementById('login');if(login)window.__faragelloLoginObserver.observe(login,{childList:true,subtree:true,characterData:true})}
  }

  function init(){
    applyLoginDesign();
    startMenuRecovery();
    function recoverChoice(buttonId,role){var button=document.getElementById(buttonId);if(!button||button.dataset.recoveryBound==='yes')return;button.dataset.recoveryBound='yes';button.addEventListener('click',function(){try{if(typeof window.chooseLogin==='function'){window.chooseLogin(role)}else{var fields=document.getElementById('loginFields');var admin=document.getElementById('adminLoginChoice');var client=document.getElementById('clientLoginToggle');if(fields)fields.classList.remove('hidden');if(admin)admin.classList.add('hidden');if(client)client.classList.add('hidden');var title=document.getElementById('loginText');if(title)title.textContent=role==='admin'?'دخول المشرف — اكتب بياناتك':'دخول العميل — اكتب بياناتك'}}catch(e){var title=document.getElementById('loginText');if(title)title.textContent='حصل خطأ عند فتح الدخول: '+(e.message||String(e))}})}
    recoverChoice('adminLoginChoice','admin');recoverChoice('clientLoginToggle','client');
    var submit=document.getElementById('loginSubmit');
    if(submit&&submit.dataset.recoveryBound!=='yes'){submit.dataset.recoveryBound='yes';submit.addEventListener('click',function(event){event.preventDefault();var errorBox=document.getElementById('loginErr');if(errorBox)errorBox.textContent='تم الضغط على زر الدخول، جاري فحص النظام...';try{if(typeof window.doLogin!=='function'){if(errorBox)errorBox.textContent='زر الدخول استجاب، لكن كود تسجيل الدخول الرئيسي لا يعمل.';return}Promise.resolve(window.doLogin()).catch(function(err){if(errorBox)errorBox.textContent='خطأ أثناء الدخول: '+(err&&err.message?err.message:String(err))})}catch(err){if(errorBox)errorBox.textContent='خطأ أثناء الدخول: '+(err&&err.message?err.message:String(err))}})}
    window.addEventListener('error',function(event){var box=document.getElementById('loginText');if(box&&event.message)box.textContent='خطأ تشغيل بالموقع: '+event.message});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();