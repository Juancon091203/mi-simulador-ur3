from flask import Flask, Response
from flask import request, jsonify
from flask_cors import CORS
from control import Robot_Control
import json
import time

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

def calculate_point_sector(x, z, cx, cz):
    dx = x - cx
    dz = z - cz
    angle_val = math.atan2(dz, dx)
    sector = round(angle_val / (math.pi / 3))
    sector = (sector + 6) % 6
    return sector

# Route to stream digital data from the robot
@app.route('/digital')
def digital():
    def event_stream():
        # Continuous loop to read robot position and stream data
        while True:
            data = Robot_Control.read_robot_pos()
            time.sleep(0.01)
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
        
        # 2. Group points by sector and solve TSP per sector
        sectors = [[] for _ in range(6)]
        for p in scaled_pts:
            sec = calculate_point_sector(p[0], p[2], cx, cz)
            sectors[sec].append(p)
            
        ordered_pts = []
        for sec_idx in range(6):
            sec_pts = sectors[sec_idx]
            if len(sec_pts) == 0:
                continue
            elif len(sec_pts) == 1:
                ordered_pts.append(sec_pts[0])
            else:
                sec_pts_arr = np.array(sec_pts)
                optimized_path, _ = solve_tsp_ortools(sec_pts_arr)
                if optimized_path:
                    for idx in optimized_path:
                        ordered_pts.append(sec_pts_arr[idx])
                else:
                    ordered_pts.extend(sec_pts)
                    
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
                    "sector": int(calculate_point_sector(pose[0], pose[2], cx, cz))
                })
            return jsonify({"status": "success", "points": result})
        else:
            return jsonify({"status": "error", "message": "TSP optimization failed"})
    except Exception as e:
        print(f"[ERROR] calculate_trajectory error: {e}")
        return jsonify({"status": "error", "message": str(e)})

# Run the Flask app on host '0.0.0.0' and port 5000
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
