import re
html = open('site/podcasts/index.html', encoding='utf-8').read()
m = re.search(r'<div class="md-content" data-md-component="content">(.*?)<footer', html, re.DOTALL)
if m:
    print(m.group(1)[:1500])
else:
    print("NOT FOUND")
