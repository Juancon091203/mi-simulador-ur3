from flask import Flask, Response
from flask import request, jsonify
from flask_cors import CORS
from control import Robot_Control
import json
import time
import os

# Initialize the Robot Control module
Robot_Control.init()

# Create a Flask app
app = Flask(__name__)
# Enable CORS for all routes
CORS(app) 

# Route to publish the robot's IP address
@app.route('/publish_ip/<ip_address>')
def publish_ip(ip_address):
    # Connect to the robot using the provided IP address
    result = Robot_Control.connect(ip_adress=ip_address)
    if result:
        return jsonify({"status": "success", "message": "Robot is connected."})
    else:
        return jsonify({"status": "warning", "message": "Wrong IP address."})

# Route to disconnect from the robot
@app.route('/disconnect')
def disconnect():
    # Disconnect from the robot
    Robot_Control.disconnect()
    return jsonify({"status": "success", "message": "Robot is disconnected."})

# Route to receive commands from the client
@app.route('/receive_command', methods=['POST'])
def receive_command():
    # Check if the robot is currently reconnecting
    if Robot_Control.reconnecting:
        return jsonify({"status": "error", "message": "Robot is currently reconnecting."})

    # Extract data from the JSON request
    data = request.get_json()["data"]
    print(f"Received data: {data}")

    # Submit the received data to the Robot Control module
    result = Robot_Control.sub_data(data=data)

    # If result is 1, initiate a reconnect process
    if result == 1:
        Robot_Control.reconnecting = True
        Robot_Control.reconnect()
        Robot_Control.reconnecting = False

    return jsonify({"status": "success"})

import math
import numpy as np
from main_path import generate_constrained_sphere_points, solve_tsp_ortools, compute_robot_poses

def calculate_point_sector(x, y, cx, cy):
    dx = x - cx
    dy = y - cy
    angle_val = math.atan2(dy, dx)
    sector = round(angle_val / (math.pi / 3))
    sector = (sector + 6) % 6
    return sector

# Route to stream digital data from the robot
@app.route('/digital')
def digital():
    def event_stream():
        # Continuous loop to read robot position and stream data
        # Lowered frequency from 100Hz (0.01s) to 20Hz (0.05s) to prevent browser main-thread
        # event-loop saturation and free up Flask socket handling
        while True:
            data = Robot_Control.read_robot_pos()
            time.sleep(0.05)
            yield 'data: {}\n\n'.format(json.dumps(data))

    # Return the event stream as a text/event-stream response
    return Response(event_stream(), mimetype="text/event-stream")

@app.route('/calculate_trajectory', methods=['POST'])
def calculate_trajectory():
    try:
        data = request.get_json() or {}
        
        n = int(data.get('n', 100))
        radius = float(data.get('radius', 1.0))
        cx = float(data.get('cx', 0.0))
        cy = float(data.get('cy', 0.0))
        cz = float(data.get('cz', 0.0))
        
        # Spheroid sizes (scaling factors)
        sx = float(data.get('sx', 1.0))
        sy = float(data.get('sy', 1.0))
        sz = float(data.get('sz', 1.0))
        
        # Constraints
        min_z = data.get('min_z')
        if min_z is not None:
            min_z = float(min_z)
        max_z = data.get('max_z')
        if max_z is not None:
            max_z = float(max_z)
            
        min_angle = float(data.get('min_angle', 0.0))
        max_angle = float(data.get('max_angle', 2 * math.pi))
        
        # 1. Generate points on a unit sphere (or sphere with radius)
        pts = generate_constrained_sphere_points((cx, cy, cz), radius, n, min_z, max_z, min_angle, max_angle)
        
        # Apply spheroid scaling relative to the center
        scaled_pts = []
        for p in pts:
            x_s = cx + (p[0] - cx) * sx
            y_s = cy + (p[1] - cy) * sy
            z_s = cz + (p[2] - cz) * sz
            scaled_pts.append((x_s, y_s, z_s))
        scaled_pts = np.array(scaled_pts)
        
        # 2. Group points by sector and solve TSP per sector, splitting each into top & bottom sub-sectors
        sectors = [[] for _ in range(6)]
        for p in scaled_pts:
            sec = calculate_point_sector(p[0], p[1], cx, cy)
            sectors[sec].append(p)
            
        ordered_pts = []
        for sec_idx in range(6):
            sec_pts = sectors[sec_idx]
            if len(sec_pts) == 0:
                continue
            
            # Divide this sector's points into top and bottom halves (relative to cz center height)
            top_pts = [p for p in sec_pts if p[2] > cz]
            bottom_pts = [p for p in sec_pts if p[2] <= cz]
            
            # Determine ordering of groups to achieve a smooth horizontal/vertical zig-zag:
            # Even sectors (0, 2, 4): top first, then bottom
            # Odd sectors (1, 3, 5): bottom first, then top
            if sec_idx % 2 == 0:
                groups = [top_pts, bottom_pts]
            else:
                groups = [bottom_pts, top_pts]
                
            for group in groups:
                if len(group) == 0:
                    continue
                elif len(group) == 1:
                    ordered_pts.append(group[0])
                else:
                    group_arr = np.array(group)
                    optimized_path, _ = solve_tsp_ortools(group_arr)
                    if optimized_path:
                        for idx in optimized_path:
                            ordered_pts.append(group_arr[idx])
                    else:
                        ordered_pts.extend(group)
                    
        ordered_pts = np.array(ordered_pts)
        
        if len(ordered_pts) > 0:
            # 3. Compute 6-DOF Robot Poses
            robot_poses = compute_robot_poses(ordered_pts, (cx, cy, cz))
            
            # Return as JSON
            result = []
            for pose in robot_poses:
                result.append({
                    "x": float(pose[0]),
                    "y": float(pose[1]),
                    "z": float(pose[2]),
                    "rx": float(pose[3]),
                    "ry": float(pose[4]),
                    "rz": float(pose[5]),
                    "sector": int(calculate_point_sector(pose[0], pose[1], cx, cy))
                })
            return jsonify({"status": "success", "points": result})
        else:
            return jsonify({"status": "error", "message": "TSP optimization failed"})
    except Exception as e:
        print(f"[ERROR] calculate_trajectory error: {e}")
        return jsonify({"status": "error", "message": str(e)})

PRESETS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'presets.json')

def load_presets():
    if not os.path.exists(PRESETS_FILE):
        return {}
    try:
        with open(PRESETS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading presets: {e}")
        return {}

def save_presets(presets):
    try:
        with open(PRESETS_FILE, 'w', encoding='utf-8') as f:
            json.dump(presets, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving presets: {e}")
        return False

@app.route('/presets', methods=['GET'])
def get_presets():
    return jsonify(load_presets())

@app.route('/save_preset', methods=['POST'])
def add_preset():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        config = data.get('config')
        if not name or config is None:
            return jsonify({"status": "error", "message": "Name and config are required"}), 400
        
        presets = load_presets()
        presets[name] = config
        if save_presets(presets):
            return jsonify({"status": "success", "presets": presets})
        else:
            return jsonify({"status": "error", "message": "Could not write presets file"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/delete_preset', methods=['POST'])
def delete_preset():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        if not name:
            return jsonify({"status": "error", "message": "Name is required"}), 400
        
        presets = load_presets()
        if name in presets:
            del presets[name]
            if save_presets(presets):
                return jsonify({"status": "success", "presets": presets})
            else:
                return jsonify({"status": "error", "message": "Could not update presets file"}), 500
        else:
            return jsonify({"status": "error", "message": "Preset not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

from camera_manager import camera_manager

@app.route('/camera/stream')
def camera_stream():
    def generate():
        camera_manager.register_client()
        try:
            while True:
                frame = camera_manager.last_frame
                if frame is not None:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                time.sleep(0.066)
        finally:
            camera_manager.unregister_client()

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/camera/status')
def camera_status():
    return jsonify({
        "stable": camera_manager.stable,
        "gyro_magnitude": camera_manager.gyro_magnitude,
        "accel_deviation": camera_manager.accel_deviation,
        "umbral_giro": camera_manager.umbral_giro,
        "umbral_accel": camera_manager.umbral_accel,
        "camera_connected": camera_manager.camera_connected
    })

@app.route('/camera/threshold', methods=['POST'])
def camera_threshold():
    try:
        data = request.get_json() or {}
        val = data.get('umbral_giro')
        if val is not None:
            camera_manager.set_thresholds(float(val))
            return jsonify({
                "status": "success", 
                "umbral_giro": camera_manager.umbral_giro, 
                "umbral_accel": camera_manager.umbral_accel
            })
        return jsonify({"status": "error", "message": "umbral_giro is required"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/camera/robot_move', methods=['POST'])
def camera_robot_move():
    # Deprecated for real camera trigger, but kept for compatibility
    return jsonify({"status": "success"})

@app.route('/camera/capture', methods=['POST'])
def camera_capture():
    try:
        data = request.get_json() or {}
        step = data.get('step')
        if step is None:
            return jsonify({"status": "error", "message": "step index is required"}), 400
        
        success, result = camera_manager.capture_photo(int(step))
        if success:
            return jsonify({"status": "success", "url": result, "photos": camera_manager.get_photos()})
        else:
            return jsonify({"status": "error", "message": result}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/camera/delete', methods=['POST'])
def camera_delete_photo():
    try:
        data = request.get_json() or {}
        step = data.get('step')
        if step is None:
            return jsonify({"status": "error", "message": "step is required"}), 400
        
        camera_manager.delete_photo_by_step(int(step))
        return jsonify({"status": "success", "photos": camera_manager.get_photos()})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/camera/photos')
def camera_photos():
    return jsonify(camera_manager.get_photos())

@app.route('/camera/clear_photos', methods=['POST'])
def camera_clear_photos():
    try:
        camera_manager.clear_photos()
        return jsonify({"status": "success", "photos": []})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Run the Flask app on host '0.0.0.0' and port 5000 with multithreading active
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)


