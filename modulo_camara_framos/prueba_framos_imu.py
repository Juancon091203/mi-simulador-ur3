import os
import sys

# Forzar a Python a buscar DLLs en el directorio de este script (crítico en Windows y Python 3.8+)
script_dir = os.path.dirname(os.path.abspath(__file__))
if sys.platform == 'win32':
    try:
        os.add_dll_directory(script_dir)
    except AttributeError:
        # En versiones antiguas de Python no existe add_dll_directory, añadimos al PATH
        os.environ['PATH'] = script_dir + os.pathsep + os.environ['PATH']

import pyrealsense2 as rs
import time

# Intentar importar OpenCV para la visualización del vídeo
opencv_available = False
try:
    import cv2
    import numpy as np
    opencv_available = True
except ImportError:
    print("[INFO] OpenCV (cv2) no está instalado. El script funcionará únicamente por línea de comandos.")

def evaluar_estabilidad(accel_data, gyro_data, umbral_giro=0.08, umbral_accel=0.20, g_referencia=9.81):
    """
    Evalúa si la cámara está inmóvil (ESTABLE) o moviéndose/vibrando (INESTABLE).
    
    Parámetros:
    - accel_data: Datos del acelerómetro en m/s^2 (objeto con x, y, z).
    - gyro_data: Datos del giroscopio en rad/s (objeto con x, y, z).
    - umbral_giro: Velocidad angular máxima permitida para ser 'estable'.
    - umbral_accel: Variación máxima de aceleración lineal respecto a la gravedad.
    - g_referencia: Gravedad local de referencia (9.81 m/s^2 por defecto).
    
    Retorna:
    - bool: True si está ESTABLE, False si es INESTABLE.
    - float: Magnitud de rotación angular medida (en rad/s).
    - float: Desviación de la aceleración respecto a la gravedad terrestre.
    """
    # 1. Rotación: Calcular la magnitud total del vector de velocidad angular (giroscopio)
    # Magnitud = sqrt(x^2 + y^2 + z^2)
    gyro_magnitude = (gyro_data.x**2 + gyro_data.y**2 + gyro_data.z**2) ** 0.5
    
    # 2. Aceleración/Vibración: Calcular la magnitud del vector de aceleración
    accel_magnitude = (accel_data.x**2 + accel_data.y**2 + accel_data.z**2) ** 0.5
    
    # Desviación de la aceleración lineal respecto a la fuerza de gravedad constante (9.81 m/s^2)
    # Si la cámara está quieta, la magnitud de la aceleración debe ser exactamente igual a la gravedad.
    accel_deviation = abs(accel_magnitude - g_referencia)
    
    # 3. Clasificación: Está estable si rotación y vibración están bajo los umbrales
    esta_estable = (gyro_magnitude < umbral_giro) and (accel_deviation < umbral_accel)
    
    return esta_estable, gyro_magnitude, accel_deviation

def main():
    # 1. Crear el contexto e interrogar a los dispositivos conectados
    ctx = rs.context()
    print("[INFO] Buscando dispositivos en la red...")
    devices = ctx.query_devices()
    print(f"[INFO] Dispositivos detectados en el sistema: {len(devices)}")
    
    if len(devices) == 0:
        print("[ALERTA] No se detectó ninguna cámara.")
        print("[CONSEJO] Asegúrate de que:")
        print("  1. La cámara tiene alimentación (PoE activo) y el LED trasero está encendido.")
        print("  2. Has cerrado por completo 'realsense-viewer.exe' (solo una app puede usar la cámara a la vez).")
        print("  3. Has configurado el puerto de red como perfil 'Privado' en Windows.")
        sys.exit(1)
        
    for i, dev in enumerate(devices):
        name = dev.get_info(rs.camera_info.name) if dev.supports(rs.camera_info.name) else "Desconocido"
        sn = dev.get_info(rs.camera_info.serial_number) if dev.supports(rs.camera_info.serial_number) else "Desconocido"
        print(f"  -> Dispositivo [{i}]: {name} | S/N: {sn}")

    # 2. Comprobar si el dispositivo soporta IMU física (acelerómetro/giroscopio)
    has_imu = False
    dev = devices[0]
    try:
        for sensor in dev.query_sensors():
            # Si es el sensor de movimiento, listar sus perfiles
            is_motion = False
            for profile in sensor.get_stream_profiles():
                if profile.stream_type() == rs.stream.accel or profile.stream_type() == rs.stream.gyro:
                    is_motion = True
                    has_imu = True
                    # Imprimir el perfil para diagnóstico
                    print(f"  [IMU PROFILE] Tipo: {profile.stream_type()} | Formato: {profile.format()} | Frecuencia: {profile.fps()} Hz")
    except Exception as e:
        print(f"[WARN] Error consultando perfiles del sensor: {e}")

    print(f"[INFO] ¿La cámara soporta IMU física detectada?: {'SÍ' if has_imu else 'NO'}")

    # 3. Configurar el pipeline
    pipeline = rs.pipeline()
    config = rs.config()

    print("[INFO] Configurando streams de la cámara...")
    
    # Habilitar flujos de imagen (Resolución estándar de 640x480)
    config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
    config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)

    # Habilitar flujos de la IMU solo si está físicamente soportada
    if has_imu:
        print("[INFO] Habilitando flujos de acelerómetro (250 Hz) y giroscopio (200 Hz)...")
        config.enable_stream(rs.stream.accel, rs.format.motion_xyz32f, 250)
        config.enable_stream(rs.stream.gyro, rs.format.motion_xyz32f, 200)
    else:
        print("[INFO] Saltando configuración de IMU (la cámara no tiene sensor de movimiento físico).")

    # 4. Iniciar el pipeline
    print(f"[INFO] Intentando abrir la transmisión del pipeline ({'con IMU' if has_imu else 'sin IMU'})...")
    try:
        pipeline.start(config)
        print("[INFO] Transmisión iniciada correctamente.")
        if opencv_available:
            print("[INFO] Se abrirá una ventana mostrando la cámara. Presiona 'q' en la ventana para salir.")
    except Exception as e:
        if has_imu:
            print(f"[WARN] No se pudo iniciar el pipeline con IMU: {e}")
            print("[INFO] Reintentando iniciar la transmisión únicamente con Color y Profundidad (sin IMU)...")
            
            # Reconfigurar sin IMU
            config_no_imu = rs.config()
            config_no_imu.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
            config_no_imu.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
            
            try:
                pipeline.start(config_no_imu)
                has_imu = False
                print("[INFO] Transmisión iniciada correctamente (Solo Color y Profundidad).")
                if opencv_available:
                    print("[INFO] Se abrirá una ventana mostrando la cámara. Presiona 'q' en la ventana para salir.")
            except Exception as ex:
                print(f"[ERROR] Tampoco se pudo iniciar el pipeline básico: {ex}")
                print("[CONSEJO] Asegúrate de que no haya otra aplicación usando la cámara.")
                sys.exit(1)
        else:
            print(f"[ERROR] No se pudo iniciar el pipeline: {e}")
            print("[CONSEJO] Asegúrate de que no haya otra aplicación usando la cámara.")
            sys.exit(1)

    try:
        while True:
            # Esperar a que llegue un grupo de frames
            frames = pipeline.wait_for_frames()

            # Obtener los frames individuales
            depth_frame = frames.get_depth_frame()
            color_frame = frames.get_color_frame()
            
            accel_frame = None
            gyro_frame = None
            if has_imu:
                accel_frame = frames.first_or_default(rs.stream.accel)
                gyro_frame = frames.first_or_default(rs.stream.gyro)

            # 1. Procesar datos de Imagen y Profundidad
            if depth_frame and color_frame:
                # Obtener la distancia en metros al punto central de la pantalla
                width = color_frame.as_video_frame().get_width()
                height = color_frame.as_video_frame().get_height()
                dist_to_center = depth_frame.get_distance(int(width / 2), int(height / 2))
                
                print(f"[CÁMARA] Color: {width}x{height} | Distancia al centro: {dist_to_center:.3f} metros")

                # Si OpenCV está disponible, mostrar el vídeo
                if opencv_available:
                    # Convertir imágenes de RealSense a arrays de numpy para OpenCV
                    color_image = np.asanyarray(color_frame.get_data())
                    
                    # Convertir el mapa de profundidad en una representación de colores (para poder verlo)
                    depth_colorizer = rs.colorizer()
                    colorized_depth = depth_colorizer.colorize(depth_frame)
                    depth_image = np.asanyarray(colorized_depth.get_data())

                    # Concatenar ambas imágenes horizontalmente para mostrarlas en la misma ventana
                    images_combined = np.hstack((color_image, depth_image))

                    # Mostrar ventana interactiva
                    cv2.imshow('FRAMOS D435e - Color y Profundidad', images_combined)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break

            # 2. Procesar datos de la IMU (solo si está habilitada)
            if has_imu and accel_frame and gyro_frame:
                accel_data = accel_frame.as_motion_frame().get_motion_data()
                gyro_data = gyro_frame.as_motion_frame().get_motion_data()
                
                # CONFIGURACIÓN DE UMBRALES DE ESTABILIDAD
                # - umbral_giro (rad/s): Sensibilidad a la rotación. Menos es más estricto.
                # - umbral_accel (m/s^2): Sensibilidad a la traslación y vibración lineal.
                umbral_giro = 0.08
                umbral_accel = 0.20
                
                estable, g_mag, a_dev = evaluar_estabilidad(accel_data, gyro_data, umbral_giro, umbral_accel)
                
                # Colores ANSI para la consola (Verde = Estable, Rojo = Inestable)
                color_code = "\033[92m" if estable else "\033[91m"
                reset_code = "\033[0m"
                estado_texto = "ESTABLE" if estable else "INESTABLE"
                
                print(f"[IMU] {color_code}{estado_texto:<9}{reset_code} | "
                      f"Rotación: {g_mag:.3f} rad/s (Umbral: <{umbral_giro}) | "
                      f"Vibración: {a_dev:.3f} m/s^2 (Umbral: <{umbral_accel})")
            
            # Pequeño retardo para no saturar la consola en exceso
            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n[INFO] Deteniendo script...")

    finally:
        # 3. Detener la cámara y liberar recursos
        pipeline.stop()
        if opencv_available:
            cv2.destroyAllWindows()
        print("[INFO] Recursos liberados con éxito. ¡Adiós!")

if __name__ == "__main__":
    main()
