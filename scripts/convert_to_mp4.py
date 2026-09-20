import cv2
import os
import sys
import glob

recordings_dir = 'recordings'
webm_files = sorted(glob.glob(os.path.join(recordings_dir, 'page@*.webm')), key=os.path.getmtime)

if not webm_files:
    # fallback to existing
    target_webm = os.path.join(recordings_dir, 'kotaku_siaga_demo_5to7min.webm')
    if not os.path.exists(target_webm):
        print("No webm files found to convert")
        sys.exit(1)
else:
    latest_raw = webm_files[-1]
    target_webm = os.path.join(recordings_dir, 'kotaku_siaga_demo_5to7min.webm')
    # Copy latest raw to target_webm
    import shutil
    shutil.copy2(latest_raw, target_webm)
    print(f"Copied latest recording {latest_raw} to {target_webm}")

output_path = os.path.join(recordings_dir, 'kotaku_siaga_demo_5to7min.mp4')

cap = cv2.VideoCapture(target_webm)
if not cap.isOpened():
    print(f"Cannot open {target_webm} via cv2")
    sys.exit(1)

fps = cap.get(cv2.CAP_PROP_FPS)
if fps <= 0 or fps > 60:
    fps = 25.0
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration_sec = total_frames / fps if fps else 0
duration_min = duration_sec / 60.0

print(f"Input Video: {width}x{height} @ {fps:.1f} fps")
print(f"Total Frames: {total_frames} | Duration: {duration_sec:.1f}s ({duration_min:.2f} minutes)")

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

count = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    out.write(frame)
    count += 1
    if count % 500 == 0:
        percent = count * 100 // total_frames if total_frames else 0
        print(f"Processed {count}/{total_frames} frames ({percent}%)")

cap.release()
out.release()
print(f"Successfully converted to {output_path} ({count} frames)")
