"""Register redrawn arm sprites with separate shoulder and foreground glove depth."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
import json
from collections import deque

ROOT=Path(__file__).resolve().parents[1]
ATLAS=Image.open(ROOT/'artwork-traits/customizer-layer-sources/gestures-artist-v3-four-digits.png').convert('RGBA')
OUT=ROOT/'public/assets/artist-arms'
PALETTE={'blue':(30,83,226),'red':(220,35,43),'purple':(137,55,200),'yellow':(255,215,0),'orange':(245,124,20),'green':(58,166,57),'black':(26,28,32),'white':(242,243,248),'neon-blue':(0,157,255),'neon-red':(255,22,62),'neon-purple':(213,22,255),'neon-yellow':(238,255,0),'neon-orange':(255,80,0),'neon-green':(85,255,0)}
GESTURES=['chill','hype','fierce','glitch','focused','relaxed']
ANCHORS=[((174,242),(363,242),.55),((733,340),(807,340),.53),((1194,242),(1374,257),.55),((192,794),(326,794),.57),((678,742),(858,742),.34),((1165,812),(1364,812),.37)]
GLOVE_BOXES=[[(80,322,210,455),(320,322,450,455)],[(530,65,750,270),(790,65,1008,270)],[(1090,322,1238,455),(1360,125,1502,270)],[(25,660,205,850),(310,660,511,850)],[(553,590,722,765),(830,820,960,955)],[(0,0,0,0),(0,0,0,0)]]
def save(im,path):
    path.parent.mkdir(parents=True,exist_ok=True);im.save(path,lossless=True,method=0)

board=Image.new('RGBA',(1800,1350),'#171021');draw=ImageDraw.Draw(board)
for row,pose in enumerate(['tilt-left','tilt-right','straight']):
    base=Image.open(ROOT/f'public/assets/base-poses/{pose}.webp').convert('RGBA')
    visible=np.array(base)[:,:,3]>180
    barrel=np.array(Image.open(ROOT/f'public/assets/body-patterns/{pose}-mask.png'))[:,:,3]>100
    rows=np.where(barrel.sum(1)>80)[0];top,bottom=int(rows.min()),int(rows.max());length=bottom-top
    for col,name in enumerate(GESTURES):
        left,right,fraction=ANCHORS[col];y=round(top+length*fraction)
        xs=np.where(visible[y])[0];cx=(xs[0]+xs[-1])/2;width=xs[-1]-xs[0];scale=width/170
        full=Image.new('RGBA',base.size);glove_zone=Image.new('L',base.size);zone_draw=ImageDraw.Draw(glove_zone)
        for side,(ax,ay) in enumerate([left,right]):
            cellx=col%3*512;celly=col//3*512
            box=(cellx+side*256,celly,cellx+(side+1)*256,celly+512)
            part=ATLAS.crop(box).resize((round(256*scale),round(512*scale)),Image.Resampling.LANCZOS)
            # Shoulder endpoints are deliberately covered by the barrel silhouette.
            tx=cx+(-1 if side==0 else 1)*width*.40
            px=round(tx-(ax-box[0])*scale);py=round(y-(ay-box[1])*scale)
            limb=Image.new('RGBA',base.size);limb.alpha_composite(part,(px,py))
            limb_zone=Image.new('L',base.size)
            gx,gy,gr,gb=GLOVE_BOXES[col][side]
            ImageDraw.Draw(limb_zone).rectangle((round(px+(gx-box[0])*scale),round(py+(gy-box[1])*scale),round(px+(gr-box[0])*scale),round(py+(gb-box[1])*scale)),fill=255)
            if name=='hype':
                angle=12 if side==0 else -12
                limb=limb.rotate(angle,Image.Resampling.BICUBIC,center=(tx,y))
                limb_zone=limb_zone.rotate(angle,Image.Resampling.NEAREST,center=(tx,y))
            full.alpha_composite(limb)
            from PIL import ImageChops
            glove_zone=ImageChops.lighter(glove_zone,limb_zone)
        a=np.array(full);r,g,b=[a[:,:,i].astype(float) for i in range(3)]
        # Neutral white-glove pixels seed a depth mask; expansion includes sculpted
        # dark creases and the antialiased glove outlines without changing artwork.
        neutral=(a[:,:,3]>0)&(np.minimum(np.minimum(r,g),b)>65)&((np.maximum(np.maximum(r,g),b)-np.minimum(np.minimum(r,g),b))<65)
        # Keep substantial glove regions; reject isolated white lacquer highlights.
        clean=np.zeros_like(neutral);seen=np.zeros_like(neutral)
        for sy,sx in zip(*np.where(neutral)):
            if seen[sy,sx]:continue
            seen[sy,sx]=True;q=deque([(int(sy),int(sx))]);points=[]
            while q:
                py,px=q.popleft();points.append((py,px))
                for ny,nx in [(py-1,px),(py+1,px),(py,px-1),(py,px+1)]:
                    if 0<=ny<a.shape[0] and 0<=nx<a.shape[1] and neutral[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((ny,nx))
            if len(points)>500*scale*scale:
                yy,xx=zip(*points);clean[yy,xx]=True
        front_mask=np.array(Image.fromarray(np.uint8(clean)*255).filter(ImageFilter.MaxFilter(7)))>0
        front_mask &= np.array(glove_zone)>0
        if name=='relaxed':front_mask[:]=False # hands rest behind the head
        front=a.copy();front[:,:,3]=np.where(front_mask,a[:,:,3],0)
        front[front[:,:,3]==0,:3]=0
        save(Image.fromarray(front),OUT/f'{pose}/{name}-hands.webp')
        rear=a.copy();rear[:,:,3]=np.where(front_mask,0,a[:,:,3])
        gold=(rear[:,:,3]>0)&(r>80)&(g>45)&(b<r*.95)&(r>g*.9)
        light=np.clip(g/210,.35,1.16)
        for colour,rgb in PALETTE.items():
            tinted=rear.copy();paint=np.array(rgb)[None,None,:]*light[:,:,None]
            if colour=='black':paint+=np.maximum(g-210,0)[:,:,None]*.35
            tinted[gold,:3]=np.clip(paint[gold],0,255).astype('uint8');tinted[tinted[:,:,3]==0,:3]=0
            save(Image.fromarray(tinted),OUT/f'{pose}/{name}-{colour}.webp')
        rear_path=OUT/f'{pose}/{name}-yellow.webp'
        preview=Image.open(rear_path).convert('RGBA');preview.alpha_composite(base)
        for category,idx in [('eyes',[0,1,3,4,0,5][col]),('mouth',[1,0,2,1,5,1][col])]:
            preview.alpha_composite(Image.open(ROOT/f'public/assets/faces/male/{pose}/{category}/{idx}.webp').convert('RGBA'))
        preview.alpha_composite(Image.fromarray(front))
        preview.thumbnail((300,400));board.alpha_composite(preview,(col*300,row*450+30));draw.text((col*300+10,row*450+8),pose+' / '+name,fill='white')
board.convert('RGB').save(ROOT/'outputs/artist-arms-all-poses.jpg',quality=94)
(OUT/'manifest.json').write_text(json.dumps({'canvas':[1024,1536],'gestures':GESTURES,'colours':list(PALETTE),'depth':['rear arms','barrel and face','foreground gloves'],'note':'Relaxed hands remain behind the head.'},indent=2))
print('Registered 252 coloured rear-arm layers and 18 foreground glove layers.')
