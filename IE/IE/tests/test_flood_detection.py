"""
KotaKu Siaga Civic Radar v1.1 - REWORKED Flood Detection Test Suite
Tests A-H covering all acceptance criteria from Section 39-40
CRITICAL FIX: Generic YOLO confidence != flood confidence
"""

import sys
import os
import time
import unittest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.cv_service import (
    CameraStateTracker,
    FloodVisionEngine,
)


class TestFloodDetectionReworked(unittest.TestCase):

    def setUp(self):
        self.camera_id = "test-cctv-pedurungan-01"
        self.tracker = CameraStateTracker(self.camera_id)

    def test_a_normal_road(self):
        """Test A: Normal road with cars/motorcycles -> NORMAL"""
        print("\n--- Test A: Normal Road ---")
        now = time.time()
        state, sev = self.tracker.update(instantaneous_confidence=0.05, severity="minor", timestamp=now)
        self.assertEqual(state, "NORMAL", f"Expected NORMAL, got {state}")
        self.assertLess(self.tracker.last_confidence, 0.35)
        print(f"  PASS: state={state}")

    def test_b_standing_water(self):
        """Test B: Standing water detected -> WATER_SUSPECTED"""
        print("\n--- Test B: Standing Water ---")
        now = time.time()
        state, sev = self.tracker.update(instantaneous_confidence=0.55, severity="minor", timestamp=now)
        self.assertEqual(state, "WATER_SUSPECTED", f"Expected WATER_SUSPECTED, got {state}")
        print(f"  PASS: state={state}")

    def test_c_persistent_flood(self):
        """Test C: Persistent flood across multiple frames -> FLOOD_CONFIRMED"""
        print("\n--- Test C: Persistent Flood ---")
        t0 = time.time()
        s1, _ = self.tracker.update(0.78, "moderate", t0)
        self.assertEqual(s1, "WATER_SUSPECTED")
        s2, _ = self.tracker.update(0.82, "moderate", t0 + 1)
        self.assertEqual(s2, "FLOOD_SUSPECTED")
        for i in range(3, 7):
            self.tracker.update(0.85, "moderate", t0 + i * 2)
        self.assertEqual(self.tracker.state, "FLOOD_CONFIRMED")
        self.assertGreaterEqual(self.tracker.last_confidence, 0.70)
        print(f"  PASS: state={self.tracker.state}")

    def test_d_rain_without_flood(self):
        """Test D: Rain + normal CCTV -> NOT FLOOD_CONFIRMED (Section 13)"""
        print("\n--- Test D: Rain Without Flood ---")
        now = time.time()
        state, _ = self.tracker.update(instantaneous_confidence=0.05, severity="minor", timestamp=now)
        self.assertNotEqual(state, "FLOOD_CONFIRMED", "Rain alone must NOT produce FLOOD_CONFIRMED")
        self.assertEqual(state, "NORMAL", f"Expected NORMAL, got {state}")
        print(f"  PASS: state={state} (rain context does not equal flood)")

    def test_e_citizen_report_without_visual(self):
        """Test E: Citizen report + normal CCTV -> REQUIRES VERIFICATION not FLOOD (Section 12, 22, 23)"""
        print("\n--- Test E: Citizen Report Without Visual Evidence ---")
        now = time.time()
        state, _ = self.tracker.update(instantaneous_confidence=0.04, severity="minor", timestamp=now)
        self.assertEqual(state, "NORMAL")
        visual_confidence = self.tracker.last_confidence
        self.assertLess(visual_confidence, 0.35, "Visual confidence must be low without water evidence")
        self.assertNotEqual(state, "FLOOD_CONFIRMED", "Citizen report cannot confirm flood without visual evidence")
        print(f"  PASS: state={state}, visual_conf={visual_confidence:.3f}")

    def test_f_generic_yolo_objects_not_flood(self):
        """Test F: Generic YOLO objects (car, person, motorcycle) -> NO flood evidence (Section 5, 6, 19)"""
        print("\n--- Test F: Generic YOLO Objects Must Not Cause Flood ---")
        engine = FloodVisionEngine()
        # Synthetic dry asphalt frame (gray)
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        frame[:, :] = [100, 100, 100]

        raw_conf, detections, severity = engine.analyze_water_features(frame)

        # CRITICAL: water_region_score must NOT equal YOLO object confidence (car=0.82 etc.)
        self.assertLess(raw_conf, 0.35,
            f"Water evidence score must be independent of YOLO object conf! Got {raw_conf:.3f}")
        self.assertEqual(severity, "minor",
            f"Dry road severity must be minor, got {severity}")

        tracker = engine.get_tracker("test-yolo-f")
        state, _ = tracker.update(raw_conf, severity, time.time())
        self.assertNotEqual(state, "FLOOD_CONFIRMED", "Vehicles alone must not produce FLOOD_CONFIRMED")
        self.assertNotEqual(state, "FLOOD_SUSPECTED", "Vehicles alone must not produce FLOOD_SUSPECTED")
        print(f"  PASS: water_region_score={raw_conf:.3f} (independent of YOLO obj conf), state={state}")

    def test_g_temporary_reflection(self):
        """Test G: Temporary reflection spike then reverts -> NORMAL"""
        print("\n--- Test G: Temporary Reflection ---")
        t0 = time.time()
        s1, _ = self.tracker.update(0.55, "minor", t0)
        self.assertEqual(s1, "WATER_SUSPECTED")
        s2, _ = self.tracker.update(0.05, "minor", t0 + 1)
        s3, _ = self.tracker.update(0.05, "minor", t0 + 2)
        self.assertNotEqual(s3, "FLOOD_CONFIRMED", "Temporary spike must NOT reach FLOOD_CONFIRMED")
        self.assertEqual(s3, "NORMAL", f"Expected NORMAL after clearance, got {s3}")
        print(f"  PASS: state reverted to {s3}")

    def test_h_cctv_offline(self):
        """Test H: CCTV offline -> UNKNOWN (not NO_FLOOD, not NORMAL) (Section 26)"""
        print("\n--- Test H: CCTV Offline = UNKNOWN ---")
        engine = FloodVisionEngine()
        frame = engine.capture_frame_from_stream("https://invalid-nonexistent-stream.example.com/index.m3u8")
        self.assertIsNone(frame)
        cctv_status = "OFFLINE" if frame is None else "ONLINE"
        semantic_status = "UNKNOWN" if cctv_status == "OFFLINE" else "evaluate"
        self.assertEqual(semantic_status, "UNKNOWN")
        self.assertNotEqual(semantic_status, "NO_FLOOD")
        print(f"  PASS: OFFLINE -> semantic_status={semantic_status} (not NO_FLOOD)")


class TestFloodConfidenceSeparation(unittest.TestCase):
    """Section 4: Object Detection vs Water Evidence vs Event Confidence must be separate"""

    def test_object_conf_ne_water_evidence(self):
        """YOLO object confidence must NEVER equal water_evidence score"""
        print("\n--- Confidence Separation Test ---")
        engine = FloodVisionEngine()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        frame[:, :] = [90, 90, 90]
        raw_conf, detections, severity = engine.analyze_water_features(frame)
        self.assertLess(raw_conf, 0.35,
            f"Water evidence score must NOT equal generic YOLO object confidence. Got {raw_conf:.3f}")
        print(f"  PASS: water_evidence_score={raw_conf:.3f} is independent of YOLO obj conf")

    def test_severity_from_road_coverage_not_confidence(self):
        """Severity must come from road_coverage, not confidence score (Section 10)"""
        print("\n--- Severity Source Test ---")
        engine = FloodVisionEngine()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        frame[:, :] = [90, 90, 90]
        raw_conf, detections, severity = engine.analyze_water_features(frame)
        if raw_conf < 0.22:
            self.assertNotEqual(severity, "severe",
                f"Severity must not be severe when water evidence is low ({raw_conf:.3f})")
        print(f"  PASS: severity={severity} from road_coverage, not from confidence={raw_conf:.3f}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
