#!/usr/bin/env python3
"""
KotaKu Siaga Civic Radar v2.0 — CCTV Detection Benchmark & Metrics Evaluator
Calculates: TP, TN, FP, FN, Accuracy, Precision, Recall, F1, Specificity, FPR, FNR, and Latency.
"""

import sys
import os
import time
import numpy as np
import cv2

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.cv_service import NonYOLOFloodVisionEngine, CameraStateTracker


def generate_synthetic_benchmark_dataset():
    """
    Generates synthetic dataset covering diverse real-world environmental scenarios.
    Each item: (name, frame, ground_truth_is_flood, camera_id)
    """
    dataset = []

    # 1. Normal Dry Asphalt (Day) - Negative
    f1 = np.full((480, 640, 3), 115, dtype=np.uint8)
    noise = np.random.randint(-12, 12, f1.shape, dtype=np.int16)
    f1 = np.clip(f1.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    dataset.append(("Normal Dry Road (Day)", f1, False, "bench-cam-01"))

    # 2. Normal Dry Asphalt (Night) - Negative
    f2 = np.full((480, 640, 3), 30, dtype=np.uint8)
    noise2 = np.random.randint(-4, 4, f2.shape, dtype=np.int16)
    f2 = np.clip(f2.astype(np.int16) + noise2, 0, 255).astype(np.uint8)
    dataset.append(("Normal Dry Road (Night)", f2, False, "bench-cam-02"))

    # 3. Wet Road with Sheen (Negative - Wet Road != Flood)
    f3 = np.full((480, 640, 3), 55, dtype=np.uint8)
    for i in range(0, 480, 4):
        f3[i, :, :] = np.clip(f3[i, :, :] + 22, 0, 255)
    noise3 = np.random.randint(-5, 5, f3.shape, dtype=np.int16)
    f3 = np.clip(f3.astype(np.int16) + noise3, 0, 255).astype(np.uint8)
    dataset.append(("Wet Road with Sheen", f3, False, "bench-cam-03"))

    # 4. Wet Road with Headlight Glare (Negative - Reflection Filter)
    f4 = np.full((480, 640, 3), 45, dtype=np.uint8)
    for i in range(0, 480, 4):
        f4[i, :, :] = np.clip(f4[i, :, :] + 20, 0, 255)
    cv2.circle(f4, (220, 320), 45, (255, 255, 255), -1)
    dataset.append(("Wet Road with Headlight Glare", f4, False, "bench-cam-04"))

    # 5. Rain Overcast on Road (Negative)
    f5 = np.full((480, 640, 3), 90, dtype=np.uint8)
    rain_noise = np.random.randint(0, 30, (480, 640), dtype=np.uint8)
    f5[:, :, 0] = np.clip(f5[:, :, 0] + rain_noise, 0, 255)
    dataset.append(("Rain Overcast on Road", f5, False, "bench-cam-05"))

    # 6. Sun Glare on Asphalt (Negative)
    f6 = np.full((480, 640, 3), 120, dtype=np.uint8)
    cv2.circle(f6, (320, 300), 70, (250, 250, 255), -1)
    dataset.append(("Sun Glare on Asphalt", f6, False, "bench-cam-06"))

    # 7. Moving Vehicle on Road (Negative)
    f7 = np.full((480, 640, 3), 110, dtype=np.uint8)
    noise7 = np.random.randint(-10, 10, f7.shape, dtype=np.int16)
    f7 = np.clip(f7.astype(np.int16) + noise7, 0, 255).astype(np.uint8)
    cv2.rectangle(f7, (200, 250), (380, 380), (40, 40, 200), -1)  # Red car
    dataset.append(("Moving Vehicle on Road", f7, False, "bench-cam-07"))

    # 8. Shallow Road Ponding (Positive - Flood Event)
    f8 = np.full((480, 640, 3), 105, dtype=np.uint8)
    noise8 = np.random.randint(-15, 15, f8.shape, dtype=np.int16)
    f8 = np.clip(f8.astype(np.int16) + noise8, 0, 255).astype(np.uint8)
    # Smooth brown flood water puddle
    f8[260:440, 80:560] = [45, 80, 110]
    dataset.append(("Shallow Road Ponding", f8, True, "bench-cam-08"))

    # 9. Deep Tidal Flood Kaligawe (Positive - High Flood)
    f9 = np.full((480, 640, 3), 95, dtype=np.uint8)
    noise9 = np.random.randint(-15, 15, f9.shape, dtype=np.int16)
    f9 = np.clip(f9.astype(np.int16) + noise9, 0, 255).astype(np.uint8)
    # Extensive brown rob water
    f9[220:465, 20:620] = [40, 75, 105]
    dataset.append(("Deep Tidal Flood Kaligawe", f9, True, "bench-cam-09"))

    # 10. Nighttime Rob Flood with Dim Streetlamps (Positive)
    f10 = np.full((480, 640, 3), 30, dtype=np.uint8)
    noise10 = np.random.randint(-6, 6, f10.shape, dtype=np.int16)
    f10 = np.clip(f10.astype(np.int16) + noise10, 0, 255).astype(np.uint8)
    f10[250:450, 50:590] = [20, 40, 55]  # Dark flood water body
    cv2.circle(f10, (150, 300), 15, (220, 220, 240), -1)  # Reflected streetlamp
    dataset.append(("Nighttime Rob Flood with Reflection", f10, True, "bench-cam-10"))

    # 11. Polder Canal Overspill (Positive)
    f11 = np.full((480, 640, 3), 100, dtype=np.uint8)
    noise11 = np.random.randint(-15, 15, f11.shape, dtype=np.int16)
    f11 = np.clip(f11.astype(np.int16) + noise11, 0, 255).astype(np.uint8)
    f11[200:460, 30:610] = [42, 78, 108]  # Overspill water
    dataset.append(("Polder Canal Overspill", f11, True, "bench-cam-11"))

    # 12. Camera Black Failure (Negative - Health Failure != Flood)
    f12 = np.zeros((480, 640, 3), dtype=np.uint8)
    dataset.append(("Camera Black Failure", f12, False, "bench-cam-12"))

    return dataset


def run_benchmark():
    print("================================================================")
    print("  KOTAKU SIAGA — NON-YOLO CV FLOOD DETECTION BENCHMARK SUITE")
    print("================================================================\n")

    engine = NonYOLOFloodVisionEngine()
    dataset = generate_synthetic_benchmark_dataset()

    tp = 0  # Ground truth flood & detected flood
    tn = 0  # Ground truth non-flood & detected non-flood
    fp = 0  # Ground truth non-flood but detected flood (False Alarm)
    fn = 0  # Ground truth flood but missed (Missed Detection)

    latencies = []

    print(f"{'Scenario':<38} | {'Truth':<8} | {'Score':<7} | {'Predicted':<10} | {'Outcome':<8}")
    print("-" * 80)

    for name, frame, gt_flood, cam_id in dataset:
        t_start = time.perf_counter()

        # Check health first
        health_status, _ = engine.diagnose_camera_health(frame, cam_id)
        if health_status != "ONLINE":
            predicted_flood = False
            score = 0.0
        else:
            score, _, _, _ = engine.analyze_water_features(frame, cam_id)
            predicted_flood = score >= 0.40

        latency_ms = (time.perf_counter() - t_start) * 1000.0
        latencies.append(latency_ms)

        outcome = ""
        if gt_flood and predicted_flood:
            tp += 1
            outcome = "TP ✅"
        elif not gt_flood and not predicted_flood:
            tn += 1
            outcome = "TN ✅"
        elif not gt_flood and predicted_flood:
            fp += 1
            outcome = "FP ❌"
        elif gt_flood and not predicted_flood:
            fn += 1
            outcome = "FN ❌"

        truth_str = "FLOOD" if gt_flood else "NORMAL"
        pred_str = "FLOOD" if predicted_flood else "NORMAL"
        print(f"{name:<38} | {truth_str:<8} | {score:<7.3f} | {pred_str:<10} | {outcome:<8}")

    total = len(dataset)
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 1.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
    avg_latency = np.mean(latencies)
    fps = 1000.0 / avg_latency if avg_latency > 0 else 0.0

    print("\n================================================================")
    print("  BENCHMARK EVALUATION METRICS")
    print("================================================================")
    print(f"Total Scenarios Evaluated: {total}")
    print(f"  • True Positives (TP):  {tp}")
    print(f"  • True Negatives (TN):  {tn}")
    print(f"  • False Positives (FP): {fp}")
    print(f"  • False Negatives (FN): {fn}")
    print("-" * 64)
    print(f"Accuracy:                {accuracy * 100:.2f}%")
    print(f"Precision:               {precision * 100:.2f}%  (Zero False Alarm Target)")
    print(f"Recall (Sensitivity):    {recall * 100:.2f}%")
    print(f"Specificity:             {specificity * 100:.2f}%")
    print(f"F1-Score:                {f1 * 100:.2f}%")
    print(f"False Positive Rate:     {fpr * 100:.2f}%")
    print(f"False Negative Rate:     {fnr * 100:.2f}%")
    print("-" * 64)
    print(f"Average Inference Time:  {avg_latency:.2f} ms per frame")
    print(f"Throughput:              {fps:.1f} FPS (CPU Classical CV)")
    print("================================================================")

    # Acceptance check
    if fp > 0:
        print("⚠️ WARNING: False positive detected.")
        sys.exit(1)
    if fn > 0:
        print("⚠️ WARNING: False negative detected.")
        sys.exit(1)

    print("\n✅ BENCHMARK PASSED: Precision 100%, Zero False Alarms, Zero Missed Floods.")


if __name__ == "__main__":
    run_benchmark()
