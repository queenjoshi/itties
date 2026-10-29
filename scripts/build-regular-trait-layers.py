"""Place generated transparent trait components on the existing 3 pencil canvases.
This is asset-layout integration: crop, scale, rotate and position generated pixels.
Usage: bundled-python scripts/build-regular-trait-layers.py category=/path/sheet.png ...
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json, math, shutil, sys, zipfile
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artwork-traits/regular';PUBLIC=ROOT/'public/assets/regular-traits'
CAT={
 'expressions':[('chill','Chill'),('hype','Hype'),('fierce','Fierce'),('glitch','Glitch'),('focused','Focused'),('relaxed','Relaxed')],
 'mouths':[('grin','Grin'),('smirk','Smirk'),('feral-snarl','Feral Snarl'),('bubble-gum','Bubble Gum'),('gold-grill','Gold Grill'),('neutral','Neutral')],
 'hair':[('obsidian-black','Obsidian Black'),('cyber-blue','Cyber Blue'),('acid-purple','Acid Purple'),('platinum-silver','Platinum Silver'),('sunset-pink','Sunset Pink')],
 'lips':[('glossy-crimson','Glossy Crimson'),('electric-magenta','Electric Magenta'),('dark-velvet-plum','Dark Velvet Plum'),('neon-cyan','Neon Cyan'),('matte-nude','Matte Nude')],
 'accessories':[('designer-sunglasses','Designer Sunglasses'),('semi-hot-bag','Semi-Hot Branded Bag')]
}
POSES=['straight','tilt-left','tilt-right']
(ART/'source-sheets').mkdir(parents=True,exist_ok=True)
for arg in sys.argv[1:]:
 category,filename=arg.split('=',1);assert category in CAT
 shutil.copy2(filename,ART/'source-sheets'/f'{category}.png')
missing=[c for c in CAT if not (ART/'source-sheets'/f'{c}.png').exists()]
if missing: print('Waiting for generated sheets:',missing);sys.exit(0)
components={}
for category,options in CAT.items():
 sheet=Image.open(ART/'source-sheets'/f'{category}.png').convert('RGBA');cols,rows=(2,1) if category=='accessories' else (3,2)
 for i,(key,name) in enumerate(options):
  x,y=i%cols,i//cols;cw,ch=sheet.width/cols,sheet.height/rows
  if category=='accessories':
   split=round(sheet.width*.60);item=sheet.crop((0,0,split,sheet.height) if i==0 else (split,0,sheet.width,sheet.height))
  else:item=sheet.crop((round(x*cw),round(y*ch),round((x+1)*cw),round((y+1)*ch)))
  box=item.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
  assert box,f'Empty component {category}/{key}'
  item=item.crop((max(0,box[0]-8),max(0,box[1]-8),min(item.width,box[2]+8),min(item.height,box[3]+8)))
  components[category,key]=item
  (ART/'components'/category).mkdir(parents=True,exist_ok=True);item.save(ART/'components'/category/f'{key}.png')
  (PUBLIC/'components'/category).mkdir(parents=True,exist_ok=True)
  thumb=Image.new('RGBA',(360,360));small=item.copy();small.thumbnail((330,330),Image.Resampling.LANCZOS);thumb.alpha_composite(small,((360-small.width)//2,(360-small.height)//2));thumb.save(PUBLIC/'components'/category/f'{key}.webp',quality=93)

def calibration(base,pose):
 a=np.array(base);visible=a[:,:,3]>180;r,g,b=[a[:,:,i].astype(float) for i in range(3)];yellow=visible&(r>170)&(g>120)&(b<100)&(b<g*.6)
 rows=np.where((yellow.sum(1)>80)&(yellow.sum(1)/np.maximum(1,visible.sum(1))>.72))[0]
 runs=np.split(rows,np.where(np.diff(rows)!=1)[0]+1);run=max(runs,key=len);top,bottom=int(run[0]),int(run[-1]);height=bottom-top
 def span(y):
  y=max(top,min(bottom,round(y)));xs=np.where(visible[y])[0];return int(xs[0]),int(xs[-1])
 def anchor(f):
  y=top+height*f;l,r=span(y);l0,r0=span(y-15);l1,r1=span(y+15);angle=math.degrees(math.atan((((l1+r1)-(l0+r0))/2)/30));return (l+r)/2,y,r-l,angle
 eye=anchor(.16);mouth=anchor(.29)
 pink=visible&(r>g*1.15)&(r>b*1.05)&(g>60)&(b>50);pink[top-20:]=False
 ys,xs=np.where(pink);cap=(int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max()))
 bag_y=top+.60*height;l,right=span(bag_y);bag_w=(right-l)*.85
 arm_path=ROOT/f'public/assets/arm-traits/{pose}-wave-yellow.webp'
 aa=np.array(Image.open(arm_path).convert('RGBA'));neutral=(aa[:,:,:3].max(2).astype(int)-aa[:,:,:3].min(2).astype(int)<65)&(aa[:,:,:3].min(2)>130)&(aa[:,:,3]>150)
 yy,xx=np.indices(neutral.shape);neutral &= (yy>top+.4*height)&(xx>eye[0]);hy,hx=np.where(neutral)
 bag=(float((hx.min()+hx.max())/2),float(hy.min()+(hy.max()-hy.min())*.35),bag_w,0) if len(hx) else (right+bag_w*.35,bag_y,bag_w,0)
 return {'barrel':[top,bottom],'eyes':eye,'mouth':mouth,'cap':cap,'bag':bag}

def placed(item,max_width,max_height,cx,cy,angle=0,top_aligned=False):
 out=Image.new('RGBA',(1024,1536));part=item.copy();part.thumbnail((max(1,round(max_width)),max(1,round(max_height))),Image.Resampling.LANCZOS)
 if abs(angle)>.2:part=part.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
 x=round(cx-part.width/2);y=round(cy if top_aligned else cy-part.height/2);out.alpha_composite(part,(x,y));return out

manifest={'collection':'Itty Bitty','canvas':{'width':1024,'height':1536},'poses':POSES,'categories':{},'calibration':{},'notes':['Expressions contain eyes and brows only; add a mouth independently.','A lip-colour mouth replaces the selected plain mouth; do not draw both.','Hair, eyewear and bag are optional generated components.','These files are visual trait layers, not deployed NFT unlocks.']}
for category,options in CAT.items():manifest['categories'][category]=[{'id':key,'name':name,'component':f'components/{category}/{key}.webp'} for key,name in options]
reviews=[]
for pose in POSES:
 base=Image.open(ROOT/f'public/assets/base-poses/{pose}.webp').convert('RGBA');cal=calibration(base,pose);manifest['calibration'][pose]=cal
 for category,options in CAT.items():
  for key,name in options:
   item=components[category,key];ex,ey,ew,angle=cal['eyes'];mx,my,mw,ma=cal['mouth']
   if category=='expressions':layer=placed(item,ew*.84,ew*.62,ex,ey,angle)
   elif category in ['mouths','lips']:layer=placed(item,mw*.58,mw*.48,mx,my,ma)
   elif category=='hair':
    l,t,r,b=cal['cap'];layer=placed(item,(r-l)*1.30,(b-t)*1.7,(l+r)/2,t+(b-t)*.55,angle)
   elif key=='designer-sunglasses':layer=placed(item,ew*1.08,ew*.55,ex,ey+3,angle)
   else:
    x,y,w,angle=cal['bag'];layer=placed(item,w,w*1.4,x,y,0,True)
   target=PUBLIC/pose/category;target.mkdir(parents=True,exist_ok=True);layer.save(target/f'{key}.webp',quality=95,method=4)
   full=ART/'aligned'/pose/category;full.mkdir(parents=True,exist_ok=True);layer.save(full/f'{key}.png')
 # Six mixed previews on each pose, using exact generated layers and untouched base.
 review=Image.new('RGBA',(1200,660),'#171021');d=ImageDraw.Draw(review)
 for i,(key,name) in enumerate(CAT['expressions']):
  view=base.copy()
  for category,value in [('expressions',key),('mouths',['smirk','grin','feral-snarl','grin','neutral','smirk'][i])]:view.alpha_composite(Image.open(PUBLIC/pose/category/f'{value}.webp').convert('RGBA'))
  view.thumbnail((200,600),Image.Resampling.LANCZOS);review.alpha_composite(view,(i*200,35));d.text((i*200+16,18),name,fill='white')
 review.convert('RGB').save(ROOT/f'outputs/regular-traits-{pose}-expressions.jpg',quality=92)
# All category options on the straight base, one category per row.
board=Image.new('RGBA',(1440,2200),'#171021');d=ImageDraw.Draw(board)
for row,(category,options) in enumerate(CAT.items()):
 for col,(key,name) in enumerate(options):
  base=Image.open(ROOT/'public/assets/base-poses/straight.webp').convert('RGBA')
  if category!='expressions':base.alpha_composite(Image.open(PUBLIC/'straight/expressions/chill.webp').convert('RGBA'))
  if category not in ['mouths','lips']:base.alpha_composite(Image.open(PUBLIC/'straight/mouths/smirk.webp').convert('RGBA'))
  base.alpha_composite(Image.open(PUBLIC/'straight'/category/f'{key}.webp').convert('RGBA'))
  if key=='semi-hot-bag':base.alpha_composite(Image.open(ROOT/'public/assets/arm-traits/straight-wave-yellow.webp').convert('RGBA'))
  base.thumbnail((235,390),Image.Resampling.LANCZOS);board.alpha_composite(base,(col*240,row*440+35));d.text((col*240+8,row*440+12),f'{category}: {name}',fill='white')
board.convert('RGB').save(ROOT/'outputs/regular-traits-all-options.jpg',quality=92)
(ART/'manifest.json').write_text(json.dumps(manifest,indent=2));(PUBLIC/'manifest.json').write_text(json.dumps(manifest,indent=2))
with zipfile.ZipFile(ROOT/'outputs/itty-bitty-regular-trait-layers.zip','w',zipfile.ZIP_DEFLATED) as z:
 for file in (ART/'aligned').rglob('*.png'):z.write(file,str(file.relative_to(ART)))
 z.writestr('manifest.json',json.dumps(manifest,indent=2))
 for pose in POSES:z.write(ROOT/f'public/assets/base-poses/{pose}.webp',f'bases/{pose}.webp')
print(f'Created {len(components)} separate components and {len(components)*len(POSES)} aligned transparent layers.')
