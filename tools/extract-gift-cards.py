#!/usr/bin/env python3
"""Lift the 3 gift cards (with baked chrome + buttons) off the dark dimmed
backdrop of artboards 4 (backs) and 5 (fronts) as transparent PNGs."""
import os
from PIL import Image

OUT = "/Users/details/apps-script-backups/jonny-fruits-dm-kit/assets/v3"
DARK = 95   # backdrop luminance ceiling (safe: below all card content)
SHADOW = 0    # shave disabled: remnant shadow reads correctly on the dim backdrop

def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]

def find_cards(path):
    """3 largest bright components at low res -> padded full-res bboxes."""
    im = Image.open(path).convert("RGB")
    D = 4
    sm = im.resize((im.width // D, im.height // D), Image.NEAREST)
    px = sm.load()
    sw, sh = sm.size
    seen = [[False] * sw for _ in range(sh)]
    comps = []
    for y0 in range(sh):
        for x0 in range(sw):
            if seen[y0][x0] or lum(px[x0, y0]) < DARK:
                continue
            stack = [(x0, y0)]
            seen[y0][x0] = True
            n = 0
            bx0 = bx1 = x0; by0 = by1 = y0
            while stack:
                x, y = stack.pop()
                n += 1
                bx0 = min(bx0, x); bx1 = max(bx1, x)
                by0 = min(by0, y); by1 = max(by1, y)
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < sw and 0 <= ny < sh and not seen[ny][nx] and lum(px[nx, ny]) >= DARK:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            comps.append((n, bx0, by0, bx1, by1))
    comps.sort(reverse=True)
    boxes = []
    for n, bx0, by0, bx1, by1 in comps[:3]:
        boxes.append((max(0, bx0*D-10), max(0, by0*D-10),
                      min(im.width, (bx1+1)*D+10), min(im.height, (by1+1)*D+10)))
    boxes.sort(key=lambda b: b[0])  # left -> right
    return im, boxes

def cut(im, box, out_name):
    """Full-res flood fill from crop edges over dark pixels -> transparent bg."""
    crop = im.crop(box).convert("RGB")
    w, h = crop.size
    px = crop.load()
    bg = bytearray(w * h)  # 1 = background
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + \
            [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for x, y in stack:
        if lum(px[x, y]) < DARK:
            bg[y * w + x] = 1
    stack = [(x, y) for x in range(w) for y in range(h) if bg[y * w + x]]
    while stack:
        x, y = stack.pop()
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not bg[ny * w + nx] and lum(px[nx, ny]) < DARK:
                bg[ny * w + nx] = 1
                stack.append((nx, ny))
    # keep only the largest opaque component (drops detached shadow blobs)
    seen = bytearray(w * h)
    best = []
    for start in range(w * h):
        if bg[start] or seen[start]:
            continue
        comp, stack = [], [start]
        seen[start] = 1
        while stack:
            p = stack.pop()
            comp.append(p)
            x, y = p % w, p // w
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    q = ny * w + nx
                    if not bg[q] and not seen[q]:
                        seen[q] = 1
                        stack.append(q)
        if len(comp) > len(best):
            best = comp
    keep = bytearray(w * h)
    for p in best:
        keep[p] = 1
    for p in range(w * h):
        if not keep[p]:
            bg[p] = 1

    # shave attached shadow fringe with a BFS from the boundary: dark-ish
    # opaque pixels adjacent to background go transparent and propagate —
    # the bright white chrome stops the shave from reaching the interior
    frontier = []
    for p in range(w * h):
        if bg[p]:
            continue
        x, y = p % w, p // w
        if any(0 <= x+dx < w and 0 <= y+dy < h and bg[(y+dy)*w + x+dx]
               for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
            if lum(px[x, y]) < SHADOW:
                bg[p] = 1
                frontier.append(p)
    while frontier:
        p = frontier.pop()
        x, y = p % w, p // w
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                q = ny * w + nx
                if not bg[q] and lum(px[nx, ny]) < SHADOW:
                    bg[q] = 1
                    frontier.append(q)

    rgba = crop.convert("RGBA")
    rgba.putalpha(Image.frombytes("L", (w, h), bytes(255 - 255 * b for b in bg)))
    # trim to opaque bbox
    rgba = rgba.crop(rgba.getchannel("A").getbbox())
    rgba.save(os.path.join(OUT, out_name))
    print(out_name, rgba.size)

names = ["rookie", "highlight", "sixthman"]
for page, kind in (("d3backs-4.png", "back"), ("d3fronts-5.png", "front")):
    im, boxes = find_cards(page)
    for box, n in zip(boxes, names):
        cut(im, box, f"gift-{n}-{kind}.png")
