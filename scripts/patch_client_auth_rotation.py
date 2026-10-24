from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

start = s.find('async function saveClient(){')
end = s.find('function renderClients(){', start)
if start < 0 or end < 0:
    raise SystemExit('saveClient function not found')

newfun = r'''async function saveClient(){
  const name=document.getElementById('clientName').value.trim();
  const username=document.getElementById('clientUsername').value.trim().toLowerCase();
  const password=document.getElementById('clientPassword').value;
  const project=document.getElementById('clientProject').value.trim();
  const email=document.getElementById('clientEmail').value.trim().toLowerCase();
  const status=document.getElementById('clientStatus').value;
  if(!name||!username){alert('اكتب اسم العميل واسم المستخدم');return}
  if(!/^[a-z0-9._-]+$/.test(username)){alert('اسم المستخدم يكون بالإنجليزية والأرقام فقط مثل: babafino');return}
  if(clientEditIndex<0 && password.length<6){alert('كلمة المرور يجب أن تكون 6 أحرف أو أكثر');return}
  if(clientEditIndex>=0 && username!==String(clients[clientEditIndex]?.username||'').toLowerCase() && password.length<6){alert('عند تغيير اسم المستخدم لازم تكتب كلمة مرور جديدة للحساب.');return}
  if(clientEditIndex>=0 && password && password.length<6){alert('كلمة المرور الجديدة يجب أن تكون 6 أحرف أو أكثر');return}

  const old=clientEditIndex>=0?clients[clientEditIndex]:null;
  const item={id:old?old.id:crypto.randomUUID(),name,username,project,email,status,date:old?old.date:new Date().toLocaleDateString('ar-EG')};
  try{
    const signupClient=window.__frgSignupClient || (window.__frgSignupClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}));

    if(!old){
      const authEmail=username+'@fergllo.local';
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

    const oldUsername=String(old.username||'').toLowerCase();
    const credentialsChanged=(username!==oldUsername)||!!password;

    if(credentialsChanged){
      if(!password){alert('اكتب كلمة مرور جديدة عند تغيير بيانات الدخول.');return;}
      /* Rotate Auth identity without exposing a service/secret key in the browser. */
      const authEmail=item.id+'@fergllo.local';
      const {data:authData,error:authError}=await signupClient.auth.signUp({email:authEmail,password});
      if(authError)throw authError;
      if(!authData.user)throw new Error('تعذر إنشاء حساب الدخول الجديد');
      const {error:profileError}=await supabaseClient.from('user_profiles')
        .update({user_id:authData.user.id,full_name:item.name,role:'client'})
        .eq('client_id',item.id);
      if(profileError)throw profileError;
    }

    const {error}=await supabaseClient.from('client_accounts')
      .update({name:item.name,username:item.username,project:item.project,email:item.email,status:item.status})
      .eq('id',item.id);
    if(error)throw error;

    clients[clientEditIndex]=item;
    saveClients();closeClientModal();renderClients();
    alert(credentialsChanged ? 'تم تعديل الحساب بالكامل. استخدم اسم المستخدم وكلمة المرور الجديدة.' : 'تم تعديل بيانات العميل بنجاح.');
  }catch(e){alert('تعذر حفظ حساب العميل: '+(e?.message||e))}
}
'''
s = s[:start] + newfun + s[end:]

# Make client login resolve rotated Auth identities as well as legacy username-based identities.
login_start = s.find('async function doLogin(){')
login_end = s.find('function logoutSystem(', login_start)
if login_start < 0 or login_end < 0:
    raise SystemExit('doLogin function not found')

loginfun = r'''async function doLogin(){
  const u=document.getElementById('email').value.trim().toLowerCase();
  const p=document.getElementById('password').value;
  const err=document.getElementById('loginErr');
  err.textContent='';
  if(!u||!p){err.textContent='اكتب اسم المستخدم وكلمة المرور';return}
  try{
    if(window.__frgLoginMode==='admin'){
      const {data,error}=await supabaseClient.auth.signInWithPassword({email:u,password:p});
      if(error)throw error;
      if(!data?.user)throw new Error('تعذر تسجيل الدخول');
      currentUser=data.user;currentRole='admin';
      document.getElementById('login').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      initApp();return;
    }

    const {data:client,error:clientError}=await supabaseClient.from('client_accounts')
      .select('id,name,username,status').eq('username',u).maybeSingle();
    if(clientError)throw clientError;
    if(!client || client.status!=='نشط')throw new Error('بيانات الدخول غير صحيحة أو الحساب غير نشط');

    const candidateEmails=[u+'@fergllo.local',client.id+'@fergllo.local'];
    let authData=null,lastError=null;
    for(const authEmail of candidateEmails){
      const result=await supabaseClient.auth.signInWithPassword({email:authEmail,password:p});
      if(!result.error){authData=result.data;break}
      lastError=result.error;
    }
    if(!authData?.user)throw lastError||new Error('Invalid login credentials');

    const {data:profile,error:profileError}=await supabaseClient.from('user_profiles')
      .select('user_id,full_name,role,client_id').eq('user_id',authData.user.id).eq('client_id',client.id).maybeSingle();
    if(profileError)throw profileError;
    if(!profile || profile.role!=='client')throw new Error('حساب العميل غير مربوط بالنظام');

    currentUser=authData.user;currentRole='client';currentClientId=client.id;
    document.getElementById('login').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  }catch(e){err.textContent=e?.message||'Invalid login credentials';}
}
'''
s = s[:login_start] + loginfun + s[login_end:]

p.write_text(s, encoding='utf-8')
