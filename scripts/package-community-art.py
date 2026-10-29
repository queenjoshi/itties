"""Package AI-rendered transparent wardrobe triptychs as small, individually browsable WebPs.
Usage: python3 scripts/package-community-art.py pepe=/path/to/pepe.png ...
Cropping/resizing preserves generated pixels and alpha; it does not create trait layers.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, shutil, sys, zipfile
root=Path(__file__).resolve().parents[1]
looks={"pepe":["circuit","hoodie","carbon"],"toshi":["hoodie","puffer","vest"],"doge":["rainbow","goldchain","tactical"],"floki":["viking","hoodie","puffer"],"shiba":["samurai","streetwear","tactical"]}
source_dir=root/'artwork-layers/community-packs';source_dir.mkdir(parents=True,exist_ok=True)
for arg in sys.argv[1:]:
 pack,filename=arg.split('=',1)
 assert pack in looks
 src=Path(filename);shutil.copy2(src,source_dir/f'{pack}-source.png')
for pack,ids in looks.items():
 source=source_dir/f'{pack}-source.png'
 if not source.exists():continue
 im=Image.open(source).convert('RGBA');w,h=im.size
 # Each final lineup has three equally spaced characters.
 cuts=[0,round(w/3),round(w*2/3),w]
 target=root/f'public/assets/community-packs/{pack}';target.mkdir(parents=True,exist_ok=True)
 im.save(target/'lineup.webp',quality=88,method=5)
 for i,key in enumerate(ids):
  item=im.crop((cuts[i],0,cuts[i+1],h));item.thumbnail((488,976),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',(512,1024));canvas.alpha_composite(item,((512-item.width)//2,(1024-item.height)//2));canvas.save(target/f'{key}.webp',quality=90,method=5)
all_files=[root/f'public/assets/community-packs/{p}/{k}.webp' for p,ids in looks.items() for k in ids]
if all(f.exists() for f in all_files):
 sheet=Image.new('RGB',(1500,1900),'#170e23');draw=ImageDraw.Draw(sheet)
 for row,(pack,ids) in enumerate(looks.items()):
  for col,key in enumerate(ids):
   img=Image.open(root/f'public/assets/community-packs/{pack}/{key}.webp').convert('RGBA');img.thumbnail((240,335),Image.Resampling.LANCZOS);sheet.paste(img,(col*500+130,row*380+35),img)
   draw.text((col*500+30,row*380+12),f'{pack.upper()} / {key.replace("-"," ").upper()}',fill='white')
 sheet.save(root/'outputs/community-wardrobes-all-15.jpg',quality=92)
 manifest={"assetType":"full-render-artwork","chain":"Base","status":"artwork only; not deployed token IDs or separated layers","packs":{p:[{"id":k,"image":f'{p}/{k}.webp'} for k in ids] for p,ids in looks.items()}}
 with zipfile.ZipFile(root/'outputs/community-expansion-artwork.zip','w',zipfile.ZIP_DEFLATED) as archive:
  for p,ids in looks.items():
   archive.write(root/f'public/assets/community-packs/{p}/lineup.webp',f'{p}/lineup.webp')
   for key in ids:archive.write(root/f'public/assets/community-packs/{p}/{key}.webp',f'{p}/{key}.webp')
  archive.writestr('manifest.json',json.dumps(manifest,indent=2))
 print('Packaged 15 full-render artworks;',sum(f.stat().st_size for f in all_files),'bytes total')
else:print('Waiting for:',[str(f.relative_to(root)) for f in all_files if not f.exists()])
