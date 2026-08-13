#!/usr/bin/env python3
# 骆芷蝶智选 · 秋冬主题企划板（本地排版，无需 API key）
import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/workspace/choiceTob-new/autumn-winter/plans"
os.makedirs(OUT, exist_ok=True)

PRIMARY = "#2d1b2e"   # 深酒紫 品牌主色
GOLD = "#C9A24B"
WHITE = "#FFFFFF"
PALE = "#E9DEE2"
MUTED = "#B9A9B0"
INK = "#1c111d"

FONT_SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
FONT_SERIF = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"


def detect_sc_index(path, test="骆"):
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


def hx(h):
    return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))


def font(path, size, index):
    return ImageFont.truetype(path, size, index=index)


def text_w(draw, text, f):
    b = draw.textbbox((0, 0), text, font=f)
    return b[2] - b[0]


def wrap(draw, text, f, max_w):
    lines, cur = [], ""
    for ch in text:
        if text_w(draw, cur + ch, f) <= max_w:
            cur += ch
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


themes = [
    {
        "no": "01",
        "title": "温柔知性 · 职场通勤",
        "en": "SOFT INTELLECTUAL WORKWEAR",
        "copy": "低饱和暖调，显白提气色；通勤不失温柔，知性里藏着温度。",
        "colors": [
            ("驼色", "#C8A98C"), ("奶油", "#F2E8DC"), ("深酒紫", "#2d1b2e"),
            ("砖红", "#A14A3A"), ("黛绿", "#3B4A3A"),
        ],
        "items": "廓形西装外套 / 高领针织 / 直筒西裤 / 真丝衬衫",
        "fabric": "羊毛混纺 · 重磅真丝 · 精纺棉",
        "tip": "同色系叠穿、金属细节点缀、廓形利落不紧绷。",
    },
    {
        "no": "02",
        "title": "高级感 · 秋冬大衣",
        "en": "REFINED WOOL COATS",
        "copy": "一件大衣撑起整个秋冬；克制的奢华，是高级感的底色。",
        "colors": [
            ("驼色", "#B89B72"), ("酒红", "#6E2A2A"), ("炭灰", "#2D2A28"),
            ("象牙", "#EDE6DD"), ("暖金", "#C9A24B"),
        ],
        "items": "双面羊毛大衣 / 长款围巾 / 高领打底 / 踝靴",
        "fabric": "双面呢 · 羊绒 · 厚织羊毛",
        "tip": "大廓形为主、中性色打底、局部酒红提亮。",
    },
    {
        "no": "03",
        "title": "休闲随性 · 秋冬针织",
        "en": "CASUAL COZY KNIT",
        "copy": "软糯针织包裹的松弛感；周末也要被质感温柔以待。",
        "colors": [
            ("燕麦", "#D8C8B0"), ("暖棕", "#9C7A53"), ("雾蓝", "#8FA3AD"),
            ("深酒紫", "#2d1b2e"), ("米白", "#F2EDE4"),
        ],
        "items": "Oversize 毛衣 / 针织开衫 / 阔腿裤 / 堆堆袜",
        "fabric": "粗针羊毛 · 马海毛 · 抓绒",
        "tip": "软廓形、层叠穿法、低饱和暖调叠搭。",
    },
]


def board(t):
    W, H = 1080, 1440
    bg = Image.new("RGB", (W, H), hx(PRIMARY))
    d = ImageDraw.Draw(bg)

    # 背景极淡大编号（酒紫+金低透明感，用略亮酒紫模拟）
    f_big = font(FONT_SERIF, 360, IDX_SERIF)
    big = t["no"]
    bw = text_w(d, big, f_big)
    d.text((W - bw - 60, 90), big, font=f_big, fill="#3c2740")

    # 顶部品牌行
    f_brand = font(FONT_SERIF, 30, IDX_SERIF)
    d.text((70, 64), "骆芷蝶智选", font=f_brand, fill=WHITE)
    f_tag = font(FONT_SANS, 20, IDX_SANS)
    tag = "AW 秋冬主题企划"
    d.text((W - 70 - text_w(d, tag, f_tag), 72), tag, font=f_tag, fill=GOLD)

    d.line([(70, 116), (W - 70, 116)], fill=GOLD, width=2)

    # 标题
    f_title = font(FONT_SERIF, 58, IDX_SERIF)
    d.text((70, 170), t["title"], font=f_title, fill=WHITE)

    # 英文副标（加空格做字距）
    f_en = font(FONT_SANS, 22, IDX_SANS)
    en = " ".join(t["en"])
    d.text((72, 250), en, font=f_en, fill=GOLD)

    # 调性文案（自动换行）
    f_copy = font(FONT_SANS, 30, IDX_SANS)
    for i, ln in enumerate(wrap(d, t["copy"], f_copy, 940)):
        d.text((72, 300 + i * 44), ln, font=f_copy, fill=PALE)

    # 区块标题样式
    def section_label(x, y, zh, en):
        f1 = font(FONT_SANS, 24, IDX_SANS)
        d.text((x, y), zh, font=f1, fill=GOLD)
        f2 = font(FONT_SANS, 16, IDX_SANS)
        e = "  " + en
        d.text((x + text_w(d, zh, f1) + 14, y + 6), e, font=f2, fill=MUTED)

    # 色彩方案
    section_label(70, 430, "色彩方案", "COLOR PALETTE")
    cols = t["colors"]
    n = len(cols)
    gap = 22
    sw = (W - 140 - (n - 1) * gap) / n
    y0, hh = 480, 150
    for i, (name, h) in enumerate(cols):
        x = 70 + i * (sw + gap)
        d.rounded_rectangle([x, y0, x + sw, y0 + hh], radius=10, fill=h, outline=WHITE, width=2)
        f_n = font(FONT_SANS, 22, IDX_SANS)
        nw = text_w(d, name, f_n)
        d.text((x + (sw - nw) / 2, y0 + hh + 14), name, font=f_n, fill=WHITE)
        f_h = font(FONT_SANS, 17, IDX_SANS)
        hw = text_w(d, h.upper(), f_h)
        d.text((x + (sw - hw) / 2, y0 + hh + 46), h.upper(), font=f_h, fill=MUTED)

    # 核心单品
    section_label(70, 720, "核心单品", "KEY ITEMS")
    f_it = font(FONT_SANS, 28, IDX_SANS)
    d.text((72, 766), t["items"], font=f_it, fill=PALE)

    # 两栏：面料 / 搭配要点
    section_label(70, 880, "面料与质感", "FABRIC")
    f_body = font(FONT_SANS, 26, IDX_SANS)
    for i, ln in enumerate(wrap(d, t["fabric"], f_body, 420)):
        d.text((72, 926 + i * 38), ln, font=f_body, fill=PALE)

    section_label(560, 880, "搭配要点", "STYLING")
    for i, ln in enumerate(wrap(d, t["tip"], f_body, 420)):
        d.text((560, 926 + i * 38), ln, font=f_body, fill=PALE)

    # 底部
    d.line([(70, 1340), (W - 70, 1340)], fill="#5a4250", width=1)
    f_foot = font(FONT_SANS, 20, IDX_SANS)
    foot = "骆芷蝶智选 · 色彩诊断与买手选品体系"
    d.text((W/2 - text_w(d, foot, f_foot)/2, 1368), foot, font=f_foot, fill=MUTED)

    path = os.path.join(OUT, f"aw_plan_{t['no']}.png")
    bg.save(path, "PNG")
    print("saved", path)


for t in themes:
    board(t)
print("DONE")
