"""Fit generated lacquer textures onto the unchanged pencil barrel pixels."""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import json,sys
root=Path(__file__).resolve().parents[1]
source=root/'artwork-traits/body-finishes';source.mkdir(parents=True,exist_ok=True)
if len(sys.argv)>1:
 import shutil
 shutil.copy2(sys.argv[1],source/'atlas.png')
sheet=Image.open(source/'atlas.png').convert('RGB')
ids=['classic-red','polka-dot-pink','sky-blue-striped','floral','stealth-matte-black','neon-acid']
for pose in ['tilt-left','tilt-right','straight']:
 base=Image.open(root/f'public/assets/base-poses/{pose}.webp').convert('RGBA');a=np.array(base);rgb=a[:,:,:3].astype(float);r,g,b=[rgb[:,:,i] for i in range(3)]
 yellow=(a[:,:,3]>30)&(r>150)&(g>95)&(b<g*.65)
 visible=a[:,:,3]>180
 rows=np.where((yellow.sum(1)>80)&(yellow.sum(1)/np.maximum(visible.sum(1),1)>.72))[0]
 run=max(np.split(rows,np.where(np.diff(rows)!=1)[0]+1),key=len);top=int(run[0]);yellow[:max(0,top-24)]=False
 yellow &= (b<r*.30)
 yellow[int(run[-1])+65:]=False
 from collections import deque
 sy=int(run[len(run)//2]);sx=int(np.where(yellow[sy])[0][len(np.where(yellow[sy])[0])//2]);connected=np.zeros_like(yellow);q=deque([(sy,sx)]);connected[sy,sx]=True
 while q:
  py,px=q.popleft()
  for ny,nx in [(py-1,px),(py+1,px),(py,px-1),(py,px+1)]:
   if 0<=ny<a.shape[0] and 0<=nx<a.shape[1] and yellow[ny,nx] and not connected[ny,nx]:connected[ny,nx]=True;q.append((ny,nx))
 yellow=connected
 yellow=np.array(Image.fromarray((yellow*255).astype("uint8")).filter(ImageFilter.MaxFilter(7)))>0
 yellow &= a[:,:,3]>0
 yy,xx=np.where(yellow);top=int(yy.min());bottom=int(yy.max())
 for i,key in enumerate(ids):
  tile=sheet.crop((round((i%3)*sheet.width/3),round((i//3)*sheet.height/2),round((i%3+1)*sheet.width/3),round((i//3+1)*sheet.height/2)))
  tile=tile.crop((8,8,tile.width-8,tile.height-8))
  tex=np.array(tile).astype(float);out=a.copy()
  widths=[np.count_nonzero(yellow[y]) for y in run]
  barrel_width=float(np.median(widths))
  solid={'classic-red':(238,22,28),'stealth-matte-black':(30,31,35),'neon-acid':(177,244,12)}
  for y in range(top,bottom+1):
   xs=np.where(yellow[y])[0]
   if not len(xs):continue
   left,right=int(xs.min()),int(xs.max());x=xs
   centre=(left+right)/2
   u=np.clip(.5+(x-centre)/barrel_width*.48,0,1);v=(y-top)/barrel_width*.48
   # One print across the barrel, four repeats along its length.
   tx=np.minimum((u*(tile.width-1)).astype(int),tile.width-1);ty=int(v*(tile.height-1))%(tile.height-1)
   colour=np.broadcast_to(solid[key],(len(x),3)) if key in solid else tex[ty,tx]
   shade=np.clip(g[y,x]/220,.45,1.15)
   if key=='stealth-matte-black':shade=.75+(shade-.75)*.5
   out[y,x,:3]=np.clip(colour*shade[:,None],0,255).astype('uint8');out[y,x,3]=a[y,x,3]
  layer=Image.fromarray(out);dest=root/f'public/assets/body-finishes/{pose}';dest.mkdir(parents=True,exist_ok=True);layer.save(dest/f'{key}.webp',lossless=True)
  png=source/pose;png.mkdir(exist_ok=True);layer.save(png/f'{key}.png')
print('Built 18 barrel-only finish layers.')
