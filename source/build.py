# builds (1) the single-file preview and (2) the fast GitHub/Cloudflare version with separate image files
import re, json, base64, hashlib, os, shutil
G='/home/claude/go/'
order=['part1.html','part_img.js','part2.js','part_legal.js','part3.js','part_api.js','part_supabase.js','part_valid.js','part_extra.js','part4.js','part5.js','part6.js','part7.js','part8.js','part9.js']
parts={f:open(G+f).read() for f in order}
single=''.join(parts[f] for f in order)
open('/mnt/user-data/outputs/green-ocean.html','w').write(single)
open('/tmp/all.js','w').write('\n'.join(re.findall(r'<script>(.*?)</script>',single,re.S)))
# ---- live version: photos become cacheable files
IMG=json.loads(re.search(r'const IMG=(\{.*\});',parts['part_img.js'],re.S).group(1))
out='/home/claude/repo2/public/assets/img/'; shutil.rmtree(out,ignore_errors=True); os.makedirs(out)
paths={}
for k,v in IMG.items():
    head,b64=v.split(',',1); ext='png' if 'png' in head else 'jpg'; data=base64.b64decode(b64)
    h=hashlib.md5(data).hexdigest()[:8]; open(out+f'{k}.{ext}','wb').write(data)
    paths[k]=f'/assets/img/{k}.{ext}?v={h}'
live=''.join(('<script>\nconst IMG='+json.dumps(paths)+';\n</script>\n') if f=='part_img.js' else parts[f] for f in order)
meta='''<meta name="description" content="Healthy nursery-fresh indoor plants, planters and plant gifts from Green Ocean, Balihari, Dhanbad. Pan-India delivery with a 7-day healthy plant guarantee.">
<meta name="theme-color" content="#0C3A28">
<link rel="canonical" href="https://greenocean.co.in/">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8C%BF%3C/text%3E%3C/svg%3E">
<meta property="og:type" content="website"><meta property="og:site_name" content="Green Ocean">
<meta property="og:title" content="Green Ocean — Plants, Planters & Gifts">
<meta property="og:description" content="Nursery-fresh plants delivered across India. 7-day healthy plant guarantee.">
<meta property="og:url" content="https://greenocean.co.in/"><meta property="og:image" content="https://greenocean.co.in/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" as="image" href="HEROPATH" fetchpriority="high">
'''.replace('HEROPATH',paths['hero'])
live=live.replace('<title>Green Ocean — Plants, Planters & Gifts</title>','<title>Green Ocean — Plants, Planters & Gifts</title>\n'+meta,1)
open('/home/claude/repo2/public/index.html','w').write(live)
print('preview %d KB · live index %d KB · %d image files' % (len(single)//1024, len(live)//1024, len(paths)))
