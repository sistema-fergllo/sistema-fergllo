/* Faragello login choice + self-service client signup */
(function(){
  'use strict';
  const NAVY='#173b56';
  function el(id){return document.getElementById(id)}
  function supabase(){return window.supabaseClient || window.supabase || null}
  function showError(msg){const x=el('loginErr');if(x)x.textContent=msg||''}
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
    admin.onclick=function(e){e.preventDefault();base(true);if(el('email')){el('email').placeholder='اسم المستخدم';el('email').focus()}}
    client.onclick=function(e){e.preventDefault();base(false);renderSignup()}
    function renderSignup(){
      const box=document.createElement('div');box.id='faragello-signup-box';
      box.innerHTML='<div style="display:grid;gap:9px;margin-top:12px">'+
        '<input id="signupName" placeholder="اسم العميل" autocomplete="name">'+
        '<input id="signupUser" placeholder="اسم المستخدم" autocomplete="username" dir="ltr">'+
        '<input id="signupPass" type="password" placeholder="كلمة السر — 6 أرقام أو أكثر" autocomplete="new-password" inputmode="numeric">'+
        '<input id="signupPass2" type="password" placeholder="تأكيد كلمة السر" autocomplete="new-password" inputmode="numeric">'+
        '<button type="button" id="signupSubmit" class="btn" style="background:'+NAVY+'!important;color:#fff!important">إنشاء الحساب</button>'+ 
        '<button type="button" id="signupBack" class="btn gray" style="background:'+NAVY+'!important;color:#fff!important">رجوع</button></div>';
      card.appendChild(box);
      el('signupSubmit').onclick=createAccount;
      el('signupBack').onclick=function(){box.remove();base(false)};
    }
    async function createAccount(){
      const name=(el('signupName')?.value||'').trim(), user=(el('signupUser')?.value||'').trim().toLowerCase();
      const pass=el('signupPass')?.value||'', pass2=el('signupPass2')?.value||'';
      if(!name||!user||!pass||!pass2){showError('اكتب كل البيانات المطلوبة.');return}
      if(!/^[A-Za-z0-9._-]{3,40}$/.test(user)){showError('اسم المستخدم بالإنجليزية والأرقام فقط، من 3 إلى 40 حرفًا.');return}
      if(!/^\d{6,}$/.test(pass)){showError('كلمة السر يجب أن تكون 6 أرقام أو أكثر.');return}
      if(pass!==pass2){showError('كلمتا السر غير متطابقتين.');return}
      const sb=supabase(); if(!sb?.auth?.signUp){showError('الاتصال بقاعدة البيانات غير متاح حاليًا.');return}
      const btn=el('signupSubmit'); if(btn){btn.disabled=true;btn.textContent='جاري إنشاء الحساب...'}
      let created=null;
      try{
        const rpc=await sb.rpc('create_customer_account',{p_name:name,p_username:user});
        if(rpc.error)throw rpc.error; created=rpc.data;
        const email=(created?.email)||((user)+'@fergllo.local');
        const res=await sb.auth.signUp({email,password:pass,options:{data:{account_type:'client',full_name:name}}});
        if(res.error)throw res.error;
        alert('تم إنشاء حساب العميل بنجاح. الحساب سيظهر في حساب المشرف ضمن العملاء.');
        if(res.data?.session){
          location.reload();
        }else{
          showError('تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا في Supabase، يجب إتمام التأكيد أولًا.');
          if(btn){btn.disabled=false;btn.textContent='إنشاء الحساب'}
        }
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
