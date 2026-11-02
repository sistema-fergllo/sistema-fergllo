/* FARAGELLO SYSTEM REPAIR - centralized runtime/UI recovery + v2 visual system */
(function(){
  'use strict';
  var MARK='faragello-system-repair-v2';
  function el(id){return document.getElementById(id)}
  function hide(node){if(node){node.classList.add('hidden');node.setAttribute('aria-hidden','true');node.style.setProperty('display','none','important')}}
  function show(node){if(node){node.classList.remove('hidden');node.setAttribute('aria-hidden','false');node.style.removeProperty('display')}}

  function installStyle(){
    if(el('faragello-system-repair-style')) return;
    var s=document.createElement('style');
    s.id='faragello-system-repair-style';
    s.textContent=`
/* ===== FARAGELLO V2 COMPLETE VISUAL REDESIGN ===== */
:root{
 --f-bg:#07111f;--f-bg2:#0b1830;--f-panel:#101f34;--f-panel2:#132640;--f-line:#263a55;
 --f-text:#eef5ff;--f-muted:#91a5bd;--f-blue:#43a5ff;--f-blue2:#6dc0ff;--f-cyan:#36d1d4;
 --f-green:#31c48d;--f-red:#ff6674;--f-gold:#f5c75b;--f-shadow:0 18px 55px rgba(0,0,0,.28);
}
html,body{background:var(--f-bg)!important;color:var(--f-text)!important}
body{font-family:"Segoe UI",Tahoma,Arial,sans-serif}
/* One screen only */
html.faragello-internal-active #login{display:none!important;visibility:hidden!important;pointer-events:none!important}
html.faragello-login-active #app{display:none!important;visibility:hidden!important;pointer-events:none!important}
#login.faragello-force-login{display:grid!important;visibility:visible!important;opacity:1!important}
#app.faragello-force-app{display:block!important;visibility:visible!important;opacity:1!important}

/* ---------- EXTERNAL / LOGIN ---------- */
#login.login-screen{
 min-height:100vh!important;display:grid!important;grid-template-columns:minmax(0,1.05fr) minmax(340px,.75fr)!important;gap:clamp(28px,6vw,90px)!important;align-items:center!important;
 padding:clamp(28px,6vw,80px)!important;position:relative!important;overflow:hidden!important;isolation:isolate!important;
 background:radial-gradient(circle at 12% 18%,rgba(67,165,255,.22),transparent 27%),radial-gradient(circle at 88% 82%,rgba(54,209,212,.18),transparent 30%),linear-gradient(135deg,#050d18,#0b1830 52%,#071421)!important;color:var(--f-text)!important;
}
#login.login-screen:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.22;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 90%)}
#login.login-screen:after{content:"";position:absolute;z-index:-1;width:420px;height:420px;right:-180px;top:-180px;border-radius:50%;border:1px solid rgba(67,165,255,.22);box-shadow:0 0 0 45px rgba(67,165,255,.035),0 0 0 90px rgba(67,165,255,.02)}
#login .public-hero{grid-column:1;grid-row:1;max-width:720px!important;padding:0!important;text-align:right!important;align-self:center!important}
#login .public-hero .hero-orb{width:104px!important;height:104px!important;margin:0 0 24px!important;border:1px solid rgba(109,192,255,.35)!important;border-radius:30px!important;background:linear-gradient(145deg,#17345a,#0c1b30)!important;box-shadow:0 20px 55px rgba(0,0,0,.35),inset 0 0 30px rgba(67,165,255,.08)!important;transform:none!important}
#login .public-hero .hero-orb span{width:68px!important;height:68px!important;border-radius:22px!important;background:linear-gradient(145deg,var(--f-blue),var(--f-cyan))!important;color:#061321!important;font-size:39px!important;transform:none!important;box-shadow:0 8px 25px rgba(67,165,255,.28)}
#login .public-hero .hero-orb:after{inset:-10px!important;border:1px solid rgba(67,165,255,.18)!important;border-radius:36px!important}
#login .hero-kicker{display:inline-flex!important;margin-bottom:18px!important;padding:8px 13px!important;border:1px solid rgba(67,165,255,.24)!important;border-radius:30px!important;background:rgba(16,31,52,.72)!important;color:#78c6ff!important;font-size:12px!important;font-weight:800!important;box-shadow:inset 0 1px rgba(255,255,255,.05)}
#login .hero-kicker:before{background:var(--f-cyan)!important;box-shadow:0 0 0 5px rgba(54,209,212,.1)!important}
#login .public-hero h2{max-width:700px!important;margin:0 0 16px!important;color:#f5f9ff!important;font-size:clamp(34px,5vw,62px)!important;font-weight:900!important;line-height:1.16!important;letter-spacing:-1.2px!important}
#login .public-hero h2 span{color:var(--f-blue2)!important}
#login .public-hero p{max-width:600px!important;margin:0 0 24px!important;color:#9cb0c6!important;font-size:clamp(15px,1.4vw,18px)!important;line-height:1.9!important}
#login .hero-points{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:11px!important;max-width:610px!important}
#login .hero-point{min-height:68px!important;padding:12px 13px!important;border:1px solid rgba(116,153,190,.18)!important;border-radius:15px!important;background:rgba(16,31,52,.66)!important;box-shadow:0 10px 30px rgba(0,0,0,.16)!important;color:#c8d6e5!important;font-size:12px!important;font-weight:700!important;backdrop-filter:blur(10px)}
#login .hero-point b{width:36px!important;height:36px!important;flex:0 0 36px!important;border-radius:11px!important;background:rgba(67,165,255,.12)!important;color:#69bdff!important;font-size:17px!important}
#login .public-hero .hero-note{margin-top:17px!important;color:#687e96!important}
#login .login-card{grid-column:2;grid-row:1;width:min(100%,430px)!important;justify-self:end!important;margin:0!important;padding:32px!important;border:1px solid rgba(113,151,191,.22)!important;border-radius:26px!important;background:linear-gradient(160deg,rgba(18,35,58,.97),rgba(9,20,34,.97))!important;box-shadow:var(--f-shadow),inset 0 1px rgba(255,255,255,.05)!important;color:var(--f-text)!important;backdrop-filter:blur(18px)!important}
#login .login-card:before{content:"تسجيل آمن";display:block;width:max-content;margin:0 0 18px;padding:5px 10px;border-radius:20px;background:rgba(49,196,141,.09);border:1px solid rgba(49,196,141,.18);color:#55d8a3;font-size:11px;font-weight:800}
#login .logo{width:68px!important;height:68px!important;margin:0 auto 15px!important;border-radius:21px!important;background:linear-gradient(145deg,var(--f-blue),var(--f-cyan))!important;color:#061321!important;box-shadow:0 15px 35px rgba(67,165,255,.25)!important}
#login .logo:after{color:#061321!important;font-size:40px!important}
#login h1{margin:0 0 5px!important;color:#f7fbff!important;font-size:27px!important;font-weight:900!important}
#login #loginText{margin:0 0 22px!important;color:#8fa4bb!important}
#login .login-card input,#login .login-card select,#login .login-card textarea{min-height:48px!important;padding:12px 14px!important;border:1px solid #29415e!important;border-radius:12px!important;background:#0a1728!important;color:#f0f6ff!important}
#login .login-card input::placeholder{color:#617892!important}
#login .login-card input:focus{border-color:var(--f-blue)!important;box-shadow:0 0 0 4px rgba(67,165,255,.11)!important}
#login .login-card button,#login .login-card .btn,#login #adminLoginChoice,#login #clientLoginToggle{min-height:46px!important;padding:11px 16px!important;border:1px solid rgba(109,192,255,.35)!important;border-radius:12px!important;background:linear-gradient(120deg,#1d5fa1,#168d9a)!important;color:#fff!important;font-weight:800!important;box-shadow:0 10px 22px rgba(0,0,0,.2)!important}
#login .login-card button:hover,#login #adminLoginChoice:hover,#login #clientLoginToggle:hover{transform:translateY(-1px)!important;filter:brightness(1.08)!important}
#login #loginSubmit{background:#142941!important;border-color:#29415e!important;color:#c9d8e8!important}
#login #loginErr{color:#ff7c87!important}

/* ---------- INTERNAL / APP ---------- */
#app{min-height:100vh!important;background:linear-gradient(135deg,#06101d,#0a1728 55%,#081421)!important;color:var(--f-text)!important}
#app .top{position:sticky!important;top:0!important;z-index:30!important;min-height:78px!important;padding:12px 24px!important;background:rgba(7,17,31,.94)!important;border-bottom:1px solid rgba(111,153,196,.17)!important;color:#fff!important;box-shadow:0 12px 35px rgba(0,0,0,.22)!important;backdrop-filter:blur(14px)!important}
#app .brand{gap:12px!important}.brand .logo,#app .brand .logo{width:48px!important;height:48px!important;flex-basis:48px!important;border-radius:15px!important;background:linear-gradient(145deg,var(--f-blue),var(--f-cyan))!important;color:#061321!important;box-shadow:0 9px 25px rgba(67,165,255,.2)!important}
#app .brand .logo:after{color:#061321!important;font-size:31px!important}
#app .brand h1{font-size:20px!important;font-weight:900!important;color:#f4f8ff!important}.brand small,#app .brand small{color:#7890a9!important}
#app .user{border:1px solid rgba(109,150,191,.2)!important;background:rgba(255,255,255,.04)!important;color:#dce8f5!important}.clock,#app .clock{color:#91a6bc!important}
#app .activity-strip{min-height:45px!important;padding:7px 22px!important;background:#0b192b!important;border-bottom:1px solid rgba(111,153,196,.14)!important;color:#7f94aa!important}
#app .activity-heading strong{color:#cfe1f3!important}.activity-feed{color:#8fa5ba!important}
#app .layout{min-height:calc(100vh - 123px)!important;display:flex!important;background:transparent!important}
#app .side{width:255px!important;flex:0 0 255px!important;gap:7px!important;padding:16px 12px!important;background:linear-gradient(180deg,#0a1728,#081321)!important;border-left:1px solid rgba(111,153,196,.13)!important}
#app .side .nav{min-height:44px!important;margin:0!important;padding:10px 13px!important;border:1px solid transparent!important;border-radius:12px!important;background:transparent!important;color:#8ea4ba!important;font-size:13px!important;font-weight:700!important;transition:.18s!important}
#app .side .nav:hover{background:rgba(67,165,255,.08)!important;border-color:rgba(67,165,255,.12)!important;color:#d9edff!important;transform:translateX(-2px)!important}
#app .side .nav.active{background:linear-gradient(90deg,rgba(67,165,255,.16),rgba(54,209,212,.07))!important;border-color:rgba(67,165,255,.24)!important;color:#75c5ff!important;box-shadow:inset -3px 0 var(--f-blue)!important}
#app .side .nav.logout{margin-top:auto!important;background:rgba(255,102,116,.06)!important;border-color:rgba(255,102,116,.14)!important;color:#ff7c87!important}
#app .layout>main{padding:25px!important;background:radial-gradient(circle at 90% 0%,rgba(67,165,255,.05),transparent 28%)!important}
#app .title{margin:0 0 20px!important;padding:0 0 16px!important;border-bottom:1px solid rgba(111,153,196,.16)!important}
#app .title h2{color:#f0f6ff!important;font-size:25px!important;font-weight:900!important}.title .sub,#app .title .sub,#app .sub{color:#8197ad!important}
#app h3{color:#dcecff!important}
#app .cash-panel,#app .panel,#app .section,#app .form-panel,#app .toolbar,#app .card{background:linear-gradient(145deg,rgba(17,34,55,.94),rgba(12,26,44,.94))!important;border:1px solid rgba(111,153,196,.15)!important;border-radius:17px!important;box-shadow:0 15px 40px rgba(0,0,0,.16)!important;color:#dce8f4!important}
#app .cash-panel,#app .panel,#app .section,#app .form-panel{padding:20px!important}
#app .cards{gap:14px!important}.card .label,#app .card .label{color:#8197ad!important}.card .value,#app .card .value{color:#eef6ff!important}.value.cyan{color:#58d4ff!important}.value.green{color:#55d9a4!important}.value.gold{color:#f6cc68!important}
#app .dashboard-bulb{background:rgba(245,199,91,.1)!important;color:#ffd66f!important;border:1px solid rgba(245,199,91,.16)!important}
#app input:not([type=checkbox]):not([type=radio]),#app select,#app textarea{min-height:41px!important;background:#091729!important;border:1px solid #29415e!important;color:#e8f1fb!important;border-radius:10px!important}
#app input::placeholder,#app textarea::placeholder{color:#617892!important}#app input:focus,#app select:focus,#app textarea:focus{border-color:var(--f-blue)!important;box-shadow:0 0 0 3px rgba(67,165,255,.1)!important}
#app .btn,#app button.btn{min-height:39px!important;padding:9px 14px!important;border-radius:10px!important;background:linear-gradient(120deg,#195a96,#176f82)!important;border:1px solid rgba(109,192,255,.25)!important;color:#fff!important;box-shadow:0 7px 18px rgba(0,0,0,.16)!important}
#app .btn:hover{filter:brightness(1.08)!important;transform:translateY(-1px)!important}.btn.gray,#app .btn.gray,#app button.gray{background:#14263c!important;border-color:#2a415c!important;color:#bcd0e4!important}.btn.green,#app .btn.green,#app button.green{background:rgba(49,196,141,.12)!important;border-color:rgba(49,196,141,.25)!important;color:#62dfae!important}.btn.gold,#app .btn.gold,#app button.gold{background:rgba(245,199,91,.1)!important;border-color:rgba(245,199,91,.24)!important;color:#ffd46d!important}.btn.red,#app .btn.red,#app button.red,#app .btn.danger{background:rgba(255,102,116,.1)!important;border-color:rgba(255,102,116,.24)!important;color:#ff7e89!important}
#app .table-wrap{background:#0d1c2f!important;border:1px solid rgba(111,153,196,.15)!important;border-radius:15px!important;box-shadow:0 15px 40px rgba(0,0,0,.16)!important}
#app table.table,#app .table-wrap table{color:#dce8f4!important}#app table.table th,#app .table-wrap th{background:#12263d!important;color:#aecaE4!important;border-bottom:1px solid #29415e!important}#app table.table td,#app .table-wrap td{border-bottom:1px solid rgba(111,153,196,.1)!important;color:#cbd9e8!important}#app table.table tbody tr:hover,#app .table-wrap tbody tr:hover{background:rgba(67,165,255,.055)!important}
#app .badge,#app .status{background:#152a42!important;color:#9fb5ca!important;border:1px solid #29415e!important}.err{color:#ff7d88!important}#app label{color:#a9bfd4!important}#app hr{border-top-color:rgba(111,153,196,.14)!important}
/* branch and modal redesign */
.branch-picker-panel{background:linear-gradient(145deg,#0e2340,#0b182b)!important;border:1px solid rgba(67,165,255,.24)!important;box-shadow:var(--f-shadow)!important}.branch-picker-panel #branchPickerCards .card{background:#122a45!important;border-color:rgba(67,165,255,.24)!important;color:#eaf4ff!important}
.modal-bg{background:rgba(1,6,14,.82)!important}.modal-bg>.modal{background:linear-gradient(160deg,#112640,#091727)!important;border-color:rgba(109,192,255,.28)!important;box-shadow:0 30px 90px rgba(0,0,0,.6)!important}.modal-bg>.modal h3{color:#f5f9ff!important}
/* keep shift summary readable in new theme */
#shiftSummaryPanel{background:linear-gradient(145deg,#112238,#0d1c30)!important;color:#e7f0fa!important;border-color:rgba(111,153,196,.15)!important}
#shiftSummaryPanel h3,#shiftSummaryPanel h3 span,#shiftSummaryPanel .shift-summary-cards h3,#shiftSummaryPanel .shift-summary-cards h4,#shiftSummaryPanel .shift-summary-cards p,#shiftSummaryPanel .shift-summary-cards span,#shiftSummaryPanel .shift-summary-cards label{color:#e7f0fa!important}
#shiftSummaryPanel .shift-summary-cards,#shiftSummaryPanel .shift-summary-cards .cash-panel,#shiftSummaryPanel .shift-summary-cards .card,#shiftSummaryPanel .shift-summary-cards table{background:#0d1d30!important;color:#e7f0fa!important}
#shiftSummaryPanel .shift-summary-cards th{background:#142b44!important;color:#cfe0f1!important}
@media(max-width:850px){
 #login.login-screen{grid-template-columns:1fr!important;gap:18px!important;padding:24px 15px 30px!important}
 #login .public-hero{grid-column:1!important;grid-row:1!important;text-align:center!important;max-width:620px!important;margin:auto!important}
 #login .public-hero .hero-orb{width:72px!important;height:72px!important;margin:0 auto 13px!important;border-radius:21px!important}.public-hero .hero-orb span{width:49px!important;height:49px!important;font-size:28px!important;border-radius:16px!important}
 #login .public-hero h2{font-size:clamp(29px,8vw,42px)!important;margin:0 auto 10px!important}.public-hero p{font-size:14px!important;margin:0 auto 16px!important}.hero-points{margin:auto!important}
 #login .login-card{grid-column:1!important;grid-row:2!important;width:min(100%,480px)!important;justify-self:center!important;padding:25px 19px!important}
 #app .top{position:relative!important;padding:10px 12px!important;min-height:68px!important}#app .layout{display:block!important;min-height:0!important}#app .side{width:100%!important;display:flex!important;flex-direction:row!important;overflow-x:auto!important;border-left:0!important;border-bottom:1px solid rgba(111,153,196,.14)!important;padding:9px!important}.side .nav,#app .side .nav{min-width:max-content!important}
 #app .layout>main{padding:15px 10px!important}.cards,#app .cards{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:430px){#login .hero-points{grid-template-columns:1fr!important}#app .cards{gap:8px!important}#app .card{padding:12px!important}#app .card .value{font-size:20px!important}.brand small,#app .brand small,.userbox .clock,#app .userbox .clock{display:none!important}}
@media print{#app .top,#app .side,#app .activity-strip,.no-print{display:none!important}body,#app{background:#fff!important;color:#111!important}}
`;
    document.head.appendChild(s);
  }

  function syncScreens(){
    var login=el('login'),app=el('app');
    if(!login||!app)return;
    var internal=app.classList.contains('hidden')===false&&getComputedStyle(app).display!=='none';
    var logged=window.currentProfileRole==='admin'||window.currentProfileRole==='client'||!!window.activeClient;
    if(internal||logged){show(app);app.classList.add('faragello-force-app');hide(login);document.documentElement.classList.add('faragello-internal-active');document.documentElement.classList.remove('faragello-login-active')}
    else{show(login);login.classList.add('faragello-force-login');hide(app);document.documentElement.classList.add('faragello-login-active');document.documentElement.classList.remove('faragello-internal-active')}
  }
  function repairLoginHandlers(){
    var admin=el('adminLoginChoice'),client=el('clientLoginToggle'),back=document.querySelector('#loginFields button.gray');
    if(admin&&!admin.dataset.repairBound){admin.dataset.repairBound='1';admin.addEventListener('click',function(){setTimeout(syncScreens,0)})}
    if(client&&!client.dataset.repairBound){client.dataset.repairBound='1';client.addEventListener('click',function(){setTimeout(syncScreens,0)})}
    if(back&&!back.dataset.repairBound){back.dataset.repairBound='1';back.addEventListener('click',function(){setTimeout(syncScreens,0)})}
  }
  function repairNavigation(){document.querySelectorAll('#app .side .nav').forEach(function(nav){if(nav.dataset.repairBound)return;nav.dataset.repairBound='1';nav.addEventListener('click',function(){setTimeout(syncScreens,30)})})}
  function safeRefresh(){try{if(typeof window.refreshAll==='function')window.refreshAll()}catch(e){console.error('Faragello refreshAll:',e)}try{if(typeof window.startActivityFeed==='function')window.startActivityFeed()}catch(e){console.error('Faragello activity feed:',e)}}
  function repairCommonRuntimeErrors(){
    if(typeof window.resetLoginChoice!=='function')window.resetLoginChoice=function(){var login=el('login'),fields=el('loginFields'),admin=el('adminLoginChoice'),client=el('clientLoginToggle'),err=el('loginErr'),title=el('loginText');if(login)login.dataset.page='';if(fields)fields.classList.add('hidden');if(admin)admin.classList.remove('hidden');if(client)client.classList.remove('hidden');if(err)err.textContent='';if(title)title.textContent='اختر نوع الدخول';syncScreens()};
    if(typeof window.doLogin!=='function'&&typeof window.__frgLoginHandler==='function')window.doLogin=window.__frgLoginHandler;
    if(typeof window.toggleRememberLogin!=='function')window.toggleRememberLogin=function(){var box=el('rememberLogin'),u=el('email'),p=el('password');try{if(box&&box.checked)localStorage.setItem('frg_repair_remember',JSON.stringify({user:u?u.value:'',pass:p?p.value:''}));else localStorage.removeItem('frg_repair_remember')}catch(e){}};
  }
  function boot(){installStyle();repairCommonRuntimeErrors();repairLoginHandlers();repairNavigation();syncScreens();setTimeout(function(){repairLoginHandlers();repairNavigation();syncScreens();safeRefresh()},100);setTimeout(syncScreens,500);setTimeout(syncScreens,1500);if(window.MutationObserver&&!window.__faragelloRepairObserver){window.__faragelloRepairObserver=new MutationObserver(function(){repairLoginHandlers();repairNavigation();syncScreens()});window.__faragelloRepairObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-hidden']})}}
  window.addEventListener('pageshow',syncScreens);window.addEventListener('hashchange',syncScreens);window.addEventListener('error',function(e){console.error('Faragello runtime error:',e.error||e.message||e);setTimeout(syncScreens,0)});window.addEventListener('unhandledrejection',function(e){console.error('Faragello promise error:',e.reason||e);setTimeout(syncScreens,0)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
