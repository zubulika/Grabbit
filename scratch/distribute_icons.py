import os
import shutil
from PySide6.QtGui import QImage, QPainter
from PySide6.QtSvg import QSvgRenderer
from PySide6.QtCore import QSize, Qt
from PIL import Image

# ─── Configuration ─────────────────────────────────────────────

SVG_SOURCE = r"E:\Repos\Grabbit\assets\brand\logo.svg"
ROOT = r"E:\Repos\Grabbit"

# Destination Mapping: { relative_path: size }
DISTRIBUTIONS = {
    # Desktop App
    "apps/grabbit/resources/icon.png": 512,
    "apps/grabbit/src/renderer/src/assets/logo.png": 128,
    
    # Website
    "apps/website/public/logo.png": 128,
    "apps/website/src/app/icon.png": 32,
    "apps/website/src/app/apple-icon.png": 180,
}

# ICO/ICNS special handling
ICO_DESTINATIONS = [
    "apps/grabbit/resources/icon.ico",
    "apps/website/public/favicon.ico"
]

# ─── Execution ────────────────────────────────────────────────

def main():
    if not os.path.exists(SVG_SOURCE):
        print(f"Error: Source SVG not found at {SVG_SOURCE}")
        return

    renderer = QSvgRenderer(SVG_SOURCE)
    if not renderer.isValid():
        print("Error: Invalid SVG source")
        return

    print(f"Rendering icons from {SVG_SOURCE}...")

    # 1. Render all needed sizes into memory/temp
    temp_dir = os.path.join(ROOT, "scratch", "temp_icons")
    os.makedirs(temp_dir, exist_ok=True)
    
    rendered_images = {} # size: path
    
    # We need sizes: 16, 32, 48, 128, 180, 256, 512
    all_sizes = set(DISTRIBUTIONS.values()) | {16, 32, 48, 256}
    
    for size in all_sizes:
        img = QImage(QSize(size, size), QImage.Format_ARGB32)
        img.fill(Qt.transparent)
        painter = QPainter(img)
        renderer.render(painter)
        painter.end()
        
        path = os.path.join(temp_dir, f"temp_{size}.png")
        img.save(path, "PNG")
        rendered_images[size] = path

    # 2. Distribute PNGs
    for rel_path, size in DISTRIBUTIONS.items():
        dest = os.path.join(ROOT, rel_path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(rendered_images[size], dest)
        print(f"  [+] Distributed: {rel_path}")

    # 3. Create & Distribute ICOs
    ico_sizes = [16, 32, 48, 256]
    ico_imgs = [Image.open(rendered_images[s]) for s in ico_sizes]
    
    for rel_path in ICO_DESTINATIONS:
        dest = os.path.join(ROOT, rel_path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        ico_imgs[0].save(dest, format='ICO', sizes=[(i.width, i.height) for i in ico_imgs])
        print(f"  [+] Created ICO: {rel_path}")

    # 4. Cleanup
    for img in ico_imgs: img.close()
    shutil.rmtree(temp_dir)
    print("\nSuccess: All icons distributed correctly.")

if __name__ == "__main__":
    main()
