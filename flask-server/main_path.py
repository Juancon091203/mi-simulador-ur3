import numpy as np
import math
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from main import generate_constrained_sphere_points

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
