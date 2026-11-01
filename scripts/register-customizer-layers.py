"""Register generated transparent sprites against each existing barrel's geometry."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import math, json, sys

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'artwork-traits/customizer-layer-sources'
OUT=ROOT/'public/assets/fitted-traits'
POSES=['tilt-left','tilt-right','straight']
GESTURES=['chill','hype','fierce','glitch','focused','relaxed']
COLOURS={'yellow':(255,215,0),'shiba-orange':(255,120,0),'pepe-green':(44,192,18),'black':(30,31,35),'red':(238,22,28),'blue':(10,66,238),'pink':(246,120,173),'lavender':(196,155,238),'classic-red':(238,22,28),'polka-dot-pink':(246,120,173),'sky-blue-striped':(22,187,220),'floral':(247,237,206),'stealth-matte-black':(30,31,35),'neon-acid':(177,244,12)}

def save(im,path):
    path.parent.mkdir(parents=True,exist_ok=True)
    im.save(path,lossless=True)

def geometry(pose):
    base=Image.open(ROOT/f'public/assets/base-poses/{pose}.webp').convert('RGBA')
    a=np.array(base);v=a[:,:,3]>180
    m=v&(a[:,:,0]>150)&(a[:,:,1]>95)&(a[:,:,2]<a[:,:,1]*.65)
    ys=np.where((m.sum(1)>80)&(m.sum(1)/np.maximum(v.sum(1),1)>.72))[0]
    run=max(np.split(ys,np.where(np.diff(ys)!=1)[0]+1),key=len);top,bottom=int(run[0]),int(run[-1])
    def profile(y):
        xs=np.where(v[int(np.clip(y,top,bottom))])[0]
        return (xs[0]+xs[-1])/2,float(xs[-1]-xs[0])
    return base,top,bottom,profile

arms=Image.open(SRC/'gestures.png').convert('RGBA')
# Coordinates are measured on the generated 1536x1024 atlas, at shoulder cut ends.
anchors=[((174,242),(363,242),.55),((724,319),(812,319),.53),((1194,242),(1374,257),.55),((192,794),(326,794),.57),((678,742),(858,742),.50),((1165,812),(1364,812),.43)]
wardrobe=Image.open(SRC/'outfits.png').convert('RGBA')
manifest={'poses':POSES,'gestures':GESTURES,'colours':list(COLOURS),'canvas':[1024,1536]}
board=Image.new('RGBA',(1800,1350),'#171021');draw=ImageDraw.Draw(board)
for row,pose in enumerate(POSES):
    base,top,bottom,profile=geometry(pose);length=bottom-top
    for index,name in enumerate(GESTURES if "--outfits-only" not in sys.argv else []):
        left,right,fraction=anchors[index];y=top+length*fraction;cx,width=profile(y)
        scale=width/170
        layer=Image.new('RGBA',base.size)
        for side,(ax,ay) in enumerate([left,right]):
            cellx=index%3*512;celly=index//3*512
            box=(cellx+side*256,celly,cellx+(side+1)*256,celly+512)
            part=arms.crop(box).resize((round(256*scale),round(512*scale)),Image.Resampling.LANCZOS)
            # Shoulder ends extend inside the barrel; the body occludes the join.
            tx=cx+(-1 if side==0 else 1)*width*.43
            layer.alpha_composite(part,(round(tx-(ax-box[0])*scale),round(y-(ay-box[1])*scale)))
        for colour,rgb in COLOURS.items():
            a=np.array(layer);r,g,b=[a[:,:,j].astype(float) for j in range(3)]
            mask=(a[:,:,3]>0)&(r>90)&(g>55)&(b<g*.65)
            shade=np.clip(g/210,.35,1.2)
            recolour=np.array(rgb)[None,None,:]*shade[:,:,None]
            a[mask,:3]=np.clip(recolour[mask],0,255).astype('uint8')
            a[a[:,:,3]==0,:3]=0
            save(Image.fromarray(a),OUT/f'{pose}/gestures/{name}-{colour}.webp')
        preview=layer.copy();preview.alpha_composite(base)
        for category,idx in [('eyes',[0,1,3,4,0,5][index]),('mouth',[1,0,2,1,5,1][index])]:
            preview.alpha_composite(Image.open(ROOT/f'public/assets/faces/male/{pose}/{category}/{idx}.webp').convert('RGBA'))
        preview.thumbnail((300,400));board.alpha_composite(preview,(index*300,row*450+35));draw.text((index*300+12,row*450+10),pose+' / '+name,fill='white')
    # Clothing is mapped row by row to the barrel centreline, not simply rotated.
    for index,name in enumerate(['none','puffer-coat','bomber-jacket','denim-vest','gold-joshi-medallion','dollar-chain']):
        if index==0:continue
        boxes={1:(440,0,978,506),2:(978,0,1536,506),3:(0,512,512,1024),4:(512,512,1024,1024),5:(1024,512,1536,1024)}
        cell=wardrobe.crop(boxes[index])
        box=cell.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox()
        item=cell.crop(box)
        # All garments start below the independently selectable mouth.
        start=top+length*.47;end=top+length*(.97 if index<4 else .79)
        height=round(end-start)
        _,width=profile((start+end)/2)
        # Each garment's torso width is measured separately from its sleeves.
        torso_ratio={1:.64,2:.58,3:1.0,4:1.0,5:1.0}[index]
        target_width=round(width*1.13/torso_ratio)
        item=item.resize((target_width,height),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',base.size)
        for sy in range(height):
            cy=round(start)+sy;centre,_=profile(cy)
            canvas.alpha_composite(item.crop((0,sy,target_width,sy+1)),(round(centre-target_width/2),cy))
        save(canvas,OUT/f'{pose}/outfits/{name}.webp')
        thumb=cell.crop(box);thumb.thumbnail((180,150));save(thumb,OUT/f'thumbs/{name}.webp')
if '--outfits-only' not in sys.argv:board.convert('RGB').save(ROOT/'outputs/fitted-gesture-review.jpg',quality=95)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('Registered gestures in 14 colours and five outfit layers for all three poses.')
