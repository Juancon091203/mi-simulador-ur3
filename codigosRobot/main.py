import numpy as np
import matplotlib.pyplot as plt

def generate_constrained_sphere_points(center, radius, n, min_z=None, max_z=None, min_angle=0.0, max_angle=2*np.pi):
    """
    Generates n evenly distributed points on a 3D sphere with constraints.
    
    Parameters:
    - center: tuple (cx, cy, cz), the absolute 3D coordinate of the sphere's center.
    - radius: float, the radius of the sphere.
    - n: int, exact number of points to generate.
    - min_z: float, minimum Z value (relative to the sphere's center).
    - max_z: float, maximum Z value (relative to the sphere's center).
    - min_angle: float, minimum azimuthal angle in the XY plane (in radians).
    - max_angle: float, maximum azimuthal angle in the XY plane (in radians).
    
    Returns:
    - numpy.ndarray of shape (n, 3) containing the generated points.
    """
    cx, cy, cz = center
    
    # 1. Handle default Z boundaries (full sphere poles)
    if min_z is None: min_z = -radius
    if max_z is None: max_z = radius
        
    # Clamp Z boundaries to ensure they do not exceed the sphere's actual radius
    min_z = max(-radius, min(radius, min_z))
    max_z = max(-radius, min(radius, max_z))
    
    points = []
    
    # The Golden Ratio is used to evenly distribute points along the rotation
    golden_ratio = (1 + 5**0.5) / 2
    angle_range = max_angle - min_angle
    
    for i in range(n):
        # 2. Distribute Z evenly between min_z and max_z
        if n == 1:
            z = (min_z + max_z) / 2.0
        else:
            z = min_z + (max_z - min_z) * (i / (n - 1))
            
        # 3. Calculate the radius of the circular slice at height z
        # max(0, ...) prevents math domain errors from floating-point inaccuracies at the poles
        r_z = np.sqrt(max(0, radius**2 - z**2))
        
        # 4. Distribute the angle evenly using a low-discrepancy sequence
        # (i / golden_ratio) % 1 produces a sequence evenly spaced between 0 and 1
        fraction = (i / golden_ratio) % 1
        theta = min_angle + (fraction * angle_range)
        
        # 5. Convert to Cartesian coordinates and translate to the sphere's center
        x = cx + r_z * np.cos(theta)
        y = cy + r_z * np.sin(theta)
        actual_z = cz + z
        
        points.append((x, y, actual_z))
        
    return np.array(points)

# ==========================================
# Example Usage & Visualization
# ==========================================
if __name__ == "__main__":
    # Define Sphere
    sphere_center = (0, 10, 0)
    sphere_radius = 10
    total_points = 500
    
    # Define Constraints
    # - Cut off the absolute bottom and top
    # - Restrict the angle to a 180-degree wedge (half the sphere)
    z_minimum = -6.0
    z_maximum = 20.0
    angle_minimum = 0.0          # 0 degrees
    angle_maximum = np.pi * 4/3     # 180 degrees in radians
    
    # Generate points
    pts = generate_constrained_sphere_points(
        center=sphere_center, 
        radius=sphere_radius, 
        n=total_points, 
        min_z=z_minimum, 
        max_z=z_maximum, 
        min_angle=angle_minimum, 
        max_angle=angle_maximum
    )
    
    # Plotting
    fig = plt.figure(figsize=(8, 8))
    ax = fig.add_subplot(111, projection='3d')
    
    # Extract coordinates
    xs, ys, zs = pts[:, 0], pts[:, 1], pts[:, 2]
    
    # Scatter plot, colored by Z-height for better depth perception
    ax.scatter(xs, ys, zs, c=zs, cmap='coolwarm', s=15, alpha=0.9)
    
    # Set equal aspect ratio to prevent stretching
    ax.set_box_aspect([1, 1, 1])
    
    # Set plot limits dynamically based on the radius and center
    ax.set_xlim(sphere_center[0] - sphere_radius, sphere_center[0] + sphere_radius)
    ax.set_ylim(sphere_center[1] - sphere_radius, sphere_center[1] + sphere_radius)
    ax.set_zlim(sphere_center[2] - sphere_radius, sphere_center[2] + sphere_radius)
    
    ax.set_xlabel('X Axis')
    ax.set_ylabel('Y Axis')
    ax.set_zlabel('Z Axis')
    plt.title(f"{total_points} Evenly Distributed Points\nConstrained by Z and Angle")
    plt.show()