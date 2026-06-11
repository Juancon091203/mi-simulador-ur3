import numpy as np
import math
import matplotlib.pyplot as plt
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# --- 1. Point Generation ---
def generate_constrained_sphere_points(center, radius, n, min_z=None, max_z=None, min_angle=0.0, max_angle=2*np.pi):
    cx, cy, cz = center
    if min_z is None: min_z = -radius
    if max_z is None: max_z = radius
        
    min_z = max(-radius, min(radius, min_z))
    max_z = max(-radius, min(radius, max_z))
    
    points = []
    golden_ratio = (1 + 5**0.5) / 2
    angle_range = max_angle - min_angle
    
    for i in range(n):
        if n == 1:
            z = (min_z + max_z) / 2.0
        else:
            z = min_z + (max_z - min_z) * (i / (n - 1))
            
        r_z = np.sqrt(max(0, radius**2 - z**2))
        fraction = (i / golden_ratio) % 1
        theta = min_angle + (fraction * angle_range)
        
        x = cx + r_z * np.cos(theta)
        y = cy + r_z * np.sin(theta)
        actual_z = cz + z
        
        points.append((x, y, actual_z))
        
    return np.array(points)

# --- 2. OR-Tools Routing ---
def solve_tsp_ortools(points):
    SCALE_FACTOR = 10000 
    
    def compute_euclidean_distance_matrix(locations):
        distances = {}
        for from_counter, from_node in enumerate(locations):
            distances[from_counter] = {}
            for to_counter, to_node in enumerate(locations):
                if from_counter == to_counter:
                    distances[from_counter][to_counter] = 0
                else:
                    dist = np.linalg.norm(from_node - to_node)
                    distances[from_counter][to_counter] = int(dist * SCALE_FACTOR)
        return distances

    distance_matrix = compute_euclidean_distance_matrix(points)
    data = {'distance_matrix': distance_matrix, 'num_vehicles': 1, 'depot': 0}
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']), data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.seconds = 2

    print("Solving with OR-Tools...")
    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        index = routing.Start(0)
        path = []
        actual_distance = 0.0
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            path.append(node_index)
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            actual_distance += routing.GetArcCostForVehicle(previous_index, index, 0) / SCALE_FACTOR
        return path, actual_distance
    else:
        print("No solution found!")
        return None, None

# --- 3. Robot Orientation (Kinematics) ---
def rotation_matrix_to_euler(R):
    """Converts a 3x3 Rotation Matrix to Euler Angles (Roll, Pitch, Yaw) in radians."""
    sy = math.sqrt(R[0,0] * R[0,0] + R[1,0] * R[1,0])
    singular = sy < 1e-6

    if not singular:
        x = math.atan2(R[2,1] , R[2,2]) # Rx
        y = math.atan2(-R[2,0], sy)     # Ry
        z = math.atan2(R[1,0], R[0,0])  # Rz
    else:
        x = math.atan2(-R[1,2], R[1,1])
        y = math.atan2(-R[2,0], sy)
        z = 0
    return x, y, z

def compute_robot_poses(ordered_points, center):
    """
    Computes X, Y, Z, Rx, Ry, Rz for the robot.
    Ensures Z points to center, and uses a global reference vector to keep Rz highly stable.
    """
    poses = []
    global_ref = np.array([0.0, 0.0, 1.0]) 
    
    for p in ordered_points:
        z_axis = np.array(center) - p
        z_norm = np.linalg.norm(z_axis)
        z_axis = z_axis / z_norm if z_norm != 0 else np.array([0.0, 0.0, 1.0])
            
        if abs(np.dot(z_axis, global_ref)) > 0.999:
            current_ref = np.array([1.0, 0.0, 0.0])
        else:
            current_ref = global_ref
            
        y_axis = np.cross(z_axis, current_ref)
        y_axis = y_axis / np.linalg.norm(y_axis)
        
        x_axis = np.cross(y_axis, z_axis)
        x_axis = x_axis / np.linalg.norm(x_axis)
        
        R = np.column_stack((x_axis, y_axis, z_axis))
        rx, ry, rz = rotation_matrix_to_euler(R)
        
        poses.append((p[0], p[1], p[2], rx, ry, rz))
        
    return np.array(poses)


def plot_poses(robot_poses, sphere_center, radius = 1, bShowAxis=True):
        """
        Plots the robot poses in 3D space with X, Y, Z axes colored according to the standard RGB convention:
        """
        # --- Plotting ---
        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')
        
        xs, ys, zs = robot_poses[:, 0], robot_poses[:, 1], robot_poses[:, 2]
        
        # 3. Reconstruct the XYZ vectors specifically for visualization
        u_z, v_z, w_z = [], [], []
        u_x, v_x, w_x = [], [], []
        u_y, v_y, w_y = [], [], []
        
        global_ref = np.array([0.0, 0.0, 1.0])
        
        if bShowAxis:
            for p in robot_poses:
                # Rebuild Z
                z_axis = np.array(sphere_center) - p[:3]
                z_norm = np.linalg.norm(z_axis)
                z_axis = z_axis / z_norm if z_norm != 0 else np.array([0.0, 0.0, 1.0])
                
                # Rebuild Y
                current_ref = np.array([1.0, 0.0, 0.0]) if abs(np.dot(z_axis, global_ref)) > 0.999 else global_ref
                y_axis = np.cross(z_axis, current_ref)
                y_axis = y_axis / np.linalg.norm(y_axis)
                
                # Rebuild X
                x_axis = np.cross(y_axis, z_axis)
                x_axis = x_axis / np.linalg.norm(x_axis)
                
                # Store for plotting
                u_z.append(z_axis[0]); v_z.append(z_axis[1]); w_z.append(z_axis[2])
                u_y.append(y_axis[0]); v_y.append(y_axis[1]); w_y.append(y_axis[2])
                u_x.append(x_axis[0]); v_x.append(x_axis[1]); w_x.append(x_axis[2])

        # Plot Path (Set to black so it doesn't clash with the blue Z-axis)
        ax.plot(xs, ys, zs, c='black', alpha=0.3, linewidth=1.5, zorder=1)


        if bShowAxis:
            # Plot X, Y, and Z Axes
            arrow_len = 0.1 * radius

            # X-Axis (Red)
            ax.quiver(xs, ys, zs, u_x, v_x, w_x, length=arrow_len, color='red', alpha=0.7, arrow_length_ratio=0.3, label='Tool X')
            # Y-Axis (Green)
            ax.quiver(xs, ys, zs, u_y, v_y, w_y, length=arrow_len, color='green', alpha=0.7, arrow_length_ratio=0.3, label='Tool Y')
            # Z-Axis (Blue)
            ax.quiver(xs, ys, zs, u_z, v_z, w_z, length=arrow_len, color='blue', alpha=0.7, arrow_length_ratio=0.3, label='Tool Z (To Center)')
            
        ax.scatter(sphere_center[0], sphere_center[1], sphere_center[2], c='black', s=200, marker='*', label='Sphere Center')
        
        ax.set_box_aspect([1, 1, 1])
        ax.set_xlabel('X Axis')
        ax.set_ylabel('Y Axis')
        ax.set_zlabel('Z Axis')

        # Add an axis in origin (point 0,0,0, rotation 0,0,0)
        # Plot X, Y, and Z Axes
        arrow_len = 0.1 * radius

        # X-Axis (Red)
        ax.quiver([0], [0], [0], [1], [0], [0], length=arrow_len, color='red', alpha=0.7, arrow_length_ratio=0.3, label='Tool X')
        # Y-Axis (Green)
        ax.quiver([0], [0], [0], [0], [1], [0], length=arrow_len, color='green', alpha=0.7, arrow_length_ratio=0.3, label='Tool Y')
        # Z-Axis (Blue)
        ax.quiver([0], [0], [0], [0], [0], [1], length=arrow_len, color='blue', alpha=0.7, arrow_length_ratio=0.3, label='Tool Z (To Center)')
        

        plt.legend()
        plt.title(f"Robot Tool Frames (Standard RGB Convention)\nX=Red, Y=Green, Z=Blue")
        plt.show()
# ==========================================
# Execution & Visualization
# ==========================================
if __name__ == "__main__":
    sphere_center = (0, 10, 0)
    sphere_radius = 10
    
    # Lowered to 60 so the 3D axes are visually readable and don't clump together
    total_points = 500 
    
    z_minimum = -6.0
    z_maximum = 20.0
    angle_minimum = 0.0
    angle_maximum = np.pi * 4/3
    
    # 1. Generate & Optimize Points
    pts = generate_constrained_sphere_points(
        center=sphere_center, radius=sphere_radius, n=total_points, 
        min_z=z_minimum, max_z=z_maximum, min_angle=angle_minimum, max_angle=angle_maximum
    )
    optimized_path, opt_dist = solve_tsp_ortools(pts)
    ordered_pts = pts[optimized_path]
    
    # 2. Compute 6-DOF Robot Poses
    robot_poses = compute_robot_poses(ordered_pts, sphere_center)
    
    plot_poses(robot_poses, sphere_center, radius=sphere_radius)