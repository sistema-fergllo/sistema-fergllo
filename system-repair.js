/* FARAGELLO SYSTEM REPAIR - centralized runtime/UI recovery */
(function(){
  'use strict';
  var MARK='faragello-system-repair-v1';

  function el(id){return document.getElementById(id)}
  function hide(node){if(node){node.classList.add('hidden');node.setAttribute('aria-hidden','true');node.style.setProperty('display','none','important')}}
  function show(node){if(node){node.classList.remove('hidden');node.setAttribute('aria-hidden','false');node.style.removeProperty('display')}}

  function installStyle(){
    if(el('faragello-system-repair-style')) return;
    var s=document.createElement('style');
    s.id='faragello-system-repair-style';
    s.textContent='\n'
      +'/* Keep exactly one application screen visible. */\n'
      +'html.faragello-internal-active #login{display:none!important;visibility:hidden!important;pointer-events:none!important}\n'
      +'html.faragello-login-active #app{display:none!important;visibility:hidden!important;pointer-events:none!important}\n'
      +'#login.faragello-force-login{display:grid!important;visibility:visible!important;opacity:1!important}\n'
      +'#app.faragello-force-app{display:block!important;visibility:visible!important;opacity:1!important}\n'
      +'#login.login-screen{background-color:#edf6f7!important;background-image:radial-gradient(ellipse at 12% 15%,#c8f1e9 0,transparent 30%),radial-gradient(ellipse at 85% 88%,#d9eafa 0,transparent 35%),linear-gradient(135deg,#f5fbfa 0%,#edf6f7 52%,#f8fbff 100%)!important}\n'
      +'#login .public-hero,#login .login-card{position:relative;z-index:2}\n';
    document.head.appendChild(s);
  }

  function syncScreens(){
    var login=el('login'),app=el('app');
    if(!login||!app) return;
    var internal=app.classList.contains('hidden')===false && getComputedStyle(app).display!=='none';
    var logged=window.currentProfileRole==='admin'||window.currentProfileRole==='client'||!!window.activeClient;
    if(internal||logged){
      show(app); app.classList.add('faragello-force-app');
      hide(login); document.documentElement.classList.add('faragello-internal-active');
      document.documentElement.classList.remove('faragello-login-active');
    }else{
      show(login); login.classList.add('faragello-force-login');
      hide(app); document.documentElement.classList.add('faragello-login-active');
      document.documentElement.classList.remove('faragello-internal-active');
    }
  }

  function repairLoginHandlers(){
    var admin=el('adminLoginChoice'),client=el('clientLoginToggle'),back=document.querySelector('#loginFields button.gray');
    if(admin && !admin.dataset.repairBound){admin.dataset.repairBound='1';admin.addEventListener('click',function(){setTimeout(syncScreens,0)})}
    if(client && !client.dataset.repairBound){client.dataset.repairBound='1';client.addEventListener('click',function(){setTimeout(syncScreens,0)})}
    if(back && !back.dataset.repairBound){back.dataset.repairBound='1';back.addEventListener('click',function(){setTimeout(syncScreens,0)})}
  }

  function repairNavigation(){
    document.querySelectorAll('#app .side .nav').forEach(function(nav){
      if(nav.dataset.repairBound) return;
      nav.dataset.repairBound='1';
      nav.addEventListener('click',function(){setTimeout(syncScreens,30)},{capture:false});
    });
  }

  function safeRefresh(){
    try{if(typeof window.refreshAll==='function')window.refreshAll()}catch(e){console.error('Faragello refreshAll:',e)}
    try{if(typeof window.startActivityFeed==='function')window.startActivityFeed()}catch(e){console.error('Faragello activity feed:',e)}
  }

  function repairCommonRuntimeErrors(){
    if(typeof window.resetLoginChoice!=='function') window.resetLoginChoice=function(){
      var login=el('login'),fields=el('loginFields'),admin=el('adminLoginChoice'),client=el('clientLoginToggle'),err=el('loginErr'),title=el('loginText');
      if(login)login.dataset.page='';
      if(fields)fields.classList.add('hidden');
      if(admin)admin.classList.remove('hidden');
      if(client)client.classList.remove('hidden');
      if(err)err.textContent='';
      if(title)title.textContent='اختر نوع الدخول';
      syncScreens();
    };
    if(typeof window.doLogin!=='function' && typeof window.__frgLoginHandler==='function') window.doLogin=window.__frgLoginHandler;
    if(typeof window.toggleRememberLogin!=='function') window.toggleRememberLogin=function(){
      var box=el('rememberLogin'),u=el('email'),p=el('password');
      try{if(box&&box.checked)localStorage.setItem('frg_repair_remember',JSON.stringify({user:u?u.value:'',pass:p?p.value:''}));else localStorage.removeItem('frg_repair_remember')}catch(e){}
    };
  }

  function boot(){
    installStyle();
    repairCommonRuntimeErrors();
    repairLoginHandlers();
    repairNavigation();
    syncScreens();
    setTimeout(function(){repairLoginHandlers();repairNavigation();syncScreens();safeRefresh()},100);
    setTimeout(syncScreens,500);
    setTimeout(syncScreens,1500);
    if(window.MutationObserver && !window.__faragelloRepairObserver){
      window.__faragelloRepairObserver=new MutationObserver(function(){repairLoginHandlers();repairNavigation();syncScreens()});
      window.__faragelloRepairObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
    }
  }

  window.addEventListener('pageshow',syncScreens);
  window.addEventListener('hashchange',syncScreens);
  window.addEventListener('error',function(e){
    console.error('Faragello runtime error:',e.error||e.message||e);
    setTimeout(syncScreens,0);
  });
  window.addEventListener('unhandledrejection',function(e){
    console.error('Faragello promise error:',e.reason||e);
    setTimeout(syncScreens,0);
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
