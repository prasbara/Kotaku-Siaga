import cv2
import os

video_path = 'recordings/kotaku_siaga_demo_master.mp4'
artifact_dir = r'C:\Users\Nabiel Ilyasa P\.gemini\antigravity-ide\brain\096aa654-b140-4fda-b24b-c1458a505e29'
cap = cv2.VideoCapture(video_path)

shots = [
    (150, 'scene_01_homepage.jpg', 'Beranda & Pemantauan Multi-Sensor'),
    (1100, 'scene_02_map.jpg', 'Peta Geospasial 70 Titik Sensor & CCTV'),
    (2400, 'scene_03_priorities.jpg', 'Matriks Risiko Kecamatan D-RISK ISO 37120'),
    (3400, 'scene_04_laporan.jpg', 'Alur Pelaporan Genangan Warga'),
    (4250, 'scene_05_dashboard.jpg', 'Dashboard Pusat Komando EOC Petugas'),
    (5300, 'scene_06_copilot.jpg', 'Civic AI Copilot & Sinyal SOS Darurat'),
    (5750, 'scene_07_mobile.jpg', 'Tampilan Responsif Mobile Viewport'),
]

for frame_idx, filename, title in shots:
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if ret:
        out_file = os.path.join(artifact_dir, filename)
        cv2.imwrite(out_file, frame)
        print(f"Saved {filename} ({title})")

cap.release()
print("All preview screenshots extracted successfully!")
