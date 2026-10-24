from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Clients should see the same navigation as the manager except for the Clients page.
s = s.replace('document.querySelectorAll(\'.nav[data-page="clients"],.nav[data-page="settings"]\').forEach(el=>el.classList.add(\'hidden\'));', 'document.querySelectorAll(\'.nav[data-page="clients"]\').forEach(el=>el.classList.add(\'hidden\'));')
s = s.replace('document.querySelectorAll(\'.nav[data-page="clients"],.nav[data-page="settings"]\').forEach(el=>el.classList.remove(\'hidden\'));', 'document.querySelectorAll(\'.nav[data-page="clients"],.nav[data-page="settings"]\').forEach(el=>el.classList.remove(\'hidden\'));')

# Give Inventory its own warehouse/box icon instead of reusing the barcode icon.
old = '<button id="navInventory" class="nav" data-page="inventory" onclick="requestPage(\'inventory\')"><span class="nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2v16H3V4Zm4 0h1v16H7V4Zm3 0h3v16h-3V4Zm5 0h1v16h-1V4Zm3 0h3v16h-3V4Z"/></svg></span>المخزون</button>'
new = '<button id="navInventory" class="nav" data-page="inventory" onclick="requestPage(\'inventory\')"><span class="nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Zm9-2.1L7 7.8l5 2.5 5-2.5-5-2.4ZM5 9.6v5.7l6 3V12.6l-6-3Zm8 3v5.7l6-3V9.6l-6 3Z"/></svg></span>المخزون</button>'
if old in s:
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
