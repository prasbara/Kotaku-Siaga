import os
from PIL import Image
import pytesseract

asset_dir = r"asset file laporan"
files = sorted([f for f in os.listdir(asset_dir) if f.endswith('.png')])
print(f"Total files: {len(files)}")
for idx, f in enumerate(files):
    p = os.path.join(asset_dir, f)
    im = Image.open(p)
    print(f"File {idx+1}: {f} - {im.size}")
