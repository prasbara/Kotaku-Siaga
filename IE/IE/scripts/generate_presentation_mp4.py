#!/usr/bin/env python3
"""
KotaKu Siaga — Professional 1080p Opening Presentation Video Generator
Renders a 54.0-second, 30 FPS Full HD (1920x1080) video following the exact 7-scene storyboard:
Scene 1: Opening & Brand Identity (0-6s)
Scene 2: The Problem (Fragmented data -> Centralized view) (6-14s)
Scene 3: Data Ingestion (4 multi-source channels) (14-22s)
Scene 4: Intelligent Analysis (5-stage verification & confidence score) (22-32s)
Scene 5: Map + CCTV Correlation (Spatial-temporal triangulation) (32-42s)
Scene 6: Decision Support (Incident lifecycle & multi-agency response) (42-50s)
Scene 7: Closing & Platform Vision (50-54s)
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
DURATION_SEC = 54.0
TOTAL_FRAMES = int(DURATION_SEC * FPS)  # 1620 frames

# Color Palette (KotaKu Siaga Slacc-inspired Editorial System)
AUBERGINE_DARK = (28, 6, 30)      # #1c061e
AUBERGINE_MID = (54, 15, 56)       # #360f38
AUBERGINE_PRIMARY = (74, 21, 75)   # #4a154b
AUBERGINE_PRESS = (97, 31, 105)    # #611f69
CREAM = (244, 237, 228)            # #f4ede4
LAVENDER = (249, 240, 255)         # #f9f0ff
WHITE = (255, 255, 255)
INK = (29, 29, 29)                 # #1d1d1d
MUTED = (105, 105, 105)            # #696969
EMERALD = (0, 122, 90)             # #007a5a
AMBER = (217, 119, 6)              # #d97706
CRIMSON = (204, 65, 23)            # #cc4117
LINK_BLUE = (18, 100, 163)         # #1264a3
BORDER_LIGHT = (230, 230, 230)

# Fonts
FONT_BOLD_PATH = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG_PATH = "C:/Windows/Fonts/segoeui.ttf"

def get_font(size: int, bold: bool = False):
    path = FONT_BOLD_PATH if bold else FONT_REG_PATH
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

# Pre-load Fonts
f_display = get_font(72, bold=True)
f_title_lg = get_font(40, bold=True)
f_title_md = get_font(30, bold=True)
f_heading = get_font(22, bold=True)
f_subhead = get_font(18, bold=False)
f_body_bold = get_font(15, bold=True)
f_body = get_font(14, bold=False)
f_caption = get_font(12, bold=False)
f_caption_bold = get_font(12, bold=True)
f_micro = get_font(10, bold=True)

# Easing Functions
def ease_in_out_cubic(x: float) -> float:
    return 4 * x * x * x if x < 0.5 else 1 - math.pow(-2 * x + 2, 3) / 2

def ease_out_quad(x: float) -> float:
    return 1 - (1 - x) * (1 - x)

# Pre-create Base Background Gradient
base_bg = Image.new("RGB", (WIDTH, HEIGHT), AUBERGINE_DARK)
draw_bg = ImageDraw.Draw(base_bg)
cx, cy = WIDTH // 2, HEIGHT // 2
for r in range(1200, 0, -25):
    t_rad = r / 1200.0
    r_val = int(AUBERGINE_DARK[0] * t_rad + AUBERGINE_MID[0] * (1 - t_rad))
    g_val = int(AUBERGINE_DARK[1] * t_rad + AUBERGINE_MID[1] * (1 - t_rad))
    b_val = int(AUBERGINE_DARK[2] * t_rad + AUBERGINE_MID[2] * (1 - t_rad))
    draw_bg.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(r_val, g_val, b_val))

# Draw Grid Lines on Base Background
for x in range(0, WIDTH, 64):
    draw_bg.line([(x, 0), (x, HEIGHT)], fill=(244, 237, 228, 8), width=1)
for y in range(0, HEIGHT, 64):
    draw_bg.line([(0, y), (WIDTH, y)], fill=(244, 237, 228, 8), width=1)

# Pre-load CCTV Real Snapshot
cctv_snapshot = None
snap_path = os.path.join(os.getcwd(), "public", "evidence", "flood_414_321_1789291801.jpg")
if os.path.exists(snap_path):
    try:
        raw_img = Image.open(snap_path).convert("RGB")
        cctv_snapshot = raw_img.resize((500, 260), Image.Resampling.LANCZOS)
    except Exception as e:
        print(f"Notice: Could not load snapshot: {e}")

# Helper: Draw telemetry header
def draw_header_bar(draw: ImageDraw.ImageDraw, t_sec: float):
    # Top left live indicator
    draw.ellipse([48, 34, 58, 44], fill=EMERALD)
    draw.text((68, 30), "LIVE CIVIC INTELLIGENCE ENGINE", font=f_caption_bold, fill=CREAM)
    # Top right time & location
    draw.text((WIDTH - 48, 30), f"KOTAKU SIAGA — CIVIC RADAR v2.0 | SEC: {t_sec:04.1f}s / {DURATION_SEC:.1f}s | SEMARANG, ID", font=f_caption, fill=(244, 237, 228), anchor="ra")

# ====================================================================
# SCENE 1: OPENING & BRAND IDENTITY (0.0s - 6.0s)
# ====================================================================
def render_scene_1(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = t / 6.0
    fade = min(1.0, p / 0.15) if p < 0.2 else (1.0 - (p - 0.85) / 0.15) if p > 0.85 else 1.0

    draw_header_bar(draw, t)

    # Logo Box
    bw, bh = 110, 110
    bx = cx - bw // 2
    by = cy - 200
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=28, fill=AUBERGINE_PRIMARY, outline=CREAM, width=2)
    # Shield graphic
    shield_pts = [
        (cx, by + 26),
        (cx + 26, by + 36),
        (cx + 26, by + 62),
        (cx, by + 92),
        (cx - 26, by + 62),
        (cx - 26, by + 36),
    ]
    draw.polygon(shield_pts, fill=CREAM)
    draw.ellipse([cx - 8, by + 52, cx + 8, by + 68], fill=AUBERGINE_PRIMARY)
    # Active indicator dot
    draw.ellipse([bx + bw - 16, by + 12, bx + bw - 4, by + 24], fill=EMERALD)

    # Main Brand Title
    draw.text((cx, cy - 24), "KotaKu Siaga", font=f_display, fill=WHITE, anchor="mm")

    # Subtitle
    draw.text((cx, cy + 38), "Real-Time Monitoring & Intelligent Decision Support", font=f_heading, fill=LAVENDER, anchor="mm")

    # Metadata Pills
    chips = ["PEMERINTAH KOTA SEMARANG", "70 TITIK PANTAUSEMAR CCTV", "CIVIC DISASTER RESILIENCE"]
    pill_y = cy + 104
    tot_w = sum(len(c) * 10 + 44 for c in chips)
    cur_x = cx - tot_w // 2

    for chip in chips:
        cw = len(chip) * 10 + 36
        draw.rounded_rectangle([cur_x, pill_y, cur_x + cw, pill_y + 36], radius=18, fill=AUBERGINE_PRIMARY, outline=(237, 220, 247), width=1)
        draw.text((cur_x + cw // 2, pill_y + 18), chip, font=f_caption_bold, fill=CREAM, anchor="mm")
        cur_x += cw + 14

# ====================================================================
# SCENE 2: THE PROBLEM (6.0s - 14.0s)
# ====================================================================
def render_scene_2(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 6.0) / 8.0
    is_chaos = p < 0.55
    settle = 0.0 if is_chaos else ease_in_out_cubic((p - 0.55) / 0.45)

    draw_header_bar(draw, t)

    # Headlines
    if is_chaos:
        draw.text((cx, 120), "From fragmented data...", font=f_title_lg, fill=LAVENDER, anchor="mm")
        draw.text((cx, 164), "Manual verification is slow, isolated, and overwhelmed by conflicting streams", font=f_subhead, fill=(244, 237, 228), anchor="mm")
    else:
        draw.text((cx, 120), "...to one intelligent view.", font=f_title_lg, fill=LAVENDER, anchor="mm")
        draw.text((cx, 164), "Unified spatial-temporal correlation brings order, precision, and instant clarity", font=f_subhead, fill=EMERALD, anchor="mm")

    # 5 Data Cards
    cards = [
        {"title": "LAPORAN WARGA (UNVERIFIED)", "desc": "Genangan 40cm di Jl. Supriyadi", "meta": "Coord: -7.0056, 110.4543 | 14:24 WIB", "color": CRIMSON, "cx": 340, "cy": 330, "tx": 400, "ty": 340},
        {"title": "PANTAUSEMAR CCTV FEED", "desc": "Kamera Supriyadi PS-GEN-321 (1080p)", "meta": "70 Kamera tersebar tanpa verifikasi otomatis", "color": AMBER, "cx": 1400, "cy": 320, "tx": 960, "ty": 340},
        {"title": "BMKG STASIUN MARITIM", "desc": "Curah Hujan Ekstrem 65mm / Jam", "meta": "Stasiun Maritim Tanjung Emas | Pasang Rob", "color": LINK_BLUE, "cx": 360, "cy": 720, "tx": 1520, "ty": 340},
        {"title": "TELEMETRI RUMAH POMPA", "desc": "Polder Tenggang & Sringin Aktif 100%", "meta": "Debit: 12.000 L/dtk | Resiko Meluap Tinggi", "color": AUBERGINE_PRIMARY, "cx": 1440, "cy": 700, "tx": 680, "ty": 590},
        {"title": "JARINGAN DRAINASE OSM", "desc": "Saluran Primer Kali Tenggang", "meta": "Elevasi: 2.1m DPL | Aliran Menuju Laut Jawa", "color": EMERALD, "cx": 900, "cy": 840, "tx": 1240, "ty": 590},
    ]

    card_w, card_h = 440, 190
    for card in cards:
        # Interpolate position
        curr_x = int(card["cx"] + (card["tx"] - card["cx"]) * settle)
        curr_y = int(card["cy"] + (card["ty"] - card["cy"]) * settle)

        x0, y0 = curr_x - card_w // 2, curr_y - card_h // 2
        x1, y1 = curr_x + card_w // 2, curr_y + card_h // 2

        # Card white container
        draw.rounded_rectangle([x0, y0, x1, y1], radius=16, fill=WHITE, outline=BORDER_LIGHT if is_chaos else AUBERGINE_PRIMARY, width=2)
        # Left accent stripe
        draw.rounded_rectangle([x0, y0, x0 + 8, y1], radius=4, fill=card["color"])

        # Content
        draw.text((x0 + 24, y0 + 26), card["title"], font=f_caption_bold, fill=card["color"])
        draw.text((x0 + 24, y0 + 60), card["desc"], font=f_heading, fill=INK)
        draw.text((x0 + 24, y0 + 98), card["meta"], font=f_body, fill=MUTED)

        # Status Badge
        badge_text = "DISCONNECTED" if is_chaos else "SYNCHRONIZED"
        badge_col = CRIMSON if is_chaos else EMERALD
        badge_bg = (253, 240, 236) if is_chaos else (235, 247, 243)
        draw.rounded_rectangle([x0 + 24, y0 + 134, x0 + 170, y0 + 164], radius=6, fill=badge_bg)
        draw.text((x0 + 36, y0 + 142), f"● {badge_text}", font=f_caption_bold, fill=badge_col)

# ====================================================================
# SCENE 3: DATA INGESTION (14.0s - 22.0s)
# ====================================================================
def render_scene_3(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 14.0) / 8.0

    draw_header_bar(draw, t)

    draw.text((cx, 110), "Multi-Source Data Ingestion Core", font=f_title_lg, fill=WHITE, anchor="mm")
    draw.text((cx, 154), "Synchronizing civic participation, real-time public CCTV, and government sensor APIs", font=f_subhead, fill=LAVENDER, anchor="mm")

    # Central Core Hub
    core_x, core_y = cx, 560
    cr = 110
    draw.ellipse([core_x - cr - 35, core_y - cr - 35, core_x + cr + 35, core_y + cr + 35], outline=(237, 220, 247), width=1)
    draw.ellipse([core_x - cr, core_y - cr, core_x + cr, core_y + cr], fill=AUBERGINE_PRIMARY, outline=CREAM, width=2)
    draw.text((core_x, core_y - 20), "KOTAKU SIAGA", font=f_heading, fill=WHITE, anchor="mm")
    draw.text((core_x, core_y + 8), "INGESTION HUB", font=f_caption_bold, fill=CREAM, anchor="mm")
    draw.text((core_x, core_y + 34), "● 70 STREAMS LIVE", font=f_caption_bold, fill=EMERALD, anchor="mm")

    sources = [
        {"name": "LAPORAN WARGA", "sub": "Geotagged + Foto + Timestamp", "x": 300, "y": 340, "color": CRIMSON},
        {"name": "CCTV PANTAUSEMAR", "sub": "70 Titik HLS Live Stream", "x": 300, "y": 740, "color": AMBER},
        {"name": "BMKG CUACA & HUJAN", "sub": "Radar Presipitasi & Pasang Laut", "x": 1620, "y": 340, "color": LINK_BLUE},
        {"name": "JARINGAN DRAINASE OSM", "sub": "Topologi Saluran & Sungai", "x": 1620, "y": 740, "color": EMERALD},
    ]

    bw, bh = 340, 110
    for idx, s in enumerate(sources):
        # Conduit line
        draw.line([(s["x"], s["y"]), (core_x, core_y)], fill=(120, 60, 125), width=2)

        # Animated Traveling Data Packet
        pt = ((p * 3.5 + idx * 0.25) % 1.0)
        px = int(s["x"] + (core_x - s["x"]) * pt)
        py = int(s["y"] + (core_y - s["y"]) * pt)
        draw.ellipse([px - 8, py - 8, px + 8, py + 8], fill=s["color"], outline=WHITE, width=2)

        # Source Box
        x0, y0 = s["x"] - bw // 2, s["y"] - bh // 2
        x1, y1 = s["x"] + bw // 2, s["y"] + bh // 2
        draw.rounded_rectangle([x0, y0, x1, y1], radius=16, fill=WHITE, outline=s["color"], width=2)
        draw.text((x0 + 20, y0 + 22), s["name"], font=f_body_bold, fill=s["color"])
        draw.text((x0 + 20, y0 + 52), s["sub"], font=f_body, fill=MUTED)

        # Latency chip
        draw.rounded_rectangle([x1 - 96, y0 + 16, x1 - 18, y0 + 40], radius=6, fill=(235, 247, 243))
        draw.text((x1 - 57, y0 + 28), "LAT: 42ms", font=f_micro, fill=EMERALD, anchor="mm")

    # Bottom Status Bar
    draw.rounded_rectangle([cx - 440, 930, cx + 440, 980], radius=25, fill=AUBERGINE_PRIMARY, outline=(237, 220, 247), width=1)
    draw.text((cx, 955), "STATUS: Continuous low-latency pipeline streaming from official Semarang PantauSemar HLS endpoints", font=f_body, fill=CREAM, anchor="mm")

# ====================================================================
# SCENE 4: INTELLIGENT ANALYSIS (22.0s - 32.0s)
# ====================================================================
def render_scene_4(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 22.0) / 10.0

    draw_header_bar(draw, t)

    draw.text((cx, 95), "Intelligent Verification & Analysis Pipeline", font=f_title_lg, fill=WHITE, anchor="mm")
    draw.text((cx, 136), "Multi-signal classical computer vision and spatial correlation without black-box hallucination", font=f_subhead, fill=LAVENDER, anchor="mm")

    # 5-Stage Sequential Pipeline Bar
    stages = [
        ("01. REPORT", "Jl. Supriyadi, 40cm", p >= 0.1),
        ("02. VALIDATE", "BBox & Saluran Air", p >= 0.3),
        ("03. TIMESTAMPS", "BMKG Hujan ±3min", p >= 0.5),
        ("04. CORRELATE", "CCTV PS-GEN-321", p >= 0.7),
        ("05. VERIFY", "Klasifikasi Valid", p >= 0.88),
    ]

    sw, sh = 310, 110
    total_sw = len(stages) * sw + (len(stages) - 1) * 20
    start_x = cx - total_sw // 2
    sy = 180

    for idx, (st_name, st_desc, is_act) in enumerate(stages):
        x0 = start_x + idx * (sw + 20)
        x1 = x0 + sw
        y0, y1 = sy, sy + sh

        draw.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=WHITE if is_act else (54, 15, 56), outline=EMERALD if is_act else (120, 60, 125), width=2)
        draw.text((x0 + 20, y0 + 20), st_name, font=f_heading, fill=AUBERGINE_PRIMARY if is_act else CREAM)
        draw.text((x0 + 20, y0 + 58), st_desc, font=f_body, fill=MUTED if is_act else (220, 200, 230))
        status_txt = "PASSED" if is_act else "PENDING"
        draw.text((x1 - 20, y0 + 20), status_txt, font=f_caption_bold, fill=EMERALD if is_act else MUTED, anchor="ra")

    # Diagnostic & Confidence Box
    diag_w, diag_h = 1000, 480
    dx0, dy0 = cx - diag_w // 2, 330
    dx1, dy1 = dx0 + diag_w, dy0 + diag_h

    draw.rounded_rectangle([dx0, dy0, dx1, dy1], radius=24, fill=WHITE, outline=AUBERGINE_PRIMARY, width=2)
    draw.text((dx0 + 40, dy0 + 40), "EVALUASI MULTI-SINYAL TITIK RAWAN GENANGAN SUPRIYADI", font=f_heading, fill=AUBERGINE_PRIMARY)
    draw.text((dx0 + 40, dy0 + 72), "Camera Code: PS-GEN-321 | Kel. Kalicari, Kec. Pedurungan, Kota Semarang", font=f_body, fill=MUTED)

    # 3 Progress Bars
    bars = [
        ("1. Deteksi Pantulan & Tekstur Air (Non-YOLO Classical CV)", 0.92, "92%", AUBERGINE_PRIMARY),
        ("2. Sinkronisasi Presipitasi Curah Hujan BMKG (65mm/jam)", 0.88, "88%", LINK_BLUE),
        ("3. Kedekatan Radius Saluran Primer Kali Tenggang (140m)", 0.95, "95%", EMERALD),
    ]

    for bidx, (bname, bval, blabel, bcol) in enumerate(bars):
        by = dy0 + 130 + bidx * 75
        draw.text((dx0 + 40, by), bname, font=f_body_bold, fill=INK)

        # Track
        tw = 520
        draw.rounded_rectangle([dx0 + 40, by + 24, dx0 + 40 + tw, by + 38], radius=7, fill=(240, 240, 240))
        # Fill
        cur_fill = min(1.0, p * 2.2 if bidx == 0 else p * 1.5 if bidx == 1 else p * 1.2) * bval
        fw = int(tw * cur_fill)
        if fw > 0:
            draw.rounded_rectangle([dx0 + 40, by + 24, dx0 + 40 + fw, by + 38], radius=7, fill=bcol)
        draw.text((dx0 + 40 + tw + 18, by + 22), blabel, font=f_body_bold, fill=INK)

    # Circular Score Display (Right side)
    score_cx, score_cy = dx0 + 780, dy0 + 220
    draw.ellipse([score_cx - 85, score_cy - 85, score_cx + 85, score_cy + 85], outline=(230, 230, 230), width=16)
    draw.ellipse([score_cx - 85, score_cy - 85, score_cx + 85, score_cy + 85], outline=EMERALD if p >= 0.85 else AMBER, width=16)
    score_disp = "89.4%" if p >= 0.88 else f"{min(89.4, p * 105):.1f}%"
    draw.text((score_cx, score_cy - 8), score_disp, font=f_title_lg, fill=INK, anchor="mm")
    draw.text((score_cx, score_cy + 32), "CONFIDENCE SCORE", font=f_caption_bold, fill=MUTED, anchor="mm")

    # Bottom Decision Banner
    is_verif = p >= 0.85
    banner_bg = (235, 247, 243) if is_verif else (254, 243, 199)
    banner_border = EMERALD if is_verif else AMBER
    draw.rounded_rectangle([dx0 + 40, dy0 + 380, dx1 - 40, dy0 + 446], radius=12, fill=banner_bg, outline=banner_border, width=2)
    b_text = "✓ STATUS: TERVERIFIKASI (PRIORITAS TINGGI)" if is_verif else "⏳ STATUS: ANALISIS VALIDASI SEDANG BERJALAN..."
    draw.text((dx0 + 64, dy0 + 413), b_text, font=f_heading, fill=banner_border, anchor="lm")
    draw.text((dx1 - 64, dy0 + 413), "Bantuan keputusan operator — Validasi multi-sinyal terkoordinasi", font=f_caption, fill=MUTED, anchor="rm")

# ====================================================================
# SCENE 5: MAP + CCTV CORRELATION (32.0s - 42.0s)
# ====================================================================
def render_scene_5(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 32.0) / 10.0

    draw_header_bar(draw, t)

    # Simulated Map Base
    map_x, map_y = 60, 90
    map_w, map_h = 1800, 920
    draw.rounded_rectangle([map_x, map_y, map_x + map_w, map_y + map_h], radius=24, fill=(30, 26, 34), outline=AUBERGINE_MID, width=2)

    # Shoreline (Laut Jawa)
    draw.polygon([(map_x, map_y), (map_x + map_w, map_y), (map_x + map_w, map_y + 200), (map_x, map_y + 240)], fill=(20, 32, 43))
    draw.text((cx, map_y + 80), "LAUT JAWA (PESISIR SEMARANG)", font=f_heading, fill=(40, 80, 120), anchor="mm")

    # Waterways
    draw.line([(map_x + 440, map_y + 220), (map_x + 480, map_y + map_h)], fill=LINK_BLUE, width=10) # BKB
    draw.line([(map_x + 1080, map_y + 240), (map_x + 1020, map_y + map_h)], fill=LINK_BLUE, width=10) # BKT
    draw.line([(map_x + 1380, map_y + 230), (map_x + 1320, map_y + map_h)], fill=LINK_BLUE, width=10) # Kali Tenggang

    # Major Arterials
    draw.line([(map_x, map_y + 300), (map_x + map_w, map_y + 280)], fill=(80, 80, 85), width=6) # Kaligawe
    draw.line([(map_x + 400, map_y + 780), (map_x + map_w, map_y + 700)], fill=(80, 80, 85), width=6) # Majapahit
    draw.line([(map_x + 1280, map_y + 540), (map_x + 1240, map_y + 900)], fill=(120, 120, 125), width=8) # Supriyadi

    # Street labels
    draw.text((map_x + 600, map_y + 290), "JL. KALIGAWE RAYA", font=f_caption_bold, fill=(180, 180, 180))
    draw.text((map_x + 800, map_y + 760), "JL. MAJAPAHIT", font=f_caption_bold, fill=(180, 180, 180))
    draw.text((map_x + 1300, map_y + 660), "JL. SUPRIYADI", font=f_caption_bold, fill=CREAM)

    # City CCTV Dots
    cctv_dots = [
        ("Simpang Lima", map_x + 760, map_y + 600),
        ("Tugu Muda", map_x + 560, map_y + 560),
        ("Kaligawe Genuk", map_x + 1440, map_y + 300),
        ("Peterongan", map_x + 880, map_y + 660),
    ]
    for dname, dx, dy in cctv_dots:
        draw.ellipse([dx - 6, dy - 6, dx + 6, dy + 6], fill=EMERALD)
        draw.text((dx + 12, dy - 8), dname, font=f_caption, fill=(200, 200, 200))

    # Active Correlation Focus: Supriyadi
    inc_x, inc_y = map_x + 1260, map_y + 680
    cctv_x, cctv_y = map_x + 1235, map_y + 610

    # Radar ring pulse
    pulse_r = int(((p * 4.0) % 1.0) * 180)
    draw.ellipse([inc_x - pulse_r, inc_y - pulse_r, inc_x + pulse_r, inc_y + pulse_r], outline=CRIMSON, width=2)
    # Search radius 500m
    draw.ellipse([inc_x - 140, inc_y - 140, inc_x + 140, inc_y + 140], outline=AMBER, width=2)

    # Correlation vector
    draw.line([(inc_x, inc_y), (cctv_x, cctv_y)], fill=EMERALD, width=4)
    draw.rounded_rectangle([(inc_x + cctv_x) // 2 - 40, (inc_y + cctv_y) // 2 - 14, (inc_x + cctv_x) // 2 + 40, (inc_y + cctv_y) // 2 + 14], radius=6, fill=AUBERGINE_PRIMARY)
    draw.text(((inc_x + cctv_x) // 2, (inc_y + cctv_y) // 2), "140m", font=f_caption_bold, fill=WHITE, anchor="mm")

    # CCTV marker (Green)
    draw.ellipse([cctv_x - 14, cctv_y - 14, cctv_x + 14, cctv_y + 14], fill=EMERALD, outline=WHITE, width=2)
    draw.text((cctv_x, cctv_y), "CAM", font=f_micro, fill=WHITE, anchor="mm")

    # Incident marker (Red)
    draw.ellipse([inc_x - 16, inc_y - 16, inc_x + 16, inc_y + 16], fill=CRIMSON, outline=WHITE, width=2)
    draw.text((inc_x, inc_y), "!", font=f_body_bold, fill=WHITE, anchor="mm")

    # Floating CCTV Inspection Modal (Left Side)
    mx0, my0 = map_x + 48, map_y + 48
    mw, mh = 560, 520
    draw.rounded_rectangle([mx0, my0, mx0 + mw, my0 + mh], radius=20, fill=WHITE, outline=AUBERGINE_PRIMARY, width=2)
    draw.text((mx0 + 24, my0 + 32), "PANTAUSEMAR CCTV INSPECTION", font=f_heading, fill=AUBERGINE_PRIMARY)
    draw.text((mx0 + mw - 24, my0 + 32), "● LIVE STREAM FHD", font=f_caption_bold, fill=EMERALD, anchor="ra")

    # CCTV Viewport Frame
    fx0, fy0 = mx0 + 24, my0 + 64
    if cctv_snapshot:
        img.paste(cctv_snapshot, (fx0, fy0))
    else:
        draw.rectangle([fx0, fy0, fx0 + 500, fy0 + 260], fill=(20, 20, 20))
        draw.text((fx0 + 250, fy0 + 130), "CCTV FEED PS-GEN-321", font=f_heading, fill=WHITE, anchor="mm")

    # Overlay Bounding Box on CCTV feed
    draw.rectangle([fx0 + 40, fy0 + 80, fx0 + 460, fy0 + 240], outline=EMERALD, width=2)
    draw.rectangle([fx0 + 40, fy0 + 55, fx0 + 230, fy0 + 80], fill=EMERALD)
    draw.text((fx0 + 48, fy0 + 62), "WATER LEVEL: ~38.5 CM", font=f_caption_bold, fill=WHITE)

    # Metadata
    draw.text((mx0 + 24, my0 + 348), "SUPRIYADI (Kec. Pedurungan)", font=f_heading, fill=INK)
    draw.text((mx0 + 24, my0 + 380), "Diskominfo Kota Semarang | 1080p FHD 25 FPS", font=f_body, fill=MUTED)

    # Triangulation Bar
    draw.rounded_rectangle([mx0 + 24, my0 + 420, mx0 + mw - 24, my0 + 490], radius=12, fill=LAVENDER)
    draw.text((mx0 + mw // 2, my0 + 442), "INCIDENT ↕ LOCATION ↕ NEARBY CCTV ↕ TIMESTAMP", font=f_caption_bold, fill=AUBERGINE_PRIMARY, anchor="mm")
    draw.text((mx0 + mw // 2, my0 + 468), "Supriyadi ↔ -7.0057, 110.4544 ↔ PS-GEN-321 ↔ 14:28:10 WIB", font=f_caption, fill=MUTED, anchor="mm")

# ====================================================================
# SCENE 6: DECISION SUPPORT (42.0s - 50.0s)
# ====================================================================
def render_scene_6(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 42.0) / 8.0

    draw_header_bar(draw, t)

    draw.text((cx, 95), "Executive Command & Decision Support Center", font=f_title_lg, fill=WHITE, anchor="mm")
    draw.text((cx, 136), "Empowering city operators with verifiable intelligence and coordinated multi-agency response", font=f_subhead, fill=LAVENDER, anchor="mm")

    # 4 KPI Cards
    kpis = [
        ("ACTIVE INCIDENTS", "14", "Terpantau Real-Time", CRIMSON),
        ("VERIFIED REPORTS", "42", "+12 Valid Hari Ini", EMERALD),
        ("CCTV MONITORED", "70", "PantauSemar 100% Aktif", LINK_BLUE),
        ("POLDER STATIONS", "5/5", "Sringin & Tenggang Aktif", AUBERGINE_PRIMARY),
    ]

    kw = 410
    total_kw = len(kpis) * kw + (len(kpis) - 1) * 24
    start_kx = cx - total_kw // 2
    for kidx, (ktitle, kval, ksub, kcol) in enumerate(kpis):
        kx0 = start_kx + kidx * (kw + 24)
        draw.rounded_rectangle([kx0, 180, kx0 + kw, 310], radius=16, fill=WHITE, outline=BORDER_LIGHT, width=2)
        draw.text((kx0 + 24, 204), ktitle, font=f_caption_bold, fill=kcol)
        draw.text((kx0 + 24, 246), kval, font=f_title_lg, fill=INK)
        draw.text((kx0 + 24, 280), ksub, font=f_caption, fill=MUTED)

    # Incident Lifecycle Tracker
    draw.rounded_rectangle([start_kx, 335, start_kx + total_kw, 510], radius=18, fill=WHITE, outline=AUBERGINE_PRIMARY, width=2)
    draw.text((start_kx + 36, 360), "PROSES STATUS INSIDEN: JL. SUPRIYADI (PEDURUNGAN)", font=f_heading, fill=AUBERGINE_PRIMARY)

    lifecycles = [
        ("REPORTED", "Laporan Diterima (14:24)", True),
        ("ANALYZING", "Korelasi CCTV (14:25)", p >= 0.25),
        ("VERIFIED", "Tervalidasi 89.4% (14:26)", p >= 0.55),
        ("DISPATCHED", "Reaksi Cepat Bergerak (14:28)", p >= 0.85),
    ]

    lw = 360
    l_start = start_kx + 36
    for lidx, (lname, lsub, lpass) in enumerate(lifecycles):
        lx0 = l_start + lidx * (lw + 40)
        draw.rounded_rectangle([lx0, 405, lx0 + lw, 485], radius=12, fill=(235, 247, 243) if lpass else (248, 248, 248), outline=EMERALD if lpass else BORDER_LIGHT, width=2)
        draw.text((lx0 + 20, 425), f"{'✓ ' if lpass else ''}{lname}", font=f_body_bold, fill=EMERALD if lpass else MUTED)
        draw.text((lx0 + 20, 455), lsub, font=f_caption, fill=MUTED)
        if lidx < len(lifecycles) - 1:
            draw.text((lx0 + lw + 20, 445), "➔", font=f_heading, fill=AUBERGINE_PRIMARY if lpass else (200, 200, 200), anchor="mm")

    # Multi-Agency Action Card
    act_y = 535
    draw.rounded_rectangle([start_kx, act_y, start_kx + total_kw, act_y + 440], radius=18, fill=(253, 249, 255), outline=AUBERGINE_PRIMARY, width=2)
    draw.text((start_kx + 36, act_y + 36), "REKOMENDASI AKSI & DISPOSISI OPERASIONAL KOTA SEMARANG", font=f_heading, fill=AUBERGINE_PRIMARY)

    actions = [
        ("BPBD KOTA SEMARANG", "Aktivasi Posko Darurat Pedurungan", "Evakuasi warga rentan dan peringatan genangan Supriyadi.", "TERKIRIM (DISPATCHED)", CRIMSON),
        ("DPUPR KOTA SEMARANG", "Operasional Pompa Mobile & Polder", "Pengalihan debit air ke Polder Tenggang & pembukaan pintu air.", "SEDANG BERJALAN", LINK_BLUE),
        ("DISHUB KOTA SEMARANG", "Manajemen Lalu Lintas Terpadu", "Pengalihan arus kendaraan dari arah Jl. Majapahit.", "TERJADWAL", EMERALD),
    ]

    aw = (total_kw - 72 - 48) // 3
    for aidx, (a_agency, a_title, a_desc, a_status, a_col) in enumerate(actions):
        ax0 = start_kx + 36 + aidx * (aw + 24)
        ay0 = act_y + 80
        draw.rounded_rectangle([ax0, ay0, ax0 + aw, ay0 + 320], radius=16, fill=WHITE, outline=BORDER_LIGHT, width=2)
        draw.text((ax0 + 24, ay0 + 28), a_agency, font=f_caption_bold, fill=a_col)
        draw.text((ax0 + 24, ay0 + 64), a_title, font=f_heading, fill=INK)
        draw.text((ax0 + 24, ay0 + 110), a_desc, font=f_body, fill=MUTED)

        draw.rounded_rectangle([ax0 + 24, ay0 + 250, ax0 + aw - 24, ay0 + 290], radius=8, fill=(240, 240, 240))
        draw.text((ax0 + 36, ay0 + 266), f"● {a_status}", font=f_caption_bold, fill=a_col)

# ====================================================================
# SCENE 7: CLOSING & PLATFORM IDENTITY (50.0s - 54.0s)
# ====================================================================
def render_scene_7(img: Image.Image, t: float):
    draw = ImageDraw.Draw(img)
    p = (t - 50.0) / 4.0

    # Smooth fade out during last 1.2 seconds
    fade = 1.0 if p < 0.7 else (1.0 - (p - 0.7) / 0.3)

    # Center Emblem
    bw = 100
    bx, by = cx - bw // 2, cy - 180
    draw.rounded_rectangle([bx, by, bx + bw, by + bw], radius=24, fill=AUBERGINE_PRIMARY, outline=CREAM, width=2)
    draw.ellipse([cx - 16, cy - 130, cx + 16, cy - 98], fill=EMERALD)

    # Title
    draw.text((cx, cy - 20), "KotaKu Siaga", font=f_display, fill=WHITE, anchor="mm")

    # Core Value Text
    draw.text((cx, cy + 45), '"Turning real-world events into actionable intelligence."', font=f_heading, fill=LAVENDER, anchor="mm")

    # Signature Tagline
    draw.text((cx, cy + 115), "Monitor.   Verify.   Respond.", font=f_title_lg, fill=WHITE, anchor="mm")

    # Sub-badge
    draw.text((cx, cy + 190), "KotaKu Siaga Platform • Inovasi Teknologi Tanggap Bencana Iklim Kota Semarang", font=f_subhead, fill=CREAM, anchor="mm")

    # Apply Fade to Black if ending
    if fade < 1.0:
        dark_overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, int(255 * (1.0 - fade))))
        img.paste(dark_overlay, (0, 0), dark_overlay)

# ====================================================================
# MAIN RENDER LOOP
# ====================================================================
def main():
    print(f"================================================================")
    print(f"KotaKu Siaga 1080p Opening Presentation Video Generator")
    print(f"Resolution: {WIDTH}x{HEIGHT} @ {FPS} FPS | Duration: {DURATION_SEC:.1f}s ({TOTAL_FRAMES} frames)")
    print(f"================================================================")

    # Output paths
    output_dir = os.path.join(os.getcwd(), "public", "videos")
    os.makedirs(output_dir, exist_ok=True)
    out_mp4_public = os.path.join(output_dir, "kotaku_siaga_presentation.mp4")
    out_mp4_root = os.path.join(os.getcwd(), "kotaku_siaga_presentation.mp4")

    # Video Writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(out_mp4_public, fourcc, FPS, (WIDTH, HEIGHT))
    if not writer.isOpened():
        print("Error: Could not open VideoWriter with mp4v. Trying avc1/XVID...")
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        writer = cv2.VideoWriter(out_mp4_public, fourcc, FPS, (WIDTH, HEIGHT))

    start_time = time.time()
    last_print = 0

    for frame_idx in range(TOTAL_FRAMES):
        t_sec = frame_idx / float(FPS)
        frame_img = base_bg.copy()

        # Scene Router
        if t_sec < 6.0:
            render_scene_1(frame_img, t_sec)
        elif t_sec < 14.0:
            render_scene_2(frame_img, t_sec)
        elif t_sec < 22.0:
            render_scene_3(frame_img, t_sec)
        elif t_sec < 32.0:
            render_scene_4(frame_img, t_sec)
        elif t_sec < 42.0:
            render_scene_5(frame_img, t_sec)
        elif t_sec < 50.0:
            render_scene_6(frame_img, t_sec)
        else:
            render_scene_7(frame_img, t_sec)

        # Convert to BGR for OpenCV
        np_frame = np.array(frame_img)
        bgr_frame = cv2.cvtColor(np_frame, cv2.COLOR_RGB2BGR)
        writer.write(bgr_frame)

        # Progress reporting
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

    # Copy to root and artifacts
    shutil.copyfile(out_mp4_public, out_mp4_root)
    print(f"Copied to root: {out_mp4_root}")

    artifact_dir = r"C:\Users\Nabiel Ilyasa P\.gemini\antigravity-ide\brain\4e9dac3c-98bb-43fe-a3da-3f47a280ae36"
    if os.path.exists(artifact_dir):
        artifact_file = os.path.join(artifact_dir, "kotaku_siaga_presentation.mp4")
        shutil.copyfile(out_mp4_public, artifact_file)
        print(f"Copied to artifacts: {artifact_file}")

if __name__ == "__main__":
    main()
