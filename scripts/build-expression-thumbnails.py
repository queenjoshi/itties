from PIL import Image
from pathlib import Path
r=Path(__file__).resolve().parents[1]/'public/assets/faces'
presets=[('chill',0,1,2),('hype',1,0,0),('fierce',3,2,2),('glitch',4,1,3),('focused',0,5,4),('relaxed',5,1,5)]
for gender in ['male','female']:
 for pose in ['tilt-left','tilt-right','straight']:
  d=r/gender/pose/'expressions';d.mkdir(exist_ok=True)
  for key,eyes,male,female in presets:
   mouth=male if gender=='male' else female
   im=Image.open(r/gender/pose/'eyes'/f'{eyes}.webp').convert('RGBA');im.alpha_composite(Image.open(r/gender/pose/'mouth'/f'{mouth}.webp').convert('RGBA'))
   box=im.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox();im=im.crop(box);im.thumbnail((200,110),Image.Resampling.LANCZOS);out=Image.new('RGBA',(220,130));out.alpha_composite(im,((220-im.width)//2,(130-im.height)//2));out.save(d/f'{key}.webp',lossless=True)
# Approved female reference-sheet presets, independent of the male expression names.
for pose in ['tilt-left','tilt-right','straight']:
 for key,eyes,mouth in [('confident',0,0),('wide-eyed',1,0),('designer-shades',2,2),('wild-stare',3,3),('cyber-visor',4,0),('wink',5,5)]:
  im=Image.open(r/'female'/pose/'eyes'/f'{eyes}.webp').convert('RGBA');im.alpha_composite(Image.open(r/'female'/pose/'mouth'/f'{mouth}.webp').convert('RGBA'))
  im=im.crop(im.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox());im.thumbnail((200,110),Image.Resampling.LANCZOS);out=Image.new('RGBA',(220,130));out.alpha_composite(im,((220-im.width)//2,(130-im.height)//2));out.save(r/'female'/pose/'expressions'/f'{key}.webp',lossless=True)
