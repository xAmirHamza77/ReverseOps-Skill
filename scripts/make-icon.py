#!/usr/bin/env python3
"""ReverseOps icon generator — deterministic, PIL-only, 4x supersampled.

Renders the ReverseOps mark (rounded dark tile, teal "R" glyph wrapped by two
counter-rotating arrows = reverse engineering + operations loop) into:

    docs/assets/reverseops.png        512px  (repo readme)
    panel/assets/icon-512.png         512px
    panel/assets/icon-128.png         128px  (panel header)
    panel/assets/icon-32.png           32px  (favicon)

    python3 scripts/make-icon.py
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont, ImageFilter

SS = 4                      # supersample factor
SIZE = 512
W = SIZE * SS

BG_TOP = (13, 22, 32)
BG_BOT = (8, 43, 38)
TEAL = (45, 212, 191)       # #2dd4bf
CYAN = (34, 211, 238)       # #22d3ee
ORANGE = (249, 115, 22)     # severity accent

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def vgrad(size, top, bot):
    img = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / max(size - 1, 1)
        img.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return img.resize((size, size))


def hgrad(size, left, right):
    img = Image.new("RGB", (size, 1))
    for x in range(size):
        t = x / max(size - 1, 1)
        img.putpixel((x, 0), tuple(int(left[i] + (right[i] - left[i]) * t) for i in range(3)))
    return img.resize((size, size))


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def find_font():
    for p in ("/System/Library/Fonts/Menlo.ttc",
              "/System/Library/Fonts/SFNSMono.ttf",
              "/System/Library/Fonts/Helvetica.ttc",
              "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"):
        if os.path.exists(p):
            return p
    return None


def arc_with_head(draw, cx, cy, r, a0, a1, width, color):
    """Thick arc + tangential triangle arrowhead at a1 end."""
    box = [cx - r, cy - r, cx + r, cy + r]
    draw.arc(box, start=a0, end=a1, fill=color, width=width)
    rad = math.radians(a1)
    tip = (cx + r * math.cos(rad), cy + r * math.sin(rad))
    tang = rad + math.pi / 2  # direction of travel (clockwise in PIL space)
    hl = width * 1.9          # arrowhead length
    hw = width * 0.92         # half width
    base = (tip[0] + hl * math.cos(tang), tip[1] + hl * math.sin(tang))
    perp = tang + math.pi / 2
    p1 = (base[0] + hw * math.cos(perp), base[1] + hw * math.sin(perp))
    p2 = (base[0] - hw * math.cos(perp), base[1] - hw * math.sin(perp))
    draw.polygon([tip, p1, p2], fill=color)


def render(size):
    ss = W // SIZE          # supersample relative to 512 master
    s = size * ss
    k = s / 512.0           # scale factor vs 512 design space

    img = vgrad(s, BG_TOP, BG_BOT).convert("RGB")
    d = ImageDraw.Draw(img)

    # faint diagonal grid (low-alpha overlay, blended back on)
    overlay = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for off in range(-s, 2 * s, int(46 * k)):
        od.line([(off, 0), (off + s, s)], fill=TEAL + (14,), width=max(1, int(1 * k)))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    d = ImageDraw.Draw(img)

    # counter-rotating orbit arrows (the "reverse ops" loop)
    cx = cy = s / 2
    r = 200 * k
    aw = int(22 * k)
    arc_with_head(d, cx, cy, r, 300, 120, aw, TEAL)     # top arc, head at 120°
    arc_with_head(d, cx, cy, r, 120, 300, aw, CYAN)     # bottom arc, head at 300°

    # "R" glyph with teal->cyan horizontal gradient, via alpha mask
    font_path = find_font()
    mask = Image.new("L", (s, s), 0)
    md = ImageDraw.Draw(mask)
    if font_path:
        font = ImageFont.truetype(font_path, int(300 * k))
    else:
        font = ImageFont.load_default()
    bbox = md.textbbox((0, 0), "R", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    md.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1] - int(4 * k)), "R", font=font, fill=255)
    grad = hgrad(s, TEAL, CYAN)
    img.paste(grad, (0, 0), mask)

    # small terminal-caret accent under the R
    caret_w, caret_h = int(64 * k), int(14 * k)
    d.rounded_rectangle([cx - caret_w / 2, cy + 118 * k, cx + caret_w / 2, cy + 118 * k + caret_h],
                        radius=caret_h / 2, fill=ORANGE)

    # inner ring stroke
    d.rounded_rectangle([int(10 * k)] * 2 + [s - int(10 * k)] * 2, radius=int(96 * k),
                        outline=TEAL, width=int(3 * k))

    # rounded-rect clip
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.paste(Image.alpha_composite(Image.new("RGBA", (s, s), (0, 0, 0, 0)), img.convert("RGBA")),
              (0, 0), rounded_mask(s, int(96 * k)))
    if ss > 1:
        out = out.resize((size, size), Image.LANCZOS)
    return out


def main():
    targets = [
        ("docs/assets/reverseops.png", 512),
        ("panel/assets/icon-512.png", 512),
        ("panel/assets/icon-128.png", 128),
        ("panel/assets/icon-32.png", 32),
    ]
    for rel, size in targets:
        path = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        render(size).save(path)
        print("wrote %-34s %dx%d" % (rel, size, size))


if __name__ == "__main__":
    main()
