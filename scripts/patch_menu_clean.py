from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')
start = s.find('<aside class="side">')
end = s.find('</aside>', start)
if start < 0 or end < 0:
    raise SystemExit('sidebar not found')

nav = '''<aside class="side">
  <button class="nav active" data-page="home" onclick="showPage('home')"><span class="nav-icon">⌂</span>الرئيسية</button>
  <button class="nav" data-page="coding" onclick="showPage('coding')"><span class="nav-icon">▥</span>تكويد الأصناف</button>
  <button class="nav" data-page="cashier" onclick="requestPage('cashier')"><span class="nav-icon">▣</span>الكاشير</button>
  <button class="nav" data-page="sales" onclick="showPage('sales')"><span class="nav-icon">▤</span>المبيعات اليومية</button>
  <button class="nav" data-page="reports" onclick="showPage('reports')"><span class="nav-icon">▥</span>التقارير</button>
  <button class="nav" data-page="transfers" onclick="showPage('transfers')"><span class="nav-icon">⇄</span>اذن تحويل</button>
  <button id="navInventory" class="nav" data-page="inventory" onclick="requestPage('inventory')"><span class="nav-icon">▦</span>المخزون</button>
  <button id="navDailyTransfers" class="nav" data-page="dailyTransfers" onclick="showPage('dailyTransfers')">ترحيل اليومية</button>
  <button id="navSettings" class="nav" data-page="settings" onclick="showPage('settings')"><span class="nav-icon">⚙</span>الإعدادات</button>
  <button id="navClients" class="nav" data-page="clients" onclick="showPage('clients')"><span class="nav-icon">♙</span>العملاء</button>
  <button class="nav logout" onclick="supabaseClient.auth.signOut().finally(()=>location.reload())"><span class="nav-icon">↪</span>تسجيل الخروج</button>
'''
# Keep the existing sidebar closing tag and replace everything inside it.
s = s[:start] + nav + '</aside>' + s[end + len('</aside>'):]
p.write_text(s, encoding='utf-8')
