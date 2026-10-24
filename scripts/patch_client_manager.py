from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

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
  document.getElementById('clientModal').classList.remove('hidden');
  document.getElementById('clientName').value=c.name||'';
  document.getElementById('clientUsername').value=c.username||'';
  document.getElementById('clientPassword').value='';
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
    }else{
      const {error}=await supabaseClient.from('client_accounts').update({name:item.name,username:item.username,project:item.project,email:item.email,status:item.status}).eq('id',item.id);
      if(error)throw error;
      clients[clientEditIndex]=item;
    }
    saveClients();closeClientModal();renderClients();
    alert(old?'تم تعديل بيانات العميل بنجاح.':'تم إنشاء حساب العميل بالكامل.');
  }catch(e){alert('تعذر حفظ حساب العميل: '+(e?.message||e))}
}
'''
s = s[:start] + newfun + s[end:]
p.write_text(s, encoding='utf-8')
