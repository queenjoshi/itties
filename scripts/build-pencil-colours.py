"""Recolour the existing barrel and registered arms, preserving their geometry."""
from pathlib import Path
from collections import deque
from PIL import Image, ImageFilter
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
PALETTE={'blue':(30,83,226),'red':(220,35,43),'purple':(137,55,200),'yellow':(255,215,0),'orange':(245,124,20),'green':(58,166,57),'black':(26,28,32),'white':(242,243,248),'neon-blue':(0,157,255),'neon-red':(255,22,62),'neon-purple':(213,22,255),'neon-yellow':(238,255,0),'neon-orange':(255,80,0),'neon-green':(85,255,0)}

def recolour(image, mask, colour, channel):
    a=np.array(image);light=np.clip(channel/210,.35,1.16)
    rgb=np.array(colour)[None,None,:]*light[:,:,None]
    # Retain highlights even on dark lacquer, without changing the silhouette.
    if colour==PALETTE['black']:rgb+=np.maximum(channel-210,0)[:,:,None]*.35
    a[mask,:3]=np.clip(rgb[mask],0,255).astype('uint8')
    a[a[:,:,3]==0,:3]=0
    return Image.fromarray(a)

for pose in ['tilt-left','tilt-right','straight']:
    image=Image.open(ROOT/f'public/assets/base-poses/{pose}.webp').convert('RGBA');a=np.array(image);r,g,b=[a[:,:,i].astype(float) for i in range(3)]
    candidate=(a[:,:,3]>0)&(r>110)&(g>70)&(b<g*.65)&(b<r*.30)
    # Flood only the lacquer barrel: the eraser, band, wood and tip are immutable.
    ys,xs=np.where(candidate);y=int(np.median(ys));x=int(np.median(np.where(candidate[y])[0]))
    mask=np.zeros_like(candidate);mask[y,x]=True;q=deque([(y,x)])
    while q:
        py,px=q.popleft()
        for ny,nx in [(py-1,px),(py+1,px),(py,px-1),(py,px+1)]:
            if 0<=ny<a.shape[0] and 0<=nx<a.shape[1] and candidate[ny,nx] and not mask[ny,nx]:mask[ny,nx]=True;q.append((ny,nx))
    mask=(np.array(Image.fromarray(np.uint8(mask)*255).filter(ImageFilter.MaxFilter(5)))>0)&(a[:,:,3]>0)
    dest=ROOT/'public/assets/body-patterns';dest.mkdir(parents=True,exist_ok=True)
    mask_image=Image.new('RGBA',image.size,'white');mask_image.putalpha(Image.fromarray(np.where(mask,a[:,:,3],0).astype('uint8')));mask_image.save(dest/f'{pose}-mask.png')
    for key,colour in PALETTE.items():
        if key!='yellow':recolour(image,mask,colour,g).save(ROOT/f'public/assets/pencil-skins/{pose}-{key}.webp',lossless=True,method=0)
    for gesture in ['chill','hype','fierce','glitch','focused','relaxed']:
        source=ROOT/f'public/assets/fitted-traits/{pose}/gestures/{gesture}-yellow.webp'
        arm=Image.open(source).convert('RGBA');aa=np.array(arm);ar,ag,ab=[aa[:,:,j].astype(float) for j in range(3)]
        arm_mask=(aa[:,:,3]>0)&(ar>90)&(ag>55)&(ab<ag*.65)
        for key,colour in PALETTE.items():
            if key!='yellow':recolour(arm,arm_mask,colour,ag).save(source.with_name(f'{gesture}-{key}.webp'),lossless=True,method=0)
print('Built 14 pencil colours and matching gestures in all three poses; saved barrel masks.')
