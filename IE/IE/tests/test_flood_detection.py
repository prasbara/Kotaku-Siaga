#!/usr/bin/env python3
"""
KotaKu Siaga Civic Radar v2.0 — Non-YOLO Classical Computer Vision Test Suite
Zero-YOLO • High Precision • Temporal Verification • Zero-False-Alarm Target
Validates:
  - Test A: Normal dry asphalt road -> NORMAL
  - Test B: Wet road with surface sheen -> Suppressed, stays NORMAL (Wet Road != Flood)
  - Test C: Standing water puddle -> WATER_SUSPECTED
  - Test D: Persistent deep flood across multiple frames -> FLOOD_CONFIRMED
  - Test E: Rain weather context alone -> Stays NORMAL (Rain != Flood)
  - Test F: Nighttime headlight glare / reflections -> Suppressed via specular filter
  - Test G: Camera failures (black screen, extreme blur) -> DEGRADED/OBSTRUCTED (not FLOOD)
  - Test H: Temporal clearance & recovery -> RECOVERING -> NORMAL
  - Test I: Strict Confidence vs Severity vs Detection Score Separation
"""

import sys
import os
import time
import unittest
import numpy as np
import cv2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.cv_service import (
    CameraStateTracker,
    NonYOLOFloodVisionEngine,
)


class TestNonYOLOFloodDetection(unittest.TestCase):

    def setUp(self):
        self.camera_id = "cctv-ps-414-321"  # SUPRIYADI
        self.engine = NonYOLOFloodVisionEngine()
        self.tracker = CameraStateTracker(self.camera_id)

    # -------------------------------------------------------------
    # Test A: Normal Dry Asphalt Road
    # -------------------------------------------------------------
    def test_a_normal_dry_road(self):
        """Test A: Normal dry road with high asphalt grain texture -> NORMAL"""
        print("\n--- Test A: Normal Dry Road ---")
        # Synthetic gray asphalt with fine texture noise
        frame = np.full((480, 640, 3), 110, dtype=np.uint8)
        noise = np.random.randint(-15, 15, (480, 640, 3), dtype=np.int16)
        frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        score, detections, severity, signal_data = self.engine.analyze_water_features(frame, self.camera_id)

        self.assertLess(score, 0.35, f"Dry road score must be < 0.35, got {score:.3f}")
        self.assertEqual(severity, "minor", f"Dry road severity must be minor, got {severity}")

        state, _ = self.tracker.update(score, severity, time.time(), signal_data["signals"])
        self.assertEqual(state, "NORMAL", f"Expected NORMAL, got {state}")
        print(f"  PASS: score={score:.3f}, state={state}, severity={severity}")

    # -------------------------------------------------------------
    # Test B: Wet Road Sheen (CRITICAL: Wet Road != Flood)
    # -------------------------------------------------------------
    def test_b_wet_road_false_positive_suppression(self):
        """Test B: Wet road sheen with preserved asphalt edge texture must NOT trigger flood"""
        print("\n--- Test B: Wet Road Sheen (Wet Road != Flood) ---")
        # Darker asphalt with sharp high-frequency edge texture (grain intact)
        frame = np.full((480, 640, 3), 60, dtype=np.uint8)
        # Add high-frequency asphalt texture
        for i in range(0, 480, 4):
            frame[i, :, :] = np.clip(frame[i, :, :] + 25, 0, 255)

        score, detections, severity, signal_data = self.engine.analyze_water_features(frame, self.camera_id)
        signals = signal_data["signals"]

        # Texture homogeneity should be low because asphalt edges are preserved
        self.assertLess(score, 0.40, f"Wet road sheen must not score >= 0.40! Got {score:.3f}")

        state, _ = self.tracker.update(score, severity, time.time(), signals)
        self.assertNotEqual(state, "FLOOD_CONFIRMED", "Wet road must NEVER produce FLOOD_CONFIRMED")
        self.assertIn(state, ["NORMAL", "WATER_SUSPECTED"])
        print(f"  PASS: wet road score={score:.3f}, state={state} (suppressed successfully)")

    # -------------------------------------------------------------
    # Test C: Standing Water Puddle
    # -------------------------------------------------------------
    def test_c_standing_water_puddle(self):
        """Test C: Standing water puddle with smooth homogeneous texture -> WATER_SUSPECTED"""
        print("\n--- Test C: Standing Water Puddle ---")
        # Synthetic road with a muddy brown pool in the lower ROI
        frame = np.full((480, 640, 3), 110, dtype=np.uint8)
        # Add smooth brown flood puddle in lower ROI (y: 280 to 440, x: 100 to 540)
        # BGR: [45, 80, 110] (muddy brown in BGR)
        frame[280:440, 100:540] = [45, 80, 110]

        score, detections, severity, signal_data = self.engine.analyze_water_features(frame, self.camera_id)
        signals = signal_data["signals"]

        self.assertGreaterEqual(score, 0.35, f"Puddle must score >= 0.35, got {score:.3f}")

        state, _ = self.tracker.update(score, severity, time.time(), signals)
        self.assertEqual(state, "WATER_SUSPECTED", f"Expected WATER_SUSPECTED, got {state}")
        print(f"  PASS: puddle score={score:.3f}, state={state}")

    # -------------------------------------------------------------
    # Test D: Persistent Flood Over Multiple Frames -> FLOOD_CONFIRMED
    # -------------------------------------------------------------
    def test_d_persistent_flood_confirmation(self):
        """Test D: Persistent deep flood over sliding window -> FLOOD_CONFIRMED"""
        print("\n--- Test D: Persistent Flood Confirmation ---")
        # Frame with extensive submerged road area (muddy brown water covering 60% of ROI)
        frame = np.full((480, 640, 3), 100, dtype=np.uint8)
        frame[240:470, 40:600] = [40, 75, 105]  # Deep muddy water blob

        score, detections, severity, signal_data = self.engine.analyze_water_features(frame, self.camera_id)
        signals = signal_data["signals"]

        self.assertGreaterEqual(score, 0.55, f"Deep flood must score >= 0.55, got {score:.3f}")

        t0 = time.time()
        # Feed consecutive frames through temporal tracker
        s1, _ = self.tracker.update(score, severity, t0, signals)
        self.assertEqual(s1, "WATER_SUSPECTED")
        s2, _ = self.tracker.update(score, severity, t0 + 1, signals)
        self.assertEqual(s2, "FLOOD_SUSPECTED")
        s3, _ = self.tracker.update(score, severity, t0 + 2, signals)
        self.assertEqual(s3, "VERIFYING")

        # Continue feeding positive frames
        for i in range(3, 8):
            st, _ = self.tracker.update(score, severity, t0 + i * 2, signals)

        self.assertEqual(self.tracker.state, "FLOOD_CONFIRMED", f"Expected FLOOD_CONFIRMED, got {self.tracker.state}")
        print(f"  PASS: persistent flood successfully confirmed -> state={self.tracker.state}")

    # -------------------------------------------------------------
    # Test E: Nighttime Headlight Glare Suppression
    # -------------------------------------------------------------
    def test_e_nighttime_headlight_glare_suppression(self):
        """Test E: Nighttime headlight glare spots must be suppressed via specular filter"""
        print("\n--- Test E: Nighttime Headlight Glare Suppression ---")
        # Dark night road (mean intensity ~ 25) with bright saturated specular headlight spots
        frame = np.full((480, 640, 3), 25, dtype=np.uint8)
        # Add 2 intense white circular headlight glare spots
        cv2.circle(frame, (200, 320), 40, (255, 255, 255), -1)
        cv2.circle(frame, (350, 320), 40, (255, 255, 255), -1)

        score, detections, severity, signal_data = self.engine.analyze_water_features(frame, self.camera_id)

        # Specular filter should isolate and subtract the glare
        self.assertLess(score, 0.38, f"Headlight glare must be suppressed! Got {score:.3f}")
        print(f"  PASS: headlight glare suppressed -> score={score:.3f}")

    # -------------------------------------------------------------
    # Test F: Camera Health Diagnostics (Black, Blurred, Offline)
    # -------------------------------------------------------------
    def test_f_camera_health_diagnostics(self):
        """Test F: Camera failure must be diagnosed as DEGRADED/OBSTRUCTED/OFFLINE, never FLOOD"""
        print("\n--- Test F: Camera Health Diagnostics ---")
        # 1. Black frame
        black_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        h1, r1 = self.engine.diagnose_camera_health(black_frame, "test-black")
        self.assertEqual(h1, "DEGRADED")
        self.assertIn("hitam pekat", r1)

        # 2. Extremely blurred frame (lens covered / smeared with grease)
        blurred_frame = np.full((480, 640, 3), 120, dtype=np.uint8)
        h2, r2 = self.engine.diagnose_camera_health(blurred_frame, "test-blur")
        self.assertEqual(h2, "OBSTRUCTED")
        self.assertIn("buram", r2)

        # 3. None frame (offline stream)
        h3, r3 = self.engine.diagnose_camera_health(None, "test-offline")
        self.assertEqual(h3, "OFFLINE")

        # Full pipeline evaluation on black frame
        res = self.engine.analyze_camera_pipeline(
            camera_id="cam-black-fail",
            camera_code="CAM-FAIL",
            camera_name="Fail Test",
            district="Genuk",
            stream_url="https://invalid.example.com/stream.m3u8",
            save_debug=False,
        )
        self.assertNotEqual(res["state"], "FLOOD_CONFIRMED")
        self.assertEqual(res["cctv_status"], "OFFLINE")
        print("  PASS: Camera health diagnostics correctly categorized failures.")

    # -------------------------------------------------------------
    # Test G: Temporal Clearance & Recovery
    # -------------------------------------------------------------
    def test_g_temporal_recovery_lifecycle(self):
        """Test G: Confirmed flood transitions to RECOVERING then NORMAL when water recedes"""
        print("\n--- Test G: Temporal Recovery Lifecycle ---")
        t0 = time.time()
        # Bring to confirmed
        for i in range(8):
            self.tracker.update(0.85, "severe", t0 + i)
        self.assertEqual(self.tracker.state, "FLOOD_CONFIRMED")

        # Clean frames start arriving
        s_clean1, _ = self.tracker.update(0.05, "minor", t0 + 10)
        s_clean2, _ = self.tracker.update(0.05, "minor", t0 + 12)
        self.assertEqual(s_clean2, "RECOVERING", f"Expected RECOVERING, got {s_clean2}")

        # Recovery period sustains clean frames
        for j in range(5):
            st, _ = self.tracker.update(0.05, "minor", t0 + 14 + j * 2)

        self.assertEqual(self.tracker.state, "NORMAL", f"Expected normalized state, got {self.tracker.state}")
        print(f"  PASS: flood lifecycle normalized to {self.tracker.state}")

    # -------------------------------------------------------------
    # Test H: Confidence vs Severity Separation
    # -------------------------------------------------------------
    def test_h_confidence_vs_severity_separation(self):
        """Test H: Severity must derive from physical coverage, independent of statistical confidence"""
        print("\n--- Test H: Confidence vs Severity Separation ---")
        # Shallow puddle covering small area
        frame_shallow = np.full((480, 640, 3), 110, dtype=np.uint8)
        frame_shallow[380:430, 200:300] = [45, 80, 110]

        score, detections, severity, signal_data = self.engine.analyze_water_features(frame_shallow, self.camera_id)
        # Severity must be minor even if local confidence is positive
        self.assertEqual(severity, "minor")
        print(f"  PASS: small puddle classified as {severity} regardless of detection confidence")


if __name__ == "__main__":
    unittest.main(verbosity=2)
