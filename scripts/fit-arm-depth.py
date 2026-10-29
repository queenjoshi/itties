from pathlib import Path
from PIL import Image
import numpy as np
r=Path(__file__).resolve().parents[1]
for pose in ['tilt-left','tilt-right','straight']:
 im=Image.open(r/f'public/assets/arm-traits/{pose}-wave-yellow.webp').convert('RGBA');a=np.array(im);yy,xx=np.indices(a.shape[:2]);white=(a[:,:,3]>160)&(a[:,:,:3].min(2)>135)&((a[:,:,:3].max(2).astype(int)-a[:,:,:3].min(2).astype(int))<45)&(yy>740)
 y,x=np.where(white);box=(int(x.min())-3,int(y.min())-3,int(x.max())+4,int(y.max())+4)
 out=Image.new('RGBA',im.size);out.alpha_composite(im.crop(box),(box[0],box[1]));out.save(r/f'public/assets/arm-traits/{pose}-hip-glove.webp',lossless=True)
 board=Image.new('RGBA',im.size,'#171021');board.alpha_composite(im);board.alpha_composite(Image.open(r/f'public/assets/base-poses/{pose}.webp').convert('RGBA'));board.alpha_composite(out);board.thumbnail((512,768));board.convert('RGB').save(r/f'outputs/arm-fit-{pose}.jpg',quality=95)
