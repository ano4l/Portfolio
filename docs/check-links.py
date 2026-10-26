from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
root=Path('dist').resolve()
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls=[]; self.ids=set(); self.images=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.add(a['id'])
        for key in ('href','src'):
            if key in a:self.urls.append(a[key])
        if tag=='img':self.images.append(a)
pages={}
for f in root.rglob('*.html'):
    p=Page();p.feed(f.read_text(encoding='utf-8'));pages[f]=p
errors=[]; count=0
for f,p in pages.items():
    for u in p.urls:
        s=urlsplit(u)
        if s.scheme or s.netloc:continue
        target=(root/unquote(s.path).lstrip('/')) if s.path.startswith('/') else f.parent/unquote(s.path)
        if not s.path:target=f
        if target.is_dir():target=target/'index.html'
        target=target.resolve();count+=1
        if not target.exists():errors.append(f'{f.relative_to(root)}: missing {u}')
        elif s.fragment and target in pages and unquote(s.fragment) not in pages[target].ids:errors.append(f'{f.relative_to(root)}: missing anchor {u}')
    for im in p.images:
        if 'alt' not in im:errors.append(f'{f}: image missing alt')
        if not all(k in im for k in ('width','height')):errors.append(f'{f}: image missing dimensions')
print(json.dumps({'pages':len(pages),'local_references':count,'errors':errors},indent=2))
raise SystemExit(bool(errors))
