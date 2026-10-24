from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="if(window.__frgLoginMode==='admin'){"
new="if(window.__frgLoginMode!=='client'){"
if old not in s:
    raise SystemExit('admin login condition not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
