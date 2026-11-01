"""Final cleanup of registered expression alpha masks, preserving facial placement."""
from pathlib import Path
from collections import deque
from PIL import Image,ImageFilter,ImageDraw
import numpy as np,json
ROOT=Path(__file__).resolve().parents[1];folder=ROOT/'public/assets/first-pose-expressions'
ids=['chill','hype','fierce','glitch','focused','relaxed'];removed=0
for key in ids:
 for category in ['eyes','mouth']:
  p=folder/f'{key}-{category}.webp';im=Image.open(p).convert('RGBA');a=np.array(im)
  mask=a[:,:,3]>3;seen=np.zeros_like(mask)
  for sy,sx in zip(*np.where(mask)):
   if seen[sy,sx]:continue
   q=deque([(sy,sx)]);seen[sy,sx]=1;points=[]
   while q:
    y,x=q.popleft();points.append((y,x))
    for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
     ny,nx=y+dy,x+dx
     if 0<=ny<1536 and 0<=nx<1024 and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
   if len(points)<24:
    yy,xx=zip(*points);a[yy,xx]=0;removed+=1
  # Remove isolated nearly invisible pixels and soften the surviving antialias edge.
  alpha=Image.fromarray(a[:,:,3]);soft=np.array(alpha.filter(ImageFilter.GaussianBlur(.35)))
  a[:,:,3]=np.minimum(a[:,:,3],soft);a[a[:,:,3]<3]=0
  assert im.size==(1024,1536) and a[:,:,3].any()
  Image.fromarray(a).save(p,lossless=True)
board=Image.new('RGBA',(1800,490),'#171021');draw=ImageDraw.Draw(board)
for i,key in enumerate(ids):
 def compose(colour):
  im=Image.open(folder/f'{key}-arms-{colour}.webp').convert('RGBA')
  base=ROOT/'public/assets/base-poses/tilt-left.webp' if colour=='yellow' else ROOT/f'public/assets/pencil-skins/tilt-left-{colour}.webp'
  im.alpha_composite(Image.open(base).convert('RGBA'))
  for c in ['eyes','mouth','hands']:im.alpha_composite(Image.open(folder/f'{key}-{c}.webp').convert('RGBA'))
  return im
 thumb=compose('yellow');thumb.thumbnail((200,300));thumb.save(folder/f'{key}-thumb.webp',lossless=True)
 preview=compose('blue');preview.thumbnail((280,430));board.alpha_composite(preview,(i*300+10,35));draw.text((i*300+15,12),key.title(),fill='white')
board.save(ROOT/'outputs/polished-expression-layers.png')
(folder/'manifest.json').write_text(json.dumps({'pose':'tilt-left','canvas':[1024,1536],'expressions':ids,'layers':['eyes (including eyebrows)','mouth','rear arms in selected colour','foreground gloves'],'blush':False,'version':3},indent=2))
print(f'Validated all 12 transparent face layers; removed {removed} stray components and refreshed six matching thumbnails.')
