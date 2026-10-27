from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
start = s.find('function printSelectedBarcode()')
end = s.find('function renderCart()', start)
if start < 0 or end < 0:
    raise SystemExit('barcode print block not found')

block = r'''function printSelectedBarcode(){const code=document.getElementById('bcSelect')?.value;const qty=Math.max(1,Math.min(500,parseInt(document.getElementById('bcQty')?.value||'1',10)));if(!code){alert('اختار الصنف الأول');return}closeBarcodeModal();printBarcodeByCode(code,qty)}
function printBarcode(code){printBarcodeByCode(code,1)}
function printAllBarcodes(){
  if(!inventory||!inventory.length){alert('المخزون فارغ، أضف أصنافًا أولًا');return}
  const w=window.open('','_blank','width=600,height=700');
  if(!w){alert('اسمح بالنوافذ المنبثقة للطباعة');return}
  const labels=inventory.filter(x=>String(x.code||'').trim()).map(x=>({code:String(x.code),name:String(x.name||''),price:Number(x.price||0)}));
  writeBarcodePrintWindow(w,labels);
}
function printBarcodeByCode(code,qty=1){
  const item=(inventory||[]).find(x=>String(x.code)===String(code));
  if(!item){alert('الصنف غير موجود في المخزون');return}
  const w=window.open('','_blank','width=600,height=700');
  if(!w){alert('اسمح بالنوافذ المنبثقة للطباعة');return}
  const count=Math.max(1,Math.min(500,parseInt(qty||1,10)));
  writeBarcodePrintWindow(w,Array.from({length:count},()=>({code:String(item.code),name:String(item.name||''),price:Number(item.price||0)})));
}
function writeBarcodePrintWindow(w,labels){
  const labelHtml=labels.map((x)=>'<section class="label"><div class="name">'+escapeBarcodeText(x.name)+'</div><svg class="barcode" data-code="'+escapeBarcodeText(x.code)+'"></svg><div class="code">'+escapeBarcodeText(x.code)+'</div><div class="price">'+(x.price?money(x.price):'')+'</div></section>').join('');
  w.document.open();
  w.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>باركود فرجللو</title><style>@page{size:50mm 30mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Tahoma,Arial,sans-serif}.label{width:50mm;height:30mm;padding:1.2mm 1.5mm;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;page-break-after:always;break-after:page}.name{font-size:9pt;font-weight:bold;text-align:center;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.barcode{width:46mm;height:14mm;max-width:100%}.code{font-size:8pt;direction:ltr;text-align:center;line-height:1.1}.price{font-size:8pt;font-weight:bold;margin-top:1mm}@media screen{body{padding:10px}.label{border:1px dashed #bbb;margin:0 auto 8px}}</style></head><body>'+labelHtml+'<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script><script>window.addEventListener("load",function(){try{document.querySelectorAll("svg.barcode").forEach(function(svg){JsBarcode(svg,svg.getAttribute("data-code"),{format:"CODE128",displayValue:false,margin:0,height:42,width:1.35,lineColor:"#000",background:"#fff"});});setTimeout(function(){window.focus();window.print()},900)}catch(e){document.body.insertAdjacentHTML("afterbegin","<p>تعذر إنشاء الباركود. تأكد من اتصال الإنترنت ثم أعد المحاولة.</p>")}});<\/script></body></html>');
  w.document.close();
}
'''

p.write_text(s[:start] + block + s[end:], encoding='utf-8')
print('restored barcode print block')
