"""Build fixed-silhouette PNG/WebP trait overlays from generated concept components."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'artwork-traits/female/generated/options'
OUT = ROOT / 'artwork-traits/female/generated/aligned-overlays'
WEB = ROOT / 'public/admin-review/overlays'
BASE = ROOT / 'artwork-layers/itty-001/itty-001-full-render.png'
ERASER = ROOT / 'artwork-layers/itty-001/05-coral-eraser.png'
WOOD = ROOT / 'artwork-layers/itty-001/02-sharpened-wood.png'
W, H = 1024, 1536
OUT.mkdir(parents=True, exist_ok=True)
WEB.mkdir(parents=True, exist_ok=True)

# Keep garment textures inside the existing pencil body silhouette.
body_mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(body_mask).polygon([
    (492, 638), (665, 638), (674, 670), (680, 700), (687, 735),
    (693, 770), (698, 805), (701, 840), (701, 875), (698, 910),
    (693, 945), (687, 980), (680, 1015), (673, 1050), (666, 1085),
    (657, 1120), (648, 1150), (635, 1170), (615, 1183), (590, 1192),
    (565, 1195), (540, 1192), (515, 1188), (490, 1181), (465, 1173),
    (445, 1164), (432, 1150), (427, 1125), (427, 1090), (430, 1055),
    (435, 1020), (441, 985), (448, 950), (456, 915), (464, 880),
    (472, 845), (480, 810), (486, 775), (491, 740), (494, 705),
    (495, 672),
], fill=255)
# Intersect with visible pixels of the unchanged base render.
base = Image.open(BASE).convert('RGBA')
from PIL import ImageChops
alpha = base.getchannel('A').point(lambda value: 255 if value >= 210 else 0).filter(ImageFilter.GaussianBlur(0.45))
body_mask = ImageChops.multiply(body_mask, alpha)
# The wood cutout supplies the exact sharpened zig-zag boundary at the pencil tip.
wood = Image.open(WOOD).convert('RGBA')
wood_full = Image.new('L', (W, H), 0)
wood_full.paste(wood.getchannel('A'), (431, 1117))
body_mask = ImageChops.subtract(body_mask, wood_full)

# Lip finishes are confined to the existing mouth area, inside the original face.
mouth_mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(mouth_mask).ellipse((525, 544, 657, 625), fill=255)
mouth_mask = ImageChops.multiply(mouth_mask, alpha)

# Preserve the exact existing eraser bounds and alpha silhouette for the hair-color layer.
eraser = Image.open(ERASER).convert('RGBA')
eraser_mask = eraser.getchannel('A')

traits = {
    'hair': ['obsidian-black', 'cyber-blue', 'acid-purple', 'platinum-silver', 'sunset-pink'],
    'lips': ['glossy-crimson', 'electric-magenta', 'dark-velvet-plum', 'neon-cyan', 'matte-nude'],
    'apparel': ['tropical-neon', 'cherry-blossom-noir', 'geometric-prism', 'statement-crop-skirt', 'neon-mesh'],
}

def place_layer(name, detail):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(detail)
    layer.save(OUT / f'{name}.png', optimize=True)
    layer.save(WEB / f'{name}.webp', 'WEBP', quality=84, method=6)

for key in traits['hair']:
    # Texture sits inside the original eraser footprint; its outer silhouette cannot grow.
    hair = Image.open(SOURCE / f'{key}.png').convert('RGBA')
    hair = ImageOps.fit(hair, eraser.size, method=Image.Resampling.LANCZOS)
    hair.putalpha(ImageChops.multiply(hair.getchannel('A'), eraser_mask))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(hair, (389, 24))
    layer.save(OUT / f'hair-{key}.png', optimize=True)
    layer.save(WEB / f'hair-{key}.webp', 'WEBP', quality=84, method=6)

for key in traits['lips']:
    lips = Image.open(SOURCE / f'{key}.png').convert('RGBA')
    # Keep the generated mouth entirely within the original face/body area.
    lips = ImageOps.contain(lips, (126, 68), method=Image.Resampling.LANCZOS)
    x, y = 524 + (126-lips.width)//2, 546 + (68-lips.height)//2
    detail = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    detail.alpha_composite(lips, (x, y))
    detail.putalpha(ImageChops.multiply(detail.getchannel('A'), mouth_mask))
    place_layer(f'lips-{key}', detail)

for key in traits['apparel']:
    swatch = Image.open(SOURCE / f'{key}.png').convert('RGBA')
    texture = ImageOps.fit(swatch, (W, H), method=Image.Resampling.LANCZOS)
    # Fill the exact mapped pencil-body mask; rounded sample-card edges are discarded.
    texture.putalpha(body_mask)
    place_layer(f'apparel-{key}', texture)
