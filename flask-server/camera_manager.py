import os
import sys
import time
import random
import threading
import math
from datetime import datetime

# Locate the camera module directory relative to this flask-server folder
backend_dir = os.path.dirname(os.path.abspath(__file__))
framos_dir = os.path.join(os.path.dirname(backend_dir), 'modulo_camara_framos')

# Add to path and DLL directory if it exists
if os.path.exists(framos_dir):
    sys.path.append(framos_dir)
    if sys.platform == 'win32':
        try:
            os.add_dll_directory(framos_dir)
            print(f"[INFO] Added DLL directory: {framos_dir}", flush=True)
        except AttributeError:
            os.environ['PATH'] = framos_dir + os.pathsep + os.environ['PATH']

# Try importing pyrealsense2
pyrealsense_available = False
try:
    import pyrealsense2 as rs
    pyrealsense_available = True
    print("[INFO] pyrealsense2 imported successfully.", flush=True)
except ImportError:
    print("[INFO] pyrealsense2 not available. Running camera in simulation mode.", flush=True)

# Try importing cv2 and numpy for drawing and encoding frames
opencv_available = False
try:
    import cv2
    import numpy as np
    opencv_available = True
    print("[INFO] OpenCV and NumPy imported successfully for camera handling.", flush=True)
except ImportError:
    print("[WARN] OpenCV/NumPy not available. Will use static/simulated JPEGs.", flush=True)


class CameraManager:
    def __init__(self):
        self.lock = threading.Lock()
        self.pipeline = None
        self.is_running = False
        self.has_imu = False
        
        # Configuration & Thresholds
        self.umbral_giro = 0.08
        self.umbral_accel = 0.20
        self.g_referencia = 9.81
        
        # Current status variables
        self.stable = True
        self.gyro_magnitude = 0.02
        self.accel_deviation = 0.04
        
        # Simulation helper variables
        self.simulation_mode = not pyrealsense_available
        self.robot_moving_until = 0.0
        self.last_frame = None
        
        # Capture gallery
        self.photos_dir = os.path.join(backend_dir, 'static', 'photos')
        os.makedirs(self.photos_dir, exist_ok=True)
        self.photos_list = []
        self._load_existing_photos()
        
        # Streaming state
        self.active_streams = 0
        self.thread = None

    def _load_existing_photos(self):
        """Loads metadata for photos currently stored in the static folder."""
        if not os.path.exists(self.photos_dir):
            return
        files = sorted([f for f in os.listdir(self.photos_dir) if f.endswith('.jpg')])
        self.photos_list = []
        for f in files:
            path = f"http://localhost:5000/static/photos/{f}"
            # Extract step from filename like photo_step_5.jpg
            step = 0
            try:
                if 'step_' in f:
                    step = int(f.split('step_')[1].split('.')[0])
            except ValueError:
                pass
            
            self.photos_list.append({
                "filename": f,
                "url": path,
                "timestamp": datetime.fromtimestamp(os.path.getmtime(os.path.join(self.photos_dir, f))).strftime("%Y-%m-%d %H:%M:%S"),
                "step": step
            })

    def start(self):
        with self.lock:
            if self.is_running:
                return
            self.is_running = True
            
            # Start background frame grabber thread
            self.thread = threading.Thread(target=self._frame_loop, daemon=True)
            self.thread.start()
            print("[INFO] Camera manager thread started.", flush=True)

    def stop(self):
        with self.lock:
            self.is_running = False
            self._close_camera()

    def set_thresholds(self, umbral_giro):
        with self.lock:
            self.umbral_giro = umbral_giro
            # Scale accel threshold proportionally
            self.umbral_accel = umbral_giro * 2.5
            print(f"[INFO] Updated camera thresholds: Giro={self.umbral_giro:.3f}, Accel={self.umbral_accel:.3f}", flush=True)

    def trigger_robot_move(self, duration=1.2):
        """Sets a timer indicating the robot is moving, creating transient instability."""
        with self.lock:
            self.robot_moving_until = time.time() + duration
            self.stable = False
            print(f"[INFO] Robot move triggered. Instability active for {duration}s", flush=True)

    def register_client(self):
        """Increments active stream count, initializing pipeline if needed."""
        with self.lock:
            self.active_streams += 1
            print(f"[INFO] Active camera streams: {self.active_streams}", flush=True)
            if not self.simulation_mode and self.pipeline is None:
                self._init_camera()

    def unregister_client(self):
        """Decrements active stream count, pausing pipeline if no clients are viewing."""
        with self.lock:
            self.active_streams = max(0, self.active_streams - 1)
            print(f"[INFO] Active camera streams: {self.active_streams}", flush=True)
            if self.active_streams == 0 and self.pipeline is not None:
                self._close_camera()

    def _init_camera(self):
        """Initializes the physical FRAMOS/RealSense camera pipeline."""
        if not pyrealsense_available:
            self.simulation_mode = True
            return
        
        try:
            ctx = rs.context()
            devices = ctx.query_devices()
            if len(devices) == 0:
                print("[WARN] No physical camera detected. Swapped to Simulation Mode.", flush=True)
                self.simulation_mode = True
                return
            
            # Check for IMU
            self.has_imu = False
            dev = devices[0]
            for sensor in dev.query_sensors():
                for profile in sensor.get_stream_profiles():
                    if profile.stream_type() in [rs.stream.accel, rs.stream.gyro]:
                        self.has_imu = True
                        break
            
            self.pipeline = rs.pipeline()
            config = rs.config()
            config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
            config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
            
            if self.has_imu:
                config.enable_stream(rs.stream.accel, rs.format.motion_xyz32f, 250)
                config.enable_stream(rs.stream.gyro, rs.format.motion_xyz32f, 200)
                
            self.pipeline.start(config)
            self.simulation_mode = False
            print("[INFO] Physical FRAMOS camera pipeline started successfully.", flush=True)
        except Exception as e:
            print(f"[ERROR] Failed to initialize physical camera pipeline: {e}. Swapped to Simulation Mode.", flush=True)
            self.pipeline = None
            self.simulation_mode = True

    def _close_camera(self):
        """Closes the physical camera pipeline."""
        if self.pipeline is not None:
            try:
                self.pipeline.stop()
                print("[INFO] Physical camera pipeline stopped.", flush=True)
            except Exception as e:
                print(f"[ERROR] Error stopping pipeline: {e}", flush=True)
            self.pipeline = None

    def _frame_loop(self):
        """Background loop to fetch frames and process IMU stability."""
        while self.is_running:
            try:
                # 1. Grab camera frame and IMU
                if not self.simulation_mode and self.pipeline is not None:
                    self._process_real_frame()
                else:
                    self._process_simulated_frame()
            except Exception as e:
                print(f"[ERROR] Exception in frame loop: {e}", flush=True)
                time.sleep(0.5)
            
            # Target frame rate ~15 FPS to conserve CPU
            time.sleep(0.066)

    def _process_real_frame(self):
        try:
            frames = self.pipeline.wait_for_frames(timeout_ms=1000)
            color_frame = frames.get_color_frame()
            if not color_frame:
                return
            
            # Convert to OpenCV image
            color_image = np.asanyarray(color_frame.get_data())
            
            # Process IMU data
            if self.has_imu:
                accel_frame = frames.first_or_default(rs.stream.accel)
                gyro_frame = frames.first_or_default(rs.stream.gyro)
                if accel_frame and gyro_frame:
                    accel_data = accel_frame.as_motion_frame().get_motion_data()
                    gyro_data = gyro_frame.as_motion_frame().get_motion_data()
                    
                    self.gyro_magnitude = (gyro_data.x**2 + gyro_data.y**2 + gyro_data.z**2) ** 0.5
                    accel_magnitude = (accel_data.x**2 + accel_data.y**2 + accel_data.z**2) ** 0.5
                    self.accel_deviation = abs(accel_magnitude - self.g_referencia)
                    
                    # Evaluate stability
                    self.stable = (self.gyro_magnitude < self.umbral_giro) and (self.accel_deviation < self.umbral_accel)
            else:
                # No physical IMU, simulate stability based on movement trigger
                self._evaluate_simulated_imu()
                
            # Draw overlay on the real image (e.g. crosshair, status)
            self._draw_overlay(color_image, is_simulated=False)
            
            # Encode as JPEG
            _, jpeg = cv2.imencode('.jpg', color_image)
            self.last_frame = jpeg.tobytes()
        except Exception as e:
            print(f"[ERROR] Real frame processing failed: {e}", flush=True)
            self.simulation_mode = True

    def _process_simulated_frame(self):
        if not opencv_available:
            # Fallback if OpenCV is not installed: read a static dummy or generate one
            self.last_frame = self._get_static_dummy_bytes()
            self._evaluate_simulated_imu()
            return
        
        # Create a black canvas (640x480)
        canvas = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Draw dynamic elements (e.g., grid, rotating circle)
        self._draw_simulated_background(canvas)
        
        # Evaluate stability
        self._evaluate_simulated_imu()
        
        # Draw overlay info
        self._draw_overlay(canvas, is_simulated=True)
        
        # Encode as JPEG
        _, jpeg = cv2.imencode('.jpg', canvas)
        self.last_frame = jpeg.tobytes()

    def _evaluate_simulated_imu(self):
        """Simulates IMU readings, creating fluctuations when the robot moves."""
        is_moving = time.time() < self.robot_moving_until
        
        if is_moving:
            # High values (unstable)
            self.gyro_magnitude = random.uniform(0.12, 0.35)
            self.accel_deviation = random.uniform(0.25, 0.55)
            self.stable = False
        else:
            # Low noise (stable)
            self.gyro_magnitude = random.uniform(0.005, 0.035)
            self.accel_deviation = random.uniform(0.01, 0.08)
            self.stable = (self.gyro_magnitude < self.umbral_giro) and (self.accel_deviation < self.umbral_accel)

    def _draw_simulated_background(self, img):
        # Draw a grid
        grid_color = (30, 35, 45)
        for x in range(0, 640, 40):
            cv2.line(img, (x, 0), (x, 480), grid_color, 1)
        for y in range(0, 480, 40):
            cv2.line(img, (0, y), (640, y), grid_color, 1)
            
        # Draw a scanning circle (simulating a product or view)
        t = time.time()
        angle = (t * 2) % (2 * math.pi)
        r = 120 + int(math.sin(t * 3) * 10)
        center = (320, 240)
        cv2.circle(img, center, r, (40, 45, 55), 2)
        
        # Draw camera sensor scanning line
        y_scan = int((t * 100) % 480)
        cv2.line(img, (0, y_scan), (640, y_scan), (0, 210, 255), 1)

    def _draw_overlay(self, img, is_simulated=True):
        # Draw crosshair in the center
        color_cyan = (255, 210, 0) # BGR
        cv2.line(img, (320, 220), (320, 260), color_cyan, 1)
        cv2.line(img, (300, 240), (340, 240), color_cyan, 1)
        cv2.circle(img, (320, 240), 8, color_cyan, 1)
        
        # Draw top-left status bar
        mode_text = "FRAMOS D435e [SIMULADO]" if is_simulated else "FRAMOS D435e [ACTIVO]"
        cv2.putText(img, mode_text, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Draw IMU status in the bottom-left corner
        status_y = 420
        status_color = (0, 255, 136) if self.stable else (43, 75, 255) # BGR (Green vs Red)
        status_text = "IMU: ESTABLE" if self.stable else "IMU: INESTABLE"
        cv2.putText(img, status_text, (20, status_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2, cv2.LINE_AA)
        
        # Draw Gyro & Accel details
        cv2.putText(img, f"Giro: {self.gyro_magnitude:.3f} rad/s (Umbral: <{self.umbral_giro:.3f})", 
                    (20, status_y + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1, cv2.LINE_AA)
        cv2.putText(img, f"Accel: {self.accel_deviation:.3f} m/s^2 (Umbral: <{self.umbral_accel:.3f})", 
                    (20, status_y + 40), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1, cv2.LINE_AA)
                    
        # Draw current timestamp in top-right
        now = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        cv2.putText(img, now, (500, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1, cv2.LINE_AA)

    def _get_static_dummy_bytes(self):
        """Generates static dummy JPEG bytes if cv2 is not available."""
        # Simple hardcoded 1x1 or minimal black JPEG string to avoid crashes
        return (
            b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06'
            b'\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
            b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00'
            b'\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02'
            b'\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01\x7d\x01\x02\x03\x00\x04\x11\x05\x12!1A'
            b'\x06\x13Qa\x07"2q\x81\x91\xa1\x08#B\xb1\xc1\x14R\xd1\xf0$3br\x82\x92\xa2\x15M\x09\n\x16\x17'
            b'\x18\x19\x1a%&\'()*56789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x93'
            b'\x94\x95\x96\x97\x98\x99\x9a\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9'
            b'\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4'
            b'\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x0c\x01\x01\x00'
            b'\x02\x11\x03\x11\x00?\x00\xbf\x00\xff\xd9'
        )

    def capture_photo(self, step_index):
        """Saves current camera frame as a photo in static/photos."""
        with self.lock:
            if self.last_frame is None:
                return False, "No camera frame available"
            
            filename = f"photo_step_{step_index}.jpg"
            filepath = os.path.join(self.photos_dir, filename)
            
            try:
                with open(filepath, 'wb') as f:
                    f.write(self.last_frame)
                
                # Check if this step is already in self.photos_list and update it, or append
                url = f"http://localhost:5000/static/photos/{filename}"
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Remove existing photo for this step if it exists
                self.photos_list = [p for p in self.photos_list if p['step'] != step_index]
                
                self.photos_list.append({
                    "filename": filename,
                    "url": url,
                    "timestamp": timestamp,
                    "step": step_index
                })
                # Sort gallery by step index
                self.photos_list.sort(key=lambda x: x['step'])
                
                print(f"[INFO] Photo captured successfully for step {step_index} -> {filename}", flush=True)
                return True, url
            except Exception as e:
                print(f"[ERROR] Capture photo failed: {e}", flush=True)
                return False, str(e)

    def get_photos(self):
        with self.lock:
            return list(self.photos_list)

    def clear_photos(self):
        """Clears all saved photos from filesystem and metadata."""
        with self.lock:
            for p in self.photos_list:
                filepath = os.path.join(self.photos_dir, p['filename'])
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception:
                        pass
            self.photos_list = []
            print("[INFO] Cleared all photos from gallery.", flush=True)
            return True


# Instantiate global camera manager singleton
camera_manager = CameraManager()
# Start background thread automatically
camera_manager.start()
