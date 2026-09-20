import cv2
import os

video_path = 'recordings/kotaku_siaga_demo_5to7min.mp4'
artifact_dir = r'C:\Users\Nabiel Ilyasa P\.gemini\antigravity-ide\brain\096aa654-b140-4fda-b24b-c1458a505e29'
cap = cv2.VideoCapture(video_path)

shots = [
    (250, 'scene_01_problem.jpg', 'Scene 1: Hook & Problem Statement'),
    (900, 'scene_02_solution.jpg', 'Scene 2: Solution Overview'),
    (2200, 'scene_03_map_cctv.jpg', 'Scene 3: Real-Time Monitoring & CCTV Map'),
    (3500, 'scene_04_citizen_report.jpg', 'Scene 4: Citizen Reporting Multi-Step'),
    (4800, 'scene_05_command_center.jpg', 'Scene 5: Validation & Command Center EOC'),
    (6000, 'scene_06_risk_data.jpg', 'Scene 6 & 7: Risk Matrix ISO 37120 & Data Integrity'),
    (7100, 'scene_08_ai_copilot.jpg', 'Scene 8: Civic AI Copilot 2.0 & SOS'),
    (8000, 'scene_09_end_to_end.jpg', 'Scene 9: End-to-End Scenario Workflow'),
    (8450, 'scene_10_architecture.jpg', 'Scene 10: Technical Architecture Flow Diagram'),
]

for frame_idx, filename, title in shots:
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if ret:
        out_file = os.path.join(artifact_dir, filename)
        cv2.imwrite(out_file, frame)
        print(f"Saved {filename} ({title})")

cap.release()
print("All 9 preview frames extracted successfully!")
