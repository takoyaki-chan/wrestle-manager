from pathlib import Path
import random

from PIL import Image, ImageDraw
from reportlab.lib import colors
from reportlab.lib.pagesizes import A3
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "newspaper"
OUT_DIR.mkdir(parents=True, exist_ok=True)

PHOTO_1 = Path(r"D:\comfyUI\ComfyUI_windows_portable\ComfyUI\output\米山VS東金 (3) のコピー 2.png")
PHOTO_2 = Path(r"D:\comfyUI\ComfyUI_windows_portable\ComfyUI\output\米山VS東金 (8) のコピー.png")

PDF_PATH = OUT_DIR / "togane_vs_yoneyama_sports_newspaper_editable.pdf"
PREVIEW_PATH = OUT_DIR / "togane_vs_yoneyama_sports_newspaper_preview.png"


def register_fonts():
    pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))
    pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))


def crop_image(src: Path, dst: Path, aspect: float) -> None:
    image = Image.open(src).convert("RGB")
    w, h = image.size
    current = w / h
    if current > aspect:
        new_w = int(h * aspect)
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:
        new_h = int(w / aspect)
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)
    cropped = image.crop(box)
    cropped.save(dst, quality=95)


def add_newsprint_texture(c: canvas.Canvas, width: float, height: float) -> None:
    c.setFillColor(colors.HexColor("#f4eedb"))
    c.rect(0, 0, width, height, stroke=0, fill=1)
    random.seed(7)
    for _ in range(1300):
        x = random.random() * width
        y = random.random() * height
        shade = random.choice(["#d9cfb7", "#e6dcc4", "#cfc2a8"])
        c.setFillColor(colors.HexColor(shade))
        c.setFillAlpha(random.uniform(0.12, 0.28))
        c.circle(x, y, random.uniform(0.08, 0.35), stroke=0, fill=1)
    c.setFillAlpha(1)


def draw_text_box(c, text, x, y, w, h, font, size, leading=None, color=colors.black):
    leading = leading or size * 1.22
    c.setFillColor(color)
    c.setFont(font, size)
    line = ""
    lines = []
    max_chars = max(1, int(w / (size * 0.55)))
    for part in text:
        trial = line + part
        if len(trial) > max_chars and line:
            lines.append(line)
            line = part
        else:
            line = trial
    if line:
        lines.append(line)

    ty = y + h - size
    for line in lines:
        if ty < y:
            break
        c.drawString(x, ty, line)
        ty -= leading


def draw_caption(c, text, x, y, w):
    c.setFillColor(colors.black)
    c.rect(x, y, w, 18, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("HeiseiKakuGo-W5", 8.5)
    c.drawString(x + 5, y + 5, text)


def draw_pdf() -> None:
    register_fonts()

    width, height = A3
    main_photo = OUT_DIR / "main_photo_crop.jpg"
    sub_photo = OUT_DIR / "sub_photo_crop.jpg"
    crop_image(PHOTO_2, main_photo, 1.42)
    crop_image(PHOTO_1, sub_photo, 0.86)

    c = canvas.Canvas(str(PDF_PATH), pagesize=A3)
    add_newsprint_texture(c, width, height)

    margin = 18 * mm
    red = colors.HexColor("#c40012")
    yellow = colors.HexColor("#ffe02e")
    dark = colors.HexColor("#161616")

    c.setFillColor(dark)
    c.rect(margin, height - 35 * mm, width - margin * 2, 20 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("HeiseiKakuGo-W5", 34)
    c.drawString(margin + 8 * mm, height - 28 * mm, "地下リングスポーツ")
    c.setFillColor(yellow)
    c.setFont("HeiseiKakuGo-W5", 12)
    c.drawRightString(width - margin - 8 * mm, height - 24 * mm, "女子地下プロレス特報")
    c.drawRightString(width - margin - 8 * mm, height - 30 * mm, "独占マッチリポート")

    c.setFillColor(red)
    c.rect(margin, height - 69 * mm, width - margin * 2, 29 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("HeiseiKakuGo-W5", 48)
    c.drawString(margin + 7 * mm, height - 58 * mm, "東金、米山を完全制圧")

    c.setFillColor(dark)
    c.setFont("HeiseiKakuGo-W5", 17)
    c.drawString(
        margin + 2 * mm,
        height - 78 * mm,
        "終始主導権を握った沙織が一方的な蹂躙劇を締める",
    )

    photo_x = margin
    photo_y = height - 202 * mm
    photo_w = width - margin * 2
    photo_h = 114 * mm
    c.setStrokeColor(dark)
    c.setLineWidth(2)
    c.rect(photo_x - 2, photo_y - 2, photo_w + 4, photo_h + 4, stroke=1, fill=0)
    c.drawImage(str(main_photo), photo_x, photo_y, photo_w, photo_h, preserveAspectRatio=False, mask="auto")
    draw_caption(c, "勝利を確信した東金、リング中央で冷然", photo_x, photo_y - 18, photo_w)

    result_x = margin
    result_y = photo_y - 58
    result_w = photo_w
    c.setFillColor(yellow)
    c.rect(result_x, result_y, result_w, 34, stroke=0, fill=1)
    c.setStrokeColor(dark)
    c.setLineWidth(1.5)
    c.rect(result_x, result_y, result_w, 34, stroke=1, fill=0)
    c.setFillColor(dark)
    c.setFont("HeiseiKakuGo-W5", 24)
    c.drawCentredString(result_x + result_w / 2, result_y + 9, "東金沙織 ○    米山杏里 ●")

    sub_x = margin
    sub_y = margin + 72 * mm
    sub_w = 72 * mm
    sub_h = 84 * mm
    c.setStrokeColor(dark)
    c.setLineWidth(1.4)
    c.rect(sub_x - 1.5, sub_y - 1.5, sub_w + 3, sub_h + 3, stroke=1, fill=0)
    c.drawImage(str(sub_photo), sub_x, sub_y, sub_w, sub_h, preserveAspectRatio=False, mask="auto")
    draw_caption(c, "米山、反撃の糸口をつかめず", sub_x, sub_y - 18, sub_w)

    body = (
        "地下リングで行われた米山杏里対東金沙織の一戦は、開始直後から東金が圧力をかけ続ける展開となった。"
        "米山は序盤に腕を取り返そうと試みたが、東金は冷静に体勢を崩し、ロープ際でも中央でも主導権を渡さない。"
        "観客席のざわめきが大きくなる中、東金は一つひとつの攻めを確実につなぎ、米山の反撃を封じ込めた。"
        "終盤、消耗の色が濃くなった米山に対し、東金はなおもペースを落とさず、リング中央で勝負を決定づけた。"
        "試合後の東金は余裕を崩さず、圧倒的な勝利を印象づけた。"
    )
    col_x = sub_x + sub_w + 11 * mm
    col_y = margin + 32 * mm
    col_w = (width - margin - col_x - 8 * mm) / 2
    col_h = 126 * mm
    draw_text_box(c, body[:82], col_x, col_y, col_w, col_h, "HeiseiMin-W3", 10.5, leading=16)
    draw_text_box(c, body[82:], col_x + col_w + 8 * mm, col_y, col_w, col_h, "HeiseiMin-W3", 10.5, leading=16)

    c.setFillColor(red)
    c.rect(margin, margin + 18 * mm, width - margin * 2, 8 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("HeiseiKakuGo-W5", 10)
    c.drawString(margin + 4 * mm, margin + 20.5 * mm, "紙面データ: 写真・見出し・本文・結果欄を別要素として再構成")

    c.showPage()
    c.save()


def draw_preview() -> None:
    # A quick raster reference for file browsers; the PDF is the editable deliverable.
    image = Image.open(PHOTO_2).convert("RGB")
    image.thumbnail((900, 640))
    preview = Image.new("RGB", (900, 1273), "#f4eedb")
    draw = ImageDraw.Draw(preview)
    draw.rectangle((35, 30, 865, 105), fill="#161616")
    draw.text((55, 48), "地下リングスポーツ", fill="white")
    draw.rectangle((35, 125, 865, 210), fill="#c40012")
    draw.text((55, 155), "東金、米山を完全制圧", fill="white")
    preview.paste(image, (35, 250))
    draw.rectangle((35, 930, 865, 990), fill="#ffe02e", outline="#161616")
    draw.text((250, 950), "東金沙織 ○    米山杏里 ●", fill="#161616")
    preview.save(PREVIEW_PATH)


if __name__ == "__main__":
    draw_pdf()
    draw_preview()
    print(PDF_PATH)
    print(PREVIEW_PATH)
