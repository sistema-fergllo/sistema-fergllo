from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""if(window.__frgLoginMode==='admin'){\n      const {data,error}=await supabaseClient.auth.signInWithPassword({email:u,password:p});\n      if(error)throw error;\n      if(!data?.user)throw new Error('تعذر تسجيل الدخول');\n      currentUser=data.user;currentRole='admin';"""
new="""if(window.__frgLoginMode!=='client'){\n      const adminCandidates = u.includes('@') ? [u] : [u+'@fergllo.local',u+'@gmail.com'];\n      let adminData=null,lastAdminError=null;\n      for(const adminEmail of adminCandidates){\n        const result=await supabaseClient.auth.signInWithPassword({email:adminEmail,password:p});\n        if(!result.error){adminData=result.data;break}\n        lastAdminError=result.error;\n      }\n      if(!adminData?.user)throw lastAdminError||new Error('بيانات دخول المشرف غير صحيحة');\n      currentUser=adminData.user;currentRole='admin';"""
if old not in s:
    raise SystemExit('admin login block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
