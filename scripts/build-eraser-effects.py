from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,sys,shutil
r=Path(__file__).resolve().parents[1];art=r/'artwork-traits/eraser-effects';art.mkdir(parents=True,exist_ok=True)
for arg in sys.argv[1:]:
 key,p=arg.split('=',1);shutil.copy2(p,art/f'{key}.png')
sheet=Image.open(art/'eraser.png').convert('RGB');ids=['standard-pink','blackout','crimson-red','electric-blue','gold-metal-band','neon-purple']
for pose in ['tilt-left','tilt-right','straight']:
 base=Image.open(r/f'public/assets/base-poses/{pose}.webp').convert('RGBA');a=np.array(base);rr,gg,bb=[a[:,:,i].astype(float) for i in range(3)];vis=a[:,:,3]>100
 cap=vis&(rr>gg*1.12)&(bb>gg*.87)&(rr>bb*.95)&(rr>100);cap[600:]=False
 from collections import deque
 sy=int(np.where(cap)[0].min())+20;sx=int(np.median(np.where(cap[sy])[0]));connected=np.zeros_like(cap);connected[sy,sx]=True;q=deque([(sy,sx)])
 while q:
  py,px=q.popleft()
  for ny,nx in [(py-1,px),(py+1,px),(py,px-1),(py,px+1)]:
   if 0<=ny<cap.shape[0] and 0<=nx<cap.shape[1] and cap[ny,nx] and not connected[ny,nx]:connected[ny,nx]=True;q.append((ny,nx))
 cap=connected
 # Pose-specific cap/ferrule seam anchors, measured on the unchanged source render.
 seam={'straight':[(425,309),(510,296),(597,309)],'tilt-left':[(360,244),(460,191),(575,193)],'tilt-right':[(495,289),(575,307),(653,352)]}[pose]
 coefficients=np.polyfit([p[0] for p in seam],[p[1] for p in seam],2);Y,X=np.indices(cap.shape);boundary=np.polyval(coefficients,X)
 cap=(a[:,:,3]>0)&(Y<boundary)&(Y<600)
 ys,xs=np.where(cap);l,t,right,bottom=int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max());shade=np.clip((rr*.65+gg*.35)/205,.4,1.25)
 for i,key in enumerate(ids):
  tile=sheet.crop((round(i%3*sheet.width/3)+8,round(i//3*sheet.height/2)+8,round((i%3+1)*sheet.width/3)-8,round((i//3+1)*sheet.height/2)-8)).resize((right-l+1,bottom-t+1),Image.Resampling.LANCZOS);out=np.zeros_like(a)
  if key=='gold-metal-band':
   # This option is the original polished gold ferrule and standard pink eraser.
   out[t:bottom+1,l:right+1]=a[t:bottom+1,l:right+1];out[:,:,3]=np.where(cap,a[:,:,3],0)
  else:
   rgb=np.array(tile).astype(float)*shade[t:bottom+1,l:right+1,None];out[t:bottom+1,l:right+1,:3]=np.clip(rgb,0,255).astype('uint8');out[:,:,3]=np.where(cap,a[:,:,3],0)
  dest=r/f'public/assets/eraser-bands/{pose}';dest.mkdir(parents=True,exist_ok=True);Image.fromarray(out).save(dest/f'{key}.webp',lossless=True)
fx=Image.open(art/'fx.png').convert('RGBA');dest=r/'public/assets/motion-effects';dest.mkdir(exist_ok=True)
for i,key in enumerate(['particle-dust','gold-shimmer']):
 part=fx.crop((round(i*fx.width/2),0,round((i+1)*fx.width/2),fx.height));part.thumbnail((700,1000),Image.Resampling.LANCZOS);part.save(dest/f'{key}.webp',lossless=True)
print('Built 18 eraser options and 2 transparent effect textures.')

# Silver Glitter uses its own approved transparent artwork, not the old dust tile.
silver=art/'silver-glitter.png'
if silver.exists():
 Image.open(silver).convert('RGBA').save(dest/'silver-glitter.webp',lossless=True)
