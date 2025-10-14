#!/usr/bin/env python3
"""
Generate polished app icon, adaptive icon foreground, favicon, and splash
without changing app.json paths. This script is deterministic and safe to
re-run. Uses Pillow only.

Design concept: Budget Buddy brand
- Symbol: Friendly piggy bank + upward savings spark
- Colors: Deep royal blue (#1E40AF) primary, spring green accent (#22C55E),
  warm yellow spark (#F59E0B), white highlights.
- Style: Flat with soft inner shadow and subtle gradient for depth.

Outputs (overwrites existing):
- assets/icon.png (1024x1024)
- assets/adaptive-icon.png (Foreground 1080x1080 with transparent bg)
- assets/favicon.png (256x256)
- assets/splash.png (2048x4096, portrait, centered art)
- assets/splash-icon.png (vector-like 1024 used inside splash)

Safe: keeps file names referenced in app.json/ios/android.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

PRIMARY = (30, 64, 175)      # #1E40AF
PRIMARY_DARK = (21, 50, 140)
ACCENT = (34, 197, 94)       # #22C55E
SPARK = (245, 158, 11)       # #F59E0B
WHITE = (255, 255, 255)

# Utility

def radial_gradient(size, inner, outer):
    w, h = size
    cx, cy = w/2, h/2
    maxr = math.hypot(cx, cy)
    img = Image.new("RGB", size, outer)
    pix = img.load()
    for y in range(h):
        for x in range(w):
            r = math.hypot(x-cx, y-cy)
            t = min(1.0, r/maxr)
            pix[x, y] = tuple(int(inner[i]*(1-t) + outer[i]*t) for i in range(3))
    return img


def draw_piggy(draw: ImageDraw.ImageDraw, cx, cy, scale=1.0, fill=WHITE, outline=None):
    """Draw a friendly piggy bank icon centered at (cx,cy)."""
    # Body
    body_w, body_h = int(520*scale), int(360*scale)
    body_bbox = [cx-body_w//2, cy-body_h//2, cx+body_w//2, cy+body_h//2]
    draw.rounded_rectangle(body_bbox, radius=int(140*scale), fill=fill, outline=outline, width=int(8*scale) if outline else 0)

    # Ear
    ear_w, ear_h = int(120*scale), int(120*scale)
    ear_bbox = [cx+int(140*scale), cy-int(230*scale), cx+int(140*scale)+ear_w, cy-int(230*scale)+ear_h]
    draw.rounded_rectangle(ear_bbox, radius=int(40*scale), fill=fill, outline=outline, width=int(8*scale) if outline else 0)

    # Snout
    snout_w, snout_h = int(180*scale), int(120*scale)
    snout_bbox = [cx+int(160*scale), cy-int(40*scale), cx+int(160*scale)+snout_w, cy-int(40*scale)+snout_h]
    draw.rounded_rectangle(snout_bbox, radius=int(50*scale), fill=fill, outline=outline, width=int(8*scale) if outline else 0)
    # Nostrils
    for i in range(2):
        nx = snout_bbox[0] + int(50*scale) + i*int(60*scale)
        ny = snout_bbox[1] + int(40*scale)
        draw.ellipse([nx, ny, nx+int(24*scale), ny+int(24*scale)], fill=PRIMARY_DARK)

    # Eye
    ex, ey = cx+int(60*scale), cy-int(60*scale)
    draw.ellipse([ex, ey, ex+int(26*scale), ey+int(26*scale)], fill=PRIMARY_DARK)

    # Slot
    slot_w = int(200*scale)
    draw.rounded_rectangle([cx-int(slot_w/2), cy-int(160*scale), cx+int(slot_w/2), cy-int(130*scale)], radius=int(20*scale), fill=PRIMARY_DARK)

    # Legs
    for i in range(2):
        lx = cx - int(140*scale) + i*int(220*scale)
        draw.rounded_rectangle([lx, cy+int(140*scale), lx+int(70*scale), cy+int(200*scale)], radius=int(18*scale), fill=fill, outline=outline, width=int(8*scale) if outline else 0)


def draw_spark(draw: ImageDraw.ImageDraw, x, y, scale=1.0):
    r = int(16*scale)
    draw.ellipse([x-r, y-r, x+r, y+r], fill=SPARK)
    # tiny rays
    for ang in range(0, 360, 45):
        dx = int(math.cos(math.radians(ang))*r*1.6)
        dy = int(math.sin(math.radians(ang))*r*1.6)
        draw.line([x, y, x+dx, y+dy], fill=SPARK, width=int(4*scale))


def make_icon():
    size = (1024, 1024)
    bg = radial_gradient(size, inner=PRIMARY, outer=PRIMARY_DARK)
    img = bg.convert("RGBA")
    d = ImageDraw.Draw(img)
    draw_piggy(d, 512, 560, scale=1.0, fill=WHITE)
    # Savings arrow/spark
    d.polygon([(370, 380), (520, 260), (550, 290), (475, 350), (610, 350), (610, 390), (420, 390)], fill=ACCENT)
    draw_spark(d, 560, 260, scale=1.2)
    # Soft vignette
    vign = Image.new("L", size, 0)
    vd = ImageDraw.Draw(vign)
    vd.ellipse([80, 80, 944, 944], fill=255)
    vign = vign.filter(ImageFilter.GaussianBlur(50))
    img.putalpha(255)
    img = Image.alpha_composite(Image.new("RGBA", size, (*PRIMARY_DARK, 255)), img)
    img.save(ASSETS/"icon.png")


def make_adaptive_foreground():
    size = (1080, 1080)
    img = Image.new("RGBA", size, (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_piggy(d, 540, 600, scale=1.05, fill=WHITE)
    d.polygon([(400, 420), (560, 290), (590, 320), (510, 390), (650, 390), (650, 430), (450, 430)], fill=ACCENT)
    draw_spark(d, 600, 290, scale=1.3)
    img.save(ASSETS/"adaptive-icon.png")


def make_favicon():
    base = Image.open(ASSETS/"icon.png").convert("RGBA")
    fav = base.resize((256, 256), Image.LANCZOS)
    fav.save(ASSETS/"favicon.png")


def make_splash():
    size = (2048, 4096)  # portrait 1:2
    bg = radial_gradient(size, inner=PRIMARY, outer=PRIMARY_DARK).convert("RGBA")
    img = bg.copy()
    d = ImageDraw.Draw(img)
    # Large center art
    draw_piggy(d, size[0]//2, int(size[1]*0.48), scale=1.6, fill=WHITE)
    d.polygon([(760, 1480), (1020, 1220), (1060, 1260), (930, 1400), (1150, 1400), (1150, 1460), (820, 1460)], fill=ACCENT)
    draw_spark(d, 1080, 1200, scale=2.0)
    # Soft ground shadow
    shadow = Image.new("RGBA", size, (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([700, 1900, 1350, 2000], fill=(0,0,0,60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    img = Image.alpha_composite(img, shadow)
    img.save(ASSETS/"splash.png")


def main():
    print("Generating brand assets in", ASSETS)
    make_icon()
    make_adaptive_foreground()
    make_splash()
    make_favicon()
    print("Done. Updated: icon.png, adaptive-icon.png, splash.png, favicon.png")

if __name__ == "__main__":
    main()
