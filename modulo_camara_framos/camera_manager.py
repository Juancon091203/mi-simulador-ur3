import os
import sys
import time
import threading
from datetime import datetime

# Locate directory containing realsense DLLs (this folder: modulo_camara_framos)
framos_dir = os.path.dirname(os.path.abspath(__file__))

# Change the working directory of the process to satisfy GigE vision driver config path requirements
try:
    os.chdir(framos_dir)
    print(f"[INFO] Changed process working directory to: {framos_dir}", flush=True)
except Exception as e:
    print(f"[WARN] Failed to change process working directory: {e}", flush=True)

# Add this folder to path and DLL directory
if sys.platform == 'win32':
    try:
        os.add_dll_directory(framos_dir)
        print(f"[INFO] Added FRAMOS DLL directory: {framos_dir}", flush=True)
    except AttributeError:
        os.environ['PATH'] = framos_dir + os.pathsep + os.environ['PATH']

# Prioritize local module directory in search paths
if framos_dir in sys.path:
    sys.path.remove(framos_dir)
sys.path.insert(0, framos_dir)

# Try importing pyrealsense2
pyrealsense_available = False
try:
    import pyrealsense2 as rs
    pyrealsense_available = True
    print(f"[INFO] pyrealsense2 imported successfully from: {rs.__file__}", flush=True)
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
        self.umbral_giro = 0.25
        self.umbral_accel = 0.625
        self.g_referencia = 9.81
        self.auto_exposure = True
        self.exposure_us = 10000  # Default 10 ms (10000 us)
        self.gain = 64            # Default gain (middle range)
        self.frame_count = 0
        self.settings_applied = False
        
        # Current status variables
        self.stable = True
        self.gyro_magnitude = 0.0
        self.accel_deviation = 0.0
        
        self.prev_gray = None
        
        # Buffer for the last frame
        self.last_frame = None
        
        # Capture gallery inside the flask-server folder
        project_root = os.path.dirname(framos_dir)
        flask_server_dir = os.path.join(project_root, 'flask-server')
        self.photos_dir = os.path.join(flask_server_dir, 'static', 'photos')
        
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
        if not pyrealsense_available:
            self.camera_connected = False
            return False
        try:
            # Reuse cached context if available to avoid UDP broadcast storms.
            # Only allocate a new context if it is None (e.g. after a disconnect/error).
            if self.ctx is None:
                self.ctx = rs.context()
            devices = self.ctx.query_devices()
            self.camera_connected = (len(devices) > 0)
            if not self.camera_connected:
                self.ctx = None # Force a fresh scan on next check
            print(f"[DEBUG] _check_connection found {len(devices)} devices (connected={self.camera_connected})", flush=True)
            return self.camera_connected
        except Exception as e:
            print(f"[WARN] Error querying devices: {e}", flush=True)
            self.ctx = None
            self.camera_connected = False
            return False

    def _load_existing_photos(self):
        """Loads metadata for photos currently stored in the static folder."""
        if not os.path.exists(self.photos_dir):
            return
        files = sorted([f for f in os.listdir(self.photos_dir) if f.endswith('.jpg')])
        self.photos_list = []
        for f in files:
            path = f"http://localhost:5005/static/photos/{f}"
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
            if self.pipeline is None:
                # Force immediate check and initialization to avoid delay
                self._check_connection()
                if self.camera_connected:
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
            
            # Detect physical IMU support
            self.has_imu = False
            dev = devices[0]
            for sensor in dev.query_sensors():
                for profile in sensor.get_stream_profiles():
                    if profile.stream_type() in [rs.stream.accel, rs.stream.gyro]:
                        self.has_imu = True
                        break
            
            self.pipeline = rs.pipeline()
            config = rs.config()
            # Enable Color stream. Disable depth to save network bandwidth.
            config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
            
            # Enable high-frequency UDP motion streams (IMU)
            if self.has_imu:
                config.enable_stream(rs.stream.accel, rs.format.motion_xyz32f, 250)
                config.enable_stream(rs.stream.gyro, rs.format.motion_xyz32f, 200)
            
            self.pipeline.start(config)
            self.camera_connected = True
            print("[INFO] Physical FRAMOS camera pipeline started successfully.", flush=True)
            self.frame_count = 0
            self.settings_applied = False
        except Exception as e:
            print(f"[ERROR] Failed to initialize physical camera pipeline: {e}", flush=True)
            try:
                if 'devices' in locals() and len(devices) > 0:
                    print("[INFO] Attempting hardware reset on the camera to restore communication...", flush=True)
                    devices[0].hardware_reset()
            except Exception as reset_err:
                print(f"[WARN] Failed to send hardware reset: {reset_err}", flush=True)
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

    def _apply_sensor_settings(self):
        """Applies the current exposure and gain settings to the physical color sensor."""
        if self.pipeline is None:
            return
        try:
            active_profile = self.pipeline.get_active_profile()
            color_sensor = active_profile.get_device().first_color_sensor()
            
            if self.auto_exposure:
                color_sensor.set_option(rs.option.enable_auto_exposure, 1)
                print("[INFO] Applied Auto Exposure on color sensor.", flush=True)
            else:
                color_sensor.set_option(rs.option.enable_auto_exposure, 0)
                # RealSense/FRAMOS color sensor exposure unit is 100 microseconds (1 unit = 100 us)
                exposure_units = float(self.exposure_us) / 100.0
                exp_range = color_sensor.get_option_range(rs.option.exposure)
                clamped_units = max(exp_range.min, min(exp_range.max, exposure_units))
                color_sensor.set_option(rs.option.exposure, clamped_units)
                
                gain_range = color_sensor.get_option_range(rs.option.gain)
                clamped_gain = max(gain_range.min, min(gain_range.max, float(self.gain)))
                color_sensor.set_option(rs.option.gain, clamped_gain)
                
                print(f"[INFO] Applied Manual Settings: Exposure={self.exposure_us}us (units={clamped_units}), Gain={clamped_gain}", flush=True)
        except Exception as e:
            print(f"[WARN] Could not apply color sensor settings: {e}", flush=True)

    def update_settings(self, auto_exposure, exposure_ms, gain):
        """Thread-safe method to update exposure and gain settings and apply them immediately."""
        with self.lock:
            self.auto_exposure = auto_exposure
            self.exposure_us = int(exposure_ms * 1000)
            self.gain = int(gain)
            self._apply_sensor_settings()

    def _frame_loop(self):
        """Background loop to fetch frames and process IMU stability."""
        last_check_time = 0
        while self.is_running:
            try:
                if self.pipeline is not None:
                    self._process_real_frame()
                else:
                    # Decide polling frequency based on whether the HMI is open
                    poll_interval = 1.5 if self.active_streams > 0 else 3.0
                    
                    now = time.time()
                    if now - last_check_time >= poll_interval:
                        last_check_time = now
                        self._check_connection()
                        if self.camera_connected and self.active_streams > 0:
                            with self.lock:
                                self._init_camera()
                    time.sleep(0.5)
            except Exception as e:
                print(f"[ERROR] Exception in frame loop: {e}", flush=True)
                time.sleep(1.0)
            
            if self.pipeline is not None:
                time.sleep(0.066)  # Reverted to ~15 FPS as requested by the user

    def _process_real_frame(self):
        try:
            frames = self.pipeline.wait_for_frames(timeout_ms=5000)
            color_frame = frames.get_color_frame()
            if not color_frame:
                return
            
            # Convert to OpenCV image
            color_image = np.asanyarray(color_frame.get_data())
            
            # Process physical IMU data
            if self.has_imu:
                accel_frame = frames.first_or_default(rs.stream.accel)
                gyro_frame = frames.first_or_default(rs.stream.gyro)
                if accel_frame and gyro_frame:
                    accel_data = accel_frame.as_motion_frame().get_motion_data()
                    gyro_data = gyro_frame.as_motion_frame().get_motion_data()
                    
                    self.gyro_magnitude = float((gyro_data.x**2 + gyro_data.y**2 + gyro_data.z**2) ** 0.5)
                    accel_magnitude = float((accel_data.x**2 + accel_data.y**2 + accel_data.z**2) ** 0.5)
                    self.accel_deviation = float(abs(accel_magnitude - self.g_referencia))
                    
                    # Evaluate stability
                    self.stable = (self.gyro_magnitude < self.umbral_giro) and (self.accel_deviation < self.umbral_accel)
            else:
                self.gyro_magnitude = 0.0
                self.accel_deviation = 0.0
                self.stable = True
                
            # Defer applying exposure and gain settings until the stream is stable (e.g. 5 frames)
            self.frame_count += 1
            if not self.settings_applied and self.frame_count >= 5:
                self._apply_sensor_settings()
                self.settings_applied = True
                
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
                
                url = f"http://localhost:5005/static/photos/{filename}"
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
