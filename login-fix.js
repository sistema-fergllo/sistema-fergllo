/* Login recovery + final login visual fixes. */
(function () {
  function openInventoryCountReport(clicked){
    // The actual report page is inventoryAudit in index.html.
    var app=document.getElementById('app');
    var login=document.getElementById('login');
    var target=document.getElementById('inventoryAudit');
    if(!target) return;
    if(login) login.classList.add('hidden');
    if(app) app.classList.remove('hidden');
    document.querySelectorAll('#app main .page').forEach(function(p){p.classList.add('hidden');});
    target.classList.remove('hidden');
    document.querySelectorAll('#app .side .nav').forEach(function(n){n.classList.toggle('active',n===clicked);});
    if(typeof window.renderInventoryAudit==='function'){
      try{window.renderInventoryAudit();}
      catch(error){
        console.error('Inventory audit render error:',error);
        var body=document.getElementById('auditBody');
        if(body) body.innerHTML='<tr><td colspan="6" style="text-align:center">تعذر تحميل بيانات تقرير الجرد</td></tr>';
      }
    }
  }

  function bindInventoryCountNavigation(){
    if(window.__faragelloCountCaptureBound) return;
    window.__faragelloCountCaptureBound = true;
    document.addEventListener('click', function(event){
      var nav = event.target.closest ? event.target.closest('#app .side .nav') : null;
      if(!nav) return;
      var text = (nav.textContent || '').replace(/\s+/g,' ').trim();
      if(text.indexOf('الجرد') !== -1){
        event.preventDefault();
        event.stopImmediatePropagation();
        openInventoryCountReport(nav);
      }
    }, true);
  }

  function addInventoryCountMenu(){
    // The official "الجرد" menu item already exists in index.html; keep it and route it to the summary report.
    bindInventoryCountNavigation();
    var side = document.querySelector('#app .side');
    if(!side) return;
    var navs = Array.prototype.slice.call(side.querySelectorAll('.nav'));
    var originalCount = navs.find(function(el){ return (el.textContent || '').replace(/\s+/g,' ').trim().indexOf('الجرد') !== -1; });
    if(originalCount) return;
    var inventory = navs.find(function(el){
      var t=(el.textContent || '').replace(/\s+/g,' ').trim();
      return t.indexOf('المخزون') !== -1 && t.indexOf('الجرد') === -1;
    });
    if(!inventory || document.getElementById('faragello-inventory-count-nav')) return;
    var item=document.createElement('button');
    item.id='faragello-inventory-count-nav';
    item.className='nav';
    item.type='button';
    item.textContent='الجرد';
    item.setAttribute('aria-label','الجرد');
    item.style.cssText='font-weight:800!important;font-size:17px!important;width:100%;text-align:right;color:#e9f4ff;display:block;visibility:visible;opacity:1;';
    inventory.parentNode.insertBefore(item, inventory.nextSibling);
  }

  function startMenuRecovery(){
    addInventoryCountMenu();
    setTimeout(addInventoryCountMenu,100); setTimeout(addInventoryCountMenu,500); setTimeout(addInventoryCountMenu,1000); setTimeout(addInventoryCountMenu,2000); setTimeout(addInventoryCountMenu,4000);
    if(!window.__faragelloMenuObserver){
      window.__faragelloMenuObserver=new MutationObserver(function(){ addInventoryCountMenu(); });
      var app=document.getElementById('app');
      if(app) window.__faragelloMenuObserver.observe(app,{childList:true,subtree:true});
    }
  }

  function ensurePublicPhone(){
    var loginText=document.getElementById('loginText');
    var card=document.querySelector('#login .login-card');
    if(!card)return;
    var phone=document.getElementById('faragello-public-phone');
    if(!phone){
      phone=document.createElement('div');
      phone.id='faragello-public-phone';
      phone.innerHTML='<div style="margin-bottom:3px">للتواصل والاستفسار</div><a href="tel:01128777287" dir="ltr" style="display:inline-block;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:1px;text-decoration:none">01128777287</a>';
    }
    phone.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;margin:10px auto 14px!important;padding:10px!important;width:100%!important;max-width:290px!important;box-sizing:border-box!important;text-align:center!important;border:1px solid rgba(41,223,255,.7)!important;border-radius:12px!important;background:rgba(0,110,180,.22)!important;color:#dff8ff!important;font-family:Tahoma,Arial,sans-serif!important;font-size:14px!important;line-height:1.7!important;z-index:2!important;';
    var link=phone.querySelector('a');
    if(link)link.style.cssText='display:inline-block!important;visibility:visible!important;opacity:1!important;color:#ffffff!important;font-size:20px!important;font-weight:700!important;letter-spacing:1px!important;text-decoration:none!important;direction:ltr!important;';
    if(loginText && loginText.parentNode===card && loginText.nextElementSibling!==phone)loginText.insertAdjacentElement('afterend',phone);
    else if(!phone.parentNode)card.appendChild(phone);
  }

  function normalizeLoginScreen(){
    var login=document.getElementById('login');
    var email=document.getElementById('email');
    var password=document.getElementById('password');
    var fields=document.getElementById('loginFields');
    var admin=document.getElementById('adminLoginChoice');
    var client=document.getElementById('clientLoginToggle');
    var title=document.getElementById('loginText');
    var error=document.getElementById('loginErr');
    var wasPagePin=!!(login&&login.dataset.page);
    if(login)login.dataset.page='';
    if(email){email.classList.remove('hidden');email.placeholder='اسم المستخدم';email.autocomplete='username';}
    if(password){password.classList.remove('hidden');password.autocomplete='current-password';}
    if(wasPagePin){
      if(fields)fields.classList.add('hidden');
      if(admin)admin.classList.remove('hidden');
      if(client)client.classList.remove('hidden');
      if(email)email.value='';
      if(password)password.value='';
      if(title)title.textContent='اختر نوع الدخول';
      if(error)error.textContent='';
    }
  }

  function applyLoginDesign(){
    var old=document.getElementById('faragello-login-design-fix'); if(old) old.remove();
    var style=document.createElement('style'); style.id='faragello-login-design-fix'; style.textContent=`
      #login .login-card #clientLoginToggle,#login .login-card .btn.gray,#login .login-card button:nth-of-type(2){background:linear-gradient(100deg,#00c8ff,#0877ff)!important;border:1px solid #29dfff!important;color:#fff!important;box-shadow:0 5px 14px rgba(0,160,255,.25)!important}
      #login .login-card h1,#login .login-card h1 *,#login .login-card p,#login .login-card p *,#login .login-card > div:last-child,#login .login-card > div:last-child *{font-family:Arial,sans-serif!important;font-weight:300!important;font-style:normal!important}
      #login .login-card button{font-family:Tahoma,Arial,sans-serif!important;font-weight:600!important}
      #login .login-card > div:last-child,#login .login-card > div:last-child *{color:#16a34a!important}
      #app .side .nav,#app .side .nav a,#app .side .nav button,#app .side .nav span,#app .side .nav *{font-weight:800!important}
      #app .side .nav{font-size:17px!important}
      #app .side .logout,#app .side .logout *{font-weight:800!important}
      #app .side #faragello-inventory-count-nav{font-weight:800!important;font-size:17px!important;display:block!important;visibility:visible!important;opacity:1!important}
      #app .side .nav{direction:rtl!important;text-align:right!important;justify-content:flex-end!important;padding-right:14px!important;padding-left:10px!important}
      #app .side .nav *{direction:rtl!important;text-align:right!important;margin-left:0!important;margin-right:auto!important}
      #app .side .nav.logout{direction:rtl!important;justify-content:flex-end!important;text-align:right!important}
    `; document.head.appendChild(style);
    function makeBrandingLight(){ var nodes=document.querySelectorAll('#login .login-card h1,#login .login-card p,#login .login-card > div:last-child,#login .login-card h1 *,#login .login-card p *,#login .login-card > div:last-child *'); nodes.forEach(function(el){el.style.setProperty('font-family','Arial,sans-serif','important');el.style.setProperty('font-weight','300','important');el.style.setProperty('font-style','normal','important');var text=(el.textContent||'').trim();if(text.indexOf('Farag El-Sayed')!==-1||text.indexOf('سيستم محاسبة')!==-1)el.style.setProperty('color','#16a34a','important')}); }
    makeBrandingLight(); if(!window.__faragelloLoginObserver){window.__faragelloLoginObserver=new MutationObserver(function(){makeBrandingLight()});var login=document.getElementById('login');if(login)window.__faragelloLoginObserver.observe(login,{childList:true,subtree:true,characterData:true})}
  }

  function init(){
    normalizeLoginScreen();
    ensurePublicPhone();
    applyLoginDesign(); startMenuRecovery();
    setTimeout(ensurePublicPhone,100); setTimeout(ensurePublicPhone,700);
    function recoverChoice(buttonId,role){var button=document.getElementById(buttonId);if(!button||button.dataset.recoveryBound==='yes')return;button.dataset.recoveryBound='yes';button.removeAttribute('onclick');button.addEventListener('click',function(event){if(event)event.preventDefault();try{var login=document.getElementById('login'),app=document.getElementById('app'),fields=document.getElementById('loginFields'),email=document.getElementById('email'),password=document.getElementById('password'),title=document.getElementById('loginText'),error=document.getElementById('loginErr');if(login){login.dataset.page='';login.classList.remove('hidden')}if(app)app.classList.add('hidden');if(typeof window.chooseLogin==='function'){window.chooseLogin(role)}else{var admin=document.getElementById('adminLoginChoice'),client=document.getElementById('clientLoginToggle');if(fields)fields.classList.remove('hidden');if(admin)admin.classList.add('hidden');if(client)client.classList.add('hidden');if(title)title.textContent=role==='admin'?'دخول المشرف':'دخول العميل'}if(fields)fields.classList.remove('hidden');if(email){email.classList.remove('hidden');email.type='text';email.placeholder='اسم المستخدم';email.autocomplete='username'}if(password){password.classList.remove('hidden');password.type='password';password.autocomplete='current-password'}if(title)title.textContent=role==='admin'?'دخول المشرف':'دخول العميل';if(error)error.textContent='';if(email)email.focus()}catch(e){var title=document.getElementById('loginText');if(title)title.textContent='حصل خطأ عند فتح الدخول: '+(e.message||String(e))}})}
    recoverChoice('adminLoginChoice','admin');recoverChoice('clientLoginToggle','client');
    var submit=document.getElementById('loginSubmit'); if(submit&&submit.dataset.recoveryBound!=='yes'){submit.dataset.recoveryBound='yes';submit.addEventListener('click',function(event){event.preventDefault();var errorBox=document.getElementById('loginErr');if(errorBox)errorBox.textContent='تم الضغط على زر الدخول، جاري فحص النظام...';try{if(typeof window.doLogin!=='function'){if(errorBox)errorBox.textContent='زر الدخول استجاب، لكن كود تسجيل الدخول الرئيسي لا يعمل.';return}Promise.resolve(window.doLogin()).catch(function(err){if(errorBox)errorBox.textContent='خطأ أثناء الدخول: '+(err&&err.message?err.message:String(err))})}catch(err){if(errorBox)errorBox.textContent='خطأ أثناء الدخول: '+(err&&err.message?err.message:String(err))}})}
    window.addEventListener('error',function(event){var box=document.getElementById('loginText');if(box&&event.message)box.textContent='خطأ تشغيل بالموقع: '+event.message});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();(function () {
  function connectClientCredentialUpdate() {
    if (window.__faragelloCredentialUpdateBound) return;
    if (typeof window.saveClient !== 'function') return;

    window.__faragelloCredentialUpdateBound = true;

    const originalSaveClient = window.saveClient;

    window.saveClient = async function () {
      try {
        const index = typeof clientEditIndex === 'number' ? clientEditIndex : -1;
        const old = index >= 0 && Array.isArray(clients) ? clients[index] : null;

        if (!old) {
          return originalSaveClient.apply(this, arguments);
        }

        const usernameInput = document.getElementById('clientUsername');
        const passwordInput = document.getElementById('clientPassword');

        const username = (usernameInput?.value || '').trim().toLowerCase();
        const password = passwordInput?.value || '';

        if (!/^[a-z0-9._-]+$/.test(username)) {
          return originalSaveClient.apply(this, arguments);
        }

        if (password && password.length < 6) {
          return originalSaveClient.apply(this, arguments);
        }

        const { error } = await supabaseClient.rpc(
          'admin_update_client_credentials',
          {
            p_client_id: old.id,
            p_username: username,
            p_password: password || null
          }
        );

        if (error) {
          alert('تعذر تحديث بيانات دخول العميل: ' + (error.message || error));
          return;
        }

        if (passwordInput) passwordInput.value = '';

        await originalSaveClient.apply(this, arguments);

      } catch (e) {
        alert('تعذر تحديث حساب العميل: ' + (e.message || e));
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(connectClientCredentialUpdate, 500);
    });
  } else {
    setTimeout(connectClientCredentialUpdate, 500);
  }
})();
