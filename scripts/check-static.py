from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, urljoin
import json, sys
root=Path('dist')
missing={}
class Parser(HTMLParser):
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  for key in ['href','src','poster']:
   if key not in d: continue
   value=d[key]
   if not value or value.startswith(('#','data:','mailto:','tel:','http:','https:','//')):continue
   path=unquote(urlsplit(urljoin(self.url,value)).path).lstrip('/')
   dest=root/path
   if not dest.is_file() and not (dest/'index.html').is_file(): missing.setdefault(value,[]).append(str(self.page))
for p in root.rglob('*.html'):
 a=Parser();a.page=p;a.url='/'+str(p.relative_to(root)).replace('index.html','');a.feed(p.read_text())
print(json.dumps({'pages':len(list(root.rglob('*.html'))),'missing':missing},indent=2))

sys.exit(1 if missing else 0)
