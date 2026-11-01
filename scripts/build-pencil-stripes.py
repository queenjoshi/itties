"""Trace longitudinal stripes along the barrel; the UI clips them to lacquer."""
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
dest=ROOT/'public/assets/body-patterns'
for pose in ['tilt-left','tilt-right','straight']:
    mask=np.array(Image.open(dest/f'{pose}-mask.png'))[:,:,3]
    visible=np.array(Image.open(ROOT/f'public/assets/base-poses/{pose}.webp'))[:,:,3]
    rows=np.where((mask>100).sum(1)>40)[0]
    paths=[]
    for fraction in [.2,.5,.8]:
        points=[]
        for y in range(int(rows.min()),int(rows.max())+1,3):
            xs=np.where(visible[y]>100)[0]
            points.append((xs[0]+(xs[-1]-xs[0])*fraction,y))
        paths.append('<path d="'+' '.join(('M' if i==0 else 'L')+f'{x:.1f},{y}' for i,(x,y) in enumerate(points))+'"/>')
    (dest/f'{pose}-stripes.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536"><g fill="none" stroke="white" stroke-opacity=".85" stroke-width="8" stroke-linecap="round">'+''.join(paths)+'</g></svg>')
