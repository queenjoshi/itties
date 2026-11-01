"""Add a restrained, antialiased dark contour around individual facial features."""
from pathlib import Path
from PIL import Image,ImageFilter,ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'public/assets/first-pose-expressions'
ids=['chill','hype','fierce','glitch','focused','relaxed']
for key in ids:
 for category in ['eyes','mouth']:
  p=out/f'{key}-{category}.webp';backup=ROOT/f'artwork-traits/layer-cleanup-originals/{key}-{category}-before-outline.webp'
  if not backup.exists():backup.write_bytes(p.read_bytes())
  im=Image.open(backup).convert('RGBA');a=np.array(im.getchannel('A'))
  # Two-pixel round contour, softened at subpixel scale; no filled face/background patch.
  core=Image.fromarray(a).filter(ImageFilter.GaussianBlur(1.15)).point(lambda value: 255 if value>115 else 0)
  outer=core.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.0))
  ring=np.maximum(0,np.array(outer).astype(float)-a.astype(float))*.78
  outline=Image.new('RGBA',im.size,(39,22,20,0));outline.putalpha(Image.fromarray(np.uint8(ring)))
  outline.alpha_composite(im);outline.save(p,lossless=True)
board=Image.new('RGBA',(1800,490),'#171021');draw=ImageDraw.Draw(board)
for i,key in enumerate(ids):
 def compose(colour):
  im=Image.open(out/f'{key}-arms-{colour}.webp').convert('RGBA')
  base=ROOT/'public/assets/base-poses/tilt-left.webp' if colour=='yellow' else ROOT/f'public/assets/pencil-skins/tilt-left-{colour}.webp'
  im.alpha_composite(Image.open(base).convert('RGBA'))
  for c in ['eyes','mouth','hands']:im.alpha_composite(Image.open(out/f'{key}-{c}.webp').convert('RGBA'))
  return im
 thumb=compose('yellow');thumb.thumbnail((200,300));thumb.save(out/f'{key}-thumb.webp',lossless=True)
 im=compose('blue')
 if key=='glitch':im.crop((400,350,700,640)).resize((900,870)).save(ROOT/'outputs/expression-outline-detail.png')
 im.thumbnail((280,430));board.alpha_composite(im,(i*300+10,35));draw.text((i*300+15,12),key.title(),fill='white')
board.save(ROOT/'outputs/outlined-expressions.png');print('Added consistent soft contours to 12 face layers and refreshed all thumbnails.')
