from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Make the manager form unmistakable on both add and edit.
if 'id="clientUsername"' not in s:
    s = re.sub(r'<input id="clientName"[^>]*>', lambda m: m.group(0) + '<input id="clientUsername" placeholder="اسم المستخدم للدخول" autocomplete="username"><input id="clientPassword" type="password" placeholder="كلمة مرور الدخول" autocomplete="new-password">', s, count=1)

start = s.find('function openClientModal(')
end = s.find('function editClient(i)', start)
if start < 0 or end < 0:
    raise SystemExit('client manager functions not found')

newfun = '''function openClientModal(index=-1){
  clientEditIndex=index;
  const c=index>=0?clients[index]:{name:'',username:'',project:'',email:'',status:'نشط'};
  const title=document.querySelector('#clientModal h3');
  if(title)title.textContent=index>=0?'✏ تعديل حساب العميل':'＋ إضافة حساب عميل';
  const sub=document.querySelector('#clientModal .sub');
  if(sub)sub.textContent=index>=0?'عدّل اسم المستخدم أو كلمة المرور أو بيانات العميل.':'أنشئ حساب دخول مستقل للعميل.';
  document.getElementById('clientModal').classList.remove('hidden');
  document.getElementById('clientName').value=c.name||'';
  document.getElementById('clientUsername').value=c.username||'';
  document.getElementById('clientPassword').value='';
  document.getElementById('clientPassword').placeholder=index>=0?'كلمة مرور جديدة (اتركها فارغة إذا لا تريد تغييرها)':'كلمة مرور الدخول';
  document.getElementById('clientProject').value=c.project||'';
  document.getElementById('clientEmail').value=c.email||'';
  document.getElementById('clientStatus').value=c.status||'نشط';
}
function closeClientModal(){document.getElementById('clientModal').classList.add('hidden')}

async function saveClient(){
  const name=document.getElementById('clientName').value.trim();
  const username=document.getElementById('clientUsername').value.trim().toLowerCase();
  const password=document.getElementById('clientPassword').value;
  const project=document.getElementById('clientProject').value.trim();
  const email=document.getElementById('clientEmail').value.trim().toLowerCase();
  const status=document.getElementById('clientStatus').value;
  if(!name||!username){alert('اكتب اسم العميل واسم المستخدم');return}
  if(!/^[a-z0-9._-]+$/.test(username)){alert('اسم المستخدم يكون بالإنجليزية والأرقام فقط مثل: babafino');return}
  if(clientEditIndex<0 && password.length<6){alert('كلمة المرور يجب أن تكون 6 أحرف أو أكثر');return}
  if(clientEditIndex>=0 && password && password.length<6){alert('كلمة المرور الجديدة يجب أن تكون 6 أحرف أو أكثر');return}
  const old=clientEditIndex>=0?clients[clientEditIndex]:null;
  const item={id:old?old.id:crypto.randomUUID(),name,username,project,email,status,date:old?old.date:new Date().toLocaleDateString('ar-EG')};
  try{
    if(!old){
      const authEmail=username+'@fergllo.local';
      const signupClient=window.__frgSignupClient || (window.__frgSignupClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}));
      const {data:authData,error:authError}=await signupClient.auth.signUp({email:authEmail,password});
      if(authError)throw authError;
      if(!authData.user)throw new Error('تعذر إنشاء حساب الدخول');
      const {error:dbError}=await supabaseClient.from('client_accounts').insert({id:item.id,name:item.name,username:item.username,project:item.project,email:item.email,status:item.status});
      if(dbError)throw dbError;
      const {error:profileError}=await supabaseClient.from('user_profiles').insert({user_id:authData.user.id,full_name:item.name,role:'client',client_id:item.id});
      if(profileError)throw profileError;
      clients.push(item);
      saveClients();closeClientModal();renderClients();
      alert('تم إنشاء حساب العميل بالكامل. اسم المستخدم: '+username);
      return;
    }
    const {error}=await supabaseClient.from('client_accounts').update({name:item.name,username:item.username,project:item.project,email:item.email,status:item.status}).eq('id',item.id);
    if(error)throw error;
    clients[clientEditIndex]=item;
    saveClients();closeClientModal();renderClients();
    if(password) alert('تم تعديل بيانات العميل. كلمة المرور الجديدة تحتاج تنفيذ عملية Auth آمنة من السيرفر؛ لم يتم تخزين كلمة المرور داخل الموقع.');
    else alert('تم تعديل بيانات العميل بنجاح.');
  }catch(e){alert('تعذر حفظ حساب العميل: '+(e?.message||e))}
}
'''
s = s[:start] + newfun + s[end:]

rstart = s.find('function renderClients(){')
rend = s.find('function showPage(', rstart)
if rstart >= 0 and rend > rstart:
    render = '''function renderClients(){
  const q=(document.getElementById('clientSearch')?.value||'').trim().toLowerCase();
  const list=clients.filter(c=>[c.name,c.username,c.project,c.email].join(' ').toLowerCase().includes(q));
  document.getElementById('clCount').textContent=clients.length;
  document.getElementById('clActive').textContent=clients.filter(c=>c.status==='نشط').length;
  document.getElementById('clInactive').textContent=clients.filter(c=>c.status!=='نشط').length;
  document.getElementById('clLast').textContent=clients.length?clients[clients.length-1].date:'—';
  document.getElementById('clientsBody').innerHTML=list.length?list.map(c=>{
    const i=clients.indexOf(c);
    return `<tr style="cursor:pointer" ondblclick="openClientWorkspace(${i})"><td><button class="btn gray" onclick="openClientWorkspace(${i})">${c.name}</button></td><td><b style="color:#52dcff">${c.username||'—'}</b></td><td>${c.project||'—'}</td><td>${c.email||'—'}</td><td><span class="badge ${c.status==='نشط'?'ok':'out'}">${c.status}</span></td><td>${c.date}</td><td><button class="btn green" onclick="openClientWorkspace(${i})">فتح السيستم</button><button class="btn gray" onclick="editClient(${i})">تعديل الاسم/المستخدم/الباسورد</button><button class="btn gold" onclick="toggleClient(${i})">${c.status==='نشط'?'إيقاف':'تفعيل'}</button><button class="btn red" onclick="deleteClient(${i})">حذف</button></td></tr>`
  }).join(''):'<tr><td colspan="7" class="empty">لا توجد حسابات عملاء بعد — اضغط «إضافة حساب عميل»</td></tr>'
}
'''
    s = s[:rstart] + render + s[rend:]

# Remove the old destructive reset button if it exists.
s = s.replace('onclick="resetData()">إعادة بيانات النظام إلى الأصل', 'onclick="deletePagePasswords()">🗑 حذف الرقم السري')
new_reset = "function deletePagePasswords(){if(!confirm('سيتم حذف الرقم السري للمخزون والكاشير فقط، ولن يتم حذف العملاء أو المخزون أو المبيعات. هل أنت متأكد؟'))return;passes.inventory='';passes.cashier='';localStorage.setItem(KEYS.pass,JSON.stringify(passes));const a=document.getElementById('invPass'),b=document.getElementById('cashPass');if(a)a.value='';if(b)b.value='';alert('تم حذف الرقم السري للمخزون والكاشير. الصفحتان تفتحان بدون رقم سري.')}"
s = re.sub(r'function resetData\(\)\{.*?\}', new_reset, s, count=1)

# Login screen: use a real calculator-style SVG icon, not an emoji.
old_login = '<div class="logo" style="margin:auto">🧮</div><h1>سيستم فرجللو</h1><p id="loginText">سيستم محاسبة</p>'
new_login = '<div class="logo" style="margin:auto"><svg viewBox="0 0 64 64" width="34" height="34" aria-label="آلة حاسبة" role="img"><rect x="13" y="5" width="38" height="54" rx="6" fill="none" stroke="currentColor" stroke-width="4"/><rect x="19" y="11" width="26" height="10" rx="2" fill="currentColor"/><rect x="19" y="27" width="7" height="7" rx="1" fill="currentColor"/><rect x="29" y="27" width="7" height="7" rx="1" fill="currentColor"/><rect x="39" y="27" width="7" height="7" rx="1" fill="currentColor"/><rect x="19" y="38" width="7" height="7" rx="1" fill="currentColor"/><rect x="29" y="38" width="7" height="7" rx="1" fill="currentColor"/><rect x="39" y="38" width="7" height="18" rx="1" fill="currentColor"/><rect x="19" y="49" width="17" height="7" rx="1" fill="currentColor"/></svg></div><h1>سيستم فرجللو</h1><p id="loginText">سيستم محاسبة</p>'
s = s.replace(old_login, new_login)

# Professional SVG navigation: same menu for manager and client, with client/settings hidden by role logic.
old_nav = '''  <button class="nav active" data-page="home" onclick="showPage('home')"><span>⌂</span>الرئيسية</button><button id="navInventory" class="nav" data-page="inventory" onclick="requestPage('inventory')"><span>📦</span>المخزون</button><button class="nav" data-page="cashier" onclick="requestPage('cashier')"><span>🧾</span>الكاشير</button><button class="nav" data-page="sales" onclick="showPage('sales')"><span>📊</span>المبيعات</button><button class="nav" data-page="reports" onclick="showPage('reports')"><span>📈</span>التقارير</button><button class="nav" data-page="coding" onclick="showPage('coding')"><span>▦</span>التكويدات</button><button class="nav" data-page="clients" onclick="showPage('clients')"><span>👥</span>العملاء</button><button class="nav" data-page="settings" onclick="openSettings()"><span>⚙</span>الإعدادات</button><button class="logout" onclick="logoutSystem()">⏻ تسجيل الخروج</button>'''

icon = {
'dashboard':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-7h6V4h-6v9Z"/></svg>',
'barcode':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2v16H3V4Zm4 0h1v16H7V4Zm3 0h3v16h-3V4Zm5 0h1v16h-1V4Zm3 0h3v16h-3V4Z"/></svg>',
'cashier':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14H3V5a2 2 0 0 1 2-2Zm0 3v4h14V6H5Zm2 7h3v3H7v-3Zm5 0h3v3h-3v-3Zm5 0h1v3h-1v-3Z"/></svg>',
'sales':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5h2v12h14v2H4Zm4-4 3-4 3 2 4-6 2 1-5 8-3-2-3 4-1-3Z"/></svg>',
'reports':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10l4 4v14H5V3Zm9 1v5h5M8 13h8v2H8v-2Zm0 4h6v2H8v-2Z"/></svg>',
'transfer':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h12l-2-2 1.4-1.4L20.8 9l-5.4 5.4L14 13l2-2H4V7Zm16 10H8l2 2-1.4 1.4L3.2 16l5.4-5.4L10 12l-2 2h12v3Z"/></svg>',
'settings':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m19.4 13 .1-1-.1-1 2-1.5-2-3.4-2.3 1a8 8 0 0 0-1.7-1L15 3h-4l-.4 2.1a8 8 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a8 8 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 1.7 1L11 21h4l.4-2.1a8 8 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z"/></svg>',
'clients':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21v-2a6 6 0 0 1 12 0v2H2Zm13 0v-1a5 5 0 0 1 7-4.6V21h-7Z"/></svg>',
'logout':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4h8a2 2 0 0 1 2 2v3h-2V6h-8v12h8v-3h2v3a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 7h7l-2.5-2.5L18 7l5 5-5 5-1.5-1.5L19 13h-7v-2Z"/></svg>'
}

new_nav = f'''  <button class="nav active" data-page="home" onclick="showPage('home')"><span class="nav-icon">{icon['dashboard']}</span>لوحة التحكم</button><button class="nav" data-page="coding" onclick="showPage('coding')"><span class="nav-icon">{icon['barcode']}</span>التكويدات</button><button class="nav" data-page="cashier" onclick="requestPage('cashier')"><span class="nav-icon">{icon['cashier']}</span>الكاشير</button><button class="nav" data-page="sales" onclick="showPage('sales')"><span class="nav-icon">{icon['sales']}</span>المبيعات</button><button class="nav" data-page="reports" onclick="showPage('reports')"><span class="nav-icon">{icon['reports']}</span>التقارير</button><button class="nav" data-page="transfers" onclick="showPage('transfers')"><span class="nav-icon">{icon['transfer']}</span>اذن تحويل</button><button class="nav" data-page="coding" onclick="showPage('coding')"><span class="nav-icon">{icon['barcode']}</span>التكويدات</button><button id="navInventory" class="nav" data-page="inventory" onclick="requestPage('inventory')"><span class="nav-icon">{icon['barcode']}</span>المخزون</button><button class="nav" data-page="settings" onclick="openSettings()"><span class="nav-icon">{icon['settings']}</span>الإعدادات</button><button class="nav" data-page="clients" onclick="showPage('clients')"><span class="nav-icon">{icon['clients']}</span>العملاء</button><button class="logout" onclick="logoutSystem()"><span class="nav-icon">{icon['logout']}</span>تسجيل الخروج</button>'''

if old_nav not in s:
    raise SystemExit('old sidebar not found')
s = s.replace(old_nav, new_nav, 1)

# Rename the dashboard page heading.
s = s.replace('<h2>الرئيسية</h2><div class="sub">تنظيم • دقة • نجاح أكبر</div>', '<h2>لوحة التحكم</h2><div class="sub">نظرة سريعة على المخزون والمبيعات وحالة النظام</div>', 1)

# Add a clean transfer-permission page if it is not already present.
if 'id="transfers" class="page hidden"' not in s:
    marker = '<div id="clients" class="page hidden">'
    transfer_page = '''<div id="transfers" class="page hidden"><div class="title"><div><h2>⇄ اذن تحويل</h2><div class="sub">إنشاء ومراجعة أذونات تحويل الأصناف بين المواقع أو الفروع</div></div><button class="btn gold" onclick="printTransferPermit()">🖨 طباعة الإذن</button></div><div class="cards"><div class="card"><div class="label">عدد الأذونات</div><div id="trCount" class="value cyan">0</div></div><div class="card"><div class="label">قيد المراجعة</div><div id="trPending" class="value gold">0</div></div><div class="card"><div class="label">تم التنفيذ</div><div id="trDone" class="value green">0</div></div><div class="card"><div class="label">حالة النظام</div><div class="value">جاهز</div></div></div><div class="cash-panel"><div class="toolbar" style="margin:0"><input id="trFrom" placeholder="من / الفرع المرسل"><input id="trTo" placeholder="إلى / الفرع المستلم"><input id="trNote" placeholder="ملاحظات التحويل"><button class="btn green" onclick="createTransferPermit()">＋ إنشاء إذن</button></div></div><div class="table-wrap" style="margin-top:14px"><table class="table"><thead><tr><th>رقم الإذن</th><th>من</th><th>إلى</th><th>التاريخ</th><th>الحالة</th></tr></thead><tbody id="transfersBody"><tr><td colspan="5" class="empty">لا توجد أذونات تحويل بعد.</td></tr></tbody></table></div></div>'''
    s = s.replace(marker, transfer_page + marker, 1)

# Transfer page uses lightweight local records until a dedicated cloud table is added.
if 'function createTransferPermit()' not in s:
    marker_js = "function renderReports(){"
    transfer_js = '''let transferPermits=JSON.parse(localStorage.getItem('frg_transfer_permits')||'[]');
function renderTransfers(){const b=document.getElementById('transfersBody');if(!b)return;document.getElementById('trCount').textContent=transferPermits.length;document.getElementById('trPending').textContent=transferPermits.filter(x=>x.status==='قيد المراجعة').length;document.getElementById('trDone').textContent=transferPermits.filter(x=>x.status==='تم التنفيذ').length;b.innerHTML=transferPermits.length?transferPermits.slice().reverse().map(x=>`<tr><td>${x.id}</td><td>${x.from}</td><td>${x.to}</td><td>${x.date}</td><td><span class="badge ${x.status==='تم التنفيذ'?'ok':'low'}">${x.status}</span></td></tr>`).join(''):'<tr><td colspan="5" class="empty">لا توجد أذونات تحويل بعد.</td></tr>'}
function createTransferPermit(){const from=document.getElementById('trFrom').value.trim(),to=document.getElementById('trTo').value.trim();if(!from||!to){alert('اكتب جهة الإرسال وجهة الاستلام أولًا');return}const id='TR-'+String(Date.now()).slice(-6);transferPermits.push({id,from,to,note:document.getElementById('trNote').value.trim(),date:new Date().toLocaleString('ar-EG'),status:'قيد المراجعة'});localStorage.setItem('frg_transfer_permits',JSON.stringify(transferPermits));document.getElementById('trFrom').value='';document.getElementById('trTo').value='';document.getElementById('trNote').value='';renderTransfers();alert('تم إنشاء إذن التحويل رقم '+id)}
function printTransferPermit(){const from=document.getElementById('trFrom').value.trim()||'—',to=document.getElementById('trTo').value.trim()||'—',note=document.getElementById('trNote').value.trim()||'—';const w=window.open('','_blank','width=800,height=700');if(!w){alert('اسمح بالنوافذ المنبثقة ثم جرّب الطباعة.');return}w.document.write('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>إذن تحويل - سيستم فرجللو</title><style>body{font-family:Tahoma,Arial;padding:30px;color:#111}.box{border:2px solid #111;padding:25px}.row{padding:12px;border-bottom:1px solid #ddd;font-size:18px}h1{text-align:center}</style></head><body><div class="box"><h1>إذن تحويل - سيستم فرجللو</h1><div class="row"><b>من:</b> '+from+'</div><div class="row"><b>إلى:</b> '+to+'</div><div class="row"><b>التاريخ:</b> '+new Date().toLocaleString('ar-EG')+'</div><div class="row"><b>ملاحظات:</b> '+note+'</div><div style="margin-top:60px;display:flex;justify-content:space-between"><b>توقيع المرسل: __________</b><b>توقيع المستلم: __________</b></div></div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\\/script></body></html>');w.document.close()}
'''
    s = s.replace(marker_js, transfer_js + marker_js, 1)

# Ensure the new page refreshes when opened.
s = s.replace("if(id==='coding')renderCoding();if(id==='clients')renderClients();", "if(id==='coding')renderCoding();if(id==='transfers')renderTransfers();if(id==='clients')renderClients();", 1)

# Make the sidebar icons look like a professional icon set.
css_marker = '.nav span{font-size:20px;margin-left:8px}'
css_new = '.nav span{font-size:20px;margin-left:8px}.nav-icon{display:inline-grid;place-items:center;width:27px;height:27px;vertical-align:middle;margin-left:9px}.nav-icon svg{width:23px;height:23px;fill:currentColor;stroke:currentColor;stroke-width:0}.nav:hover .nav-icon,.nav.active .nav-icon{filter:drop-shadow(0 0 5px #24d7ff)}.logout .nav-icon{display:inline-grid;margin-left:7px}'
if css_marker in s and '.nav-icon svg' not in s:
    s=s.replace(css_marker,css_new,1)

# Header logo: use the same real calculator SVG instead of a cart emoji.
s=s.replace('<div class="logo">🛒</div><div><h1>سيستم فرجللو</h1>', '<div class="logo"><svg viewBox="0 0 64 64" width="32" height="32" aria-label="آلة حاسبة" role="img"><rect x="13" y="5" width="38" height="54" rx="6" fill="none" stroke="currentColor" stroke-width="4"/><rect x="19" y="11" width="26" height="10" rx="2" fill="currentColor"/><rect x="19" y="27" width="7" height="7" rx="1" fill="currentColor"/><rect x="29" y="27" width="7" height="7" rx="1" fill="currentColor"/><rect x="39" y="27" width="7" height="7" rx="1" fill="currentColor"/><rect x="19" y="38" width="7" height="7" rx="1" fill="currentColor"/><rect x="29" y="38" width="7" height="7" rx="1" fill="currentColor"/><rect x="39" y="38" width="7" height="18" rx="1" fill="currentColor"/><rect x="19" y="49" width="17" height="7" rx="1" fill="currentColor"/></svg></div><div><h1>سيستم فرجللو</h1>', 1)

marker='<!-- deploy-trigger-20261024-manager-client-menu-v1 -->'
# Keep only the latest deploy marker at the bottom.
s=re.sub(r'<!-- deploy-trigger-20261024:[^>]+ -->$', marker, s)
if marker not in s:
    s += '\n'+marker+'\n'
p.write_text(s, encoding='utf-8')
