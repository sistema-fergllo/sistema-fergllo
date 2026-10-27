from pathlib import Path

path = Path('index.html')
s = path.read_text(encoding='utf-8')
start = s.find('function printLabelsInFrame(labels){')
end = s.find('function renderCart(){', start)
if start < 0 or end < 0:
    raise SystemExit('barcode print block not found')

new_block = r'''function printLabelsInFrame(labels){
  if(typeof window.JsBarcode!=='function'){alert('مكتبة الباركود لم تتحمل. اعمل Ctrl+F5 ثم جرّب تاني.');return}
  const valid=(Array.isArray(labels)?labels:[]).map(x=>({code:String(x.code||'').trim(),price:Number(x.price||0)})).filter(x=>x.code);
  if(!valid.length){alert('مفيش أكواد صالحة للطباعة.');return}
  const w=window.open('','_blank','width=900,height=700');
  if(!w){alert('اسمح بالنوافذ المنبثقة للموقع ثم جرّب تاني.');return}
  try{
    const pages=valid.map(x=>{
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      window.JsBarcode(svg,x.code,{format:'CODE128',displayValue:false,margin:0,height:42,width:1.35,lineColor:'#000',background:'#fff'});
      svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
      const svgText=new XMLSerializer().serializeToString(svg);
      const price=Number.isFinite(x.price)?x.price.toFixed(2):'0.00';
      const safeCode=x.code.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
      return '<section class="label"><div class="bars">'+svgText+'</div><div class="code">'+safeCode+'</div><div class="price">'+price+' ج.م</div></section>';
    }).join('');
    w.document.open();
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Barcode</title><style>@page{size:50mm 30mm landscape;margin:0}html,body{width:50mm!important;height:30mm!important;margin:0!important;padding:0!important;background:#fff!important;overflow:hidden!important}*{box-sizing:border-box}.label{width:50mm;height:30mm;margin:0!important;padding:1mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;overflow:hidden;break-before:page;page-break-before:always;break-after:avoid;page-break-after:avoid;font-family:Arial,sans-serif;color:#000;background:#fff}.label:first-child{break-before:auto;page-break-before:auto}.bars{display:flex;align-items:center;justify-content:center;width:47mm;height:15mm}.bars svg{display:block;width:47mm!important;height:15mm!important}.code{font-size:10pt;font-weight:700;line-height:1.15;margin-top:1mm;white-space:nowrap}.price{font-size:12pt;font-weight:700;line-height:1.15;margin-top:1mm;white-space:nowrap}@media print{@page{size:50mm 30mm landscape;margin:0}html,body{width:50mm!important;height:30mm!important;margin:0!important;padding:0!important;overflow:hidden!important}.label{margin:0!important}}</style></head><body>'+pages+'</body></html>');
    w.document.close();
    const doPrint=()=>{if(w.closed)return;w.focus();try{w.print()}catch(e){}};
    w.addEventListener('load',()=>setTimeout(doPrint,350),{once:true});
    setTimeout(()=>{if(!w.closed&&w.document.readyState==='complete')doPrint()},1000);
  }catch(e){try{w.close()}catch(_){}alert('تعذر تجهيز صفحة الطباعة: '+(e.message||e))}
}
'''

s = s[:start] + new_block + s[end:]
path.write_text(s, encoding='utf-8')
print('patched', path)
