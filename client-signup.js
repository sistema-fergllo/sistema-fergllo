/* Faragello login choice + self-service client signup */
(function(){
  'use strict';
  const NAVY='#173b56';
  function el(id){return document.getElementById(id)}
  function supabase(){return window.supabaseClient || window.__frgSignupClient || null}
  function showError(msg){const x=el('signupError');const y=el('loginErr');if(x)x.textContent=msg||'';if(y)y.textContent=msg||''}
  function setup(){
    const login=el('login'); const card=document.querySelector('#login .login-card');
    const admin=el('adminLoginChoice'), client=el('clientLoginToggle'), fields=el('loginFields'), submit=el('loginSubmit'), title=el('loginText');
    if(!login||!card||!admin||!client)return false;
    admin.textContent='تسجيل الدخول'; client.textContent='إنشاء حساب';
    [admin,client].forEach(b=>{b.style.background=NAVY;b.style.color='#fff';b.style.borderColor=NAVY});
    function base(showFields){
      if(title)title.textContent=showFields?'تسجيل الدخول':'اختر نوع الحساب';
      if(fields)fields.classList.toggle('hidden',!showFields);
      if(submit)submit.classList.toggle('hidden',!showFields);
      showError('');
      const old=el('faragello-signup-box');if(old)old.remove();
    }
    admin.onclick=function(e){e.preventDefault();if(typeof window.chooseLogin==='function')window.chooseLogin('both');base(true);if(el('email')){el('email').placeholder='اسم المستخدم (مشرف أو عميل)';el('email').focus()}}
    client.onclick=function(e){e.preventDefault();base(false);renderSignup()}
    function renderSignup(){
      const box=document.createElement('div');box.id='faragello-signup-box';
      box.innerHTML='<div style="display:grid;gap:9px;margin-top:12px">'+
        '<input id="signupName" placeholder="اسم العميل" autocomplete="name">'+
        '<input id="signupPhone" type="tel" placeholder="رقم الهاتف" autocomplete="tel" inputmode="tel" dir="ltr">'+
        '<input id="signupUser" placeholder="اسم المستخدم" autocomplete="username" dir="ltr">'+
        '<input id="signupPass" type="password" placeholder="كلمة السر — 6 أرقام أو أكثر" autocomplete="new-password" inputmode="numeric">'+
        '<input id="signupPass2" type="password" placeholder="تأكيد كلمة السر" autocomplete="new-password" inputmode="numeric">'+
        '<div id="signupError" class="err" role="alert" style="display:block;min-height:18px"></div>'+
        '<button type="button" id="signupSubmit" class="btn" style="background:'+NAVY+'!important;color:#fff!important">إنشاء الحساب</button>'+
        '<button type="button" id="signupBack" class="btn gray" style="background:'+NAVY+'!important;color:#fff!important">رجوع</button></div>';
      card.appendChild(box);
      el('signupSubmit').onclick=createAccount;
      el('signupBack').onclick=function(){box.remove();base(false)};
    }
    async function createAccount(){
      const name=(el('signupName')?.value||'').trim();
      const phone=(el('signupPhone')?.value||'').trim();
      const user=(el('signupUser')?.value||'').trim().toLowerCase();
      const pass=el('signupPass')?.value||'', pass2=el('signupPass2')?.value||'';
      if(!name||!phone||!user||!pass||!pass2){showError('اكتب كل البيانات المطلوبة، ومنها رقم الهاتف.');return}
      const normalizedPhone=phone.replace(/[\s()-]/g,'');
      if(!/^\+?[0-9]{10,15}$/.test(normalizedPhone)){showError('اكتب رقم هاتف صحيحًا من 10 إلى 15 رقمًا.');return}
      if(!/^[A-Za-z0-9._-]{3,40}$/.test(user)){showError('اسم المستخدم بالإنجليزية والأرقام فقط، من 3 إلى 40 حرفًا.');return}
      if(!/^\d{6,}$/.test(pass)){showError('كلمة السر يجب أن تكون 6 أرقام أو أكثر.');return}
      if(pass!==pass2){showError('كلمتا السر غير متطابقتين.');return}
      const sb=supabase(); if(!sb?.auth?.signUp||!sb?.rpc){showError('الاتصال بقاعدة البيانات غير متاح حاليًا.');return}
      const btn=el('signupSubmit'); if(btn){btn.disabled=true;btn.textContent='جاري إنشاء الحساب...'}
      try{
        const rpc=await sb.rpc('create_customer_account',{p_name:name,p_username:user,p_phone:normalizedPhone});
        if(rpc.error)throw rpc.error;
        const created=rpc.data||{};
        const email=created.email||((user)+'@fergllo.local');
        const res=await sb.auth.signUp({email,password:pass,options:{data:{account_type:'client',full_name:name}}});
        if(res.error)throw res.error;
        if(res.data?.session)await sb.auth.signOut();
        alert('تم إنشاء حساب العميل وتسجيله في قائمة العملاء بحساب المشرف. اسم المستخدم: '+user);
        showError(res.data?.session?'تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول.':'تم إنشاء سجل العميل، لكن يلزم تعطيل تأكيد البريد الإلكتروني في إعدادات Supabase حتى يعمل الدخول باسم المستخدم.');
        if(btn){btn.disabled=false;btn.textContent='إنشاء الحساب'}
      }catch(err){
        console.error(err); showError(err?.message||'تعذر إنشاء الحساب.');
        if(btn){btn.disabled=false;btn.textContent='إنشاء الحساب'}
      }
    }
    return true;
  }
  function boot(){if(setup())return;setTimeout(boot,300)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
