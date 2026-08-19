#!/usr/bin/env python3
"""Build the v4 board from Kharisel's Aug 19 artboard.

Two jobs the raw render can't do on its own:

1. HEADROOM. The pawns now start on the top red piece, but a standing head
   rises ~0.083 board-heights above its feet and the art has only ~0.009 of
   cream above the band — the heads would hang off the top edge. We insert a
   cream band directly under the board's 61px frame (the frame is re-drawn
   around it), which is also the "breathing room at the top" Sarah asked for.

2. THE START LABEL. "Start the Journey" is baked into the cream exactly where
   the pawns have to stand, so the heads cover the word "Journey". We cut the
   label out as a transparent sprite (band pixels excluded by flood-filling the
   track first, decorative sparkles dropped by colour) and erase it from the
   raster. main.js then places it as a DOM element clear of the pawns and can
   fade it out once the journey starts.

Everything else in the artboard is used as-is. Usage:
    python3 tools/build-board-v4.py board-render.png out-dir/
"""
import json
import os
import sys
from collections import deque

from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "board.png"
OUT = sys.argv[2] if len(sys.argv) > 2 else "assets/v4"

PAD_PX = 360        # cream inserted below the frame, in render px
FRAME_PX = 61       # board's own black border
CREAM = (253, 248, 221)

os.makedirs(OUT, exist_ok=True)
board = Image.open(SRC).convert("RGB")
BW, BH = board.size
px = board.load()


def is_cream(c):
    return c[0] > 235 and c[1] > 230 and c[2] > 195


# ---------- 1. the start label: sprite + erase mask ----------
# window covering the label and the stretch of track it sits above
X0, X1 = int(0.40 * BW), int(0.83 * BW)
Y0, Y1 = int(0.010 * BH), int(0.175 * BH)
w, h = X1 - X0, Y1 - Y0

noncream = bytearray(w * h)
for y in range(Y0, Y1):
    row = (y - Y0) * w
    for x in range(X0, X1):
        if not is_cream(px[x, y]):
            noncream[row + (x - X0)] = 1

# flood the painted track from seeds on the band so its edges never enter the mask
band = bytearray(w * h)
q = deque()
for sx, sy in ((0.5546, 0.1271), (0.6511, 0.1101), (0.7767, 0.0693), (0.4752, 0.1424)):
    ix, iy = int(sx * BW) - X0, int(sy * BH) - Y0
    if 0 <= ix < w and 0 <= iy < h and noncream[iy * w + ix]:
        band[iy * w + ix] = 1
        q.append((ix, iy))
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            i = ny * w + nx
            if noncream[i] and not band[i]:
                band[i] = 1
                q.append((nx, ny))

ink = []
for y in range(h):
    for x in range(w):
        i = y * w + x
        if noncream[i] and not band[i]:
            r, g, b = px[x + X0, y + Y0]
            if r + g + b < 420:
                ink.append((x + X0, y + Y0))

# drop connected components that carry yellow — those are sparkle stickers,
# board decoration that must stay where the designer put it
inkset = set(ink)
seen = set()
keep = []
for start in ink:
    if start in seen:
        continue
    comp, stack, yellow = [], [start], False
    seen.add(start)
    while stack:
        p = stack.pop()
        comp.append(p)
        r, g, b = px[p[0], p[1]]
        if r > 190 and g > 140 and b < 130:
            yellow = True
        for dx in (-2, -1, 0, 1, 2):
            for dy in (-2, -1, 0, 1, 2):
                n = (p[0] + dx, p[1] + dy)
                if n in inkset and n not in seen:
                    seen.add(n)
                    stack.append(n)
    if not yellow and len(comp) > 40:
        keep.extend(comp)

keepset = set(keep)
grown = set()
for (x, y) in keep:
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            n = (x + dx, y + dy)
            if n in keepset:
                grown.add(n)
                continue
            ix, iy = n[0] - X0, n[1] - Y0
            if 0 <= ix < w and 0 <= iy < h and band[iy * w + ix]:
                continue  # never bleed into the track
            grown.add(n)

xs = [p[0] for p in keep]
ys = [p[1] for p in keep]
P = 8
sx0, sy0, sx1, sy1 = min(xs) - P, min(ys) - P, max(xs) + P + 1, max(ys) + P + 1
sprite = Image.new("RGBA", (sx1 - sx0, sy1 - sy0), (0, 0, 0, 0))
sp = sprite.load()
for (x, y) in grown:
    if sx0 <= x < sx1 and sy0 <= y < sy1 and not is_cream(px[x, y]):
        r, g, b = px[x, y]
        sp[x - sx0, y - sy0] = (r, g, b, 255)
sprite.save(os.path.join(OUT, "label-start.png"))

for (x, y) in grown:
    if not is_cream(px[x, y]):
        px[x, y] = CREAM

# ---------- 2. insert the cream headroom band under the frame ----------
NH = BH + PAD_PX
tall = Image.new("RGB", (BW, NH), CREAM)
tall.paste(board.crop((0, 0, BW, FRAME_PX)), (0, 0))              # frame stays on top
tall.paste(board.crop((0, FRAME_PX, BW, BH)), (0, FRAME_PX + PAD_PX))
side = Image.new("RGB", (FRAME_PX, PAD_PX), (0, 0, 0))
tall.paste(side, (0, FRAME_PX))                                    # left frame column
tall.paste(side, (BW - FRAME_PX, FRAME_PX))                        # right frame column
tall.save(os.path.join(OUT, "board-play.jpg"), quality=92)

# ---------- 3. report the coordinate transform ----------
# every y fraction measured on the raw artboard maps as (y*BH + PAD) / NH
meta = {
    "render_size": [BW, BH],
    "padded_size": [BW, NH],
    "pad_px": PAD_PX,
    "y_transform": {"scale": BH / NH, "offset": PAD_PX / NH},
    "label_sprite": {
        "size": list(sprite.size),
        "x_frac": sx0 / BW,
        "y_frac_padded": (sy0 + PAD_PX) / NH,
        "w_frac": sprite.size[0] / BW,
    },
}
with open(os.path.join(OUT, "board-meta.json"), "w") as f:
    json.dump(meta, f, indent=1)
print(json.dumps(meta, indent=1))


def ynew(y):
    return round((y * BH + PAD_PX) / NH, 4)


print("\ntrack:", [[x, ynew(y)] for x, y in [
    [0.945, 0.022], [0.845, 0.042], [0.762, 0.075], [0.660, 0.108],
    [0.550, 0.128], [0.440, 0.150], [0.350, 0.175], [0.295, 0.205],
    [0.253, 0.240], [0.222, 0.278], [0.205, 0.332], [0.293, 0.364],
    [0.383, 0.397], [0.473, 0.419], [0.560, 0.432], [0.660, 0.450],
    [0.755, 0.480], [0.833, 0.530], [0.805, 0.585], [0.720, 0.607],
    [0.600, 0.622], [0.483, 0.638], [0.370, 0.646], [0.260, 0.652],
    [0.148, 0.669], [0.107, 0.715], [0.126, 0.762], [0.215, 0.810],
    [0.335, 0.831], [0.445, 0.846], [0.550, 0.853], [0.650, 0.858],
    [0.735, 0.882], [0.775, 0.935],
]])
print("slots cy:", {k: ynew(v) for k, v in
                    (("founding", 0.2565), ("contract", 0.3986),
                     ("signing", 0.6211), ("henry", 0.8406))})
print("slot h:", round(0.1533 * BH / NH, 4))
print("start (red piece):", [0.777, ynew(0.069)])
print("final stop (black):", [0.762, ynew(0.913)])
print("surprise piece (blue):", [0.775, ynew(0.938)])
