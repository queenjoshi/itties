"""Separate generated eye/mouth art and register the six coordinated gestures."""
from pathlib import Path
from collections import deque
from PIL import Image,ImageDraw,ImageFilter
import numpy as np, math, json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'artwork-traits/reference-expression-gestures'
OUT=ROOT/'public/assets/expression-gestures'
IDS=['chill','hype','fierce','glitch','focused','relaxed']

def split_face(tile):
    a=np.array(tile);solid=a[:,:,3]>20;seen=np.zeros_like(solid)
    masks={'eyes':np.zeros_like(solid),'mouth':np.zeros_like(solid)}
    for sy,sx in zip(*np.where(solid)):
        if seen[sy,sx]:continue
        seen[sy,sx]=True;q=deque([(int(sy),int(sx))]);points=[]
        while q:
            y,x=q.popleft();points.append((y,x))
            for ny,nx in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
                if 0<=ny<solid.shape[0] and 0<=nx<solid.shape[1] and solid[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((ny,nx))
        if len(points)<20:continue
        yy,xx=zip(*points);category='mouth' if (min(yy)+max(yy))/2>310 else 'eyes'
        masks[category][yy,xx]=True
    result={}
    for category,mask in masks.items():
        mask=np.array(Image.fromarray(np.uint8(mask)*255).filter(ImageFilter.MaxFilter(3)))>0
        b=a.copy();b[:,:,3]=np.where(mask,a[:,:,3],0);b[b[:,:,3]==0,:3]=0
        image=Image.fromarray(b);bbox=image.getchannel('A').getbbox()
        assert bbox,(category,'empty facial sprite')
        result[category]=image.crop(bbox)
    return result

def save(im,path):
    path.parent.mkdir(parents=True,exist_ok=True);im.save(path,lossless=True,method=0)

for gender in ['male','female']:
    atlas=Image.open(SOURCE/f'{gender}-atlas.png').convert('RGBA')
    components={key:split_face(atlas.crop((i%3*512,i//3*512,(i%3+1)*512,(i//3+1)*512))) for i,key in enumerate(IDS)}
    board=Image.new('RGBA',(1800,1380),'#171021');draw=ImageDraw.Draw(board)
    for row,pose in enumerate(['tilt-left','tilt-right','straight']):
        base=Image.open(ROOT/f'public/assets/base-poses/{pose}.webp').convert('RGBA')
        mask=np.array(Image.open(ROOT/f'public/assets/body-patterns/{pose}-mask.png'))[:,:,3]>100
        rows=np.where(mask.sum(1)>80)[0];top,bottom=int(rows.min()),int(rows.max())
        def profile(y):
            xs=np.where(mask[y])[0];return (xs[0]+xs[-1])/2,xs[-1]-xs[0]
        def place(sprite,fraction,width_scale,height_scale):
            y=round(top+(bottom-top)*fraction);x,width=profile(y)
            angle=math.degrees(math.atan((profile(y+12)[0]-profile(y-12)[0])/24))
            item=sprite.copy();item.thumbnail((round(width*width_scale),round(width*height_scale)),Image.Resampling.LANCZOS)
            item=item.rotate(angle,Image.Resampling.BICUBIC,expand=True)
            layer=Image.new('RGBA',base.size);layer.alpha_composite(item,(round(x-item.width/2),round(y-item.height/2)));return layer
        eye_layers={key:place(components[key]['eyes'],.20,.96,.70) for key in IDS}
        eye_bottom=max(im.getchannel('A').getbbox()[3] for im in eye_layers.values())
        def mouth_layer(sprite):
            layer=place(sprite,.38,.64,.42);bbox=layer.getchannel('A').getbbox()
            shift=max(0,eye_bottom+12-bbox[1])
            if shift:
                moved=Image.new('RGBA',base.size);moved.alpha_composite(layer,(0,shift));layer=moved
            assert layer.getchannel('A').getbbox()[1]>=eye_bottom+12
            return layer
        for col,key in enumerate(IDS):
            eyes=eye_layers[key];mouth=mouth_layer(components[key]['mouth'])
            save(eyes,OUT/f'{gender}/{pose}/{key}-eyes.webp');save(mouth,OUT/f'{gender}/{pose}/{key}-mouth.webp')
            face=eyes.copy();face.alpha_composite(mouth)
            thumb=face.crop(face.getchannel('A').getbbox());thumb.thumbnail((200,120),Image.Resampling.LANCZOS)
            save(thumb,OUT/f'{gender}/thumbs/{key}.webp')
            armroot=ROOT/f'public/assets/artist-arms/{pose}'
            preview=Image.open(armroot/f'{key}-black.webp').convert('RGBA');preview.alpha_composite(Image.open(ROOT/f'public/assets/pencil-skins/{pose}-black.webp').convert('RGBA'))
            preview.alpha_composite(face);preview.alpha_composite(Image.open(armroot/f'{key}-hands.webp').convert('RGBA'))
            preview.thumbnail((300,410),Image.Resampling.LANCZOS);board.alpha_composite(preview,(col*300,row*460+35));draw.text((col*300+10,row*460+10),pose+' / '+key.title(),fill='white')
        for index in range(6):
            old=Image.open(ROOT/f'public/assets/faces/{gender}/{pose}/mouth/{index}.webp').convert('RGBA')
            save(mouth_layer(old.crop(old.getchannel('A').getbbox())),OUT/f'{gender}/{pose}/manual-mouth/{index}.webp')
    board.convert('RGB').save(ROOT/f'outputs/{gender}-reference-expressions-all-poses.jpg',quality=94)
(OUT/'manifest.json').write_text(json.dumps({'poses':['tilt-left','tilt-right','straight'],'expressions':IDS,'genders':['male','female'],'canvas':[1024,1536],'gestures':dict(zip(IDS,['hands on hips','raised palms','raised fist and hip hand','finger guns','temple point and hip hand','hands behind head']))},indent=2))
print('Built 72 expression layers, 36 aligned manual mouths, and 12 thumbnails.')
