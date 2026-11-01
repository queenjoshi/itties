"""Rebuild the first-pose layers and apply all approved cleanup passes."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
for script in ["build-first-pose-expressions.py","clean-pencil-layer-lines.py","remove-expression-blush.py","clean-expression-colour-edges.py","polish-expression-layers.py","outline-expression-layers.py","restore-original-expression-brows.py"]:
 subprocess.run([sys.executable,str(root/"scripts"/script)],cwd=root,check=True)
