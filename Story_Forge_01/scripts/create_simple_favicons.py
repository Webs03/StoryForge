#!/usr/bin/env python3
"""
Generate simple PNG favicons and an ICO (containing PNG entries) without external libs.
Creates: public/favicon-16.png, favicon-32.png, apple-touch-icon.png (180), favicon-192.png, favicon-512.png, favicon.ico
"""
import zlib
import struct
from pathlib import Path

public = Path(__file__).resolve().parents[1] / 'public'
public.mkdir(parents=True, exist_ok=True)

def write_png(path, size, color=(40,120,200,255)):
    # size: (w,h)
    w,h = size
    rgba = bytearray()
    for y in range(h):
        rgba.append(0)  # filter byte per scanline
        for x in range(w):
            # simple circle: compute alpha for circle mask
            cx = w/2 - x
            cy = h/2 - y
            r = (w/2)*0.9
            dist = (cx*cx+cy*cy)**0.5
            if dist <= r:
                a = color[3]
                rgba.extend(color[0:3])
                rgba.append(a)
            else:
                # transparent outside
                rgba.extend((0,0,0,0))
    # PNG file structure
    def chunk(tag, data):
        return struct.pack('!I', len(data)) + tag + data + struct.pack('!I', zlib.crc32(tag + data) & 0xffffffff)

    png = b"\x89PNG\r\n\x1a\n"
    # IHDR
    ihdr = struct.pack('!IIBBBBB', w, h, 8, 6, 0, 0, 0)
    png += chunk(b'IHDR', ihdr)
    # IDAT
    comp = zlib.compress(bytes(rgba), level=9)
    png += chunk(b'IDAT', comp)
    # IEND
    png += chunk(b'IEND', b'')
    path.write_bytes(png)
    print('Wrote', path)
    return png

# create PNGs
sizes = {
    'favicon-16.png': (16,16),
    'favicon-32.png': (32,32),
    'apple-touch-icon.png': (180,180),
    'favicon-192.png': (192,192),
    'favicon-512.png': (512,512)
}

png_datas = {}
for name, sz in sizes.items():
    path = public / name
    data = write_png(path, sz)
    png_datas[sz[0]] = data

# create favicon.ico containing PNG entries
# ICO header: 6 bytes, then entry per image 16 bytes, then image data concatenated
entries = []
images = []
offset = 6 + 16 * 4  # we'll include 4 sizes
ico_buf = bytearray()
# pick sizes for ico
ico_sizes = [16,32,48,64]
for s in ico_sizes:
    # if we have png for that size, use it; else create scaled-up/down from nearest (simple choice: use 64 for all)
    if s in png_datas:
        img = png_datas[s]
    else:
        # fallback to largest available (512) and include (that's acceptable in modern ICO)
        img = png_datas[max(png_datas.keys())]
    images.append(img)

# write header
ico_buf += struct.pack('<HHH', 0, 1, len(images))
for img in images:
    b = img
    size_byte = b'\x00' if len(b) >= 256 else struct.pack('<B', len(b))  # not used for PNG entries
    # width and height in bytes
    width = img[16]
    height = img[17]
    # For PNG entries, set width/height to size in single byte; if 0 means 256
    # But reading PNG header to get width/height properly might be complex; instead we set width/height fields from our ico_sizes

# rebuild more robustly: create entries with appropriate width/height from ico_sizes
ico_buf = bytearray()
ico_buf += struct.pack('<HHH', 0, 1, len(images))
current_offset = 6 + 16 * len(images)
for idx, img in enumerate(images):
    s = ico_sizes[idx]
    b = img
    width_byte = s if s < 256 else 0
    height_byte = s if s < 256 else 0
    color_count = 0
    reserved = 0
    planes = 1
    bit_count = 32
    bytes_in_res = len(b)
    ico_buf += struct.pack('<BBBBHHII', width_byte, height_byte, color_count, reserved, planes, bit_count, bytes_in_res, current_offset)
    current_offset += bytes_in_res
# append image data
for img in images:
    ico_buf += img

ico_path = public / 'favicon.new.ico'
ico_path.write_bytes(ico_buf)
print('Wrote', ico_path)
# Also copy to favicon.v3.ico and favicon.ico (backup existing)
(public / 'favicon.new.ico').replace(public / 'favicon.v3.ico')
(public / 'favicon.v3.ico').write_bytes(ico_buf)

# optionally overwrite public/favicon.ico
(public / 'favicon.v3.ico').replace(public / 'favicon.ico')
print('Replaced public/favicon.ico')

print('Done')
