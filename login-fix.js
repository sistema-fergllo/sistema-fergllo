/* Login recovery + final login visual fixes. */
(function () {
  function addInventoryCountReportPage() {
    var main = document.querySelector('#app main');
    if (!main || document.getElementById('faragello-inventory-count-page')) return;

    var page = document.createElement('section');
    page.id = 'faragello-inventory-count-page';
    page.className = 'page hidden';
    page.innerHTML = `
      <div class="title">
        <div><h2>تقرير الجرد</h2><div class="sub">مقارنة رصيد النظام بالكمية الفعلية بعد الجرد</div></div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn gray" id="faragello-count-refresh">تحديث</button>
          <button type="button" class="btn" id="faragello-count-print">طباعة التقرير</button>
        </div>
      </div>
      <div class="cards" id="faragello-count-cards">
        <div class="card"><div class="label">عدد الأصناف</div><div class="value cyan" id="countItems">0</div></div>
        <div class="card"><div class="label">أصناف بدون فرق</div><div class="value green" id="countOk">0</div></div>
        <div class="card"><div class="label">العجز</div><div class="value" style="color:#ff6b7e" id="countShort">0</div></div>
        <div class="card"><div class="label">الزيادة</div><div class="value gold" id="countOver">0</div></div>
      </div>
      <div class="toolbar">
        <input id="faragello-count-search" placeholder="بحث باسم الصنف أو الكود..." />
        <button type="button" class="btn green" id="faragello-count-save">حفظ الجرد</button>
      </div>
      <div class="table-wrap">
        <table class="table" id="faragello-count-table">
          <thead><tr><th>الصنف</th><th>الكود</th><th>رصيد النظام</th><th>الكمية الفعلية</th><th>الفرق</th><th>الحالة</th></tr></thead>
          <tbody id="faragello-count-body"><tr><td colspan="6" class="empty">جاري تحميل أصناف المخزون...</td></tr></tbody>
        </table>
      </div>
    `;
    main.appendChild(page);

    var style = document.createElement('style');
    style.id = 'faragello-count-report-style';
    style.textContent = `
      #faragello-inventory-count-page .table input{width:110px;background:#031226;color:#f5f9ff;border:1px solid #1269a5;border-radius:8px;padding:8px;text-align:center;outline:none}
      #faragello-inventory-count-page .count-short{color:#ff7183;font-weight:800}
      #faragello-inventory-count-page .count-over{color:#ffd35a;font-weight:800}
      #faragello-inventory-count-page .count-ok{color:#63eca0;font-weight:800}
      @media(max-width:900px){#faragello-inventory-count-page .title{gap:10px;align-items:flex-start;flex-direction:column}.cards{grid-template-columns:repeat(2,1fr)!important}}
    `;
    document.head.appendChild(style);

    document.getElementById('faragello-count-refresh').addEventListener('click', function(){ renderCountReport(); });
    document.getElementById('faragello-count-print').addEventListener('click', function(){ window.print(); });
    document.getElementById('faragello-count-save').addEventListener('click', function(){
      var values = {};
      document.querySelectorAll('#faragello-count-body input[data-count-key]').forEach(function(input){ values[input.dataset.countKey] = input.value; });
      localStorage.setItem('faragello_inventory_count_values', JSON.stringify(values));
      renderCountReport();
      alert('تم حفظ بيانات الجرد بنجاح');
    });
    document.getElementById('faragello-count-search').addEventListener('input', function(){
      var q = (this.value || '').trim().toLowerCase();
      document.querySelectorAll('#faragello-count-body tr[data-search]').forEach(function(row){ row.style.display = !q || row.dataset.search.indexOf(q) !== -1 ? '' : 'none'; });
    });
  }

  function getInventoryRows() {
    var inventoryPage = document.getElementById('inventory');
    if (!inventoryPage) return [];
    var table = inventoryPage.querySelector('table');
    if (!table) return [];
    var rows = [];
    table.querySelectorAll('tbody tr').forEach(function(tr){
      var cells = Array.prototype.slice.call(tr.querySelectorAll('td')).map(function(td){ return (td.textContent || '').replace(/\s+/g,' ').trim(); });
      if (cells.length < 2) return;
      var inputs = Array.prototype.slice.call(tr.querySelectorAll('input')).map(function(i){ return i.value; });
      if (cells.join('').trim() === '') return;
      rows.push({ cells: cells, inputs: inputs });
    });
    return rows;
  }

  function renderCountReport() {
    addInventoryCountReportPage();
    var body = document.getElementById('faragello-count-body');
    if (!body) return;
    var rows = getInventoryRows();
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('faragello_inventory_count_values') || '{}'); } catch(e) {}
    body.innerHTML = '';
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="6" class="empty">لا توجد أصناف ظاهرة في المخزون حالياً. أضف الأصناف أولاً ثم افتح تقرير الجرد.</td></tr>';
      updateCountCards();
      return;
    }
    rows.forEach(function(row, idx){
      var cells = row.cells;
      var name = cells[0] || '—';
      var code = cells[1] || (row.inputs[0] || '—');
      var systemText = cells.length > 2 ? cells[2] : '';
      var systemQty = parseFloat(String(systemText).replace(/[^0-9.-]/g,''));
      if (isNaN(systemQty)) systemQty = 0;
      var key = String(code) + '|' + String(name);
      var physical = saved[key] !== undefined ? saved[key] : systemQty;
      var tr = document.createElement('tr');
      tr.dataset.search = (name + ' ' + code).toLowerCase();
      tr.innerHTML = '<td>' + escapeHtml(name) + '</td><td>' + escapeHtml(code) + '</td><td>' + systemQty + '</td><td><input type="number" step="0.01" data-count-key="' + escapeAttr(key) + '" value="' + escapeAttr(physical) + '"></td><td class="diff">0</td><td class="status count-ok">مطابق</td>';
      body.appendChild(tr);
      var input = tr.querySelector('input');
      input.addEventListener('input', function(){ updateCountRow(tr, systemQty, parseFloat(this.value)); });
      updateCountRow(tr, systemQty, parseFloat(physical));
    });
    updateCountCards();
  }

  function updateCountRow(tr, systemQty, physical){
    if (isNaN(physical)) physical = 0;
    var diff = physical - systemQty;
    var diffCell = tr.querySelector('.diff');
    var status = tr.querySelector('.status');
    diffCell.textContent = diff > 0 ? '+' + diff : String(diff);
    status.className = 'status ' + (diff === 0 ? 'count-ok' : (diff < 0 ? 'count-short' : 'count-over'));
    status.textContent = diff === 0 ? 'مطابق' : (diff < 0 ? 'عجز' : 'زيادة');
    tr.dataset.diff = String(diff);
    updateCountCards();
  }

  function updateCountCards(){
    var rows = Array.prototype.slice.call(document.querySelectorAll('#faragello-count-body tr[data-diff]'));
    var ok=0, short=0, over=0;
    rows.forEach(function(r){ var d=parseFloat(r.dataset.diff)||0; if(d===0) ok++; else if(d<0) short += Math.abs(d); else over += d; });
    var items=document.getElementById('countItems'), okEl=document.getElementById('countOk'), shortEl=document.getElementById('countShort'), overEl=document.getElementById('countOver');
    if(items) items.textContent=rows.length; if(okEl) okEl.textContent=ok; if(shortEl) shortEl.textContent=short; if(overEl) overEl.textContent=over;
  }

  function escapeHtml(s){ return String(s).replace(/[&<>'\"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function escapeAttr(s){ return escapeHtml(s); }

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
