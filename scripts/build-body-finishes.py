"""Fit generated lacquer textures onto the unchanged pencil barrel pixels."""
from pathlib import Path
from PIL import Image
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
 run=max(np.split(rows,np.where(np.diff(rows)!=1)[0]+1),key=len);top=int(run[0]);yellow[:top]=False
 yellow &= (b<r*.30)
 yellow[int(run[-1])+65:]=False
 yy,xx=np.where(yellow);bottom=int(yy.max())
 for i,key in enumerate(ids):
  tile=sheet.crop((round((i%3)*sheet.width/3),round((i//3)*sheet.height/2),round((i%3+1)*sheet.width/3),round((i//3+1)*sheet.height/2)))
  tex=np.array(tile).astype(float);out=np.zeros_like(a)
  for y in range(top,bottom+1):
   xs=np.where(yellow[y])[0]
   if not len(xs):continue
   left,right=int(xs.min()),int(xs.max());x=np.arange(left,right+1) if y<int(run[-1])-20 else xs
   u=(x-left)/max(1,right-left);v=(y-top)/max(1,bottom-top)
   # One print across the barrel, four repeats along its length.
   tx=np.minimum((u*(tile.width-1)).astype(int),tile.width-1);ty=int(v*4*(tile.height-1))%(tile.height-1)
   colour=tex[ty,tx];shade=np.clip(g[y,x]/220,.45,1.15)
   if key=='stealth-matte-black':shade=.75+(shade-.75)*.5
   out[y,x,:3]=np.clip(colour*shade[:,None],0,255).astype('uint8');out[y,x,3]=a[y,x,3]
  layer=Image.fromarray(out);dest=root/f'public/assets/body-finishes/{pose}';dest.mkdir(parents=True,exist_ok=True);layer.save(dest/f'{key}.webp',quality=94)
  png=source/pose;png.mkdir(exist_ok=True);layer.save(png/f'{key}.png')
print('Built 18 barrel-only finish layers.')
