from pathlib import Path
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


SRC = Path(r"D:\comfyUI\ComfyUI_windows_portable\ComfyUI\output\アンケート企画済\米山VS東金 生成画像1.png")
OUT = Path(__file__).resolve().parents[1] / "output" / "newspaper" / "米山VS東金_見出し以外文字消し_v2.png"


def paper_patch(size, base=(225, 214, 187), seed=0):
    rng = random.Random(seed)
    w, h = size
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[:, :] = base
    noise = np.random.default_rng(seed).normal(0, 8, (h, w, 1))
    arr = np.clip(arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr, "RGB").filter(ImageFilter.GaussianBlur(0.45))
    draw = ImageDraw.Draw(img, "RGBA")
    for _ in range(max(20, w * h // 4200)):
        x = rng.randrange(max(1, w))
        y = rng.randrange(max(1, h))
        r = rng.choice([1, 1, 2])
        tone = rng.choice([(75, 60, 45, 25), (255, 248, 220, 28), (130, 105, 75, 18)])
        draw.ellipse((x - r, y - r, x + r, y + r), fill=tone)
    return img


def blank_panel(img, box, *, border=True, base=(225, 214, 187), seed=0):
    x1, y1, x2, y2 = box
    patch = paper_patch((x2 - x1, y2 - y1), base, seed)
    img.paste(patch, (x1, y1))
    if border:
        d = ImageDraw.Draw(img)
        d.rectangle((x1, y1, x2 - 1, y2 - 1), outline=(30, 28, 22), width=2)


def solid_strip(img, box, color, border=False):
    d = ImageDraw.Draw(img)
    d.rectangle(box, fill=color)
    if border:
        d.rectangle(box, outline=(30, 28, 22), width=2)


def restore(src, dst, box):
    dst.paste(src.crop(box), box[:2])


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    img = src.copy()

    red = (177, 77, 66)
    blue = (18, 69, 94)
    paper = (224, 214, 188)

    # Non-headline date/issue block.
    blank_panel(img, (814, 27, 995, 97), border=False, base=paper, seed=1)

    # Main photo caption: preserve strip shape, remove caption text cleanly.
    solid_strip(img, (21, 947, 398, 990), red)

    # Right article column: blank body but restore the vertical headline on the far right.
    blank_panel(img, (750, 300, 944, 850), border=False, base=paper, seed=2)
    restore(src, img, (940, 104, 1015, 952))

    # Match result module: keep only its header.
    blank_panel(img, (760, 815, 962, 1064), border=True, base=paper, seed=3)
    restore(src, img, (760, 815, 950, 860))

    # Tiny vertical notes around the result module.
    blank_panel(img, (958, 952, 1013, 1065), border=False, base=paper, seed=4)

    # Trial-flow module: keep vertical heading, remove list body.
    blank_panel(img, (62, 1004, 278, 1287), border=True, base=paper, seed=5)
    restore(src, img, (20, 1007, 64, 1285))

    # Lower action photo caption strip.
    solid_strip(img, (286, 1258, 746, 1302), red)

    # Right-lower article: keep red headline, blank article body.
    blank_panel(img, (760, 1070, 1009, 1310), border=True, base=paper, seed=6)
    restore(src, img, (760, 1070, 1008, 1124))

    # Bottom row modules: keep section headings, remove all body text.
    blank_panel(img, (84, 1314, 402, 1467), border=True, base=paper, seed=7)
    restore(src, img, (20, 1314, 86, 1468))

    blank_panel(img, (418, 1314, 602, 1468), border=True, base=paper, seed=8)
    restore(src, img, (418, 1314, 598, 1364))

    blank_panel(img, (611, 1316, 1010, 1468), border=True, base=paper, seed=9)
    restore(src, img, (611, 1316, 1010, 1365))
    # Keep the crowd silhouette at the bottom of this module; it is graphic, not text.
    restore(src, img, (612, 1458, 1010, 1468))

    # Remove any text fragments that peeked just below/above restored headings.
    blank_panel(img, (90, 1360, 398, 1464), border=False, base=paper, seed=10)
    blank_panel(img, (424, 1364, 596, 1464), border=False, base=paper, seed=11)
    blank_panel(img, (616, 1366, 1006, 1458), border=False, base=paper, seed=12)

    # Re-restore heading strips after cleanup.
    restore(src, img, (20, 1314, 86, 1468))
    restore(src, img, (418, 1314, 598, 1364))
    restore(src, img, (611, 1316, 1010, 1365))
    restore(src, img, (612, 1458, 1010, 1468))

    # Preserve top headline area and image areas exactly in case any mask touched them.
    restore(src, img, (0, 0, 1024, 345))
    restore(src, img, (20, 345, 750, 947))
    restore(src, img, (279, 1004, 750, 1258))

    # Final cleanup after restoring headline/photo regions.
    ImageDraw.Draw(img).rectangle((818, 29, 1000, 97), fill=paper)
    blank_panel(img, (826, 300, 940, 345), border=False, base=paper, seed=22)

    img.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
