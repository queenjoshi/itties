"""Remove isolated lacquer glints missed by colour masks and stray glove streaks."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
# Work from the original yellow body so every colour uses the same repair mask.
for pose in ['tilt-left','tilt-right','straight']:
 path=ROOT/f'public/assets/base-poses/{pose}.webp'
 archive=ROOT/f'artwork-traits/layer-cleanup-originals/{pose}.webp';archive.parent.mkdir(parents=True,exist_ok=True)
 if not archive.exists():archive.write_bytes(path.read_bytes())
 source=np.array(Image.open(archive).convert('RGBA'))
 mask=Image.open(ROOT/f'public/assets/body-patterns/{pose}-mask.png').getchannel('A')
 filled=np.array(mask)>0
 for y in range(len(filled)):
  xs=np.where(filled[y])[0]
  if len(xs):filled[y,xs[0]:xs[-1]+1]=True
 r,g,b=[source[:,:,i].astype(float) for i in range(3)]
 glints=filled&(b>g*.35)&(g>150)&(source[:,:,3]>0)
 for file in [path,*ROOT.glob(f'public/assets/pencil-skins/{pose}-*.webp')]:
  a=np.array(Image.open(file).convert('RGBA'));original=a.copy()
  for y,x in zip(*np.where(glints)):
   lo=max(0,x-9);hi=min(1024,x+10);valid=filled[y,lo:hi]&~glints[y,lo:hi]
   if valid.any():a[y,x,:3]=np.median(original[y,lo:hi,:3][valid],axis=0)
  a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(file,lossless=True,method=0)
# The white barrel highlight is not a glove. Keep foreground gloves in their actual bounds.
boxes={'chill':[(350,700,545,960),(650,690,850,960)],'hype':[(0,240,410,650),(680,230,1024,650)],'fierce':[(350,700,550,960),(680,350,960,700)],'glitch':[(0,450,450,850),(690,450,1024,900)],'focused':[(250,300,465,700),(660,700,900,970)],'relaxed':[]}
root=ROOT/'public/assets/first-pose-expressions'
for key,rects in boxes.items():
 p=root/f'{key}-hands.webp';im=Image.open(p).convert('RGBA');zone=Image.new('L',im.size);d=ImageDraw.Draw(zone)
 for box in rects:d.rectangle(box,fill=255)
 a=np.array(im);a[:,:,3]=np.minimum(a[:,:,3],np.array(zone));a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(p,lossless=True)
# Hide residual source-barrel slivers; only shoulder rows may meet the lacquer.
body=np.array(Image.open(ROOT/'public/assets/base-poses/tilt-left.webp').convert('RGBA'))[:,:,3]>180
for p in root.glob('*-arms-*.webp'):
 a=np.array(Image.open(p).convert('RGBA'))
 for y in range(370,1050):
  if 610<=y<=745:continue
  xs=np.where(body[y])[0]
  if not len(xs):continue
  lo=max(0,xs[0]-18);hi=min(1024,xs[-1]+19)
  rgb=a[y,lo:hi,:3].astype(float);neutral=(rgb.max(1)-rgb.min(1)<65)&(rgb.min(1)>65)
  a[y,lo:hi,3]=np.where(neutral,a[y,lo:hi,3],0)
 a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(p,lossless=True)
board=Image.new('RGBA',(1800,480),'#171021');draw=ImageDraw.Draw(board)
for i,key in enumerate(boxes):
 im=Image.open(root/f'{key}-arms-blue.webp').convert('RGBA');im.alpha_composite(Image.open(ROOT/'public/assets/pencil-skins/tilt-left-blue.webp').convert('RGBA'))
 for c in ['eyes','mouth','hands']:im.alpha_composite(Image.open(root/f'{key}-{c}.webp').convert('RGBA'))
 if key=='glitch':im.crop((320,330,800,1000)).resize((720,1005)).save(ROOT/'outputs/layer-seams-after.png')
 im.thumbnail((280,430));board.alpha_composite(im,(i*300+10,30));draw.text((i*300+20,10),key.title(),fill='white')
board.save(ROOT/'outputs/clean-first-pose-expressions.png')
print('Cleaned barrel glints in all poses/colours and isolated all six foreground gloves.')
