"""Map generated cylindrical garments onto each unchanged pencil barrel curve."""
from pathlib import Path
from PIL import Image
import numpy as np
import sys,shutil
r=Path(__file__).resolve().parents[1];art=r/'artwork-traits/male-wearables';art.mkdir(parents=True,exist_ok=True)
if len(sys.argv)>1:shutil.copy2(sys.argv[1],art/'source.png')
sheet=Image.open(art/'source.png').convert('RGBA');ids=['puffer-coat','bomber-jacket','denim-vest','gold-joshi-medallion','dollar-chain']
for i,key in enumerate(ids):
 cw,ch=sheet.width/3,sheet.height/2;item=sheet.crop((round(i%3*cw),round(i//3*ch),round((i%3+1)*cw),round((i//3+1)*ch)))
 box=item.getchannel('A').point(lambda a:255 if a>30 else 0).getbbox();assert box;item=item.crop(box);item.save(art/f'{key}.png')
 for pose in ['tilt-left','tilt-right','straight']:
  base=Image.open(r/f'public/assets/base-poses/{pose}.webp').convert('RGBA');a=np.array(base);rr,gg,bb=[a[:,:,j].astype(float) for j in range(3)];mask=(a[:,:,3]>180)&(rr>150)&(gg>95)&(bb<gg*.65)
  vis=a[:,:,3]>180;rows=np.where((mask.sum(1)>80)&(mask.sum(1)/np.maximum(vis.sum(1),1)>.72))[0];run=max(np.split(rows,np.where(np.diff(rows)!=1)[0]+1),key=len);top,bottom=int(run[0]),int(run[-1]);h=bottom-top
  necklace=i>=3;start=round(top+h*(.23 if necklace else .30));end=round(top+h*(.61 if necklace else .89));height=end-start
  out=Image.new('RGBA',base.size)
  for y in range(start,end):
   xs=np.where(vis[y])[0];left,right=int(xs.min()),int(xs.max());centre=(left+right)/2;w=round((right-left)*(1.04 if necklace else 1.44));sy=min(item.height-1,round((y-start)/height*(item.height-1)))
   strip=item.crop((0,sy,item.width,sy+1)).resize((w,1),Image.Resampling.LANCZOS);out.alpha_composite(strip,(round(centre-w/2),y))
  dst=r/f'public/assets/male-wearables/{pose}';dst.mkdir(parents=True,exist_ok=True);out.save(dst/f'{key}.webp',lossless=True)
print('Built 15 fitted wearable layers.')
