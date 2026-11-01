"""Extract the reviewed one-by-one artwork into registered Tilt Left layers."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
from collections import deque
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/first-pose-expressions'
SOURCES={'chill':'chill-approved.png','hype':'hype-v3.png','fierce':'fierce-v1.png','glitch':'glitch-v1.png','focused':'focused-v1.png','relaxed':'relaxed-v1.png'}
PALETTE={'blue':(30,83,226),'red':(220,35,43),'purple':(137,55,200),'yellow':(255,215,0),'orange':(245,124,20),'green':(58,166,57),'black':(26,28,32),'white':(242,243,248),'neon-blue':(0,157,255),'neon-red':(255,22,62),'neon-purple':(213,22,255),'neon-yellow':(238,255,0),'neon-orange':(255,80,0),'neon-green':(85,255,0)}
base=Image.open(ROOT/'public/assets/base-poses/tilt-left.webp').convert('RGBA')
ba=np.array(base)[:,:,3]>180
# Source lacquer boundaries, traced independently of projecting hands and arms.
ys=[290,350,450,550,650,750,850,950,1050,1150,1200]
ls=[405,419,438,452,463,467,464,454,438,414,410]
rs=[630,650,674,693,709,718,717,708,687,657,635]
Y,X=np.indices((1536,1024));left=np.interp(Y[:,0],ys,ls)[:,None];right=np.interp(Y[:,0],ys,rs)[:,None]

def save(a,name):
 OUT.mkdir(parents=True,exist_ok=True);Image.fromarray(a).save(OUT/name,lossless=True)
def clean_components(mask, min_area=80):
 seen=np.zeros_like(mask);keep=np.zeros_like(mask)
 for sy,sx in zip(*np.where(mask)):
  if seen[sy,sx]:continue
  q=deque([(sy,sx)]);seen[sy,sx]=1;pts=[]
  while q:
   yy,xx=q.popleft();pts.append((yy,xx))
   for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
    ny,nx=yy+dy,xx+dx
    if 0<=ny<1536 and 0<=nx<1024 and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
  yy,xx=zip(*pts)
  if len(pts)>=min_area and max(xx)-min(xx)>12:keep[yy,xx]=1
 return keep

def filled_mask(mask):
 # Fill enclosed iris/eye holes without expanding the outside silhouette.
 image=Image.fromarray(np.uint8(mask)*255)
 from PIL import ImageDraw
 flooded=image.copy();ImageDraw.floodfill(flooded,(0,0),128,thresh=0)
 return mask | (np.array(flooded)==0)

def warp(a):
 out=np.zeros_like(a)
 for sy in range(200,1100):
  ty=round(350+(sy-290)*(840/910))
  if not 0<=ty<1536:continue
  refy=max(370,min(1100,ty));xx=np.where(ba[refy])[0]
  if not len(xx):continue
  cx=(xx[0]+xx[-1])/2;scale=(xx[-1]-xx[0])/(float(right[sy,0]-left[sy,0]));sc=(float(left[sy,0]+right[sy,0]))/2
  row=Image.fromarray(a[sy:sy+1]).resize((max(1,round(1024*scale)),1),Image.Resampling.BICUBIC)
  ox=round(cx-sc*scale);ar=np.array(row)[0];start=max(0,ox);end=min(1024,ox+len(ar))
  if end>start:out[ty,start:end]=ar[start-ox:end-ox]
 # Fill rounding gaps without expanding silhouettes horizontally.
 for yy in range(351,1096):
  if not out[yy,:,3].any() and out[yy-1,:,3].any() and out[yy+1,:,3].any():out[yy]=out[yy-1]
 out[out[:,:,3]==0,:3]=0
 return out
board=Image.new('RGBA',(1800,480),'#171021')
for n,(key,file) in enumerate(SOURCES.items()):
 a=np.array(Image.open(ROOT/f'artwork-traits/one-by-one/{key}/{file}').convert('RGBA'))
 r,g,b=[a[:,:,i].astype(float) for i in range(3)]
 # Alpha matte excludes the source's low-opacity halo; source RGB is preserved.
 alpha=np.clip((a[:,:,3].astype(float)-225)/28,0,1)*255
 outside=((X<left+3)|(X>right-3))&(Y>260)&(Y<1000)&~((Y<350)&(X>340)&(X<710))
 neutral=(b>g*.72)&(r< b*1.35)&(r>80)
 # White gloves may overlap the lacquer, unlike rear arms.
 glove=neutral&(Y>260)&(Y<920)&~((Y<350)&(X>340)&(X<710))&((X<left+70)|(X>right-70))
 # Focused pointing hand sits beside the eyebrow; exclude face region.
 if key=='focused':glove &= ~((X>452)&(X<680)&(Y<590))
 arm=a.copy();arm[:,:,3]=np.uint8(alpha*outside)
 glove=clean_components(glove&(alpha>20),200)
 hands=a.copy();hands[:,:,3]=np.uint8(alpha*glove)
 arm[glove,3]=0
 arm[(Y<400)&(r>g*.9)&(b<g*.8),3]=0
 if key=='relaxed':arm[:,:,3]=np.uint8(alpha*outside);hands[:,:,3]=0
 for cat,y0,y1 in [('eyes',315,615),('mouth',315,615)]:
  # Segment the complete face before classifying components; never slice an eye.
  bounds=(X>left+12)&(X<right-12)&(Y>y0)&(Y<y1)
  chroma=((b>g*.40)|(g<r*.65))&bounds&(alpha>0)
  # Reject lacquer highlight components that touch the side of the face crop.
  seen=np.zeros_like(chroma);keep=np.zeros_like(chroma)
  for sy,sx in zip(*np.where(chroma)):
   if seen[sy,sx]:continue
   q=deque([(sy,sx)]);seen[sy,sx]=1;pts=[]
   while q:
    yy,xx=q.popleft();pts.append((yy,xx))
    for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
     ny,nx=yy+dy,xx+dx
     if 0<=ny<1536 and 0<=nx<1024 and chroma[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
   if len(pts)>35:
    yy,xx=zip(*pts)
    if min(yy)>y0+1 and max(yy)<y1-1 and max(xx)-min(xx)>12:
     kind='mouth' if (min(yy)+max(yy))/2 > 505 else 'eyes'
     if kind==cat:keep[yy,xx]=1
  keep=filled_mask(keep)
  matte=np.array(Image.fromarray(np.uint8(keep)*255).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.65)))/255
  layer=a.copy();layer[:,:,3]=np.uint8(alpha*matte);save(warp(layer),f'{key}-{cat}.webp')
 save(warp(hands),f'{key}-hands.webp')
 for colour,rgb in PALETTE.items():
  tinted=arm.copy()
  if colour!='yellow':
   paint=(r>80)&(g>40)&(b<g*.80)
   light=np.clip(g/210,.25,1.18);p=np.array(rgb)[None,None,:]*light[:,:,None]
   if colour=='black':p+=np.maximum(g-200,0)[:,:,None]*.40
   tinted[paint,:3]=np.clip(p[paint],0,255)
  save(warp(tinted),f'{key}-arms-{colour}.webp')
 preview=Image.open(OUT/f'{key}-arms-yellow.webp').convert('RGBA');preview.alpha_composite(base)
 for c in ['eyes','mouth','hands']:preview.alpha_composite(Image.open(OUT/f'{key}-{c}.webp').convert('RGBA'))
 thumb=preview.copy();thumb.thumbnail((280,430));board.alpha_composite(thumb,(n*300+10,30))
 ImageDraw.Draw(board).text((n*300+20,10),key.title(),fill='white')
 preview.thumbnail((200,300));preview.save(OUT/f'{key}-thumb.webp',lossless=True)
ROOT.joinpath('outputs').mkdir(exist_ok=True);board.save(ROOT/'outputs/first-pose-expressions-review.png')
print('Built six Tilt Left expressions, separate faces/gloves and 84 coloured arm layers.')
