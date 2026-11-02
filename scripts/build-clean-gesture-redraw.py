"""Register isolated 3D limbs with concealed shoulders and foreground gloves."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np,json,math
ROOT=Path(__file__).resolve().parents[1];atlas=Image.open(ROOT/'artwork-traits/clean-gesture-redraw/arms-atlas.png').convert('RGBA');out=ROOT/'public/assets/clean-gestures'
PAL={'blue':(30,83,226),'red':(220,35,43),'purple':(137,55,200),'yellow':(255,215,0),'orange':(245,124,20),'green':(58,166,57),'black':(26,28,32),'white':(242,243,248),'neon-blue':(0,157,255),'neon-red':(255,22,62),'neon-purple':(213,22,255),'neon-yellow':(238,255,0),'neon-orange':(255,80,0),'neon-green':(85,255,0)}
IDS=['chill','hype','fierce','glitch','focused','relaxed'];POSES=['tilt-left','tilt-right','straight']
ANCHORS=[[(183,222),(330,222)],[(731,352),(802,352)],[(1207,220),(1351,220)],[(224,842),(286,842)],[(702,704),(836,704)],[(1200,843),(1350,843)]]
GLOVES=[[(75,325,225,470),(290,325,430,470)],[(510,45,720,280),(820,45,1024,280)],[(1080,325,1260,475),(1360,75,1534,245)],[(5,645,195,835),(315,645,510,835)],[(545,575,715,765),(785,815,950,965)],[(1140,625,1250,750),(1310,625,1420,750)]]
def save(im,path):path.parent.mkdir(parents=True,exist_ok=True);im.save(path,lossless=True,method=0)
board=Image.new('RGBA',(1800,1440),'#171021');d=ImageDraw.Draw(board)
for row,pose in enumerate(POSES):
 base=Image.open(ROOT/f'public/assets/base-poses/{pose}.webp').convert('RGBA');barrel=np.array(Image.open(ROOT/f'public/assets/body-patterns/{pose}-mask.png').convert('RGBA'))[:,:,3]>100
 rows=np.where(barrel.sum(1)>80)[0];top,bottom=rows.min(),rows.max();length=bottom-top
 y=round(top+length*.35);xs=np.where(barrel[y])[0];cx=(xs[0]+xs[-1])/2;width=xs[-1]-xs[0];scale=width/220
 for col,key in enumerate(IDS):
  rear=Image.new('RGBA',base.size);front=Image.new('RGBA',base.size)
  for side,(ax,ay) in enumerate(ANCHORS[col]):
   cellx=col%3*512;celly=col//3*512;box=(cellx+side*256,celly,cellx+(side+1)*256,celly+512)
   src=atlas.crop(box)
   if key=='focused' and side==0:
    # Extend only the vertical forearm, preserving glove proportions and shoulder height.
    original=np.array(src);yy,xx=np.indices(original.shape[:2]);gyy=yy+box[1];gxx=xx+box[0]
    rr,gg,bb=[original[:,:,j].astype(float) for j in range(3)]
    glove_pixels=(gxx>545)&(gxx<715)&(gyy>575)&(gyy<765)&(bb>gg*.68)&(rr<bb*1.4)
    shift=(glove_pixels|((gxx<640)&(gyy<760)))&(original[:,:,3]>0)
    moved=original.copy();moved[shift]=0
    sy,sx=np.where(shift);valid=sy>=70;moved[sy[valid]-70,sx[valid]]=original[sy[valid],sx[valid]]
    line=original[760-box[1]]
    for fill_y in range(690-box[1],760-box[1]):
     for fill_x in range(max(0,545-box[0]),min(256,640-box[0])):
      if line[fill_x,3]>0:moved[fill_y,fill_x]=line[fill_x]
    src=Image.fromarray(moved)
   a=np.array(src);r,g,b=[a[:,:,i].astype(float) for i in range(3)];gx,gy,gr,gb=GLOVES[col][side]
   if key=='focused' and side==0:gy-=70;gb-=70
   zone=np.zeros(a.shape[:2],dtype=bool);zone[max(0,gy-box[1]):min(512,gb-box[1]),max(0,gx-box[0]):min(256,gr-box[0])]=1
   white=zone&(a[:,:,3]>5)&(b>g*.68)&(r<b*1.4)&(np.minimum(np.minimum(r,g),b)>35)
   # Extend only into existing glove pixels to retain soft gray sculpting and cuff edges.
   white=np.array(Image.fromarray(np.uint8(white)*255).filter(ImageFilter.MaxFilter(3)))>0;white &= zone
   fg=a.copy();fg[:,:,3]=np.where(white,a[:,:,3],0);fg[(r>g*.9)&(b<g*.80),3]=0;fg[fg[:,:,3]==0,:3]=0
   size=(round(src.width*scale),round(src.height*scale));part=src.resize(size,Image.Resampling.LANCZOS);hand=Image.fromarray(fg).resize(size,Image.Resampling.LANCZOS)
   tx=cx+(-1 if side==0 else 1)*width*.44;ty=y
   px=round(tx-(ax-box[0])*scale);py=round(ty-(ay-box[1])*scale)
   limb=Image.new('RGBA',base.size);limb.alpha_composite(part,(px,py));glove=Image.new('RGBA',base.size);glove.alpha_composite(hand,(px,py))
   if pose=='tilt-right':
    # Follow the barrel's local axis, including the differing shoulder heights.
    sample_y=np.arange(y-20,y+21);centres=[]
    for sy in sample_y:
     edge=np.where(barrel[sy])[0];centres.append((edge[0]+edge[-1])/2)
    angle=math.degrees(math.atan(np.polyfit(sample_y,np.array(centres),1)[0]))
    limb=limb.rotate(angle,Image.Resampling.BICUBIC,center=(cx,y))
    glove=glove.rotate(angle,Image.Resampling.BICUBIC,center=(cx,y))
   rear.alpha_composite(limb)
   if key!='relaxed':front.alpha_composite(glove)
  save(front,out/pose/f'{key}-hands.webp')
  a=np.array(rear);r,g,b=[a[:,:,i].astype(float) for i in range(3)]
  # The atlas has no torso pixels: only yellow lacquer is tinted, gloves remain white.
  paint=(a[:,:,3]>0)&(r>g*.9)&(b<g*.80)&(g>35);light=np.clip(g/210,.28,1.18)
  for colour,rgb in PAL.items():
   result=a.copy()
   if colour!='yellow':
    pigment=np.array(rgb)[None,None,:]*light[:,:,None];spec=np.clip((b-90)/165,0,1)*.45;pigment=pigment*(1-spec[:,:,None])+255*spec[:,:,None]
    if colour=='black':pigment+=np.maximum(g-210,0)[:,:,None]*.25
    result[paint,:3]=np.clip(pigment[paint],0,255)
   result[result[:,:,3]==0,:3]=0;save(Image.fromarray(result),out/pose/f'{key}-{colour}.webp')
  if pose=='straight':
   thumb=rear.copy();thumb.alpha_composite(front);thumb=thumb.crop(thumb.getchannel('A').getbbox());thumb.thumbnail((180,140));save(thumb,out/'thumbs'/f'{key}.webp')
  preview=Image.open(out/pose/f'{key}-yellow.webp').convert('RGBA');preview.alpha_composite(base)
  for category in ['eyes','mouth']:preview.alpha_composite(Image.open(ROOT/f'public/assets/clean-expressions/{pose}/{key}-{category}.webp').convert('RGBA'))
  preview.alpha_composite(front);preview.thumbnail((280,420));board.alpha_composite(preview,(col*300+10,row*480+35));d.text((col*300+15,row*480+12),pose+' / '+key,fill='white')
board.save(ROOT/'outputs/new-gestures-all-poses.png');(out/'manifest.json').write_text(json.dumps({'poses':POSES,'gestures':IDS,'colours':list(PAL),'canvas':[1024,1536],'depth':['rear arms','body','foreground gloves'],'digits':'three fingers and one thumb'},indent=2));print('Built 252 colour-matched arm layers and 18 foreground glove layers.')
