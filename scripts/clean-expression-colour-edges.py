"""Remove baked yellow lacquer from outer facial edges, preserving iris colours."""
from pathlib import Path
from PIL import Image,ImageFilter,ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'public/assets/first-pose-expressions'
ids=['chill','hype','fierce','glitch','focused','relaxed']
for key in ids:
 for category in ['eyes','mouth']:
  p=out/f'{key}-{category}.webp';backup=ROOT/f'artwork-traits/layer-cleanup-originals/{key}-{category}-no-blush.webp'
  if not backup.exists():backup.write_bytes(p.read_bytes())
  a=np.array(Image.open(backup).convert('RGBA'));rgb=a[:,:,:3].astype(float);r,g,b=rgb.transpose(2,0,1)
  solid=Image.fromarray(np.uint8(a[:,:,3]>10)*255)
  interior=np.array(solid.filter(ImageFilter.MinFilter(11)))>0
  yellow=(r>120)&(g>65)&(r>g*.95)&(g>r*.40)&(b<g*.70)
  if category=="eyes":
   whites=(np.min(rgb,axis=2)>150)&(np.max(rgb,axis=2)-np.min(rgb,axis=2)<65)&(a[:,:,3]>200)
   protected=np.zeros_like(whites)
   wy,wx=np.where(whites)
   if len(wx):protected[max(0,wy.min()-12):wy.max()+13,max(0,wx.min()-20):wx.max()+21]=True
   yellow &= ~protected
  # Only the silhouette band is cleaned. Enclosed brown/hazel iris pixels remain intact.
  remove=yellow&~interior
  alpha=a[:,:,3].copy();alpha[remove]=0
  # Restrict antialias smoothing to the surviving outline, never expand onto the body.
  smooth=np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.45)))
  a[:,:,3]=np.minimum(alpha,smooth);a[a[:,:,3]==0,:3]=0
  Image.fromarray(a).save(p,lossless=True)
board=Image.new('RGBA',(1800,930),'#171021');draw=ImageDraw.Draw(board)
for row,colour in enumerate(['blue','purple']):
 for i,key in enumerate(ids):
  im=Image.open(out/f'{key}-arms-{colour}.webp').convert('RGBA');im.alpha_composite(Image.open(ROOT/f'public/assets/pencil-skins/tilt-left-{colour}.webp').convert('RGBA'))
  for c in ['eyes','mouth','hands']:im.alpha_composite(Image.open(out/f'{key}-{c}.webp').convert('RGBA'))
  if key=='glitch' and row==0:im.crop((400,350,700,640)).resize((900,870)).save(ROOT/'outputs/face-colour-edges-detail.png')
  im.thumbnail((280,420));board.alpha_composite(im,(300*i+10,row*465+30));draw.text((300*i+20,row*465+10),key.title()+' / '+colour,fill='white')
for key in ids:
 im=Image.open(out/f'{key}-arms-yellow.webp').convert('RGBA');im.alpha_composite(Image.open(ROOT/'public/assets/base-poses/tilt-left.webp').convert('RGBA'))
 for c in ['eyes','mouth','hands']:im.alpha_composite(Image.open(out/f'{key}-{c}.webp').convert('RGBA'))
 im.thumbnail((200,300));im.save(out/f'{key}-thumb.webp',lossless=True)
board.save(ROOT/'outputs/face-colour-edges-review.png');print('Cleaned 12 face layers and six thumbnails; preserved enclosed iris pixels.')
