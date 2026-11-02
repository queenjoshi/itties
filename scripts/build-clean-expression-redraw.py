"""Register directly drawn transparent facial sprites; no body-colour keying."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,math,json
from collections import deque
from PIL import ImageFilter
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'public/assets/clean-expressions';out.mkdir(exist_ok=True,parents=True)
atlas=Image.open(ROOT/'artwork-traits/clean-expression-redraw/faces-atlas.png').convert('RGBA');ids=['chill','hype','fierce','glitch','focused','relaxed'];poses=['tilt-left','tilt-right','straight'];cw,ch=atlas.width//3,atlas.height//2
sprites={}
for i,key in enumerate(ids):
 tile=atlas.crop((i%3*cw,i//3*ch,(i%3+1)*cw,(i//3+1)*ch))
 sprites[key]={}
 a=np.array(tile);solid=a[:,:,3]>12;seen=np.zeros_like(solid);masks={'eyes':np.zeros_like(solid),'mouth':np.zeros_like(solid)}
 for sy,sx in zip(*np.where(solid)):
  if seen[sy,sx]:continue
  q=deque([(sy,sx)]);seen[sy,sx]=1;points=[]
  while q:
   y,x=q.popleft();points.append((y,x))
   for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
    ny,nx=y+dy,x+dx
    if 0<=ny<ch and 0<=nx<cw and solid[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
  if len(points)<30:continue
  yy,xx=zip(*points);category='mouth' if (min(yy)+max(yy))/2>ch*.65 else 'eyes';masks[category][yy,xx]=True
 for category,mask in masks.items():
  keep=np.array(Image.fromarray(np.uint8(mask)*255).filter(ImageFilter.MaxFilter(3)))>0
  item=a.copy();item[:,:,3]=np.where(keep,a[:,:,3],0);item[item[:,:,3]==0,:3]=0;im=Image.fromarray(item);bbox=im.getchannel('A').getbbox();assert bbox,(key,category)
  sprites[key][category]=im.crop(bbox)
board=Image.new('RGBA',(1800,1440),'#171021');draw=ImageDraw.Draw(board)
for row,pose in enumerate(poses):
 base=Image.open(ROOT/f'public/assets/base-poses/{pose}.webp').convert('RGBA');barrel=np.array(Image.open(ROOT/f'public/assets/body-patterns/{pose}-mask.png').convert('RGBA'))[:,:,3]>100
 rows=np.where(barrel.sum(1)>80)[0];top,bottom=rows.min(),rows.max()
 def profile(y):
  xs=np.where(barrel[int(y)])[0];return (xs[0]+xs[-1])/2,xs[-1]-xs[0]
 def place(sprite,fraction,width_factor,height_factor):
  y=round(top+(bottom-top)*fraction);cx,width=profile(y);angle=math.degrees(math.atan((profile(y+12)[0]-profile(y-12)[0])/24))
  im=sprite.copy();im.thumbnail((round(width*width_factor),round(width*height_factor)),Image.Resampling.LANCZOS);im=im.rotate(angle,Image.Resampling.BICUBIC,expand=True)
  layer=Image.new('RGBA',base.size);layer.alpha_composite(im,(round(cx-im.width/2),round(y-im.height/2)));return layer
 for col,key in enumerate(ids):
  eyes=place(sprites[key]['eyes'],.15,.94,.78);mouth=place(sprites[key]['mouth'],.30,.58,.40)
  eb=eyes.getchannel('A').getbbox();mb=mouth.getchannel('A').getbbox();dy=max(0,eb[3]+12-mb[1])
  if dy:
   moved=Image.new('RGBA',base.size);moved.alpha_composite(mouth,(0,dy));mouth=moved
  dest=out/pose;dest.mkdir(exist_ok=True)
  for category,im in [('eyes',eyes),('mouth',mouth)]:im.save(dest/f'{key}-{category}.webp',lossless=True)
  thumb=eyes.copy();thumb.alpha_composite(mouth);thumb=thumb.crop(thumb.getchannel('A').getbbox());thumb.thumbnail((180,150));thumbdir=out/'thumbs';thumbdir.mkdir(exist_ok=True);thumb.save(thumbdir/f'{key}.webp',lossless=True)
  preview=base.copy();preview.alpha_composite(eyes);preview.alpha_composite(mouth);preview.thumbnail((280,420));board.alpha_composite(preview,(col*300+10,row*480+35));draw.text((col*300+15,row*480+12),pose+' / '+key,fill='white')
board.save(ROOT/'outputs/clean-redrawn-expressions-all-poses.png');(out/'manifest.json').write_text(json.dumps({'source':'Direct transparent facial art, no extracted yellow body','poses':poses,'expressions':ids,'canvas':[1024,1536]},indent=2));print('Built 36 new facial layers across three poses and six consistent thumbnails.')
