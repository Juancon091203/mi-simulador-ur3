import os
import sys
import time
import threading
from datetime import datetime

# Locate the camera module directory relative to this flask-server folder
backend_dir = os.path.dirname(os.path.abspath(__file__))
framos_dir = os.path.join(os.path.dirname(backend_dir), 'modulo_camara_framos')

# Add backend_dir and framos_dir to path and DLL directories
if sys.platform == 'win32':
    try:
        os.add_dll_directory(backend_dir)
        print(f"[INFO] Added backend DLL directory: {backend_dir}", flush=True)
    except AttributeError:
        os.environ['PATH'] = backend_dir + os.pathsep + os.environ['PATH']

if os.path.exists(framos_dir):
    sys.path.append(framos_dir)
    if sys.platform == 'win32':
        try:
            os.add_dll_directory(framos_dir)
        except AttributeError:
            pass

# Try importing pyrealsense2
pyrealsense_available = False
try:
    import pyrealsense2 as rs
    pyrealsense_available = True
    print("[INFO] pyrealsense2 imported successfully.", flush=True)
except ImportError:
    print("[WARN] pyrealsense2 not available on this host environment.", flush=True)

# Try importing cv2 and numpy for drawing and encoding frames
opencv_available = False
try:
    import cv2
    import numpy as np
    opencv_available = True
    print("[INFO] OpenCV and NumPy imported successfully for camera handling.", flush=True)
except ImportError:
    print("[ERROR] OpenCV or NumPy not available.", flush=True)


class CameraManager:
    def __init__(self):
        self.lock = threading.Lock()
        self.pipeline = None
        self.is_running = False
        self.has_imu = False
        self.camera_connected = False
        
        # Store context at initialization to avoid multiple allocations (which can cause GigE discovery issues)
        self.ctx = None
        if pyrealsense_available:
            try:
                self.ctx = rs.context()
            except Exception as e:
                print(f"[ERROR] Failed to allocate RealSense context: {e}", flush=True)
        
        # Configuration & Thresholds
        self.umbral_giro = 0.08
        self.umbral_accel = 0.20
        self.g_referencia = 9.81
        
        # Current status variables
        self.stable = True
        self.gyro_magnitude = 0.0
        self.accel_deviation = 0.0
        
        # Buffer for the last frame
        self.last_frame = None
        
        # Capture gallery
        self.photos_dir = os.path.join(backend_dir, 'static', 'photos')
        os.makedirs(self.photos_dir, exist_ok=True)
        self.photos_list = []
        self._load_existing_photos()
        
        # Streaming state
        self.active_streams = 0
        self.thread = None

        # Check initial connection
        self._check_connection()

    def _check_connection(self):
        """Checks if a physical camera is connected without starting the pipeline."""
        if not pyrealsense_available or self.ctx is None:
            self.camera_connected = False
            return False
        try:
            devices = self.ctx.query_devices()
            self.camera_connected = (len(devices) > 0)
            return self.camera_connected
        except Exception as e:
            print(f"[WARN] Error querying devices: {e}", flush=True)
            self.camera_connected = False
            return False

    def _load_existing_photos(self):
        """Loads metadata for photos currently stored in the static folder."""
        if not os.path.exists(self.photos_dir):
            return
        files = sorted([f for f in os.listdir(self.photos_dir) if f.endswith('.jpg')])
        self.photos_list = []
        for f in files:
            path = f"http://localhost:5000/static/photos/{f}"
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
            self.umbral_accel = umbral_giro * 2.5
            print(f"[INFO] Updated camera thresholds: Giro={self.umbral_giro:.3f}, Accel={self.umbral_accel:.3f}", flush=True)

    def register_client(self):
        """Increments active stream count, initializing pipeline if needed."""
        with self.lock:
            self.active_streams += 1
            print(f"[INFO] Active camera streams: {self.active_streams}", flush=True)
            self._check_connection()
            if self.camera_connected and self.pipeline is None:
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
        if not pyrealsense_available or self.ctx is None:
            self.camera_connected = False
            return
        
        try:
            devices = self.ctx.query_devices()
            if len(devices) == 0:
                self.camera_connected = False
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
            self.camera_connected = True
            print("[INFO] Physical FRAMOS camera pipeline started successfully.", flush=True)
        except Exception as e:
            print(f"[ERROR] Failed to initialize physical camera pipeline: {e}", flush=True)
            self.pipeline = None
            self.camera_connected = False

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
                if self.pipeline is not None:
                    self._process_real_frame()
                else:
                    # Periodically check for camera connection if not active
                    self._check_connection()
                    if self.camera_connected and self.active_streams > 0:
                        with self.lock:
                            self._init_camera()
                    time.sleep(1.0)
            except Exception as e:
                print(f"[ERROR] Exception in frame loop: {e}", flush=True)
                time.sleep(0.5)
            
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
                self.gyro_magnitude = 0.0
                self.accel_deviation = 0.0
                self.stable = True
                
            # Encode clean color frame as JPEG (without overlay)
            _, jpeg = cv2.imencode('.jpg', color_image)
            self.last_frame = jpeg.tobytes()
        except Exception as e:
            print(f"[ERROR] Real frame processing failed: {e}", flush=True)
            self.pipeline = None
            self.camera_connected = False

    def capture_photo(self, step_index):
        """Saves current camera frame as a photo in static/photos."""
        with self.lock:
            if not self.camera_connected or self.last_frame is None:
                return False, "Cámara no conectada o sin imagen disponible"
            
            filename = f"photo_step_{step_index}.jpg"
            filepath = os.path.join(self.photos_dir, filename)
            
            try:
                with open(filepath, 'wb') as f:
                    f.write(self.last_frame)
                
                url = f"http://localhost:5000/static/photos/{filename}"
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                self.photos_list = [p for p in self.photos_list if p['step'] != step_index]
                
                self.photos_list.append({
                    "filename": filename,
                    "url": url,
                    "timestamp": timestamp,
                    "step": step_index
                })
                self.photos_list.sort(key=lambda x: x['step'])
                
                print(f"[INFO] Photo captured successfully for step {step_index} -> {filename}", flush=True)
                return True, url
            except Exception as e:
                print(f"[ERROR] Capture photo failed: {e}", flush=True)
                return False, str(e)

    def delete_photo_by_step(self, step_index):
        """Deletes a specific photo by its step index."""
        with self.lock:
            matched = [p for p in self.photos_list if p['step'] == step_index]
            if matched:
                photo = matched[0]
                filepath = os.path.join(self.photos_dir, photo['filename'])
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception as e:
                        print(f"[ERROR] Failed to delete file {filepath}: {e}", flush=True)
                self.photos_list = [p for p in self.photos_list if p['step'] != step_index]
                print(f"[INFO] Deleted photo for step {step_index}", flush=True)
                return True
            return False

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
