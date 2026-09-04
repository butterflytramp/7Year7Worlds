import os

src = os.path.expanduser("~/Documents/Claude/Projects/7 Years 7 Worlds/iceage-world/index.html")
dst = os.path.expanduser("~/Documents/GitHub/7Year7Worlds/iceage/index.html")

with open(src, 'r') as f:
    content = f.read()

video = '''
<!-- VIDEO -->
<div class="iceworld-video" style="width: 100%; background: #000; padding: 40px 20px; display: flex; justify-content: center;">
  <video style="max-width: 100%; height: auto;" autoplay muted loop playsinline>
    <source src="./iceworldloop.mp4" type="video/mp4">
  </video>
</div>
'''

content = content.replace('</main>', video + '\n</main>')

with open(dst, 'w') as f:
    f.write(content)

print("✓ Done - iceage file ready with video")
