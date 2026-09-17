#!/usr/bin/env python3
"""Reassemble the single-file 7 Years / 7 Worlds page.

    python3 build.py            -> writes index.html

Edit anything in src/ and re-run. Assets in assets/ are re-inlined as base64
data URIs wherever an __ASSET:<filename>__ placeholder appears, so the output
stays one self-contained file with no external requests.
"""
import base64, os, re, mimetypes
HERE=os.path.dirname(os.path.abspath(__file__))
def read(p): return open(os.path.join(HERE,p),encoding='utf-8').read()

html = (read('src/01-head.html') + read('src/02-body.html')
        + '<script type="module">' + read('src/03-engine.js') + read('src/04-tail.html'))

MIME={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.woff':'font/woff'}
def inline(m):
    fn=m.group(1); path=os.path.join(HERE,'assets',fn)
    if not os.path.exists(path): raise SystemExit('missing asset: '+fn)
    mime=MIME.get(os.path.splitext(fn)[1].lower()) or mimetypes.guess_type(fn)[0] or 'application/octet-stream'
    b64=base64.b64encode(open(path,'rb').read()).decode()
    return f'data:{mime};base64,{b64}'
html=re.sub(r'__ASSET:([^_]+?)__', inline, html)

out=os.path.join(HERE,'index.html')
open(out,'w',encoding='utf-8').write(html)
print(f'wrote {out}  ({len(html):,} chars)')
