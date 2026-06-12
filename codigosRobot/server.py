import socket
import threading
from urllib.parse import urlparse, parse_qs
import numpy as np
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from main_path import compute_robot_poses, generate_constrained_sphere_points, plot_poses, solve_tsp_ortools

# ==========================================
# Global State Manager
# ==========================================
class PointManager:
    def __init__(self):
        self.ordered_points = []
        self.current_index = 0
        self.lock = threading.Lock()

    def update_points(self, points):
        with self.lock:
            self.ordered_points = points
            self.current_index = 0

    def get_next_point(self):
        with self.lock:
            if self.current_index < len(self.ordered_points):
                pt = self.ordered_points[self.current_index]
                self.current_index += 1
                return pt
            else:
                return (0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

manager = PointManager()

# ==========================================
# 3. Socket Server Logic
# ==========================================
def parse_params(param_string):
    """Parses a string like 'n=10,radius=5.0' into a dictionary."""
    params = {}
    pairs = param_string.split(',')
    for pair in pairs:
        if '=' in pair:
            key, val = pair.split('=', 1)
            params[key.strip()] = float(val.strip())
    return params

def calculate_point_sector(x, y, cx, cy):
    dx = x - cx
    dy = y - cy
    angle_val = np.arctan2(dy, dx)
    sector = round(angle_val / (np.pi / 3))
    sector = (sector + 6) % 6
    return sector

def handle_client(client_socket, address):
    print(f"[+] Connected: {address}")
    
    try:
        while True:
            data = client_socket.recv(1024).decode('utf-8').strip()
            if not data:
                break # Client disconnected

            # Petition 1: Calculate
            if data.startswith("CALCULATE:"):
                param_str = data.split(":", 1)[1]
                params = parse_params(param_str)
                
                # Extract with defaults
                n = int(params.get('n', 10))
                radius = abs(params.get('radius', 10.0))
                cx = params.get('cx', 0.0)
                cy = params.get('cy', 10.0)
                cz = params.get('cz', 0.0)
                aux_min_z = params.get('min_z', 6.0)
                aux_max_z = params.get('max_z', 20.0)
                aux_min_angle = params.get('min_angle', np.pi/2)
                aux_max_angle = params.get('max_angle', np.pi/2)

                min_z = - radius + abs(aux_min_z)
                max_z = radius - abs(aux_max_z)

                # Min angle = angle between cx,cy and 0,0 - aux_min_angle, so that we can have points in the front of the sphere, but not in the back
                ang = np.arctan2(-cy, -cx) * 180/np.pi
                if cy != 0 and cx != 0:
                    min_angle = np.arctan2(-cy, -cx) - abs(aux_min_angle)
                    max_angle = np.arctan2(-cy, -cx) + abs(aux_max_angle)
                else:
                    min_angle = aux_min_angle
                    max_angle = aux_max_angle

                print(f"[*] Angulo calculado: {ang:.2f}° -> Min Angle: {min_angle* 180/np.pi:.2f} °, Max Angle: {max_angle* 180/np.pi:.2f} °")
                print(f"[*] Calculating {n} points...")
                pts = generate_constrained_sphere_points((cx, cy, cz), radius, n, min_z, max_z, min_angle, max_angle)
                
                # Group by sector and solve TSP per sector to minimize base station changes
                sectors = [[] for _ in range(6)]
                for p in pts:
                    sec = calculate_point_sector(p[0], p[1], cx, cy)
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
                    # 2. Compute 6-DOF Robot Poses
                    robot_poses = compute_robot_poses(ordered_pts, (cx, cy, cz))
                    manager.update_points(robot_poses)
                    plot_poses(robot_poses, (cx, cy, cz), radius=radius, bShowAxis=False)
                    client_socket.sendall(b"OK: Calculated and optimized.\n")
                else:
                    client_socket.sendall(b"ERROR: TSP Failed.\n")

            # Petition 2: Next Point
            elif data == "NEXT":
                pt = manager.get_next_point()
                response = f"{pt[0]:.4f}, {pt[1]:.4f}, {pt[2]:.4f}, {pt[3]:.4f}, {pt[4]:.4f}, {pt[5]:.4f}\n"
                client_socket.sendall(response.encode('utf-8'))
                
            else:
                client_socket.sendall(b"UNKNOWN COMMAND\n")
                
    except ConnectionResetError:
        pass
    finally:
        print(f"[-] Disconnected: {address}")
        client_socket.close()

def start_server(host='127.0.0.1', port=9999):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((host, port))
    server.listen(5)
    print(f"[*] Raw Socket Server listening on {host}:{port}")
    
    try:
        while True:
            client, addr = server.accept()
            thread = threading.Thread(target=handle_client, args=(client, addr))
            thread.daemon = True
            thread.start()
    except KeyboardInterrupt:
        print("\n[*] Server shutting down.")
        server.close()

if __name__ == "__main__":
    start_server()