from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Make the manager form unmistakable on both add and edit.
if 'id="clientUsername"' not in s:
    s = re.sub(
        r'<input id="clientName"[^>]*>',
        lambda m: m.group(0) + '<input id="clientUsername" placeholder="اسم المستخدم للدخول" autocomplete="username"><input id="clientPassword" type="password" placeholder="كلمة مرور الدخول" autocomplete="new-password">',
        s,
        count=1,
    )

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

    // Update public client data now. Password/auth-identity changes are handled only by a trusted server action.
    const {error}=await supabaseClient.from('client_accounts').update({name:item.name,username:item.username,project:item.project,email:item.email,status:item.status}).eq('id',item.id);
    if(error)throw error;
    clients[clientEditIndex]=item;
    saveClients();closeClientModal();renderClients();
    if(password){
      alert('تم تعديل بيانات العميل. كلمة المرور الجديدة تحتاج تنفيذ عملية Auth آمنة من السيرفر؛ لم يتم تخزين كلمة المرور داخل الموقع.');
    }else{
      alert('تم تعديل بيانات العميل بنجاح.');
    }
  }catch(e){alert('تعذر حفظ حساب العميل: '+(e?.message||e))}
}
'''
s = s[:start] + newfun + s[end:]

# Replace the clients table renderer so username is visible and the edit action is obvious.
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
    return `<tr style="cursor:pointer" ondblclick="openClientWorkspace(${i})">
      <td><button class="btn gray" onclick="openClientWorkspace(${i})">${c.name}</button></td>
      <td><b style="color:#52dcff">${c.username||'—'}</b></td>
      <td>${c.project||'—'}</td>
      <td>${c.email||'—'}</td>
      <td><span class="badge ${c.status==='نشط'?'ok':'out'}">${c.status}</span></td>
      <td>${c.date}</td>
      <td>
        <button class="btn green" onclick="openClientWorkspace(${i})">فتح السيستم</button>
        <button class="btn gray" onclick="editClient(${i})">تعديل الاسم/المستخدم/الباسورد</button>
        <button class="btn gold" onclick="toggleClient(${i})">${c.status==='نشط'?'إيقاف':'تفعيل'}</button>
        <button class="btn red" onclick="deleteClient(${i})">حذف</button>
      </td>
    </tr>`
  }).join(''):'<tr><td colspan="7" class="empty">لا توجد حسابات عملاء بعد — اضغط «إضافة حساب عميل»</td></tr>'
}
'''
    s = s[:rstart] + render + s[rend:]

# Replace the old reset-to-default action with a dedicated page-password deletion action.
s = s.replace('onclick="resetData()">إعادة بيانات النظام إلى الأصل', 'onclick="deletePagePasswords()">🗑 حذف الرقم السري')
old_reset = "function resetData(){if(!confirm('سيتم حذف المبيعات وإرجاع المخزون لبيانات البداية. هل أنت متأكد؟'))return;inventory=ORIGINAL.map(x=>({...x,sold:0}));sales=[];save();refreshAll();alert('تمت إعادة النظام لبيانات البداية')}"
new_reset = "function deletePagePasswords(){if(!confirm('سيتم حذف الرقم السري للمخزون والكاشير فقط، ولن يتم حذف العملاء أو المخزون أو المبيعات. هل أنت متأكد؟'))return;passes.inventory='';passes.cashier='';localStorage.setItem(KEYS.pass,JSON.stringify(passes));const a=document.getElementById('invPass'),b=document.getElementById('cashPass');if(a)a.value='';if(b)b.value='';alert('تم حذف الرقم السري للمخزون والكاشير. الصفحتان تفتحان بدون رقم سري.')}"
if old_reset in s:
    s = s.replace(old_reset, new_reset)
else:
    s = re.sub(r'function resetData\(\)\{.*?\}', new_reset, s, count=1)

# Visible deployment marker so GitHub Pages receives a fresh commit.
marker='<!-- deploy-trigger-20261024-client-credentials-v2 -->'
s=re.sub(r'<!-- deploy-trigger-20261024:[^>]+ -->$', marker, s)
if marker not in s:
    s += '\n'+marker+'\n'

p.write_text(s, encoding='utf-8')
