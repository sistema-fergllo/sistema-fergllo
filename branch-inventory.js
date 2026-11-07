/* سيستم حلاوة — إدارة المخزون المستقل للفروع */
(function(){
 'use strict';
 const originalSync=window.syncClientInventoryToCloud;
 async function loadBranchInventory(){
   if(window.currentProfileRole!=='client'||!window.activeClient?.id) return;
   let branch=null;
   try{branch=JSON.parse(localStorage.getItem('frg_active_branch')||'null')}catch(e){}
   if(!branch?.id) throw new Error('اختار الفرع أولاً قبل تحميل المخزون.');
   const clientId=window.activeClient.id;
   const {data:base,error:baseError}=await window.supabaseClient.from('client_inventory')
     .select('code,name,unit,price').eq('client_id',clientId).order('code');
   if(baseError) throw new Error('تعذر تحميل قائمة الأصناف: '+baseError.message);
   const {data:rows,error}=await window.supabaseClient.from('branch_inventory')
     .select('code,name,price,qty,sold').eq('client_id',clientId).eq('branch_id',branch.id).order('code');
   if(error) throw new Error('تعذر تحميل مخزون الفرع. شغّل ملف supabase/branch_inventory.sql أولاً: '+error.message);
   // Keep a local catalog snapshot as a safety net. Loading a branch with no
   // branch_inventory rows must never replace a populated catalog with an empty list.
   let cached=[];
   try{cached=JSON.parse(window.localStorage.getItem('frg_inv_'+clientId)||'[]')}catch(e){}
   if(!Array.isArray(cached))cached=[];
   const current=Array.isArray(window.inventory)?window.inventory:[];
   const catalog=new Map();
   [...(base||[]),...cached,...current].forEach(x=>{
     const code=String(x.code??'').trim();
     if(code&&!catalog.has(code))catalog.set(code,x);
   });
   const byCode=new Map((rows||[]).map(x=>[String(x.code),x]));
   const branchHasRows=(rows||[]).length>0;
   window.inventory=[...catalog.entries()].map(([code,x])=>{
     const stock=byCode.get(code);
     return {
       code,
       name:stock?.name||x.name||'',
       unit:x.unit==='كيلو'?'كيلو':'قطعة',
       price:Number(stock?.price??x.price??0),
       qty:Number(stock?.qty??(branchHasRows?0:(x.qty??0))),
       sold:Number(stock?.sold??(branchHasRows?0:(x.sold??0)))
     };
   });
   // Include products created directly in this branch.
   (rows||[]).forEach(x=>{
     if(!window.inventory.some(y=>String(y.code)===String(x.code))){
       window.inventory.push({code:String(x.code),name:x.name,unit:'قطعة',price:Number(x.price||0),qty:Number(x.qty||0),sold:Number(x.sold||0)});
     }
   });
   // Use the actual client cache key (KEYS is a lexical const, not window.KEYS).
   window.localStorage.setItem('frg_inv_'+clientId,JSON.stringify(window.inventory));
   if(typeof window.refreshAll==='function')window.refreshAll();
   if(typeof window.renderTransfers==='function')window.renderTransfers();
 }
 window.loadBranchInventory=loadBranchInventory;

 window.syncClientInventoryToCloud=async function(){
   if(window.currentProfileRole!=='client'||!window.activeClient?.id)return typeof originalSync==='function'?originalSync():undefined;
   let branch=null;
   try{branch=JSON.parse(localStorage.getItem('frg_active_branch')||'null')}catch(e){}
   if(!branch?.id)throw new Error('لا يمكن حفظ المخزون دون تحديد الفرع.');
   const rows=(window.inventory||[]).map(x=>({
     client_id:window.activeClient.id,branch_id:branch.id,code:String(x.code),
     name:String(x.name||''),price:Number(x.price||0),qty:Number(x.qty||0),
     sold:Number(x.sold||0),updated_at:new Date().toISOString()
   }));
   if(!rows.length)return;
   const masterRows=rows.map(x=>({client_id:x.client_id,code:x.code,name:x.name,price:x.price,qty:0,sold:0,updated_at:x.updated_at}));
   const {error:masterError}=await window.supabaseClient.from('client_inventory').upsert(masterRows,{onConflict:'client_id,code',ignoreDuplicates:true});
   if(masterError)throw masterError;
   const {error}=await window.supabaseClient.from('branch_inventory').upsert(rows,{onConflict:'client_id,branch_id,code'});
   if(error)throw error;
 };

 const oldConfirm=window.confirmBranchEntry;
 if(typeof oldConfirm==='function'){
   window.confirmBranchEntry=async function(){
     await oldConfirm.apply(this,arguments);
     let branch=null;try{branch=JSON.parse(localStorage.getItem('frg_active_branch')||'null')}catch(e){}
     if(branch?.id&&document.getElementById('branchGateModal')?.classList.contains('hidden')){
       try{await loadBranchInventory()}
       catch(e){alert(e.message||'تعذر تحميل مخزون الفرع');console.error(e)}
     }
   };
 }

 window.markTransferDone=async function(id){
   const permits=typeof window.getTransferPermits==='function'?window.getTransferPermits():[];
   const p=permits.find(x=>String(x.id)===String(id));
   if(!p)return;
   if(p.status==='تم التنفيذ'){alert('الإذن معتمد كمنفذ بالفعل');return}
   if(window.currentProfileRole!=='client'||!window.activeClient?.id){
     alert('اعتماد التحويل المخزني متاح من حساب العميل بعد اختيار الفرع.');return;
   }
   if(!confirm('تأكيد تنفيذ الإذن '+p.number+'؟ سيتم الخصم من فرع الإرسال والإضافة إلى فرع الاستلام وتحديث الجرد فورًا.'))return;
   try{
     const {data:branches,error:branchError}=await window.supabaseClient.from('client_branches')
       .select('id,name').eq('client_id',window.activeClient.id);
     if(branchError)throw branchError;
     const norm=s=>String(s||'').trim().toLocaleLowerCase('ar');
     const from=(branches||[]).find(b=>norm(b.name)===norm(p.from));
     const to=(branches||[]).find(b=>norm(b.name)===norm(p.to));
     if(!from||!to)throw new Error('اسم فرع الإرسال أو الاستلام غير مطابق لاسم فرع مسجل. راجع أسماء الفروع في الإذن.');
     if(from.id===to.id)throw new Error('فرع الإرسال والاستلام يجب أن يكونا مختلفين.');
     const itemMap=new Map();
     (p.items||[]).forEach(x=>{const code=String(x.code||'');const qty=Number(x.qty);if(!code||!String(x.name||'').trim()||!Number.isFinite(qty)||qty<=0)throw new Error('بيانات الأصناف في الإذن غير مكتملة.');const old=itemMap.get(code);if(old)old.qty+=qty;else itemMap.set(code,{code,name:String(x.name),qty,price:Number(x.price||0)})});
     const items=[...itemMap.values()];
     if(!items.length)throw new Error('لا توجد أصناف صالحة في الإذن.');
     const {data,error}=await window.supabaseClient.rpc('apply_branch_transfer',{
       p_client_id:window.activeClient.id,p_transfer_id:String(p.id),
       p_from_branch_id:from.id,p_to_branch_id:to.id,p_items:items
     });
     if(error)throw error;
     if(!data?.success)throw new Error('قاعدة البيانات لم تؤكد تنفيذ التحويل.');
     p.status='تم التنفيذ';p.completed_at=new Date().toLocaleString('ar-EG');
     p.stock_applied=true;p.stock_applied_at=new Date().toISOString();
     window.saveTransferPermits(permits);
     if(typeof window.logActivity==='function')window.logActivity('تم تنفيذ التحويل '+p.number+' من '+p.from+' إلى '+p.to+' وتحديث أرصدة الفرعين','transfer');
     let active=null;try{active=JSON.parse(localStorage.getItem('frg_active_branch')||'null')}catch(e){}
     if(active?.id===from.id||active?.id===to.id)await loadBranchInventory();
     if(typeof window.renderTransfers==='function')window.renderTransfers();
     alert('تم تنفيذ التحويل وتحديث مخزون الفرعين والجرد بنجاح.');
   }catch(e){console.error(e);alert('لم يتم تنفيذ التحويل، ولم يتم اعتماد الإذن: '+(e?.message||e))}
 };
 const previousShowPage=window.showPage;
 if(typeof previousShowPage==='function'){
   window.showPage=function(id){
     const result=previousShowPage.apply(this,arguments);
     if(id==='transfers'&&window.currentProfileRole==='client'&&window.activeClient?.id){
       window.loadBranchInventory().then(()=>{
         if(typeof window.renderTransfers==='function')window.renderTransfers();
       }).catch(e=>{console.error('تعذر تحديث مخزون التحويلات:',e);alert('تعذر تحميل أصناف الفرع للتحويل: '+(e?.message||e))});
     }
     return result;
   };
 }

})();