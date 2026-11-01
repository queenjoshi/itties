from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,math
r=Path(__file__).resolve().parents[1]
eye=Image.open(r/'artwork-traits/drawn-eyes/male-female-eyes-reference-v2.png').convert('RGBA');mouth=Image.open(r/'artwork-traits/drawn-mouths/male-female-mouths-reference-v2.png').convert('RGBA')
labels=['Confident','Wide-Eyed','Shades','Wild Stare','Cyber Visor','Wink'];poses=['tilt-left','tilt-right','straight']
def component(sheet,i):
 w,h=sheet.width/3,sheet.height/4;im=sheet.crop((round(i%3*w),round(i//3*h),round((i%3+1)*w),round((i//3+1)*h)))
 if sheet is eye:
  xb=[(0,415),(415,790),(795,sheet.width)][i%3];yb=[(0,365),(365,675),(675,965),(965,sheet.height)][i//3];im=sheet.crop((xb[0],yb[0],xb[1],yb[1]))
 alpha=np.array(im.getchannel('A'));mass=(alpha>40).sum(1);ys=np.where(mass>2)[0];runs=np.split(ys,np.where(np.diff(ys)>1)[0]+1);run=max(runs,key=lambda rows:mass[rows].sum());im=im.crop((0,max(0,int(run[0])-2),im.width,min(im.height,int(run[-1])+3))) if sheet is mouth else im;box=im.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox();return im.crop(box)
for gender in ['male','female']:
 board=Image.new('RGBA',(1800,1500),'#171021');draw=ImageDraw.Draw(board)
 for row,pose in enumerate(poses):
  base=Image.open(r/f'public/assets/base-poses/{pose}.webp').convert('RGBA');a=np.array(base);rr,gg,bb=[a[:,:,j].astype(float) for j in range(3)];vis=a[:,:,3]>180;mask=vis&(rr>150)&(gg>95)&(bb<gg*.65);rows=np.where((mask.sum(1)>80)&(mask.sum(1)/np.maximum(vis.sum(1),1)>.72))[0];run=max(np.split(rows,np.where(np.diff(rows)!=1)[0]+1),key=len);top,bottom=int(run[0]),int(run[-1])
  def anchor(f):
   y=round(top+(bottom-top)*f)
   def centre(y):
    xs=np.where(vis[y])[0];return (xs[0]+xs[-1])/2,xs[-1]-xs[0]
   x,w=centre(y);angle=math.degrees(math.atan((centre(y+15)[0]-centre(y-15)[0])/30));return x,y,w,angle
  for col,label in enumerate(labels):
   view=base.copy();offset=6 if gender=='female' else 0
   # Pair eyewear with smiles; keep the six male mouth choices visible across the row.
   mi=([0,1,4,2,3,5][col] if gender=='male' else col)+offset
   for sheet,i,f,wscale,hscale in [(eye,col+offset,.20,.96,.82),(mouth,mi,.42 if gender=="male" else .34,.64 if gender=="male" else .68,.34 if gender=="male" else .50)]:
    x,y,w,angle=anchor(f);item=component(sheet,i);item.thumbnail((round(w*wscale),round(w*hscale)),Image.Resampling.LANCZOS);item=item.rotate(angle,Image.Resampling.BICUBIC,expand=True);layer=Image.new('RGBA',base.size);layer.alpha_composite(item,(round(x-item.width/2),round(y-item.height/2)));view.alpha_composite(layer)
    category='eyes' if sheet is eye else 'mouth';idx=i-offset;dest=r/f'public/assets/faces/{gender}/{pose}/{category}';dest.mkdir(parents=True,exist_ok=True);layer.save(dest/f'{idx}.webp',lossless=True)
    thumb=component(sheet,i);thumb.thumbnail((180,110),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(200,130));canvas.alpha_composite(thumb,((200-thumb.width)//2,(130-thumb.height)//2));td=r/f'public/assets/faces/{gender}/thumbs/{category}';td.mkdir(parents=True,exist_ok=True);canvas.save(td/f'{idx}.webp',lossless=True)
   view.thumbnail((300,450),Image.Resampling.LANCZOS);board.alpha_composite(view,(col*300,row*500+35));draw.text((col*300+10,row*500+10),f'{gender.title()} / {pose} / {label}',fill='#eaff3d')
 board.convert('RGB').save(r/f'outputs/{gender}-faces-three-poses.jpg',quality=95)
