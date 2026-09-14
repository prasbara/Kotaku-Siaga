#!/usr/bin/env python3
"""
KotaKu Siaga Civic Radar v2.0 — Non-YOLO Classical Computer Vision Flood Detection Service
Zero-YOLO • High Precision • Multi-Signal Analysis • Temporal Verification
Designed for Kota Semarang PantauSemar CCTV Vantage Points
"""

import os
import sys
import time
import json
import argparse
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import urllib.request
import urllib.error

import cv2
import numpy as np

# Configuration from Environment
CCTV_NORMAL_INTERVAL = int(os.getenv("CCTV_NORMAL_INTERVAL", "10"))
CCTV_SUSPECT_INTERVAL = int(os.getenv("CCTV_SUSPECT_INTERVAL", "2"))
FLOOD_CONFIDENCE_THRESHOLD = float(os.getenv("FLOOD_CONFIDENCE_THRESHOLD", "0.65"))
FLOOD_CONFIRMATION_FRAMES = int(os.getenv("FLOOD_CONFIRMATION_FRAMES", "5"))
FLOOD_RECOVERY_FRAMES = int(os.getenv("FLOOD_RECOVERY_FRAMES", "4"))
SERVER_PORT = int(os.getenv("CV_SERVICE_PORT", "8000"))

EVIDENCE_DIR = os.path.join(os.getcwd(), "public", "evidence")
os.makedirs(EVIDENCE_DIR, exist_ok=True)

WIB = timezone(timedelta(hours=7))


def get_wib_now() -> datetime:
    return datetime.now(WIB)


# ============================================================
# 1. CAMERA CALIBRATION PROFILES (Semarang CCTV Vantage Points)
# ============================================================

DEFAULT_ROAD_CALIBRATION = {
    "roi_polygon": [[0.05, 0.42], [0.95, 0.42], [1.00, 0.96], [0.00, 0.96]],
    "baseline_water_ratio": 0.01,
    "water_threshold_ratio": 0.15,
    "window_size": 15,
    "min_positive_frames": 5,
    "recovery_clean_frames": 4,
}

CAMERA_CALIBRATIONS: Dict[str, Dict[str, Any]] = {
    "cctv-ps-414-321": {  # SUPRIYADI (Pedurungan)
        "roi_polygon": [[0.05, 0.48], [0.95, 0.48], [1.00, 0.98], [0.00, 0.98]],
        "baseline_water_ratio": 0.02,
        "water_threshold_ratio": 0.16,
        "window_size": 15,
        "min_positive_frames": 5,
        "recovery_clean_frames": 4,
    },
    "cctv-ps-414-324": {  # PETERONGAN (Semarang Tengah)
        "roi_polygon": [[0.08, 0.46], [0.92, 0.46], [0.98, 0.95], [0.02, 0.95]],
        "baseline_water_ratio": 0.01,
        "water_threshold_ratio": 0.15,
        "window_size": 15,
        "min_positive_frames": 5,
        "recovery_clean_frames": 4,
    },
    "cctv-ps-414-323": {  # KALIGAWE (Genuk - Critical Tidal Corridor)
        "roi_polygon": [[0.02, 0.40], [0.98, 0.40], [1.00, 0.98], [0.00, 0.98]],
        "baseline_water_ratio": 0.03,
        "water_threshold_ratio": 0.15,
        "window_size": 15,
        "min_positive_frames": 4,
        "recovery_clean_frames": 5,
    },
    "cctv-ps-414-320": {  # TAMBAK LOROK (Semarang Utara)
        "roi_polygon": [[0.06, 0.44], [0.94, 0.44], [0.98, 0.96], [0.02, 0.96]],
        "baseline_water_ratio": 0.05,
        "water_threshold_ratio": 0.18,
        "window_size": 15,
        "min_positive_frames": 5,
        "recovery_clean_frames": 5,
    },
    "cctv-ps-414-322": {  # TANJUNG EMAS (Semarang Utara - Seaport)
        "roi_polygon": [[0.04, 0.38], [0.96, 0.38], [1.00, 0.95], [0.00, 0.95]],
        "baseline_water_ratio": 0.04,
        "water_threshold_ratio": 0.18,
        "window_size": 15,
        "min_positive_frames": 4,
        "recovery_clean_frames": 5,
    },
}


# ============================================================
# 2. TEMPORAL STATE MACHINE & SLIDING WINDOW BUFFER
# ============================================================

class CameraStateTracker:
    """
    Finite State Machine with Sliding Window for High-Precision Flood Confirmation.
    States: NORMAL -> SUSPECTED -> VERIFYING -> FLOOD_CONFIRMED -> RECOVERING -> NORMAL
    """

    def __init__(self, camera_id: str, calibration: Optional[Dict[str, Any]] = None):
        self.camera_id = camera_id
        self.calib = calibration or CAMERA_CALIBRATIONS.get(camera_id, DEFAULT_ROAD_CALIBRATION)
        self.window_size = int(self.calib.get("window_size", 15))
        self.min_positive = int(self.calib.get("min_positive_frames", FLOOD_CONFIRMATION_FRAMES))
        self.recovery_clean = int(self.calib.get("recovery_clean_frames", FLOOD_RECOVERY_FRAMES))

        self.state = "NORMAL"
        self.sliding_window: List[Dict[str, Any]] = []
        self.consecutive_water_frames = 0
        self.consecutive_clean_frames = 0
        self.first_water_detected_at: Optional[float] = None
        self.last_detection_at: Optional[float] = None
        self.last_confidence = 0.0
        self.last_severity = "minor"
        self.last_signals: Dict[str, float] = {}

    def update(
        self,
        instantaneous_confidence: float,
        severity: str,
        timestamp: float,
        signals: Optional[Dict[str, float]] = None,
    ) -> Tuple[str, str]:
        """
        Updates sliding window buffer and evaluates state machine transitions.
        """
        signals = signals or {}
        self.last_signals = signals

        is_positive = instantaneous_confidence >= 0.40
        is_strong_positive = instantaneous_confidence >= FLOOD_CONFIDENCE_THRESHOLD

        # Append to sliding window
        self.sliding_window.append({
            "timestamp": timestamp,
            "confidence": instantaneous_confidence,
            "is_positive": is_positive,
            "severity": severity,
            "signals": signals,
        })
        if len(self.sliding_window) > self.window_size:
            self.sliding_window.pop(0)

        # Count positive frames in current sliding window
        window_positives = sum(1 for f in self.sliding_window if f["is_positive"])
        temporal_persistence = window_positives / max(1, len(self.sliding_window))

        if is_positive:
            self.consecutive_clean_frames = 0
            self.consecutive_water_frames += 1
            if self.first_water_detected_at is None:
                self.first_water_detected_at = timestamp
            self.last_detection_at = timestamp

            # State Transitions
            if self.state in ["NORMAL", "FLOOD_RESOLVED", "RECOVERING"]:
                self.state = "WATER_SUSPECTED"
            elif self.state == "WATER_SUSPECTED":
                if self.consecutive_water_frames >= 2 or window_positives >= 3:
                    self.state = "FLOOD_SUSPECTED"
            elif self.state == "FLOOD_SUSPECTED":
                if self.consecutive_water_frames >= 3 or window_positives >= 4:
                    self.state = "VERIFYING"
            elif self.state == "VERIFYING":
                # Strict confirmation rule:
                # Requires sufficient consecutive frames + window persistence + strong confidence
                if (
                    self.consecutive_water_frames >= self.min_positive
                    and temporal_persistence >= 0.50
                    and is_strong_positive
                ):
                    self.state = "FLOOD_CONFIRMED"
                elif self.consecutive_water_frames >= self.min_positive and not is_strong_positive:
                    # Sustained standing water but lower confidence
                    self.state = "WATER_SUSPECTED"
            elif self.state == "FLOOD_CONFIRMED":
                # Stays confirmed while positive frames persist
                pass
        else:
            # Clean frame
            self.consecutive_water_frames = 0
            self.consecutive_clean_frames += 1

            if self.state == "FLOOD_CONFIRMED":
                if self.consecutive_clean_frames >= 2:
                    self.state = "RECOVERING"
            elif self.state == "RECOVERING":
                if self.consecutive_clean_frames >= self.recovery_clean:
                    self.state = "NORMAL"
                    self.first_water_detected_at = None
            elif self.state in ["WATER_SUSPECTED", "FLOOD_SUSPECTED", "VERIFYING"]:
                if self.consecutive_clean_frames >= 2:
                    self.state = "NORMAL"
                    self.first_water_detected_at = None

        self.last_confidence = instantaneous_confidence
        self.last_severity = severity
        return self.state, severity


# ============================================================
# 3. NON-YOLO CLASSICAL COMPUTER VISION ENGINE
# ============================================================

class NonYOLOFloodVisionEngine:
    """
    State-of-the-Art Classical Computer Vision Flood Detection Engine
    Zero Deep Learning / Zero YOLO Dependencies
    Features:
      - Camera Health Diagnostics (frozen, black, overexposed, blur/obstruction)
      - Scene & Ambient Illumination Analysis (Day, Night, Rain, Low Light)
      - Color Space Analysis (HSV muddy/dark water + LAB luminance/color separation)
      - Texture & Asphalt Homogeneity Analysis (Wet-road vs. Standing water differentiation)
      - Edge Density Reduction Filter (Standing water destroys road surface edges)
      - Specular Reflection & Glare Suppression
      - Relative Waterline & Elevation Extractor
      - Multi-Signal Scoring System & Explainability Telemetry
    """

    def __init__(self):
        self.trackers: Dict[str, CameraStateTracker] = {}
        self.prev_frames: Dict[str, np.ndarray] = {}
        self.frozen_counts: Dict[str, int] = {}
        print("[Non-YOLO Engine] Classical Computer Vision Engine initialized (Zero YOLO).")

    def get_tracker(self, camera_id: str) -> CameraStateTracker:
        if camera_id not in self.trackers:
            calib = CAMERA_CALIBRATIONS.get(camera_id, DEFAULT_ROAD_CALIBRATION)
            self.trackers[camera_id] = CameraStateTracker(camera_id, calib)
        return self.trackers[camera_id]

    def capture_frame_from_stream(self, stream_url: str, timeout_sec: int = 5) -> Optional[np.ndarray]:
        """
        Captures a live frame from an HLS / RTSP / HTTP video stream using OpenCV.
        """
        try:
            cap = cv2.VideoCapture(stream_url)
            if not cap.isOpened():
                return None
            ret, frame = cap.read()
            cap.release()
            if ret and frame is not None and frame.size > 0:
                return frame
            return None
        except Exception as e:
            print(f"[Stream Capture Error] {e}")
            return None

    # --------------------------------------------------------
    # 3.1 Camera Health Diagnostics
    # --------------------------------------------------------
    def diagnose_camera_health(
        self, frame: Optional[np.ndarray], camera_id: str
    ) -> Tuple[str, str]:
        """
        Evaluates camera health: ONLINE, DEGRADED, OFFLINE, OBSTRUCTED.
        """
        if frame is None or frame.size == 0:
            return "OFFLINE", "Stream tidak dapat diakses atau timeout."

        h, w = frame.shape[:2]
        if h < 80 or w < 80:
            return "DEGRADED", "Resolusi frame terlalu rendah untuk evaluasi visual."

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
        mean_lum = float(np.mean(gray))

        # Check black / blank screen
        if mean_lum < 6.0:
            return "DEGRADED", f"Frame hitam pekat (mean intensity: {mean_lum:.1f} < 6.0)."

        # Check overexposed / blown out
        if mean_lum > 248.0:
            return "DEGRADED", f"Frame mengalami overexposure ekstrem (mean: {mean_lum:.1f} > 248.0)."

        # Check blur / lens obstruction using Laplacian variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if laplacian_var < 10.0:
            return "OBSTRUCTED", f"Lensa kamera buram atau terhalang (Laplacian var: {laplacian_var:.1f} < 10.0)."

        # Check frozen frame
        if camera_id in self.prev_frames:
            prev = self.prev_frames[camera_id]
            if prev.shape == gray.shape:
                diff = float(np.mean(cv2.absdiff(gray, prev)))
                if diff < 0.20:
                    self.frozen_counts[camera_id] = self.frozen_counts.get(camera_id, 0) + 1
                    if self.frozen_counts[camera_id] >= 3:
                        return "DEGRADED", f"Feed kamera membeku (diff: {diff:.2f} across 3 captures)."
                else:
                    self.frozen_counts[camera_id] = 0

        self.prev_frames[camera_id] = gray.copy()
        return "ONLINE", "Kamera beroperasi normal (telemetri visual jernih)."

    # --------------------------------------------------------
    # 3.2 Scene & Ambient Illumination Analysis
    # --------------------------------------------------------
    def classify_scene(self, frame: np.ndarray) -> str:
        """
        Classifies scene condition: DAY, NIGHT, RAIN, LOW_LIGHT.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_val = float(np.mean(gray))
        std_val = float(np.std(gray))

        if mean_val < 45.0:
            return "NIGHT"
        elif mean_val < 75.0:
            return "LOW_LIGHT"
        elif std_val < 32.0 and mean_val > 90.0:
            # Low contrast + uniform gray distribution typically indicates heavy rain overcast
            return "RAIN"
        else:
            return "DAY"

    # --------------------------------------------------------
    # 3.3 Multi-Signal Non-YOLO Water Analysis
    # --------------------------------------------------------
    def analyze_water_features(
        self,
        frame: np.ndarray,
        camera_id: str = "default",
        roi_polygon: Optional[List[List[float]]] = None,
    ) -> Tuple[float, List[Dict[str, Any]], str, Dict[str, Any]]:
        """
        Executes multi-signal computer vision analysis on candidate frame.
        Returns:
          (detection_score, detected_features, severity, signal_metadata)
        """
        h, w = frame.shape[:2]
        calib = CAMERA_CALIBRATIONS.get(camera_id, DEFAULT_ROAD_CALIBRATION)
        poly = roi_polygon or calib.get("roi_polygon", DEFAULT_ROAD_CALIBRATION["roi_polygon"])

        # 1. Create ROI polygon mask
        pts = np.array([[int(p[0] * w), int(p[1] * h)] for p in poly], dtype=np.int32)
        roi_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(roi_mask, [pts], 255)
        total_roi_pixels = max(1, cv2.countNonZero(roi_mask))

        # Extract ROI area
        roi_bgr = cv2.bitwise_and(frame, frame, mask=roi_mask)
        scene = self.classify_scene(frame)

        # 2. Dual Color Space Candidate Segmentation (HSV + LAB)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Muddy water mask (typical Semarang rob / brown stormwater)
        # Muddy water has distinct yellowish-brown hue and positive saturation (unlike gray asphalt)
        if scene == "NIGHT":
            lower_muddy = np.array([5, 20, 25])
            upper_muddy = np.array([42, 175, 140])
        else:
            lower_muddy = np.array([8, 28, 35])
            upper_muddy = np.array([38, 195, 185])
        muddy_mask = cv2.inRange(hsv, lower_muddy, upper_muddy)

        # 3. Specular Highlight & Direct Glare Suppression (Headlights, Streetlamps)
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        glare_mask = ((val > 215) & (roi_mask > 0)).astype(np.uint8) * 255
        glare_dilated = cv2.dilate(glare_mask, np.ones((9, 9), np.uint8), iterations=1)

        # 4. Texture & Edge Density Analysis (Wet Road vs Standing Water)
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        edge_mag = np.sqrt(sobelx**2 + sobely**2)
        roi_edge_mag = edge_mag[roi_mask > 0]
        mean_edge_intensity = float(np.mean(roi_edge_mag)) if roi_edge_mag.size > 0 else 0.0

        # Standing water requires smooth surface: edge magnitude must be low (< 10)
        smooth_surface_mask = (edge_mag < 9.0).astype(np.uint8) * 255

        # Dark standing water (rain puddle over dark road):
        # In night scenes, pitch-black unlit asphalt is val < 28; water puddles reflect streetlights (val >= 28).
        # In daylight, puddles over dark asphalt have val >= 18.
        dark_min_val = 30 if scene == "NIGHT" else 18
        dark_water_mask = (
            (val >= dark_min_val) & (val <= 85) & (sat <= 60) & (smooth_surface_mask > 0)
        ).astype(np.uint8) * 255

        # Combine candidate water masks: Muddy Water OR Smooth Dark Standing Water
        raw_water_mask = cv2.bitwise_or(muddy_mask, dark_water_mask)
        raw_water_mask = cv2.bitwise_and(raw_water_mask, cv2.bitwise_not(glare_dilated))
        raw_water_mask = cv2.bitwise_and(raw_water_mask, raw_water_mask, mask=roi_mask)

        # 5. Morphological Filtering (Removes rain noise and small speckles)
        kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        morphed_mask = cv2.morphologyEx(raw_water_mask, cv2.MORPH_OPEN, kernel_open)
        morphed_mask = cv2.morphologyEx(morphed_mask, cv2.MORPH_CLOSE, kernel_close)

        # Filter out small noise components (< 300 pixels)
        contours, _ = cv2.findContours(morphed_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        final_water_mask = np.zeros_like(morphed_mask)
        water_contour_count = 0
        largest_contour_area = 0

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area >= 300:
                cv2.drawContours(final_water_mask, [cnt], -1, 255, -1)
                water_contour_count += 1
                if area > largest_contour_area:
                    largest_contour_area = area

        water_pixels = cv2.countNonZero(final_water_mask)
        water_ratio = water_pixels / float(total_roi_pixels)
        baseline_ratio = float(calib.get("baseline_water_ratio", 0.01))
        excess_water_ratio = max(0.0, water_ratio - baseline_ratio)
        thresh_ratio = float(calib.get("water_threshold_ratio", 0.15))

        # Texture local variance inside candidate water region
        if water_pixels > 100:
            water_pixels_gray = gray[final_water_mask > 0]
            water_texture_var = float(np.var(water_pixels_gray))
            texture_homogeneity_score = float(np.clip((250.0 - water_texture_var) / 250.0, 0.0, 1.0))
        else:
            texture_homogeneity_score = 0.0

        # Normal asphalt edge intensity is > 20. Standing water reduces it.
        expected_edge = 22.0
        edge_reduction_score = float(np.clip((expected_edge - mean_edge_intensity) / expected_edge, 0.0, 1.0))

        # Wet road false-positive suppression:
        # If overall ROI edge intensity is high (> 16.0), asphalt grain is clearly preserved (not submerged)
        if mean_edge_intensity >= 16.0:
            edge_suppression = float(np.clip(1.0 - (mean_edge_intensity - 16.0) / 10.0, 0.10, 1.0))
        else:
            edge_suppression = 1.0

        # 6. Waterline Elevation Profile (Vertical depth estimation)
        # Project water mask vertically to find the highest waterline inside ROI
        y_indices, x_indices = np.where(final_water_mask > 0)
        if len(y_indices) > 0:
            highest_y = np.min(y_indices)
            roi_y_indices = np.where(roi_mask > 0)[0]
            roi_min_y = np.min(roi_y_indices)
            roi_max_y = np.max(roi_y_indices)
            roi_height = max(1, roi_max_y - roi_min_y)
            # Waterline elevation: 0.0 (bottom of road) to 1.0 (submerged whole road)
            waterline_elevation = float(np.clip((roi_max_y - highest_y) / float(roi_height), 0.0, 1.0))
        else:
            waterline_elevation = 0.0

        # 7. Spatial Continuity / Compactness Score
        if water_pixels > 0 and water_contour_count > 0:
            # Ratio of largest blob to total water pixels (high compactness = single large pool)
            spatial_compactness = float(np.clip(largest_contour_area / float(water_pixels), 0.0, 1.0))
        else:
            spatial_compactness = 0.0

        # 8. Scene Context Score
        scene_multiplier = 1.0
        if scene == "NIGHT":
            scene_multiplier = 0.90  # Slightly more conservative at night
        elif scene == "RAIN":
            scene_multiplier = 0.95

        # ----------------------------------------------------
        # Multi-Signal Score Formula
        # ----------------------------------------------------
        s_area = float(np.clip(excess_water_ratio / 0.40, 0.0, 1.0))
        s_line = float(waterline_elevation)
        s_texture = float(texture_homogeneity_score)
        s_edge = float(edge_reduction_score)
        s_spatial = float(spatial_compactness)

        # Apply threshold gating: if excess water is negligible, clamp composite
        if excess_water_ratio < (thresh_ratio * 0.50):
            raw_composite = (0.35 * s_area + 0.15 * s_line) * 0.3
        else:
            raw_composite = (
                0.35 * s_area + 0.20 * s_line + 0.20 * s_texture + 0.15 * s_spatial + 0.10 * s_edge
            )

        composite_detection_score = float(raw_composite * scene_multiplier * edge_suppression)
        composite_detection_score = round(float(np.clip(composite_detection_score, 0.0, 1.0)), 4)

        # Severity Estimation based strictly on coverage & waterline (NOT confidence!)
        if excess_water_ratio >= 0.38 and waterline_elevation >= 0.60:
            severity = "severe"
        elif excess_water_ratio >= 0.18:
            severity = "moderate"
        else:
            severity = "minor"

        # Construct Explainability Insights
        features: List[Dict[str, Any]] = []
        explanation_reasons: List[str] = []
        suppression_reasons: List[str] = []

        if water_ratio >= calib.get("water_threshold_ratio", 0.15):
            features.append({
                "class": "standing_water_pool",
                "score": round(s_area, 3),
                "coverage_pct": round(water_ratio * 100, 1),
            })
            explanation_reasons.append(
                f"Genangan air terdeteksi menutupi {round(water_ratio * 100, 1)}% area ROI jalan."
            )
        else:
            suppression_reasons.append(
                f"Cakupan air ({round(water_ratio * 100, 1)}%) berada di bawah ambang genangan ({round(calib.get('water_threshold_ratio', 0.15) * 100, 1)}%)."
            )

        if texture_homogeneity_score >= 0.50:
            explanation_reasons.append("Tekstur permukaan mulus homogen (karakteristik fisik genangan air nyata).")
        else:
            suppression_reasons.append("Tekstur butiran aspal jalan masih terlihat jelas (bukan lapisan air dalam).")

        if glare_mask.any() and cv2.countNonZero(glare_mask) > 50:
            suppression_reasons.append("Filter pantulan cahaya lampu/glare berhasil meredam false positive.")

        signal_metadata = {
            "signals": {
                "water_area_score": round(s_area, 4),
                "waterline_score": round(s_line, 4),
                "texture_score": round(s_texture, 4),
                "spatial_score": round(s_spatial, 4),
                "scene_score": round(scene_multiplier, 4),
                "temporal_score": 0.0,  # Will be populated by tracker
                "composite_detection_score": composite_detection_score,
            },
            "metrics": {
                "water_ratio": round(water_ratio, 4),
                "baseline_water_ratio": baseline_ratio,
                "excess_water_ratio": round(excess_water_ratio, 4),
                "mean_edge_intensity": round(mean_edge_intensity, 2),
                "waterline_elevation": round(waterline_elevation, 3),
                "contour_count": water_contour_count,
                "scene": scene,
            },
            "explainability": {
                "verdict": "FLOOD_CANDIDATE" if composite_detection_score >= 0.40 else "NORMAL_SURFACE",
                "primary_factors": explanation_reasons,
                "suppression_factors": suppression_reasons,
                "confidence_rationale": (
                    f"Skor komposit non-YOLO: {composite_detection_score:.3f} "
                    f"[Area: {s_area:.2f}, Waterline: {s_line:.2f}, Tekstur: {s_texture:.2f}]."
                ),
            },
            "masks": {
                "roi_mask": roi_mask,
                "water_mask": final_water_mask,
            }
        }

        return composite_detection_score, features, severity, signal_metadata

    # --------------------------------------------------------
    # 3.4 Debug Visualizer (4-Panel Diagnostic Composite)
    # --------------------------------------------------------
    def generate_debug_visualization(
        self,
        frame: np.ndarray,
        camera_id: str,
        state: str,
        confidence: float,
        signals: Dict[str, float],
        roi_mask: np.ndarray,
        water_mask: np.ndarray,
    ) -> str:
        """
        Generates 4-panel composite diagnostic visualization image and saves to public/evidence.
        """
        h, w = frame.shape[:2]
        vis_w, vis_h = 480, 270

        # 1. Panel 1: Original with ROI overlay
        p1 = frame.copy()
        roi_contours, _ = cv2.findContours(roi_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(p1, roi_contours, -1, (0, 165, 255), 2)  # Amber ROI contour
        p1 = cv2.resize(p1, (vis_w, vis_h))
        cv2.putText(p1, "1. ORIGINAL & CALIBRATED ROI", (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        # 2. Panel 2: Water Candidate Segmentation Mask
        p2 = np.zeros((h, w, 3), dtype=np.uint8)
        p2[water_mask > 0] = [235, 145, 30]  # Blue-cyan water pixels
        p2 = cv2.addWeighted(frame, 0.4, p2, 0.6, 0)
        p2 = cv2.resize(p2, (vis_w, vis_h))
        cv2.putText(p2, "2. MULTI-SPECTRAL WATER MASK", (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

        # 3. Panel 3: Waterline & Contours
        p3 = cv2.cvtColor(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
        water_contours, _ = cv2.findContours(water_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(p3, water_contours, -1, (0, 0, 255), 2)
        p3 = cv2.resize(p3, (vis_w, vis_h))
        cv2.putText(p3, "3. WATERLINE BOUNDARY & BLOB", (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1)

        # 4. Panel 4: Diagnostic Telemetry HUD
        p4 = np.zeros((vis_h, vis_w, 3), dtype=np.uint8)
        p4[:] = (30, 15, 35)  # Deep Aubergine tint

        state_color = (0, 200, 80) if state == "NORMAL" else (0, 165, 255) if "SUSPECTED" in state else (0, 0, 255)
        cv2.putText(p4, f"KOTAKU SIAGA NON-YOLO CV", (14, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 200, 230), 2)
        cv2.putText(p4, f"CAM: {camera_id.upper()}", (14, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1)
        cv2.putText(p4, f"STATE: {state}", (14, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.55, state_color, 2)
        cv2.putText(p4, f"CONFIDENCE: {confidence:.2f}", (14, 98), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        # Draw Signal Bar Gauges
        gauge_y = 125
        bar_signals = [
            ("Water Area", signals.get("water_area_score", 0.0)),
            ("Waterline", signals.get("waterline_score", 0.0)),
            ("Texture Homogeneity", signals.get("texture_score", 0.0)),
            ("Spatial Continuity", signals.get("spatial_score", 0.0)),
            ("Temporal Persistence", signals.get("temporal_score", 0.0)),
        ]
        for name, val in bar_signals:
            cv2.putText(p4, f"{name}:", (14, gauge_y), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (200, 200, 200), 1)
            bar_x = 180
            bar_w = 200
            cv2.rectangle(p4, (bar_x, gauge_y - 8), (bar_x + bar_w, gauge_y + 2), (60, 40, 70), -1)
            fill_w = int(bar_w * np.clip(val, 0.0, 1.0))
            bar_color = (0, 200, 80) if val < 0.40 else (0, 165, 255) if val < 0.70 else (0, 0, 255)
            cv2.rectangle(p4, (bar_x, gauge_y - 8), (bar_x + fill_w, gauge_y + 2), bar_color, -1)
            cv2.putText(p4, f"{val:.2f}", (bar_x + bar_w + 10, gauge_y), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (230, 230, 230), 1)
            gauge_y += 24

        # Assemble 2x2 grid
        top_row = np.hstack([p1, p2])
        bottom_row = np.hstack([p3, p4])
        composite = np.vstack([top_row, bottom_row])

        # Save composite
        filename = f"cctv-debug-{camera_id}-{int(time.time())}.jpg"
        save_path = os.path.join(EVIDENCE_DIR, filename)
        cv2.imwrite(save_path, composite, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return f"/evidence/{filename}"

    # --------------------------------------------------------
    # 3.5 High-Level Camera Analysis Pipeline
    # --------------------------------------------------------
    def analyze_camera_pipeline(
        self,
        camera_id: str,
        camera_code: str,
        camera_name: str,
        district: str,
        stream_url: str,
        save_debug: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes complete Non-YOLO detection pipeline with temporal tracking.
        """
        start_time = time.time()
        frame = self.capture_frame_from_stream(stream_url)

        # 1. Health Diagnostic
        health_status, health_reason = self.diagnose_camera_health(frame, camera_id)

        if health_status != "ONLINE" or frame is None:
            return {
                "camera_id": camera_id,
                "camera_code": camera_code,
                "camera_name": camera_name,
                "district": district,
                "cctv_status": health_status,
                "camera_health": health_status,
                "state": "NORMAL",
                "detection_score": 0.0,
                "visual_confidence": 0.0,
                "water_region_score": 0.0,
                "road_coverage_score": 0.0,
                "temporal_score": 0.0,
                "estimated_visual_severity": "minor",
                "signals": {
                    "water_area_score": 0.0,
                    "waterline_score": 0.0,
                    "texture_score": 0.0,
                    "spatial_score": 0.0,
                    "scene_score": 0.0,
                    "temporal_score": 0.0,
                    "composite_detection_score": 0.0,
                },
                "detected_features": [health_reason],
                "explainability": {
                    "verdict": "CAMERA_OFFLINE_OR_DEGRADED",
                    "primary_factors": [health_reason],
                    "suppression_factors": ["Tidak dapat mengevaluasi piksel karena status kamera non-optimal."],
                    "confidence_rationale": "UNKNOWN -- bukan bukti tidak ada banjir (OFFLINE != NO_FLOOD).",
                },
                "evidence_url": None,
                "debug_visual_url": None,
                "processing_time_ms": int((time.time() - start_time) * 1000),
                "engine_used": "NonYOLOCVEngine",
                "methodology_note": f"Kamera {health_status}. Status UNKNOWN bukan NO_FLOOD.",
            }

        # 2. Multi-Signal CV Analysis
        raw_score, detections, severity, signal_data = self.analyze_water_features(frame, camera_id)
        signals = signal_data["signals"]

        # 3. Temporal State Machine Verification
        tracker = self.get_tracker(camera_id)
        state, updated_severity = tracker.update(raw_score, severity, time.time(), signals)

        # Compute temporal score from sliding window
        window_positives = sum(1 for f in tracker.sliding_window if f["is_positive"])
        temporal_persistence = float(window_positives / max(1, len(tracker.sliding_window)))
        signals["temporal_score"] = round(temporal_persistence, 4)

        # Compute Final Calibrated Confidence Score
        # Confidence requires agreement between instantaneous score and temporal persistence
        if state == "FLOOD_CONFIRMED":
            visual_confidence = float(np.clip(0.70 + 0.25 * temporal_persistence, 0.70, 0.96))
        elif state == "VERIFYING":
            visual_confidence = float(np.clip(0.50 + 0.20 * raw_score, 0.50, 0.74))
        elif state == "FLOOD_SUSPECTED":
            visual_confidence = float(np.clip(0.40 + 0.20 * raw_score, 0.40, 0.65))
        elif state == "WATER_SUSPECTED":
            visual_confidence = float(np.clip(0.30 + 0.15 * raw_score, 0.30, 0.48))
        else:
            visual_confidence = float(np.clip(raw_score * 0.40, 0.0, 0.28))

        visual_confidence = round(visual_confidence, 4)

        # 4. Optional Debug Visualization
        debug_url = None
        if save_debug:
            try:
                debug_url = self.generate_debug_visualization(
                    frame=frame,
                    camera_id=camera_id,
                    state=state,
                    confidence=visual_confidence,
                    signals=signals,
                    roi_mask=signal_data["masks"]["roi_mask"],
                    water_mask=signal_data["masks"]["water_mask"],
                )
            except Exception as ex:
                print(f"[Debug Vis Error] {ex}")

        explainability = signal_data["explainability"]
        explainability["verdict"] = f"State: {state} ({visual_confidence * 100:.0f}% confidence)"

        return {
            "camera_id": camera_id,
            "camera_code": camera_code,
            "camera_name": camera_name,
            "district": district,
            "cctv_status": "ONLINE",
            "camera_health": "ONLINE",
            "scene": signal_data["metrics"]["scene"],
            "state": state,
            "detection_score": raw_score,
            "visual_confidence": visual_confidence,
            "water_region_score": signal_data["metrics"]["water_ratio"],
            "road_coverage_score": signal_data["metrics"]["excess_water_ratio"],
            "temporal_score": temporal_persistence,
            "estimated_visual_severity": updated_severity,
            "signals": signals,
            "detected_features": [d["class"] for d in detections] or ["Permukaan jalan normal"],
            "explainability": explainability,
            "evidence_url": debug_url,
            "debug_visual_url": debug_url,
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "engine_used": "NonYOLOCVEngine",
            "methodology_note": (
                f"Analisis Classical Non-YOLO CV. Status: {state}. "
                f"Sinyal komposit: {raw_score:.3f}, Persistensi temporal: {temporal_persistence:.2f}."
            ),
        }


# ============================================================
# 4. HTTP SERVER INTERFACE FOR NEXT.JS INTEGRATION
# ============================================================

GLOBAL_ENGINE = NonYOLOFloodVisionEngine()


class CVServiceRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: Dict[str, Any]):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {
                "status": "healthy",
                "engine": "NonYOLOFloodVisionEngine",
                "version": "2.0.0",
                "methodology": "Classical Non-YOLO (Color, Texture, Edge, Waterline, Temporal)",
                "active_trackers": len(GLOBAL_ENGINE.trackers),
            })
        elif self.path == "/calibrate":
            self._send_json(200, {
                "success": True,
                "calibrations": CAMERA_CALIBRATIONS,
            })
        else:
            self._send_json(404, {"error": "Endpoint tidak ditemukan."})

    def do_POST(self):
        if self.path == "/infer":
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length).decode("utf-8")
            try:
                body = json.loads(raw_body)
                cam_id = body.get("camera_id", "cctv-unknown")
                cam_code = body.get("camera_code", cam_id.upper())
                cam_name = body.get("camera_name", "Kamera PantauSemar")
                district = body.get("district", "Semarang")
                stream_url = body.get("stream_url", "")
                save_evidence = body.get("save_evidence", True)

                result = GLOBAL_ENGINE.analyze_camera_pipeline(
                    camera_id=cam_id,
                    camera_code=cam_code,
                    camera_name=cam_name,
                    district=district,
                    stream_url=stream_url,
                    save_debug=save_evidence,
                )
                self._send_json(200, result)
            except Exception as e:
                self._send_json(500, {"error": str(e), "engine": "NonYOLOFloodVisionEngine"})
        else:
            self._send_json(404, {"error": "Endpoint tidak ditemukan."})


def start_server(port: int = SERVER_PORT):
    server = HTTPServer(("0.0.0.0", port), CVServiceRequestHandler)
    print(f"[Non-YOLO CV Service] Daemon running at http://0.0.0.0:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[Non-YOLO CV Service] Shutting down daemon.")
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KotaKu Siaga Non-YOLO CV Flood Detection Service")
    parser.add_argument("--port", type=int, default=SERVER_PORT, help="Server port (default: 8000)")
    parser.add_argument("--camera", type=str, help="Run one-shot check on specific camera ID")
    parser.add_argument("--stream", type=str, help="Stream URL for one-shot check")
    args = parser.parse_args()

    if args.camera and args.stream:
        print(f"Running one-shot Non-YOLO analysis on {args.camera}...")
        res = GLOBAL_ENGINE.analyze_camera_pipeline(
            camera_id=args.camera,
            camera_code=args.camera.upper(),
            camera_name="One-Shot Test",
            district="Semarang",
            stream_url=args.stream,
        )
        print(json.dumps(res, indent=2))
    else:
        start_server(args.port)
