# Módulo de Cámara FRAMOS D435e GigE (Python 3.12 - Windows x64)

Este directorio contiene el controlador autónomo e independiente para la cámara industrial **FRAMOS Depth Camera D435e**. Puedes copiar y pegar este directorio directamente en cualquier otro proyecto en el futuro para empezar a capturar imágenes, profundidad e IMU de inmediato.

## Contenido del Módulo

* `prueba_framos_imu.py`: Script de ejemplo en Python que demuestra cómo conectarse a la cámara, obtener datos en tiempo real de los sensores inerciales (IMU) y el vídeo (color y profundidad combinados).
* `pyrealsense2.cp312-win_amd64.pyd`: Enlace compilado en C++ para que **Python 3.12** se comunique con el SDK.
* `realsense2.dll`: Librería principal de RealSense modificada por FRAMOS para el backend de red.
* `CameraSuite.dll`: Librería de red GigE Vision de Framos.
* Archivos `*_MD_VC120_v3_0.dll` (6 DLLs): Dependencias del estándar industrial GenICam (GenApi, XmlParser, etc.).

---

## Cómo usarlo en otros proyectos

Si en un futuro quieres integrar el lector de cámara en tu propio script de Python (por ejemplo, `mi_script.py`) ubicado en otra carpeta:

1. **Copia esta carpeta entera** a tu proyecto.
2. En tu script de Python, antes de importar `pyrealsense2`, debes indicarle a Python dónde encontrar el `.pyd` y sus DLLs asociadas:

```python
import os
import sys

# Ruta a la carpeta "modulo_camara_framos" en tu nuevo proyecto
framos_module_path = os.path.abspath("./modulo_camara_framos")

# 1. Decirle a Python dónde buscar el archivo .pyd
if framos_module_path not in sys.path:
    sys.path.append(framos_module_path)

# 2. Decirle a Windows dónde buscar las DLLs asociadas (crítico en Python 3.8+)
if sys.platform == 'win32':
    os.add_dll_directory(framos_module_path)

# 3. Ya puedes importar la librería con total normalidad
import pyrealsense2 as rs
```

---

## Recordatorios de Red e IP (¡Por si cambia de ordenador!)

Si conectas la cámara a otro ordenador en el futuro, recuerda repasar estos 3 puntos clave:

1. **Configuración de la IP de la tarjeta de red (PC):**
   * Ve a las Propiedades del adaptador Ethernet en Windows y configúrale una **IP estática** en la misma subred que la cámara.
   * *Por ejemplo:* Si la cámara usa su IP por defecto (`10.0.100.10`), ponle al PC la IP `10.0.100.101` y máscara de subred `255.255.255.0`.

2. **Cortafuegos de Windows (Perfil de red Privado):**
   * Windows clasifica las conexiones directas por Ethernet a hardware como *"Red no identificada"* y las pone en perfil **Público** (lo que bloquea todo el tráfico UDP de la cámara).
   * Debes ir a *Configuración de Windows -> Red e Internet -> Ethernet*, hacer clic en la red y cambiar el perfil a **Privada** para autorizar el tráfico.

3. **Exclusividad del dispositivo (Bloqueos):**
   * Solo una aplicación puede conectarse a la cámara a la vez. Si `realsense-viewer.exe` o un script de Python previo colgado en segundo plano está en ejecución, la cámara devolverá errores del tipo `No device connected` o `Couldn't connect`. Asegúrate de cerrar todo antes de iniciar tu programa.
