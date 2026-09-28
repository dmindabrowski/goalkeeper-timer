#!/usr/bin/env python3
"""Generate PNG app icons using Pillow only (no cairosvg / native deps).

Usage:  python3 generate-icons.py
Requires: pip install pillow
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BG_TOP    = (17, 24, 39, 255)
BG_BOT    = (11, 15, 20, 255)
GLOW      = (74, 222, 128, 40)
TRACK     = (31, 41, 55, 255)
RING_LIGHT = (134, 239, 172, 255)
RING_DARK  = (34, 197, 94, 255)
BTN_DARK  = (34, 197, 94, 255)
BTN_LIGHT = (74, 222, 128, 255)
TEXT      = (245, 247, 251, 255)


def _vgradient(size, top, bot):
    grad = Image.new("RGBA", (1, size), 0)
    for y in range(size):
        t = y / max(1, size - 1)
        grad.putpixel(
            (0, y),
            tuple(int(top[i] * (1 - t) + bot[i] * t) for i in range(4)),
        )
    return grad.resize((size, size))


def _radial_glow(size, color):
    img = Image.new("RGBA", (size, size), 0)
    cx, cy = size // 2, int(size * 0.6)
    max_r = int(size * 0.55)
    for r in range(max_r, 0, -4):
        alpha = int(color[3] * (r / max_r) ** 2)
        alpha = color[3] - alpha
        d = ImageDraw.Draw(img)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(color[0], color[1], color[2], max(0, alpha)))
    return img


def _load_font(size):
    for path in [
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def make_icon(size: int, out: Path, maskable: bool = False) -> None:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        draw.rectangle([0, 0, size, size], fill=BG_BOT)
        pad = int(size * 0.10)
        inner = size - 2 * pad
    else:
        pad = 0
        inner = size
        radius = int(size * 0.22)
        grad = _vgradient(size, BG_TOP, BG_BOT)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
        img.paste(grad, (0, 0), mask)

    glow = _radial_glow(inner, GLOW)
    img.alpha_composite(glow, (pad, pad))

    cx = pad + inner // 2
    cy = pad + int(inner * 0.58)
    ring_r = int(inner * 0.30)
    ring_w = max(2, int(inner * 0.052))

    draw.ellipse(
        [cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
        outline=TRACK, width=ring_w,
    )
    draw.arc(
        [cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
        start=-90, end=180,
        fill=RING_LIGHT, width=ring_w,
    )

    btn_w = int(inner * 0.11)
    btn_h = int(inner * 0.06)
    btn_x = cx - btn_w // 2
    btn_y = pad + int(inner * 0.13)
    draw.rounded_rectangle(
        [btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
        radius=int(btn_h * 0.35), fill=BTN_DARK,
    )
    nub_w = int(inner * 0.062)
    nub_h = int(inner * 0.068)
    nub_x = cx - nub_w // 2
    nub_y = pad + int(inner * 0.075)
    draw.rounded_rectangle(
        [nub_x, nub_y, nub_x + nub_w, nub_y + nub_h],
        radius=int(nub_h * 0.28), fill=BTN_LIGHT,
    )

    font = _load_font(int(inner * 0.28))
    text = "GK"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1]
    draw.text((tx, ty), text, fill=TEXT, font=font)

    img.save(out)
    print(f"  ✓ {out.name} ({size}x{size})")


def main() -> None:
    out = Path(__file__).parent / "icons"
    out.mkdir(exist_ok=True)
    print("Rendering icons...")
    make_icon(180, out / "apple-touch-icon.png")
    make_icon(192, out / "icon-192.png")
    make_icon(512, out / "icon-512.png")
    make_icon(512, out / "icon-maskable-512.png", maskable=True)
    print("Done.")


if __name__ == "__main__":
    main()
