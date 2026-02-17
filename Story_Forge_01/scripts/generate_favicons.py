from PIL import Image
from pathlib import Path

public = Path(__file__).resolve().parents[1] / 'public'
source = public / 'favicon.png'
if not source.exists():
    raise SystemExit('Source favicon.png not found in public/')

sizes = {
    'favicon-16.png': (16,16),
    'favicon-32.png': (32,32),
    'apple-touch-icon.png': (180,180),
    'favicon-192.png': (192,192),
    'favicon-512.png': (512,512)
}

img = Image.open(source).convert('RGBA')
for name, size in sizes.items():
    out = public / name
    resized = img.resize(size, Image.LANCZOS)
    resized.save(out)
    print('Saved', out)

# Create multi-size favicon.ico
ico_sizes = [(16,16),(32,32),(48,48),(64,64)]
ico_imgs = [img.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_path = public / 'favicon.ico'
ico_imgs[0].save(ico_path, format='ICO', sizes=ico_sizes)
print('Saved', ico_path)
