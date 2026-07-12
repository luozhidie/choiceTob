#!/usr/bin/env python3
# 用 PIL 生成 骆芷蝶智选 秋冬主题企划板（避开 matplotlib 字体问题）
import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/workspace/choiceTob-new/autumn-winter"
os.makedirs(OUT, exist_ok=True)

PRIMARY = "#2d1b2e"   # 深酒紫 品牌主色
GOLD = "#C9A24B"
WHITE = "#FFFFFF"
PALE = "#E9DEE2"
MUTED = "#B9A9B0"

FONT_SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
FONT_SERIF = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"


def detect_sc_index(path, test="骆"):
    """返回能正确渲染简体中文的 TTC face index"""
    for idx in range(5):
        try:
            font = ImageFont.truetype(path, 60, index=idx)
            im = Image.new("L", (120, 120), 0)
            dr = ImageDraw.Draw(im)
            dr.text((10, 10), test, font=font, fill=255)
            if im.getbbox():
                return idx
        except Exception:
            continue
    return 0

IDX_SANS = detect_sc_index(FONT_SANS)
IDX_SERIF = detect_sc_index(FONT_SERIF)


def hex_to_rgb(h):
    return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))


def fit_text(draw, text, max_w, font_path, index, start_size, min_size=16):
    """文字在指定宽度内自动缩放字号"""
    for size in range(start_size, min_size - 1, -1):
        font = ImageFont.truetype(font_path, size, index=index)
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_w:
            return font
    return ImageFont.truetype(font_path, min_size, index=index)


themes = [
    {
        "no": "01",
        "title": "温柔知性 · 职场通勤",
        "sub": "SOFT INTELLECTUAL WORKWEAR",
        "copy": "低饱和暖调，显白提气色；通勤不失温柔，知性里有温度。",
        "colors": [
            ("驼色", "#C8A98C"), ("咖啡", "#8B6F4E"), ("奶油", "#F2E8DC"),
            ("深酒紫", "#2d1b2e"), ("黛绿", "#3B4A3A"),
        ],
    },
    {
        "no": "02",
        "title": "高级感 · 秋冬大衣",
        "sub": "REFINED WOOL COATS",
        "copy": "廓形利落，质地厚重；一件大衣，撑起整个秋冬的气场。",
        "colors": [
            ("酒红", "#5C2A36"), ("炭灰紫", "#2d1b2e"), ("灰褐", "#9C8B7A"),
            ("象牙", "#EDE6DD"), ("墨绿", "#2F3B30"),
        ],
    },
    {
        "no": "03",
        "title": "休闲随性 · 秋冬针织",
        "sub": "CASUAL COZY KNIT",
        "copy": "软糯针织，松弛有度；周末也要被质感包裹的松弛感。",
        "colors": [
            ("莓果", "#7B2D3A"), ("铁锈", "#B5651D"), ("燕麦", "#D8C8B0"),
            ("雾蓝", "#8FA3AD"), ("深棕", "#4A3526"),
        ],
    },
]


def make_board(t):
    W, H = 1200, 1650
    im = Image.new("RGB", (W, H), hex_to_rgb(PRIMARY))
    draw = ImageDraw.Draw(im)

    # 品牌名
    f_brand = ImageFont.truetype(FONT_SERIF, 56, index=IDX_SERIF)
    bbox = draw.textbbox((0, 0), "骆芷蝶智选", font=f_brand)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 60), "骆芷蝶智选", font=f_brand, fill=WHITE)

    f_sub = ImageFont.truetype(FONT_SANS, 22, index=IDX_SANS)
    sub = "AW 秋冬主题企划 · COLOR STORY"
    bbox = draw.textbbox((0, 0), sub, font=f_sub)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 132), sub, font=f_sub, fill=GOLD)

    # 编号
    f_no = ImageFont.truetype(FONT_SANS, 24, index=IDX_SANS)
    no_txt = f"NO.{t['no']}"
    bbox = draw.textbbox((0, 0), no_txt, font=f_no)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 220), no_txt, font=f_no, fill=GOLD)

    # 大标题（自动缩放，防超长）
    f_title = fit_text(draw, t["title"], W - 120, FONT_SERIF, IDX_SERIF, 52, 34)
    bbox = draw.textbbox((0, 0), t["title"], font=f_title)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 280), t["title"], font=f_title, fill=WHITE)

    # 英文副标题
    f_en = ImageFont.truetype(FONT_SANS, 22, index=IDX_SANS)
    bbox = draw.textbbox((0, 0), t["sub"], font=f_en)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 350), t["sub"], font=f_en, fill=MUTED)

    # 调性文案
    f_copy = ImageFont.truetype(FONT_SANS, 28, index=IDX_SANS)
    bbox = draw.textbbox((0, 0), t["copy"], font=f_copy)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 420), t["copy"], font=f_copy, fill=PALE)

    # 情绪色块（半透明圆叠加）
    import random
    random.seed(int(t["no"]) * 11 + 7)
    mood = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(mood)
    for _ in range(8):
        c = hex_to_rgb(random.choice(t["colors"])[1]) + (130,)
        x = random.randint(120, W - 120)
        y = random.randint(540, 940)
        r = random.randint(90, 180)
        mdraw.ellipse([x - r, y - r, x + r, y + r], fill=c)
    im = Image.alpha_composite(im.convert("RGBA"), mood).convert("RGB")
    draw = ImageDraw.Draw(im)

    # 配色条
    n = len(t["colors"])
    gap = 30
    sw = (W - 120 - (n - 1) * gap) / n
    y0 = 1020
    h = 140
    for i, (name, hexv) in enumerate(t["colors"]):
        x = 60 + i * (sw + gap)
        # 色块
        draw.rounded_rectangle([x, y0, x + sw, y0 + h], radius=12, fill=hexv, outline=WHITE, width=2)
        # 名称
        f_name = ImageFont.truetype(FONT_SANS, 24, index=IDX_SANS)
        bbox = draw.textbbox((0, 0), name, font=f_name)
        nx = x + (sw - (bbox[2] - bbox[0])) / 2
        draw.text((nx, y0 + h + 16), name, font=f_name, fill=WHITE)
        # HEX
        f_hex = ImageFont.truetype(FONT_SANS, 20, index=IDX_SANS)
        bbox = draw.textbbox((0, 0), hexv.upper(), font=f_hex)
        hx = x + (sw - (bbox[2] - bbox[0])) / 2
        draw.text((hx, y0 + h + 52), hexv.upper(), font=f_hex, fill=MUTED)

    # 底部说明
    f_label = ImageFont.truetype(FONT_SANS, 26, index=IDX_SANS)
    bbox = draw.textbbox((0, 0), "配色故事 · 买手选品方向", font=f_label)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 1390), "配色故事 · 买手选品方向", font=f_label, fill=GOLD)

    f_foot = ImageFont.truetype(FONT_SANS, 22, index=IDX_SANS)
    foot = "用于轮播图 / 版块视觉对齐 · 骆芷蝶智选色彩诊断体系"
    bbox = draw.textbbox((0, 0), foot, font=f_foot)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, 1440), foot, font=f_foot, fill=MUTED)

    path = os.path.join(OUT, f"aw_{t['no']}.png")
    im.save(path, "PNG")
    print("saved", path)


for t in themes:
    make_board(t)

print("DONE")
