#!/usr/bin/env python3
"""
KotaKu Siaga — Master Cinematic Product Introduction & Client Pitch Video Generator
Renders a 60.0-second, 30 FPS Full HD (1920x1080) video following the 8-scene master storyboard:
  Scene 01: Product Reveal (0.0s - 6.0s)
  Scene 02: The Real-World Problem (6.0s - 13.0s)
  Scene 03: Data Ingestion (13.0s - 21.0s)
  Scene 04: Intelligent Verification (21.0s - 31.0s)
  Scene 05: Map + CCTV Correlation (31.0s - 41.0s)
  Scene 06: Operational Dashboard (41.0s - 50.0s)
  Scene 07: Decision Support (50.0s - 55.0s)
  Scene 08: Final Product Shot (55.0s - 60.0s)
Total: 1800 frames @ 30 FPS
"""

import os
import sys
import math
import shutil
import time
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

# Video Configuration
WIDTH = 1920
HEIGHT = 1080
FPS = 30
DURATION_SEC = 60.0
TOTAL_FRAMES = int(DURATION_SEC * FPS)  # 1800 frames

# Color Palette (KotaKu Siaga Editorial Brand Identity)
AUBERGINE_DARK = (28, 6, 30)        # #1c061e
AUBERGINE_MID = (54, 15, 56)         # #360f38
AUBERGINE_PRIMARY = (74, 21, 75)     # #4a154b
AUBERGINE_PRESS = (97, 31, 105)      # #611f69
AUBERGINE_LIGHT = (120, 50, 125)
CREAM = (244, 237, 228)              # #f4ede4
LAVENDER = (249, 240, 255)           # #f9f0ff
WHITE = (255, 255, 255)
INK = (29, 29, 29)                   # #1d1d1d
MUTED = (105, 105, 105)              # #696969
EMERALD = (0, 122, 90)               # #007a5a
EMERALD_BG = (235, 247, 243)
AMBER = (217, 119, 6)                # #d97706
AMBER_BG = (254, 243, 199)
CRIMSON = (204, 65, 23)              # #cc4117
CRIMSON_BG = (253, 240, 236)
LINK_BLUE = (18, 100, 163)           # #1264a3
BORDER_LIGHT = (230, 230, 230)

# Fonts Loading
FONT_BOLD_PATH = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG_PATH = "C:/Windows/Fonts/segoeui.ttf"

def get_font(size: int, bold: bool = False):
    path = FONT_BOLD_PATH if bold else FONT_REG_PATH
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

f_hero = get_font(76, bold=True)
f_display = get_font(64, bold=True)
f_title_lg = get_font(38, bold=True)
f_title_md = get_font(28, bold=True)
f_heading = get_font(22, bold=True)
f_subhead = get_font(18, bold=False)
f_body_bold = get_font(15, bold=True)
f_body = get_font(14, bold=False)
f_caption = get_font(12, bold=False)
f_caption_bold = get_font(12, bold=True)
f_micro = get_font(10, bold=True)

# Easing Helpers
def ease_in_out_cubic(x: float) -> float:
    return 4 * x * x * x if x < 0.5 else 1 - math.pow(-2 * x + 2, 3) / 2

def ease_out_quad(x: float) -> float:
    return 1 - (1 - x) * (1 - x)

def ease_out_cubic(x: float) -> float:
    return 1 - math.pow(1 - x, 3)

# Base Canvas Gradient
cx, cy = WIDTH // 2, HEIGHT // 2
base_bg = Image.new("RGB", (WIDTH, HEIGHT), AUBERGINE_DARK)
draw_bg = ImageDraw.Draw(base_bg)
for r in range(1200, 0, -25):
    t_rad = r / 1200.0
    r_val = int(AUBERGINE_DARK[0] * t_rad + AUBERGINE_MID[0] * (1 - t_rad))
    g_val = int(AUBERGINE_DARK[1] * t_rad + AUBERGINE_MID[1] * (1 - t_rad))
    b_val = int(AUBERGINE_DARK[2] * t_rad + AUBERGINE_MID[2] * (1 - t_rad))
    draw_bg.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(r_val, g_val, b_val))

for x in range(0, WIDTH, 64):
    draw_bg.line([(x, 0), (x, HEIGHT)], fill=(244, 237, 228, 8), width=1)
for y in range(0, HEIGHT, 64):
    draw_bg.line([(0, y), (WIDTH, y)], fill=(244, 237, 228, 8), width=1)

# Pre-load CCTV Snapshots
cctv_snapshot = None
snap_path = os.path.join(os.getcwd(), "public", "evidence", "flood_414_321_1789291801.jpg")
if os.path.exists(snap_path):
    try:
        raw_img = Image.open(snap_path).convert("RGB")
        cctv_snapshot = raw_img.resize((500, 260), Image.Resampling.LANCZOS)
    except Exception as e:
        print(f"Notice: Could not load snapshot: {e}")

# Header Bar Helper
def draw_header_bar(draw: ImageDraw.ImageDraw, t_sec: float, scene_label: str):
    draw.ellipse([48, 34, 58, 44], fill=EMERALD)
    draw.text((68, 30), "KOTAKU SIAGA — DISASTER INTELLIGENCE ENGINE", font=f_caption_bold, fill=CREAM)
    draw.text((cx, 30), scene_label, font=f_micro, fill=LAVENDER, anchor="mm")
    draw.text((WIDTH - 48, 30), f"SEC: {t_sec:04.1f}s / {DURATION_SEC:.1f}s | SEMARANG, ID", font=f_caption, fill=CREAM, anchor="ra")
    draw.line([(48, 56), (WIDTH - 48, 56)], fill=(244, 237, 228, 25), width=1)

# ====================================================================
# SCENE 01: PRODUCT REVEAL (0.0s - 6.0s)
# ====================================================================
def render_scene_1(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = t / 6.0
    fade = min(1.0, p / 0.15) if p < 0.2 else (1.0 - (p - 0.85) / 0.15) if p > 0.85 else 1.0

    draw_header_bar(draw, t, "SCENE 01: PRODUCT REVEAL")

    # Zoom scale effect
    scale_off = int(ease_out_quad(p) * 20)

    # Logo Box
    bw, bh = 114, 114
    bx = cx - bw // 2
    by = cy - 210 + scale_off
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=28, fill=AUBERGINE_PRIMARY, outline=CREAM, width=2)

    # Shield graphic
    shield_pts = [
        (cx, by + 28),
        (cx + 28, by + 38),
        (cx + 28, by + 66),
        (cx, by + 96),
        (cx - 28, by + 66),
        (cx - 28, by + 38),
    ]
    draw.polygon(shield_pts, fill=CREAM)
    draw.ellipse([cx - 9, by + 56, cx + 9, by + 74], fill=AUBERGINE_PRIMARY)
    draw.ellipse([bx + bw - 18, by + 12, bx + bw - 6, by + 24], fill=EMERALD)

    # Titles
    draw.text((cx, cy - 24 + scale_off), "KotaKu Siaga", font=f_hero, fill=WHITE, anchor="mm")
    draw.text((cx, cy + 48 + scale_off), "Real-Time Monitoring & Intelligent Decision Support", font=f_heading, fill=LAVENDER, anchor="mm")
    draw.text((cx, cy + 86 + scale_off), "Civic Climate & Urban Disaster Intelligence Platform for Kota Semarang", font=f_subhead, fill=CREAM, anchor="mm")

    # Chips
    chips = ["PEMERINTAH KOTA SEMARANG", "70 TITIK CCTV PANTAUSEMAR", "EXPLAINABLE RISK ENGINE", "NO DUMMY DATA"]
    pill_y = cy + 150 + scale_off
    tot_w = sum(len(c) * 9 + 40 for c in chips)
    cur_x = cx - tot_w // 2

    for chip in chips:
        cw = len(chip) * 9 + 32
        draw.rounded_rectangle([cur_x, pill_y, cur_x + cw, pill_y + 36], radius=18, fill=AUBERGINE_PRIMARY, outline=(237, 220, 247), width=1)
        draw.text((cur_x + cw // 2, pill_y + 18), chip, font=f_caption_bold, fill=CREAM, anchor="mm")
        cur_x += cw + 14

# ====================================================================
# SCENE 02: THE REAL-WORLD PROBLEM (6.0s - 13.0s)
# ====================================================================
def render_scene_2(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 6.0) / 7.0
    is_chaos = p < 0.50
    settle = 0.0 if is_chaos else ease_in_out_cubic((p - 0.50) / 0.50)

    draw_header_bar(draw, t, "SCENE 02: THE REAL-WORLD PROBLEM")

    if is_chaos:
        draw.text((cx, 105), "From fragmented information...", font=f_title_lg, fill=LAVENDER, anchor="mm")
        draw.text((cx, 148), "Too many disconnected sources. Slow manual verification. High operational blindspots.", font=f_subhead, fill=(244, 237, 228), anchor="mm")
    else:
        draw.text((cx, 105), "...to one centralized operational view.", font=f_title_lg, fill=WHITE, anchor="mm")
        draw.text((cx, 148), "Cross-source correlation transforms isolated signals into situational awareness.", font=f_subhead, fill=EMERALD, anchor="mm")

    cards = [
        {"title": "LAPORAN WARGA", "desc": "Genangan Rob 45cm di Tanjung Mas", "meta": "Coord: -6.9554, 110.4182 | GPS Unverified", "color": CRIMSON, "cx": 340, "cy": 330, "tx": 380, "ty": 340},
        {"title": "CCTV PANTAUSEMAR", "desc": "Kamera PS-GEN-321 Kaligawe", "meta": "70 titik HLS stream terpisah tanpa agregasi", "color": AMBER, "cx": 1420, "cy": 320, "tx": 960, "ty": 340},
        {"title": "BMKG RADAR MARITIM", "desc": "Curah Hujan 65mm / Jam + Pasang Rob", "meta": "Stasiun Maritim Pelabuhan Tanjung Emas", "color": LINK_BLUE, "cx": 360, "cy": 720, "tx": 1540, "ty": 340},
        {"title": "TELEMETRI POLDER BBWS", "desc": "Polder Tenggang & Sringin Aktif", "meta": "Debit Muka Air Sungai Meluap", "color": AUBERGINE_PRIMARY, "cx": 1440, "cy": 700, "tx": 670, "ty": 620},
        {"title": "TOPOGRAFI & DEMNAS", "desc": "Elevasi Rendah 1.8m DPL", "meta": "Kemiringan lereng & kerentanan historis", "color": EMERALD, "cx": 900, "cy": 840, "tx": 1250, "ty": 620},
    ]

    card_w, card_h = 440, 195
    for card in cards:
        curr_x = int(card["cx"] + (card["tx"] - card["cx"]) * settle)
        curr_y = int(card["cy"] + (card["ty"] - card["cy"]) * settle)

        x0, y0 = curr_x - card_w // 2, curr_y - card_h // 2
        x1, y1 = curr_x + card_w // 2, curr_y + card_h // 2

        draw.rounded_rectangle([x0, y0, x1, y1], radius=16, fill=WHITE, outline=BORDER_LIGHT if is_chaos else AUBERGINE_PRIMARY, width=2)
        draw.rounded_rectangle([x0, y0, x0 + 8, y1], radius=4, fill=card["color"])

        draw.text((x0 + 24, y0 + 24), card["title"], font=f_caption_bold, fill=card["color"])
        draw.text((x0 + 24, y0 + 56), card["desc"], font=f_heading, fill=INK)
        draw.text((x0 + 24, y0 + 94), card["meta"], font=f_body, fill=MUTED)

        badge_text = "DISCONNECTED" if is_chaos else "SYNCHRONIZED"
        badge_col = CRIMSON if is_chaos else EMERALD
        badge_bg = CRIMSON_BG if is_chaos else EMERALD_BG
        draw.rounded_rectangle([x0 + 24, y0 + 138, x0 + 180, y0 + 168], radius=6, fill=badge_bg)
        draw.text((x0 + 36, y0 + 146), f"● {badge_text}", font=f_caption_bold, fill=badge_col)

# ====================================================================
# SCENE 03: DATA INGESTION (13.0s - 21.0s)
# ====================================================================
def render_scene_3(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 13.0) / 8.0

    draw_header_bar(draw, t, "SCENE 03: MULTI-SOURCE DATA INGESTION")

    draw.text((cx, 100), "Multi-Source Data Ingestion Architecture", font=f_title_lg, fill=WHITE, anchor="mm")
    draw.text((cx, 144), "Ingesting live civic telemetry, government sensor APIs, radar, and CCTV streams without mock data", font=f_subhead, fill=LAVENDER, anchor="mm")

    core_x, core_y = cx, 550
    cr = 115
    draw.ellipse([core_x - cr - 35, core_y - cr - 35, core_x + cr + 35, core_y + cr + 35], outline=(237, 220, 247), width=1)
    draw.ellipse([core_x - cr, core_y - cr, core_x + cr, core_y + cr], fill=AUBERGINE_PRIMARY, outline=CREAM, width=2)
    draw.text((core_x, core_y - 24), "DISASTER", font=f_heading, fill=WHITE, anchor="mm")
    draw.text((core_x, core_y + 4), "INTELLIGENCE CORE", font=f_caption_bold, fill=CREAM, anchor="mm")
    draw.text((core_x, core_y + 32), "● 8 LIVE SOURCES", font=f_caption_bold, fill=EMERALD, anchor="mm")

    sources = [
        {"name": "LAPORAN WARGA", "sub": "GPS Geo-Tagged + Foto + Time", "x": 280, "y": 320, "color": CRIMSON, "lat": "42ms"},
        {"name": "CCTV PANTAUSEMAR", "sub": "70 Titik Live Stream HLS", "x": 280, "y": 720, "color": AMBER, "lat": "95ms"},
        {"name": "OPEN-METEO & BMKG", "sub": "Curah Hujan & Gelombang Laut", "x": 1640, "y": 320, "color": LINK_BLUE, "lat": "284ms"},
        {"name": "DEMNAS ELEVASI", "sub": "Topografi & Jaringan Drainase", "x": 1640, "y": 720, "color": EMERALD, "lat": "12ms"},
    ]

    bw, bh = 340, 115
    for idx, s in enumerate(sources):
        draw.line([(s["x"], s["y"]), (core_x, core_y)], fill=(120, 60, 125), width=2)

        # Traveling Data Packets
        pt = ((p * 4.0 + idx * 0.25) % 1.0)
        px = int(s["x"] + (core_x - s["x"]) * pt)
        py = int(s["y"] + (core_y - s["y"]) * pt)
        draw.ellipse([px - 9, py - 9, px + 9, py + 9], fill=s["color"], outline=WHITE, width=2)

        x0, y0 = s["x"] - bw // 2, s["y"] - bh // 2
        x1, y1 = s["x"] + bw // 2, s["y"] + bh // 2
        draw.rounded_rectangle([x0, y0, x1, y1], radius=16, fill=WHITE, outline=s["color"], width=2)
        draw.text((x0 + 20, y0 + 22), s["name"], font=f_body_bold, fill=s["color"])
        draw.text((x0 + 20, y0 + 52), s["sub"], font=f_body, fill=MUTED)

        draw.rounded_rectangle([x1 - 105, y0 + 16, x1 - 18, y0 + 42], radius=6, fill=EMERALD_BG)
        draw.text((x1 - 61, y0 + 29), f"LAT: {s['lat']}", font=f_micro, fill=EMERALD, anchor="mm")

    # Bottom Architecture Ribbon
    draw.rounded_rectangle([cx - 500, 920, cx + 500, 975], radius=24, fill=AUBERGINE_PRIMARY, outline=(237, 220, 247), width=1)
    draw.text((cx, 947), "DATA PROVENANCE: Every record tracks source, timestamp, latency, freshness, and quality status", font=f_body, fill=CREAM, anchor="mm")

# ====================================================================
# SCENE 04: INTELLIGENT VERIFICATION (21.0s - 31.0s)
# ====================================================================
def render_scene_4(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 21.0) / 10.0

    draw_header_bar(draw, t, "SCENE 04: INTELLIGENT VERIFICATION")

    draw.text((cx, 90), "Intelligent Multi-Signal Verification Pipeline", font=f_title_lg, fill=WHITE, anchor="mm")
    draw.text((cx, 130), "Cross-correlating incoming citizen evidence with sensor telemetry and AI-assisted analysis", font=f_subhead, fill=LAVENDER, anchor="mm")

    stages = [
        ("01. INCOMING REPORT", "Kaligawe, Rob 45cm", p >= 0.1),
        ("02. GPS BOUNDS", "Kec. Semarang Utara", p >= 0.3),
        ("03. TIME & WEATHER", "BMKG Hujan 65mm/h", p >= 0.5),
        ("04. SENSOR & CCTV", "Kamera PS-GEN-321", p >= 0.7),
        ("05. RISK SCORING", "7-Faktor Terverifikasi", p >= 0.88),
    ]

    sw, sh = 310, 105
    total_sw = len(stages) * sw + (len(stages) - 1) * 20
    start_x = cx - total_sw // 2
    sy = 170

    for idx, (st_name, st_desc, is_act) in enumerate(stages):
        x0 = start_x + idx * (sw + 20)
        x1 = x0 + sw
        y0, y1 = sy, sy + sh

        draw.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=WHITE if is_act else (54, 15, 56), outline=EMERALD if is_act else (120, 60, 125), width=2)
        draw.text((x0 + 18, y0 + 18), st_name, font=f_heading, fill=AUBERGINE_PRIMARY if is_act else CREAM)
        draw.text((x0 + 18, y0 + 54), st_desc, font=f_body, fill=MUTED if is_act else (220, 200, 230))
        status_txt = "PASSED" if is_act else "PENDING"
        draw.text((x1 - 18, y0 + 18), status_txt, font=f_caption_bold, fill=EMERALD if is_act else MUTED, anchor="ra")

    # Diagnostic Box
    diag_w, diag_h = 1040, 470
    dx0, dy0 = cx - diag_w // 2, 315
    dx1, dy1 = dx0 + diag_w, dy0 + diag_h

    draw.rounded_rectangle([dx0, dy0, dx1, dy1], radius=24, fill=WHITE, outline=AUBERGINE_PRIMARY, width=2)
    draw.text((dx0 + 40, dy0 + 36), "VERIFIKASI BUKTI INSIDEN: JL. RAYA KALIGAWE (GENUK)", font=f_heading, fill=AUBERGINE_PRIMARY)
    draw.text((dx0 + 40, dy0 + 68), "Camera: PS-GEN-321 | Koordinat: -6.9542, 110.4721 | Waktu: 19:42 WIB", font=f_body, fill=MUTED)

    bars = [
        ("1. Deteksi Visual Genangan (PantauSemar Classical CV)", 0.94, "94%", AUBERGINE_PRIMARY),
        ("2. Presipitasi Aktual BMKG Radar Maritim (65 mm/jam)", 0.88, "88%", LINK_BLUE),
        ("3. Elevasi DEMNAS & Kedekatan Sungai Sringin (140m)", 0.93, "93%", EMERALD),
    ]

    for bidx, (bname, bval, blabel, bcol) in enumerate(bars):
        by = dy0 + 120 + bidx * 75
        draw.text((dx0 + 40, by), bname, font=f_body_bold, fill=INK)

        tw = 540
        draw.rounded_rectangle([dx0 + 40, by + 24, dx0 + 40 + tw, by + 38], radius=7, fill=(240, 240, 240))
        cur_fill = min(1.0, p * 2.2 if bidx == 0 else p * 1.5 if bidx == 1 else p * 1.2) * bval
        fw = int(tw * cur_fill)
        if fw > 0:
            draw.rounded_rectangle([dx0 + 40, by + 24, dx0 + 40 + fw, by + 38], radius=7, fill=bcol)
        draw.text((dx0 + 40 + tw + 18, by + 22), blabel, font=f_body_bold, fill=INK)

    # Circular Confidence Score
    score_cx, score_cy = dx0 + 820, dy0 + 205
    draw.ellipse([score_cx - 85, score_cy - 85, score_cx + 85, score_cy + 85], outline=(230, 230, 230), width=16)
    draw.ellipse([score_cx - 85, score_cy - 85, score_cx + 85, score_cy + 85], outline=EMERALD if p >= 0.85 else AMBER, width=16)
    score_disp = "91.8%" if p >= 0.88 else f"{min(91.8, p * 110):.1f}%"
    draw.text((score_cx, score_cy - 8), score_disp, font=f_title_lg, fill=INK, anchor="mm")
    draw.text((score_cx, score_cy + 32), "CONFIDENCE SCORE", font=f_caption_bold, fill=MUTED, anchor="mm")

    is_verif = p >= 0.85
    banner_bg = EMERALD_BG if is_verif else AMBER_BG
    banner_border = EMERALD if is_verif else AMBER
    draw.rounded_rectangle([dx0 + 40, dy0 + 375, dx1 - 40, dy0 + 438], radius=12, fill=banner_bg, outline=banner_border, width=2)
    b_text = "✓ STATUS: TERVERIFIKASI (AI-Assisted Analysis)" if is_verif else "⏳ STATUS: ANALISIS VALIDASI SEDANG BERJALAN..."
    draw.text((dx0 + 60, dy0 + 406), b_text, font=f_heading, fill=banner_border, anchor="lm")
    draw.text((dx1 - 60, dy0 + 406), "Assist Human Operators • Verifikasi Multi-Sinyal Terkonfirmasi", font=f_caption, fill=MUTED, anchor="rm")

# ====================================================================
# SCENE 05: MAP + CCTV CORRELATION (31.0s - 41.0s)
# ====================================================================
def render_scene_5(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 31.0) / 10.0

    draw_header_bar(draw, t, "SCENE 05: SPATIAL-TEMPORAL CCTV CORRELATION")

    map_x, map_y = 60, 85
    map_w, map_h = 1800, 930
    draw.rounded_rectangle([map_x, map_y, map_x + map_w, map_y + map_h], radius=24, fill=(30, 26, 34), outline=AUBERGINE_MID, width=2)

    # Coastline (Laut Jawa)
    draw.polygon([(map_x, map_y), (map_x + map_w, map_y), (map_x + map_w, map_y + 200), (map_x, map_y + 240)], fill=(20, 32, 43))
    draw.text((cx, map_y + 75), "LAUT JAWA (PESISIR SEMARANG UTARA)", font=f_heading, fill=(40, 80, 120), anchor="mm")

    # Major Rivers
    draw.line([(map_x + 440, map_y + 220), (map_x + 480, map_y + map_h)], fill=LINK_BLUE, width=10) # BKB
    draw.line([(map_x + 1080, map_y + 240), (map_x + 1020, map_y + map_h)], fill=LINK_BLUE, width=10) # BKT
    draw.line([(map_x + 1380, map_y + 230), (map_x + 1320, map_y + map_h)], fill=LINK_BLUE, width=10) # Kali Tenggang

    # Arterials
    draw.line([(map_x, map_y + 300), (map_x + map_w, map_y + 280)], fill=(80, 80, 85), width=6) # Kaligawe
    draw.line([(map_x + 400, map_y + 780), (map_x + map_w, map_y + 700)], fill=(80, 80, 85), width=6) # Majapahit
    draw.line([(map_x + 1280, map_y + 540), (map_x + 1240, map_y + 900)], fill=(120, 120, 125), width=8) # Supriyadi

    draw.text((map_x + 600, map_y + 290), "JL. KALIGAWE RAYA (PANTURA)", font=f_caption_bold, fill=(180, 180, 180))
    draw.text((map_x + 800, map_y + 760), "JL. MAJAPAHIT", font=f_caption_bold, fill=(180, 180, 180))
    draw.text((map_x + 1300, map_y + 660), "JL. SUPRIYADI", font=f_caption_bold, fill=CREAM)

    # City CCTV points
    cctv_dots = [
        ("Simpang Lima", map_x + 760, map_y + 600),
        ("Tugu Muda", map_x + 560, map_y + 560),
        ("Kaligawe Genuk", map_x + 1440, map_y + 300),
        ("Tanjung Emas Pos 4", map_x + 880, map_y + 260),
    ]
    for dname, dx, dy in cctv_dots:
        draw.ellipse([dx - 6, dy - 6, dx + 6, dy + 6], fill=EMERALD)
        draw.text((dx + 12, dy - 8), dname, font=f_caption, fill=(200, 200, 200))

    # Correlation Focus
    inc_x, inc_y = map_x + 1260, map_y + 680
    cctv_x, cctv_y = map_x + 1235, map_y + 610

    pulse_r = int(((p * 4.0) % 1.0) * 180)
    draw.ellipse([inc_x - pulse_r, inc_y - pulse_r, inc_x + pulse_r, inc_y + pulse_r], outline=CRIMSON, width=2)
    draw.ellipse([inc_x - 140, inc_y - 140, inc_x + 140, inc_y + 140], outline=AMBER, width=2)

    # Distance vector
    draw.line([(inc_x, inc_y), (cctv_x, cctv_y)], fill=EMERALD, width=4)
    draw.rounded_rectangle([(inc_x + cctv_x) // 2 - 40, (inc_y + cctv_y) // 2 - 14, (inc_x + cctv_x) // 2 + 40, (inc_y + cctv_y) // 2 + 14], radius=6, fill=AUBERGINE_PRIMARY)
    draw.text(((inc_x + cctv_x) // 2, (inc_y + cctv_y) // 2), "140m", font=f_caption_bold, fill=WHITE, anchor="mm")

    draw.ellipse([cctv_x - 14, cctv_y - 14, cctv_x + 14, cctv_y + 14], fill=EMERALD, outline=WHITE, width=2)
    draw.text((cctv_x, cctv_y), "CAM", font=f_micro, fill=WHITE, anchor="mm")

    draw.ellipse([inc_x - 16, inc_y - 16, inc_x + 16, inc_y + 16], fill=CRIMSON, outline=WHITE, width=2)
    draw.text((inc_x, inc_y), "!", font=f_body_bold, fill=WHITE, anchor="mm")

    # Floating CCTV Inspection Modal
    mx0, my0 = map_x + 48, map_y + 48
    mw, mh = 560, 530
    draw.rounded_rectangle([mx0, my0, mx0 + mw, my0 + mh], radius=20, fill=WHITE, outline=AUBERGINE_PRIMARY, width=2)
    draw.text((mx0 + 24, my0 + 32), "PANTAUSEMAR CCTV INSPECTION", font=f_heading, fill=AUBERGINE_PRIMARY)
    draw.text((mx0 + mw - 24, my0 + 32), "● LIVE STREAM FHD", font=f_caption_bold, fill=EMERALD, anchor="ra")

    fx0, fy0 = mx0 + 24, my0 + 64
    if cctv_snapshot:
        img.paste(cctv_snapshot, (fx0, fy0))
    else:
        draw.rectangle([fx0, fy0, fx0 + 500, fy0 + 260], fill=(20, 20, 20))
        draw.text((fx0 + 250, fy0 + 130), "CCTV FEED PS-GEN-321", font=f_heading, fill=WHITE, anchor="mm")

    draw.rectangle([fx0 + 40, fy0 + 80, fx0 + 460, fy0 + 240], outline=EMERALD, width=2)
    draw.rectangle([fx0 + 40, fy0 + 55, fx0 + 240, fy0 + 80], fill=EMERALD)
    draw.text((fx0 + 48, fy0 + 62), "WATER SURFACE REFLECTION", font=f_caption_bold, fill=WHITE)

    draw.text((mx0 + 24, my0 + 348), "KALIGAWE (Kec. Genuk)", font=f_heading, fill=INK)
    draw.text((mx0 + 24, my0 + 380), "Diskominfo Kota Semarang | 1080p FHD HLS Stream", font=f_body, fill=MUTED)

    draw.rounded_rectangle([mx0 + 24, my0 + 420, mx0 + mw - 24, my0 + 495], radius=12, fill=LAVENDER)
    draw.text((mx0 + mw // 2, my0 + 442), "SYNCHRONIZED CONTEXTUAL EVIDENCE", font=f_caption_bold, fill=AUBERGINE_PRIMARY, anchor="mm")
    draw.text((mx0 + mw // 2, my0 + 470), "Location: -6.9542, 110.4721 ↔ PS-GEN-321 ↔ 19:42 WIB", font=f_caption, fill=MUTED, anchor="mm")

# ====================================================================
# SCENE 06: OPERATIONAL DASHBOARD (41.0s - 50.0s)
# ====================================================================
def render_scene_6(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 41.0) / 9.0

    draw_header_bar(draw, t, "SCENE 06: SEMARANG DISASTER OPERATIONS CENTER (EOC)")

    draw.text((cx, 88), "SEMARANG DISASTER OPERATIONS CENTER (EOC)", font=f_title_lg, fill=WHITE, anchor="mm")
    draw.text((cx, 126), "One screen. One operational picture. Transparent 7-factor explainable risk scoring.", font=f_subhead, fill=LAVENDER, anchor="mm")

    # 4 Top KPI Cards
    kpis = [
        ("SKOR RISIKO MULTIVARIAT", "73.3", "LEVEL: SIAGA (HIGH)", CRIMSON),
        ("STATUS SUMBER DATA", "8 / 8", "100% Telemetri Terhubung", EMERALD),
        ("INDIKATOR KORELASI", "CONVERGENT", "Bukti Lintas Sinyal Valid", LINK_BLUE),
        ("SISTEM POMPA POLDER", "5 / 5 AKTIF", "Sringin & Tenggang Beroperasi", AUBERGINE_PRIMARY),
    ]

    kw = 410
    total_kw = len(kpis) * kw + (len(kpis) - 1) * 24
    start_kx = cx - total_kw // 2
    for kidx, (ktitle, kval, ksub, kcol) in enumerate(kpis):
        kx0 = start_kx + kidx * (kw + 24)
        draw.rounded_rectangle([kx0, 160, kx0 + kw, 275], radius=16, fill=WHITE, outline=BORDER_LIGHT, width=2)
        draw.text((kx0 + 20, 182), ktitle, font=f_caption_bold, fill=kcol)
        draw.text((kx0 + 20, 218), kval, font=f_title_lg, fill=INK)
        draw.text((kx0 + 20, 252), ksub, font=f_caption, fill=MUTED)

    # 7-Factor Explainable Scoring Table
    tbl_y = 295
    tbl_h = 360
    draw.rounded_rectangle([start_kx, tbl_y, start_kx + total_kw, tbl_y + tbl_h], radius=18, fill=WHITE, outline=AUBERGINE_PRIMARY, width=2)
    draw.text((start_kx + 36, tbl_y + 24), "RINCIAN PEMBOBOTAN RISIKO MULTIVARIAT (EXPLAINABLE SCORING ENGINE)", font=f_heading, fill=AUBERGINE_PRIMARY)

    factors = [
        ("Curah Hujan & Atmosfer", "Open-Meteo & BMKG", "0.25", "24.5 mm/jam", "68", "+17.00"),
        ("Dinamika Pesisir & Gelombang", "Open-Meteo Marine", "0.20", "1.25 m (Gelombang)", "72", "+14.40"),
        ("Model Elevasi Digital (DEM)", "DEMNAS Topografi", "0.15", "2.8 m DPL (Dataran)", "93", "+13.95"),
        ("Kerentanan Historis Banjir/Rob", "BPS & BPBD Semarang", "0.15", "Indeks Kerentanan 88", "88", "+13.20"),
        ("Pemantauan Visual CCTV", "PantauSemar 70 Titik", "0.10", "Validasi Visual Genangan", "40", "+4.00"),
        ("Paparan Infrastruktur Kritis", "Jalur Pantura & Kawasan", "0.10", "Akses Logistik Terhambat", "82", "+8.20"),
        ("Bukti Validasi Laporan Warga", "Crowd Corroboration", "0.05", "Klaster Terverifikasi GPS", "50", "+2.50"),
    ]

    # Table Header
    th_y = tbl_y + 60
    draw.rectangle([start_kx + 30, th_y, start_kx + total_kw - 30, th_y + 32], fill=(245, 243, 240))
    cols = [(start_kx + 50, "FAKTOR / PARAMETER"), (start_kx + 450, "SUMBER DATA"), (start_kx + 800, "BOBOT (W)"), (start_kx + 1000, "NILAI MENTAH"), (start_kx + 1300, "NORMALISASI"), (start_kx + 1520, "KONTRIBUSI")]
    for cx_pos, cname in cols:
        draw.text((cx_pos, th_y + 8), cname, font=f_caption_bold, fill=INK)

    for fidx, (fname, fsrc, fw_val, fraw, fnorm, fcontrib) in enumerate(factors):
        row_y = th_y + 38 + fidx * 36
        draw.text((start_kx + 50, row_y + 6), fname, font=f_body_bold, fill=INK)
        draw.text((start_kx + 450, row_y + 6), fsrc, font=f_body, fill=MUTED)
        draw.text((start_kx + 800, row_y + 6), fw_val, font=f_body, fill=LINK_BLUE)
        draw.text((start_kx + 1000, row_y + 6), fraw, font=f_body, fill=INK)
        draw.text((start_kx + 1300, row_y + 6), fnorm, font=f_body, fill=MUTED)
        draw.text((start_kx + 1520, row_y + 6), fcontrib, font=f_body_bold, fill=CRIMSON if fidx < 4 else EMERALD)

    # Bottom Total Score Strip
    draw.rounded_rectangle([start_kx, 675, start_kx + total_kw, 740], radius=14, fill=LAVENDER, outline=AUBERGINE_PRIMARY, width=1)
    draw.text((start_kx + 40, 707), "TOTAL RISK SCORE: 73.3 / 100 (SIAGA / HIGH) — HASIL KALKULASI DETERMINISTIK DAPAT DIAUDIT LENGKAP", font=f_heading, fill=AUBERGINE_PRIMARY, anchor="lm")

    # Lower Split: Data Health & Chronological Milestones
    half_w = (total_kw - 24) // 2
    draw.rounded_rectangle([start_kx, 760, start_kx + half_w, 980], radius=16, fill=WHITE, outline=BORDER_LIGHT, width=2)
    draw.text((start_kx + 30, 786), "DATA INTEGRITY & PROVENANCE", font=f_heading, fill=AUBERGINE_PRIMARY)
    draw.text((start_kx + 30, 822), "• Open-Meteo & WMO: CONNECTED (Latency: 284ms | Freshness: 4m)", font=f_body, fill=INK)
    draw.text((start_kx + 30, 856), "• Open-Meteo Marine: CONNECTED (Gelombang Laut Jawa: 1.25m)", font=f_body, fill=INK)
    draw.text((start_kx + 30, 890), "• CCTV PantauSemar: CONNECTED (70 Titik Kamera Terhubung)", font=f_body, fill=INK)
    draw.text((start_kx + 30, 924), "• Sentinel-1 SAR: NO RECENT SATELLITE PASS (Revisit 5–6 Hari)", font=f_body, fill=MUTED)

    draw.rounded_rectangle([start_kx + half_w + 24, 760, start_kx + total_kw, 980], radius=16, fill=WHITE, outline=BORDER_LIGHT, width=2)
    draw.text((start_kx + half_w + 54, 786), "CHRONOLOGICAL EVENT MILESTONES (AUDIT TIMELINE)", font=f_heading, fill=AUBERGINE_PRIMARY)
    draw.text((start_kx + half_w + 54, 822), "19:02 WIB — Kenaikan Curah Hujan Terdeteksi (Radar BMKG)", font=f_body, fill=INK)
    draw.text((start_kx + half_w + 54, 856), "19:10 WIB — Laporan Kejadian Pertama dari Warga (GPS Valid)", font=f_body, fill=INK)
    draw.text((start_kx + half_w + 54, 890), "19:24 WIB — Korelasi Visual CCTV Kamera PantauSemar Terdeteksi", font=f_body, fill=INK)
    draw.text((start_kx + half_w + 54, 924), "19:35 WIB — Peringatan Dini & Rekomendasi Rute Aman Diterbitkan", font=f_body, fill=EMERALD)

# ====================================================================
# SCENE 07: DECISION SUPPORT (50.0s - 55.0s)
# ====================================================================
def render_scene_7(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 50.0) / 5.0

    draw_header_bar(draw, t, "SCENE 07: MULTI-AGENCY DECISION SUPPORT & ACTION")

    draw.text((cx, 95), "Actionable Decision Support & Coordinated Response", font=f_title_lg, fill=WHITE, anchor="mm")
    draw.text((cx, 136), "Empowering city operators: Detect → Verify → Understand → Decide → Respond", font=f_subhead, fill=LAVENDER, anchor="mm")

    # Workflow Ribbon
    steps = [("DETECT", "Sinyal Terdeteksi", True), ("VERIFY", "Korelasi Multi-Sinyal", True), ("UNDERSTAND", "Asesmen Dampak", True), ("DECIDE", "Disposisi Perintah", p >= 0.3), ("RESPOND", "Aksi Terkoordinasi", p >= 0.7)]
    sw = 320
    tot_sw = len(steps) * sw + (len(steps) - 1) * 20
    sx0 = cx - tot_sw // 2
    for sidx, (sname, sdesc, sdone) in enumerate(steps):
        bx0 = sx0 + sidx * (sw + 20)
        draw.rounded_rectangle([bx0, 180, bx0 + sw, 270], radius=14, fill=WHITE if sdone else (54, 15, 56), outline=EMERALD if sdone else (120, 60, 125), width=2)
        draw.text((bx0 + 20, 202), f"{'✓ ' if sdone else ''}{sname}", font=f_heading, fill=AUBERGINE_PRIMARY if sdone else CREAM)
        draw.text((bx0 + 20, 234), sdesc, font=f_caption, fill=MUTED if sdone else (200, 180, 210))

    # 3 Agency Action Cards
    actions = [
        ("BPBD KOTA SEMARANG", "Aktivasi Posko Bencana & Peringatan 112", "Disposisi regu evakuasi pesisir & notifikasi rute aman untuk warga.", "DISPATCHED", CRIMSON),
        ("DPUPR BIDANG SDA", "Operasionalisasi Pompa Polder Tenggang", "Pengalihan debit banjir rob dan pembukaan pintu air muara sungai.", "BERJALAN", LINK_BLUE),
        ("DISHUB KOTA SEMARANG", "Manajemen Lalu Lintas Pantura", "Penutupan lajur lambat bawah tol Kaligawe & pengalihan arus.", "TERJADWAL", EMERALD),
    ]

    aw = 530
    total_aw = len(actions) * aw + (len(actions) - 1) * 25
    ax_start = cx - total_aw // 2
    for aidx, (a_agency, a_title, a_desc, a_status, a_col) in enumerate(actions):
        ax0 = ax_start + aidx * (aw + 25)
        draw.rounded_rectangle([ax0, 310, ax0 + aw, 920], radius=18, fill=WHITE, outline=BORDER_LIGHT, width=2)
        draw.rounded_rectangle([ax0, 310, ax0 + aw, 380], radius=18, fill=a_col)
        draw.text((ax0 + 24, 345), a_agency, font=f_heading, fill=WHITE, anchor="lm")

        draw.text((ax0 + 24, 420), a_title, font=f_heading, fill=INK)
        draw.text((ax0 + 24, 470), a_desc, font=f_subhead, fill=MUTED)

        draw.rounded_rectangle([ax0 + 24, 820, ax0 + aw - 24, 880], radius=12, fill=(245, 245, 245), outline=a_col, width=1)
        draw.text((ax0 + 40, 850), f"STATUS AKSI: ● {a_status}", font=f_caption_bold, fill=a_col, anchor="lm")

# ====================================================================
# SCENE 08: FINAL PRODUCT SHOT (55.0s - 60.0s)
# ====================================================================
def render_scene_8(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 55.0) / 5.0
    fade = 1.0 if p < 0.75 else (1.0 - (p - 0.75) / 0.25)

    # Center Emblem
    bw = 110
    bx, by = cx - bw // 2, cy - 200
    draw.rounded_rectangle([bx, by, bx + bw, by + bw], radius=26, fill=AUBERGINE_PRIMARY, outline=CREAM, width=2)
    draw.ellipse([cx - 18, cy - 145, cx + 18, cy - 109], fill=EMERALD)

    # Title
    draw.text((cx, cy - 30), "KotaKu Siaga", font=f_hero, fill=WHITE, anchor="mm")

    # Core Value
    draw.text((cx, cy + 45), '"Turning real-world events into actionable intelligence."', font=f_heading, fill=LAVENDER, anchor="mm")

    # Signature Tagline
    draw.text((cx, cy + 120), "Monitor.   Verify.   Respond.", font=f_display, fill=WHITE, anchor="mm")

    # Sub-badge
    draw.text((cx, cy + 205), "KotaKu Siaga Platform • Inovasi Teknologi Tanggap Bencana Iklim Kota Semarang", font=f_subhead, fill=CREAM, anchor="mm")

    if fade < 1.0:
        dark_overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, int(255 * (1.0 - fade))))
        img.paste(dark_overlay, (0, 0), dark_overlay)

# ====================================================================
# MAIN RENDER LOOP
# ====================================================================
def main():
    print("================================================================")
    print("KotaKu Siaga — Master 1080p Presentation Video Generator")
    print(f"Resolution: {WIDTH}x{HEIGHT} @ {FPS} FPS | Duration: {DURATION_SEC:.1f}s ({TOTAL_FRAMES} frames)")
    print("Story Structure: 8 Master Scenes (Problem -> Ingestion -> Verification -> Map -> EOC -> Decision -> Closing)")
    print("================================================================")

    output_dir = os.path.join(os.getcwd(), "public", "videos")
    preview_dir = os.path.join(output_dir, "previews")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(preview_dir, exist_ok=True)

    out_mp4_public = os.path.join(output_dir, "kotaku_siaga_presentation.mp4")
    out_mp4_root = os.path.join(os.getcwd(), "kotaku_siaga_presentation.mp4")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(out_mp4_public, fourcc, FPS, (WIDTH, HEIGHT))
    if not writer.isOpened():
        print("Error: Could not open VideoWriter with mp4v. Trying avc1/XVID...")
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        writer = cv2.VideoWriter(out_mp4_public, fourcc, FPS, (WIDTH, HEIGHT))

    start_time = time.time()
    last_print = 0

    # Keyframe snapshots to save for preview
    preview_timestamps = [
        (3.0, "scene_1_reveal.jpg"),
        (9.5, "scene_2_problem.jpg"),
        (17.0, "scene_3_ingestion.jpg"),
        (26.0, "scene_4_verification.jpg"),
        (36.0, "scene_5_correlation.jpg"),
        (45.5, "scene_6_dashboard_eoc.jpg"),
        (52.5, "scene_7_decision_support.jpg"),
        (57.5, "scene_8_final.jpg"),
    ]
    saved_previews = set()

    for frame_idx in range(TOTAL_FRAMES):
        t_sec = frame_idx / float(FPS)
        frame_img = base_bg.copy()

        # Route to exact 8 Scenes
        if t_sec < 6.0:
            render_scene_1(frame_img, t_sec)
        elif t_sec < 13.0:
            render_scene_2(frame_img, t_sec)
        elif t_sec < 21.0:
            render_scene_3(frame_img, t_sec)
        elif t_sec < 31.0:
            render_scene_4(frame_img, t_sec)
        elif t_sec < 41.0:
            render_scene_5(frame_img, t_sec)
        elif t_sec < 50.0:
            render_scene_6(frame_img, t_sec)
        elif t_sec < 55.0:
            render_scene_7(frame_img, t_sec)
        else:
            render_scene_8(frame_img, t_sec)

        # Check preview capture
        for p_sec, p_name in preview_timestamps:
            if p_name not in saved_previews and abs(t_sec - p_sec) < (1.0 / FPS):
                preview_path = os.path.join(preview_dir, p_name)
                frame_img.save(preview_path, quality=95)
                saved_previews.add(p_name)

        np_frame = np.array(frame_img)
        bgr_frame = cv2.cvtColor(np_frame, cv2.COLOR_RGB2BGR)
        writer.write(bgr_frame)

        now = time.time()
        if now - last_print > 3.0 or frame_idx == TOTAL_FRAMES - 1:
            pct = (frame_idx + 1) / TOTAL_FRAMES * 100
            elapsed = now - start_time
            fps_proc = (frame_idx + 1) / elapsed if elapsed > 0 else 0
            eta = (TOTAL_FRAMES - frame_idx - 1) / fps_proc if fps_proc > 0 else 0
            print(f"Progress: {pct:5.1f}% | Frame {frame_idx+1:4d}/{TOTAL_FRAMES} | {fps_proc:4.1f} FPS | ETA: {eta:4.1f}s")
            last_print = now

    writer.release()
    total_time = time.time() - start_time
    file_size_mb = os.path.getsize(out_mp4_public) / (1024 * 1024)

    print(f"\nRender Complete in {total_time:.1f}s!")
    print(f"Output File: {out_mp4_public} ({file_size_mb:.2f} MB)")

    shutil.copyfile(out_mp4_public, out_mp4_root)
    print(f"Copied to root: {out_mp4_root}")

    # Copy to artifact directory
    artifact_dir = r"C:\Users\Nabiel Ilyasa P\.gemini\antigravity-ide\brain\4e9dac3c-98bb-43fe-a3da-3f47a280ae36"
    if os.path.exists(artifact_dir):
        artifact_file = os.path.join(artifact_dir, "kotaku_siaga_presentation.mp4")
        shutil.copyfile(out_mp4_public, artifact_file)
        print(f"Copied to artifacts: {artifact_file}")
        # Copy preview frames to artifacts
        for p_name in saved_previews:
            src = os.path.join(preview_dir, p_name)
            dst = os.path.join(artifact_dir, p_name)
            if os.path.exists(src):
                shutil.copyfile(src, dst)
        print(f"Copied {len(saved_previews)} preview slides to artifacts.")

if __name__ == "__main__":
    main()
