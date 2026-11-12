import sys, struct, numpy as np
from PIL import Image
mode, a, b = sys.argv[1:4]
if mode == 'to':
    im = np.asarray(Image.open(a).convert('RGBA')); h, w = im.shape[:2]
    open(b, 'wb').write(struct.pack('<II', w, h) + im.tobytes())
else:
    raw = open(a, 'rb').read(); w, h = struct.unpack('<II', raw[:8])
    Image.fromarray(np.frombuffer(raw[8:], np.uint8).reshape(h, w, 3)).save(b)
