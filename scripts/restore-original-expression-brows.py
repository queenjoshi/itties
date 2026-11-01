"""Restore source-art eyebrows at their original scale, position and colour."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
from collections import deque
ROOT=Path(__file__).resolve().parents[1]
# Reuse the exact registration transform; do not rebuild unrelated layers.
namespace={"__file__":str(ROOT/'scripts/build-first-pose-expressions.py')}
exec((ROOT/'scripts/build-first-pose-expressions.py').read_text().split("board=Image.new")[0],namespace)
warp=namespace['warp'];folder=ROOT/'public/assets/first-pose-expressions'
ids=namespace['SOURCES']
for key,file in ids.items():
 source=np.array(Image.open(ROOT/f'artwork-traits/one-by-one/{key}/{file}').convert('RGBA'))
 r,g,b=[source[:,:,i] for i in range(3)];Y,X=np.indices(r.shape)
 mask=(Y>300)&(Y<425)&(X>420)&(X<655)&(r<190)&(g<145)&(b<130)&(source[:,:,3]>225)
 seen=np.zeros_like(mask);components=[]
 for sy,sx in zip(*np.where(mask)):
  if seen[sy,sx]:continue
  q=deque([(sy,sx)]);seen[sy,sx]=1;points=[]
  while q:
   y,x=q.popleft();points.append((y,x))
   for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
    ny,nx=y+dy,x+dx
    if 0<=ny<1536 and 0<=nx<1024 and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
  yy,xx=zip(*points)
  if len(points)>150 and max(yy)<423 and max(xx)-min(xx)>25:components.append(points)
 components=sorted(components,key=len,reverse=True)[:2];assert len(components)==2,(key,len(components))
 p=folder/f'{key}-eyes.webp';im=Image.open(ROOT/f'artwork-traits/layer-cleanup-originals/{key}-eyes-before-visible-brows.webp').convert('RGBA')
 for points in components:
  yy,xx=zip(*points);seed=np.zeros(mask.shape,dtype='uint8');seed[yy,xx]=255
  matte=Image.fromarray(seed).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.5));a=source.copy();a[:,:,3]=np.minimum(a[:,:,3],np.array(matte));sprite=Image.fromarray(warp(a));box=sprite.getchannel('A').getbbox();assert box
  # Replace exactly the source brow footprint, including any old outline.
  x0,y0,x1,y1=box;im.paste((0,0,0,0),(x0-2,y0-2,x1+2,y1+2));im.alpha_composite(sprite)
 im.save(p,lossless=True)
board=Image.new('RGBA',(1800,490),'#171021');d=ImageDraw.Draw(board)
for i,key in enumerate(ids):
 for colour in ['yellow','blue']:
  im=Image.open(folder/f'{key}-arms-{colour}.webp').convert('RGBA');base=ROOT/'public/assets/base-poses/tilt-left.webp' if colour=='yellow' else ROOT/f'public/assets/pencil-skins/tilt-left-{colour}.webp';im.alpha_composite(Image.open(base).convert('RGBA'))
  for c in ['eyes','mouth','hands']:im.alpha_composite(Image.open(folder/f'{key}-{c}.webp').convert('RGBA'))
  if colour=='yellow':im.thumbnail((200,300));im.save(folder/f'{key}-thumb.webp',lossless=True)
  else:im.thumbnail((280,430));board.alpha_composite(im,(i*300+10,35));d.text((i*300+15,12),key.title(),fill='white')
board.save(ROOT/'outputs/original-eyebrows-restored.png');print('Restored all 12 eyebrows directly from source art, at original scale and colour.')
