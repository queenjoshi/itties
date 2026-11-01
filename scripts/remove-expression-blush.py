"""Remove isolated warm cheek components without changing eyes or mouth artwork."""
from pathlib import Path
from collections import deque
from PIL import Image,ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1];folder=ROOT/'public/assets/first-pose-expressions'
ids=['chill','hype','fierce','glitch','focused','relaxed'];removed=0
for key in ids:
 for category in ['eyes','mouth']:
  p=folder/f'{key}-{category}.webp';a=np.array(Image.open(p).convert('RGBA'));solid=a[:,:,3]>2;seen=np.zeros_like(solid)
  for sy,sx in zip(*np.where(solid)):
   if seen[sy,sx]:continue
   q=deque([(sy,sx)]);seen[sy,sx]=1;points=[]
   while q:
    y,x=q.popleft();points.append((y,x))
    for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
     ny,nx=y+dy,x+dx
     if 0<=ny<a.shape[0] and 0<=nx<a.shape[1] and solid[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
   yy,xx=zip(*points);rgb=a[yy,xx,:3].astype(float);weights=a[yy,xx,3].astype(float);mean=np.average(rgb,axis=0,weights=weights)
   if mean[0]>170 and mean[1]>65 and mean[0]>mean[1]*1.3:
    # Cheeks are isolated warm patches. Brows are dark and eyes/teeth neutral.
    mask=Image.new('L',(a.shape[1],a.shape[0]));arr=np.array(mask);arr[yy,xx]=255
    from PIL import ImageFilter
    expanded=np.array(Image.fromarray(arr).filter(ImageFilter.MaxFilter(5)))>0
    a[expanded]=0;removed+=1
  a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(p,lossless=True)
board=Image.new('RGBA',(1800,480),'#171021');draw=ImageDraw.Draw(board)
for i,key in enumerate(ids):
 im=Image.open(folder/f'{key}-arms-yellow.webp').convert('RGBA');im.alpha_composite(Image.open(ROOT/'public/assets/base-poses/tilt-left.webp').convert('RGBA'))
 for category in ['eyes','mouth','hands']:im.alpha_composite(Image.open(folder/f'{key}-{category}.webp').convert('RGBA'))
 thumb=im.copy();thumb.thumbnail((200,300));thumb.save(folder/f'{key}-thumb.webp',lossless=True)
 im.thumbnail((280,430));board.alpha_composite(im,(300*i+10,30));draw.text((300*i+20,10),key.title(),fill='white')
board.save(ROOT/'outputs/first-pose-no-blush.png');print(f'Removed {removed} cheek components; refreshed six thumbnails.')
