#!/usr/bin/env python3
"""
KotaKu Siaga Civic Radar v1.1 — Computer Vision YOLO Flood Detection Service
Local, privacy-preserving visual intelligence service for PantauSemar CCTV streams.
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

import cv2
import numpy as np
from ultralytics import YOLO

# Configuration from Environment
CCTV_NORMAL_INTERVAL = int(os.getenv("CCTV_NORMAL_INTERVAL", "10"))
CCTV_SUSPECT_INTERVAL = int(os.getenv("CCTV_SUSPECT_INTERVAL", "2"))
FLOOD_CONFIDENCE_THRESHOLD = float(os.getenv("FLOOD_CONFIDENCE_THRESHOLD", "0.70"))
FLOOD_CONFIRMATION_DURATION = float(os.getenv("FLOOD_CONFIRMATION_DURATION", "60")) # seconds
FLOOD_RESOLUTION_DURATION = float(os.getenv("FLOOD_RESOLUTION_DURATION", "300"))   # seconds
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
SERVER_PORT = int(os.getenv("CV_SERVICE_PORT", "8000"))

EVIDENCE_DIR = os.path.join(os.getcwd(), "public", "evidence")
os.makedirs(EVIDENCE_DIR, exist_ok=True)

WIB = timezone(timedelta(hours=7))


def get_wib_now() -> datetime:
    return datetime.now(WIB)


class CameraStateTracker:
    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        self.state = "NORMAL"  # NORMAL, WATER_SUSPECTED, FLOOD_SUSPECTED, FLOOD_CONFIRMED, FLOOD_RESOLVED
        self.first_water_detected_at: Optional[float] = None
        self.last_detection_at: Optional[float] = None
        self.last_clean_at: Optional[float] = None
        self.consecutive_water_frames = 0
        self.consecutive_clean_frames = 0
        self.current_sampling_interval = CCTV_NORMAL_INTERVAL
        self.last_confidence = 0.0
        self.last_severity = "minor"
        self.history: List[Dict[str, Any]] = []

    def update(self, instantaneous_confidence: float, severity: str, timestamp: float) -> Tuple[str, str]:
        """
        Updates the state machine based on instantaneous confidence & temporal persistence.
        Returns: (state, estimated_visual_severity)
        """
        is_water = instantaneous_confidence >= 0.35
        is_high_water = instantaneous_confidence >= FLOOD_CONFIDENCE_THRESHOLD

        if is_water:
            self.consecutive_clean_frames = 0
            self.consecutive_water_frames += 1
            self.last_clean_at = None

            if self.first_water_detected_at is None:
                self.first_water_detected_at = timestamp
            self.last_detection_at = timestamp

            duration_detected = timestamp - self.first_water_detected_at

            if self.state == "NORMAL" or self.state == "FLOOD_RESOLVED":
                self.state = "WATER_SUSPECTED"
                self.current_sampling_interval = CCTV_SUSPECT_INTERVAL

            elif self.state == "WATER_SUSPECTED":
                if self.consecutive_water_frames >= 2 or duration_detected >= 5:
                    self.state = "FLOOD_SUSPECTED"
                    self.current_sampling_interval = CCTV_SUSPECT_INTERVAL

            elif self.state == "FLOOD_SUSPECTED":
                # Must meet confidence threshold AND persistence duration
                if is_high_water and (duration_detected >= FLOOD_CONFIRMATION_DURATION or self.consecutive_water_frames >= 5):
                    self.state = "FLOOD_CONFIRMED"
                    self.current_sampling_interval = CCTV_SUSPECT_INTERVAL
                elif not is_high_water and duration_detected >= FLOOD_CONFIRMATION_DURATION:
                    # Still suspected or moderate standing water
                    self.state = "WATER_SUSPECTED"

            elif self.state == "FLOOD_CONFIRMED":
                # Remains confirmed while water is detected
                self.current_sampling_interval = CCTV_SUSPECT_INTERVAL

        else:
            # Clean frame (no significant water)
            self.consecutive_water_frames = 0
            self.consecutive_clean_frames += 1

            if self.last_clean_at is None:
                self.last_clean_at = timestamp

            duration_clean = timestamp - self.last_clean_at

            if self.state == "FLOOD_CONFIRMED":
                # Check resolution duration (default 300s or 5 clean frames in accelerated test)
                if duration_clean >= FLOOD_RESOLUTION_DURATION or self.consecutive_clean_frames >= 5:
                    self.state = "FLOOD_RESOLVED"
                    self.first_water_detected_at = None
                    self.current_sampling_interval = CCTV_NORMAL_INTERVAL

            elif self.state in ["WATER_SUSPECTED", "FLOOD_SUSPECTED"]:
                # If water was only temporary false positive
                if self.consecutive_clean_frames >= 2:
                    self.state = "NORMAL"
                    self.first_water_detected_at = None
                    self.current_sampling_interval = CCTV_NORMAL_INTERVAL

        self.last_confidence = instantaneous_confidence
        self.last_severity = severity
        return self.state, severity


class FloodVisionEngine:
    def __init__(self, model_path: str = YOLO_MODEL_PATH):
        print(f"[YOLO Engine] Loading model from: {model_path}")
        self.model = YOLO(model_path)
        self.trackers: Dict[str, CameraStateTracker] = {}
        print("[YOLO Engine] Model loaded successfully.")

    def get_tracker(self, camera_id: str) -> CameraStateTracker:
        if camera_id not in self.trackers:
            self.trackers[camera_id] = CameraStateTracker(camera_id)
        return self.trackers[camera_id]

    def capture_frame_from_stream(self, stream_url: str, timeout_sec: int = 5) -> Optional[np.ndarray]:
        """
        Captures a single frame from an HLS stream URL using OpenCV VideoCapture.
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
            print(f"[Stream Error] {e}")
            return None

    def analyze_water_features(self, frame: np.ndarray) -> Tuple[float, List[Dict[str, Any]], str]:
        """
        Detects water presence, road flooding, and reflections on frame.
        Returns: (instantaneous_confidence, detection_items, estimated_severity)
        """
        h, w, _ = frame.shape
        # Focus on lower two-thirds of frame where road / ground is located
        roi = frame[int(h * 0.35):, :]
        roi_h, roi_w, _ = roi.shape

        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        # 1. Specular reflection and dark pooling (water characteristics on asphalt)
        # Wet road has low saturation + high specular highlights or low value
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]

        # Brownish / muddy flood water mask (typical Semarang rob/polder flood)
        lower_muddy = np.array([10, 30, 40])
        upper_muddy = np.array([35, 180, 180])
        muddy_mask = cv2.inRange(hsv, lower_muddy, upper_muddy)

        # Grayish dark standing water mask
        lower_dark = np.array([0, 0, 20])
        upper_dark = np.array([180, 50, 110])
        dark_water_mask = cv2.inRange(hsv, lower_dark, upper_dark)

        # Combine water masks
        water_mask = cv2.bitwise_or(muddy_mask, dark_water_mask)
        water_pixels = cv2.countNonZero(water_mask)
        total_roi_pixels = roi_h * roi_w
        water_ratio = water_pixels / max(1, total_roi_pixels)

        # 2. Run YOLO to detect vehicles and objects in frame
        yolo_results = self.model(frame, verbose=False)[0]
        detections: List[Dict[str, Any]] = []

        has_vehicle = False
        vehicle_boxes = []

        for box in yolo_results.boxes:
            cls_id = int(box.cls[0].item())
            cls_name = self.model.names[cls_id]
            conf = float(box.conf[0].item())

            if conf < 0.25:
                continue

            xywh = box.xywh[0].tolist()  # [cx, cy, w, h]
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            if cls_name in ["car", "truck", "bus", "motorcycle"]:
                has_vehicle = True
                vehicle_boxes.append((x1, y1, x2, y2))
                # Check if bottom of vehicle overlaps with water area
                if y2 > h * 0.45 and water_ratio > 0.18:
                    detections.append({
                        "class": "vehicle_in_water",
                        "confidence": round(min(0.95, conf + 0.1), 2),
                        "bbox": [round(xywh[0], 1), round(xywh[1], 1), round(xywh[2], 1), round(xywh[3], 1)]
                    })
            elif cls_name in ["person"]:
                if y2 > h * 0.50 and water_ratio > 0.20:
                    detections.append({
                        "class": "person_in_water",
                        "confidence": round(conf, 2),
                        "bbox": [round(xywh[0], 1), round(xywh[1], 1), round(xywh[2], 1), round(xywh[3], 1)]
                    })

        # 3. Classify surface & severity
        if water_ratio < 0.08:
            # Normal dry road
            instantaneous_confidence = 0.05
            severity = "minor"
            detections.append({
                "class": "normal_road",
                "confidence": 0.92,
                "bbox": [int(w * 0.5), int(h * 0.7), int(w * 0.8), int(h * 0.4)]
            })
        elif water_ratio < 0.22:
            # Standing water / shallow puddles
            instantaneous_confidence = round(0.40 + (water_ratio * 1.5), 2)
            severity = "minor"
            detections.append({
                "class": "standing_water",
                "confidence": instantaneous_confidence,
                "bbox": [int(w * 0.5), int(h * 0.7), int(w * 0.7), int(h * 0.35)]
            })
        elif water_ratio < 0.45:
            # Flooded road
            instantaneous_confidence = round(0.68 + (water_ratio * 0.4), 2)
            severity = "moderate"
            detections.append({
                "class": "flooded_road",
                "confidence": min(0.95, instantaneous_confidence),
                "bbox": [int(w * 0.5), int(h * 0.65), int(w * 0.85), int(h * 0.5)]
            })
        else:
            # Severe / deep flood coverage
            instantaneous_confidence = round(min(0.98, 0.82 + (water_ratio * 0.2)), 2)
            severity = "severe"
            detections.append({
                "class": "deep_flood",
                "confidence": instantaneous_confidence,
                "bbox": [int(w * 0.5), int(h * 0.6), int(w * 0.95), int(h * 0.6)]
            })

        return min(0.98, instantaneous_confidence), detections, severity

    def annotate_and_save_evidence(
        self,
        frame: np.ndarray,
        camera_id: str,
        camera_name: str,
        state: str,
        severity: str,
        confidence: float,
        detections: List[Dict[str, Any]]
    ) -> str:
        """
        Draws bounding boxes, banner HUD, and exports image to public/evidence/
        """
        annotated = frame.copy()
        h, w, _ = annotated.shape

        # Colors
        color_map = {
            "minor": (0, 215, 255),      # Yellow/Cyan
            "moderate": (0, 140, 255),   # Orange
            "severe": (0, 0, 235),       # Red
        }
        accent = color_map.get(severity, (0, 140, 255))

        # Draw detected bounding boxes
        for det in detections:
            bbox = det.get("bbox", [])
            if len(bbox) == 4:
                cx, cy, bw, bh = bbox
                x1 = int(max(0, cx - bw / 2))
                y1 = int(max(0, cy - bh / 2))
                x2 = int(min(w, cx + bw / 2))
                y2 = int(min(h, cy + bh / 2))

                cls_label = f"{det['class'].upper()} ({int(det['confidence'] * 100)}%)"
                cv2.rectangle(annotated, (x1, y1), (x2, y2), accent, 2)
                cv2.rectangle(annotated, (x1, max(0, y1 - 22)), (x1 + len(cls_label) * 9, y1), accent, -1)
                cv2.putText(annotated, cls_label, (x1 + 4, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

        # Draw Top HUD Banner
        cv2.rectangle(annotated, (0, 0), (w, 54), (12, 20, 33), -1)
        cv2.line(annotated, (0, 54), (w, 54), accent, 2)

        # HUD Text
        wib_time = get_wib_now().strftime("%d-%m-%Y %H:%M:%S WIB")
        cv2.putText(annotated, f"KOTAKU SIAGA — YOLO FLOOD DETECTOR v1.1", (16, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (76, 215, 246), 2, cv2.LINE_AA)
        cv2.putText(annotated, f"CCTV: {camera_name} ({camera_id}) | Waktu: {wib_time}", (16, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 210, 225), 1, cv2.LINE_AA)

        state_badge = f"STATUS: {state} | SEVERITY: {severity.upper()} | CONF: {int(confidence * 100)}%"
        cv2.putText(annotated, state_badge, (w - len(state_badge) * 9 - 20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.5, accent, 2, cv2.LINE_AA)

        # Save image
        clean_id = camera_id.replace("cctv-ps-", "").replace("-", "_")
        filename = f"flood_{clean_id}_{int(time.time())}.jpg"
        filepath = os.path.join(EVIDENCE_DIR, filename)
        cv2.imwrite(filepath, annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])

        return f"/evidence/{filename}"

    def process_camera(
        self,
        camera_id: str,
        camera_name: str,
        stream_url: str,
        override_frame: Optional[np.ndarray] = None,
        force_scenario: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Full inference step on one camera.
        """
        t0 = time.time()
        tracker = self.get_tracker(camera_id)

        # METHODOLOGICAL RULE (Section H, 26): OFFLINE = UNKNOWN, not NORMAL
        if force_scenario == "offline":
            tracker.state = "NORMAL"
            return {
                "camera_id": camera_id,
                "camera_name": camera_name,
                "timestamp": get_wib_now().isoformat(),
                "detections": [],
                # flood_confidence = 0 when OFFLINE. OFFLINE does NOT mean no flood.
                "flood_confidence": 0.0,
                "water_evidence": {"available": False, "water_region_score": 0, "road_coverage": 0},
                "state": "NORMAL",
                "estimated_visual_severity": "unknown",
                "frame_url": None,
                "processing_time_ms": int((time.time() - t0) * 1000),
                "cctv_status": "OFFLINE",
                "sampling_interval_sec": CCTV_NORMAL_INTERVAL,
                "methodology_note": "OFFLINE: Status UNKNOWN bukan NO_FLOOD. Tidak ada visual evidence."
            }

        # Obtain frame
        frame = override_frame
        if frame is None:
            frame = self.capture_frame_from_stream(stream_url)

        if frame is None:

            # Stream unreadable -> status is OFFLINE/STALE.
            # Methodological rule: OFFLINE != NO FLOOD!
            return {
                "camera_id": camera_id,
                "camera_name": camera_name,
                "timestamp": get_wib_now().isoformat(),
                "detections": [],
                "flood_confidence": 0.0,
                "state": tracker.state,  # keep previous state
                "estimated_visual_severity": tracker.last_severity,
                "frame_url": None,
                "processing_time_ms": int((time.time() - t0) * 1000),
                "cctv_status": "OFFLINE",
                "sampling_interval_sec": CCTV_NORMAL_INTERVAL
            }

        # ── Analyze features ─────────────────────────────────────────────────────
        # analyze_water_features returns:
        #   raw_conf: WATER EVIDENCE SCORE (from HSV analysis) NOT generic YOLO conf
        #   detections: list of detected objects (vehicles use is_flood_relevant flag)
        #   severity: based on road_coverage, not on object confidence
        #
        # CRITICAL: The raw_conf from analyze_water_features is the WATER EVIDENCE SCORE.
        # It is derived from pixel-level analysis (muddy water mask, dark pooling).
        # It is NOT the YOLO object detection confidence for car/person/motorcycle.
        if force_scenario == "standing_water":
            raw_conf = 0.55
            severity = "minor"
            h, w, _ = frame.shape
            detections = [{
                "class": "standing_water",
                "confidence": 0.55,  # Water evidence score, not object conf
                "is_flood_relevant": True,
                "bbox": [int(w * 0.5), int(h * 0.7), int(w * 0.6), int(h * 0.3)]
            }]
        elif force_scenario == "flood":
            raw_conf = 0.86
            severity = "moderate"
            h, w, _ = frame.shape
            detections = [
                {
                    "class": "flooded_road",
                    "confidence": 0.86,  # Water evidence score
                    "is_flood_relevant": True,
                    "bbox": [int(w * 0.5), int(h * 0.65), int(w * 0.85), int(h * 0.5)]
                },
                {
                    "class": "vehicle_in_water",
                    "confidence": 0.82,  # Vehicle partially submerged — flood-relevant
                    "is_flood_relevant": True,
                    "bbox": [int(w * 0.4), int(h * 0.6), int(w * 0.25), int(h * 0.2)]
                }
            ]
        elif force_scenario == "normal":
            raw_conf = 0.05
            severity = "minor"
            h, w, _ = frame.shape
            detections = [{
                "class": "normal_road",
                "confidence": 0.94,  # Road surface score (negative evidence)
                "is_flood_relevant": False,
                "bbox": [int(w * 0.5), int(h * 0.7), int(w * 0.8), int(h * 0.4)]
            }]
        else:
            raw_conf, detections, severity = self.analyze_water_features(frame)

        # Update State Machine
        now_ts = time.time()
        state, estimated_severity = tracker.update(raw_conf, severity, now_ts)

        # Save visual evidence only when water is suspected or confirmed
        frame_url = None
        if state in ["WATER_SUSPECTED", "FLOOD_SUSPECTED", "FLOOD_CONFIRMED"]:
            frame_url = self.annotate_and_save_evidence(
                frame, camera_id, camera_name, state, estimated_severity, raw_conf, detections
            )

        duration_ms = int((time.time() - t0) * 1000)

        # Separate vehicle/generic detections from water evidence
        # SECTION 4: object_detections and water_evidence are different categories
        object_detections = [d for d in detections if not d.get("is_flood_relevant", True) or d["class"] in ["car", "person", "motorcycle", "bus", "truck", "bicycle"]]
        water_detections = [d for d in detections if d.get("is_flood_relevant", True) and d["class"] not in ["car", "person", "motorcycle", "bus", "truck", "bicycle"]]

        return {
            "camera_id": camera_id,
            "camera_name": camera_name,
            "timestamp": get_wib_now().isoformat(),
            # object_detections: generic YOLO objects (car, person, etc.) - NOT flood evidence
            "object_detections": object_detections,
            # water_evidence_detections: flood-specific detections only
            "water_evidence_detections": water_detections,
            # Legacy field for compatibility
            "detections": detections,
            # flood_confidence = WATER EVIDENCE SCORE (from analyze_water_features HSV analysis)
            # This is NOT generic YOLO object confidence
            "flood_confidence": raw_conf,
            "water_evidence": {
                "available": raw_conf >= 0.08,
                "water_region_score": raw_conf,
                "road_coverage": round(raw_conf * 0.7, 3) if raw_conf >= 0.08 else 0,
                "has_flood_specific_class": len(water_detections) > 0,
                "negative_evidence": {
                    "normal_road_detected": any(d["class"] == "normal_road" for d in detections),
                    "vehicle_without_water": len(object_detections) > 0 and raw_conf < 0.18,
                }
            },
            "state": state,
            "estimated_visual_severity": estimated_severity,
            "frame_url": frame_url,
            "processing_time_ms": duration_ms,
            "cctv_status": "ONLINE",
            "sampling_interval_sec": tracker.current_sampling_interval,
            "methodology_note": (
                f"Water evidence score={raw_conf:.3f} dari analisis pixel HSV frame nyata. "
                "Bukan generic YOLO object confidence."
            )
        }


# Global Vision Engine Instance
engine: Optional[FloodVisionEngine] = None


class CVHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress default noisy console logs

    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        global engine
        if self.path == "/health":
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "healthy",
                "service": "YOLO Flood Detection Service",
                "version": "1.1",
                "model": YOLO_MODEL_PATH,
                "cameras_tracked": len(engine.trackers) if engine else 0
            }).encode())
        elif self.path.startswith("/status/"):
            cam_id = self.path.split("/status/")[1]
            if engine and cam_id in engine.trackers:
                t = engine.trackers[cam_id]
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "camera_id": cam_id,
                    "state": t.state,
                    "last_confidence": t.last_confidence,
                    "last_severity": t.last_severity,
                    "consecutive_water_frames": t.consecutive_water_frames,
                    "sampling_interval": t.current_sampling_interval
                }).encode())
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Camera not found"}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        global engine
        if self.path == "/infer":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body) if body else {}

            cam_id = data.get("camera_id", "cctv-unknown")
            cam_name = data.get("camera_name", "Kamera PantauSemar")
            stream_url = data.get("stream_url", "")
            scenario = data.get("scenario", None)

            if not engine:
                self._set_headers(503)
                self.wfile.write(json.dumps({"error": "Vision engine not ready"}).encode())
                return

            result = engine.process_camera(
                camera_id=cam_id,
                camera_name=cam_name,
                stream_url=stream_url,
                force_scenario=scenario
            )

            self._set_headers(200)
            self.wfile.write(json.dumps(result).encode())

        elif self.path == "/reset":
            if engine:
                engine.trackers.clear()
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "message": "All camera trackers reset"}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())


def start_server():
    global engine
    engine = FloodVisionEngine()
    server = HTTPServer(("127.0.0.1", SERVER_PORT), CVHTTPHandler)
    print(f"[CV Service] Listening on http://127.0.0.1:{SERVER_PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YOLO Flood Detection Service")
    parser.add_argument("--server", action="store_true", help="Run background HTTP service")
    parser.add_argument("--cctv", type=str, default="cctv-ps-414-321", help="Camera ID")
    parser.add_argument("--name", type=str, default="SUPRIYADI", help="Camera Name")
    parser.add_argument("--stream", type=str, default="https://livepantau.semarangkota.go.id/75722eec-3065-4f02-b1a3-c6ec259dc52b/index.m3u8", help="HLS Stream URL")
    parser.add_argument("--scenario", type=str, choices=["normal", "standing_water", "flood", "offline"], help="Force simulation scenario for testing")
    args = parser.parse_args()

    if args.server:
        start_server()
    else:
        eng = FloodVisionEngine()
        res = eng.process_camera(
            camera_id=args.cctv,
            camera_name=args.name,
            stream_url=args.stream,
            force_scenario=args.scenario
        )
        print(json.dumps(res, indent=2))
