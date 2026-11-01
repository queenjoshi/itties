"""Place independent eye-colour and personality-brow sprites on the three poses."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np, math
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'artwork-traits/simple-eyes'
OUT=ROOT/'public/assets/faces'
COLOURS=['blue','green','hazel','brown']
PERSONALITIES=['chill','hype','fierce','glitch','focused','relaxed']
eyes=Image.open(SOURCE/'eyes-atlas.png').convert('RGBA')
brows=Image.open(SOURCE/'brows-atlas.png').convert('RGBA')
def sprite(sheet,index,cols,rows):
    w,h=sheet.width/cols,sheet.height/rows
    item=sheet.crop((round(index%cols*w),round(index//cols*h),round((index%cols+1)*w),round((index//cols+1)*h)))
    bbox=item.getchannel('A').point(lambda x:255 if x>45 else 0).getbbox()
    return item.crop(bbox)
def save(image,path):
    path.parent.mkdir(parents=True,exist_ok=True);image.save(path,lossless=True,method=0)
board=Image.new('RGBA',(1800,1350),'#171021');draw=ImageDraw.Draw(board)
for row,pose in enumerate(['tilt-left','tilt-right','straight']):
    base=Image.open(ROOT/f'public/assets/base-poses/{pose}.webp').convert('RGBA')
    a=np.array(Image.open(ROOT/f'public/assets/body-patterns/{pose}-mask.png'))[:,:,3]>100
    ys=np.where(a.sum(1)>80)[0];top,bottom=int(ys.min()),int(ys.max())
    def anchor(f):
        y=round(top+(bottom-top)*f)
        def profile(y):
            xs=np.where(a[y])[0];return (xs[0]+xs[-1])/2,xs[-1]-xs[0]
        x,w=profile(y);angle=math.degrees(math.atan((profile(y+12)[0]-profile(y-12)[0])/24))
        return x,y,w,angle
    def place(item,f,wscale,hscale):
        x,y,w,angle=anchor(f);item=item.copy();item.thumbnail((round(w*wscale),round(w*hscale)),Image.Resampling.LANCZOS)
        item=item.rotate(angle,Image.Resampling.BICUBIC,expand=True)
        layer=Image.new('RGBA',base.size);layer.alpha_composite(item,(round(x-item.width/2),round(y-item.height/2)));return layer
    for i,name in enumerate(COLOURS):
        item=sprite(eyes,i,2,2);layer=place(item,.23,.94,.52)
        save(layer,OUT/f'eye-colours/{pose}/{name}.webp')
        thumb=item.copy();thumb.thumbnail((200,100));save(thumb,OUT/f'eye-colours/thumbs/{name}.webp')
        preview=base.copy();preview.alpha_composite(layer);preview.alpha_composite(Image.open(OUT/f'male/{pose}/mouth/0.webp').convert('RGBA'));preview.thumbnail((300,400));board.alpha_composite(preview,(i*300,row*450+35));draw.text((i*300+12,row*450+10),pose+' / '+name,fill='white')
    for i,name in enumerate(PERSONALITIES):
        item=sprite(brows,i,3,2);layer=place(item,.09,.92,.25)
        save(layer,OUT/f'personality/{pose}/{name}.webp')
        thumb=item.copy();thumb.thumbnail((200,90));save(thumb,OUT/f'personality/thumbs/{name}.webp')
        if i<2:
            preview=base.copy();preview.alpha_composite(Image.open(OUT/f'eye-colours/{pose}/brown.webp').convert('RGBA'));preview.alpha_composite(layer);preview.alpha_composite(Image.open(OUT/f'male/{pose}/mouth/0.webp').convert('RGBA'));preview.thumbnail((300,400));board.alpha_composite(preview,((i+4)*300,row*450+35));draw.text(((i+4)*300+12,row*450+10),pose+' / '+name,fill='white')
board.convert('RGB').save(ROOT/'outputs/simple-eyes-and-personality.jpg',quality=95)
print('Built 12 eye-colour layers and 18 independent personality layers.')
