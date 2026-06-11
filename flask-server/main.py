import numpy as np

def generate_constrained_sphere_points(center, radius, n, min_z=None, max_z=None, min_angle=0.0, max_angle=2*np.pi):
    """
    Generates n evenly distributed points on a 3D sphere with constraints.
    """
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
