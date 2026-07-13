# Guía de Puesta en Marcha: Cámara Industrial FRAMOS D435e en Python

Esta guía detalla el proceso completo paso a paso para poner en marcha la cámara de profundidad **FRAMOS D435e** (GigE Vision) en cualquier ordenador con Windows, utilizando el módulo de Python 3.12 autónomo que hemos estructurado.

---

## 📋 Requisitos Previos

### 1. Requisitos de Hardware
* Cámara industrial **FRAMOS D435e**.
* Inyector PoE (Power over Ethernet) o Switch PoE activo.
* Cable Ethernet (categoría 5e o superior) y cable de alimentación del inyector.
* Ordenador con puerto Ethernet RJ45.

### 2. Requisitos de Software
* **Sistema Operativo:** Windows 10 u 11 (64-bit).
* **Python:** Versión **3.12 (64-bit)** estrictamente.
  > [!IMPORTANT]
  > El wrapper binario `pyrealsense2.cp312-win_amd64.pyd` que compilamos está enlazado directamente a la arquitectura de Python 3.12 de 64 bits. No funcionará en otras versiones de Python (como 3.10 o 3.11) ni en Python de 32 bits.
* **Librerías de Python:**
  Abre una terminal y asegúrate de tener instaladas las dependencias de procesado e imagen ejecutando:
  ```powershell
  pip install numpy opencv-python
  ```

---

## 🔌 Paso 1: Conexión Física de la Cámara

1. Conecta el cable Ethernet de la cámara al puerto **Data+Power** (PoE Out) de tu inyector PoE o switch PoE.
2. Conecta otro cable Ethernet desde el puerto **Data** (LAN) del inyector PoE al puerto Ethernet de tu ordenador.
3. Conecta el inyector PoE a la corriente eléctrica.
4. Observa el LED trasero de la cámara. Parpadeará brevemente y se quedará fijo (indica que la cámara tiene energía y ha arrancado su sistema operativo interno de red).

---

## 🌐 Paso 2: Configuración de Red en Windows

Las cámaras de red GigE Vision necesitan estar en la misma subred IP que el adaptador Ethernet del PC para poder comunicarse.

### 1. Configurar IP Estática en el PC
1. Pulsa `Windows + R`, escribe `ncpa.cpl` y pulsa Enter para abrir las **Conexiones de red**.
2. Haz clic derecho sobre tu adaptador de red **Ethernet** (donde está conectada la cámara) y selecciona **Propiedades**.
3. Haz doble clic en **Protocolo de Internet versión 4 (TCP/IPv4)**.
4. Selecciona **Usar la siguiente dirección IP** e introduce los siguientes valores:
   * **Dirección IP:** `10.0.100.101` (o cualquier IP en el rango `10.0.100.2` a `10.0.100.254`, excepto la de la cámara).
   * **Máscara de subred:** `255.255.255.0`
   * *La puerta de enlace y los DNS se pueden dejar en blanco.*
5. Haz clic en **Aceptar** para guardar los cambios.

> [!NOTE]
> Esta configuración asume que tu cámara FRAMOS D435e se encuentra con su IP por defecto de fábrica, que es la `10.0.100.10`.

### 🔍 ¿Qué pasa si no conoces la IP de la cámara o fue modificada?

Si la cámara ha sido utilizada en otros proyectos y no sabes qué IP tiene asignada, **no te preocupes**. Las cámaras GigE Vision admiten descubrimiento por broadcast (difusión física) a bajo nivel, lo que permite detectarlas e interactuar con ellas sin importar su dirección IP.

Para descubrir y reconfigurar la IP de la cámara, utiliza la herramienta oficial **`ConfigureIP.exe`** que se encuentra en la carpeta del SDK de FRAMOS:

1. **Localiza la herramienta:**
   Normalmente instalada en: `C:\Program Files\FRAMOS\CameraSuite\tools\ConfigureIP.exe` (o dentro de la subcarpeta `tools` de tu descarga original de FRAMOS).
2. **Ejecuta `ConfigureIP.exe`:**
   Al abrirse, la herramienta escaneará físicamente tu tarjeta de red Ethernet mediante paquetes de broadcast (capa 2) y listará todas las cámaras conectadas, mostrando su **Dirección MAC** y su **IP actual**.
3. **Comprobar el estado de conexión:**
   * Si la herramienta te muestra la cámara en **Rojo** (`Connectable: No`), significa que la IP actual de la cámara está en una subred diferente a la de tu PC.
   * Si se muestra en **Verde** (`Connectable: Yes`), está lista para usarse.
4. **Asignar una nueva IP a la cámara:**
   * Haz doble clic sobre la cámara en la lista (o selecciónala y haz clic en *Configure*).
   * En la configuración de IP, introduce una dirección IP compatible con tu subred (por ejemplo, si configuraste tu PC en `192.168.1.10`, asígnale a la cámara la IP `192.168.1.50`).
   * **¿Temporal o Persistente?:** 
     * **Temporal:** La cámara usará esa IP hasta que se apague o se desconecte la corriente. Muy útil para pruebas rápidas de laboratorio sin alterar la configuración del equipo.
     * **Persistente (Recomendado para producción):** Guarda la IP de forma permanente en la memoria flash de la cámara. Sobrevivirá a los reinicios.
   * Haz clic en **Apply/Save**. La cámara se reiniciará en unos segundos con su nueva dirección IP asignada y el indicador cambiará a **Verde** (`Connectable: Yes`).

---

### 2. Cambiar el Perfil de Red a "Privado" (Paso Crítico)
Por defecto, Windows clasifica la red de la cámara como una *"Red no identificada"* y la asigna al perfil **Público**, bloqueando la comunicación de entrada de vídeo UDP.
1. Abre la **Configuración de Windows** (`Windows + I`).
2. Ve a **Red e Internet** -> **Ethernet**.
3. Haz clic sobre la conexión de tu cámara y cambia el tipo de perfil de red a **Privado**.
   
*(Alternativa rápida: Abre PowerShell como Administrador y ejecuta: `Set-NetConnectionProfile -Name "Red no identificada" -NetworkCategory Private`)*.

---

## 🛡️ Paso 3: Configuración del Firewall de Windows

El Firewall de Windows bloquea las transmisiones UDP entrantes de cámaras de red para aplicaciones personalizadas como Python. Debes añadir una excepción para que Python pueda recibir los datos.

1. Abre **PowerShell como Administrador** (pulsa la tecla Windows, escribe `PowerShell`, haz clic derecho y selecciona *Ejecutar como administrador*).
2. Pega y ejecuta el siguiente comando para permitir el tráfico en tu versión de Python 3.12:
   ```powershell
   New-NetFirewallRule -DisplayName "Permitir Python Practicas" -Direction Inbound -Program "C:\Program Files\Python312\python.exe" -Action Allow -Profile Any
   ```

---

## 🚀 Paso 4: Ejecución y Prueba de Funcionamiento

Una vez configurada la red y el firewall:

1. Asegúrate de que **ningún otro programa** (como `realsense-viewer.exe`) esté usando la cámara. Las cámaras GigE solo admiten una conexión activa en exclusiva.
2. Abre tu terminal de comandos en VS Code o PowerShell.
3. Desplázate al directorio del módulo:
   ```powershell
   cd "C:\Users\FA507\Documents\UNI\PracticasCFZ\FRAMOS\modulo_camara_framos"
   ```
4. Ejecuta el script de prueba:
   ```powershell
   python prueba_framos_imu.py
   ```

### Resultados esperados en consola:
El script detectará la cámara, interrogará sus perfiles físicos de la IMU y configurará de forma óptima el pipeline (acelerómetro a 250 Hz, giroscopio a 200 Hz). La consola empezará a imprimir las lecturas estables e inestables según muevas la cámara:

```text
[INFO] Buscando dispositivos en la red...
[INFO] Dispositivos detectados en el sistema: 1
  -> Dispositivo [0]: FRAMOS D435e | S/N: 6CD146032D69
  [IMU PROFILE] Tipo: stream.accel | Formato: format.motion_xyz32f | Frecuencia: 250 Hz
  ...
[INFO] ¿La cámara soporta IMU física detectada?: SÍ
[INFO] Configurando streams de la cámara...
[INFO] Habilitando flujos de acelerómetro (250 Hz) y giroscopio (200 Hz)...
[INFO] Intentando abrir la transmisión del pipeline (con IMU)...
[INFO] Transmisión iniciada correctamente.

[CÁMARA] Color: 640x480 | Distancia al centro: 0.301 metros
[IMU] ESTABLE   | Rotación: 0.005 rad/s (Umbral: <0.08) | Vibración: 0.043 m/s^2 (Umbral: <0.20)
[CÁMARA] Color: 640x480 | Distancia al centro: 0.301 metros
[IMU] ESTABLE   | Rotación: 0.006 rad/s (Umbral: <0.08) | Vibración: 0.038 m/s^2 (Umbral: <0.20)
```

*Si tienes OpenCV instalado, se abrirá una ventana de vídeo combinando la imagen de color a la izquierda y el mapa térmico de profundidad a la derecha. Pulsa la tecla `q` sobre la ventana o `Ctrl + C` en la consola para detener el script.*

---

## 🛠️ Paso 5: Cómo Integrar este Módulo en Otro Proyecto

Para usar este controlador de cámara en un proyecto de software diferente en el futuro, no necesitas instalar nada en el sistema:

1. **Copia la carpeta entera `modulo_camara_framos`** a la raíz de tu nuevo proyecto.
2. En tu nuevo código Python (por ejemplo, `controlador_robot.py`), escribe lo siguiente al inicio de tu archivo para que Python reconozca las librerías dinámicas y el wrapper `.pyd`:

```python
import os
import sys

# 1. Obtener la ruta absoluta del módulo copiado
framos_module_path = os.path.abspath("./modulo_camara_framos")

# 2. Agregar la carpeta al PATH de importaciones de Python (para encontrar pyrealsense2)
if framos_module_path not in sys.path:
    sys.path.append(framos_module_path)

# 3. Registrar el directorio de DLLs en Windows (crítico para cargar realsense2.dll y CameraSuite.dll)
if sys.platform == 'win32':
    try:
        os.add_dll_directory(framos_module_path)
    except AttributeError:
        # Fallback para sistemas o versiones muy antiguas
        os.environ['PATH'] = framos_module_path + os.pathsep + os.environ['PATH']

# 4. Ahora puedes importar realsense de forma directa y limpia
import pyrealsense2 as rs

# --- Tu lógica de control empieza aquí ---
```

---

## 🔍 Solución de Problemas Comunes

### 1. Error: `No device connected` o `Couldn't resolve requests`
* **Causa A:** Has dejado el visor `realsense-viewer.exe` abierto en segundo plano. Ciérralo del todo.
* **Causa B:** La tarjeta de red no está configurada como **Privada**. Vuelve a realizar el paso 2 de la sección de red.
* **Causa C:** La dirección IP de la tarjeta de red de tu PC no está en el mismo rango de la cámara (por ejemplo, tu tarjeta tiene DHCP y está en el rango `169.254.X.X`). Revisa el paso 1 de red.

### 2. Error: `DLL load failed: No se puede encontrar el módulo especificado`
* **Causa A:** Estás usando una versión de Python diferente a la **3.12 (64-bit)**. Ejecuta `python --version` en tu terminal para verificar que estás usando la versión correcta.
* **Causa B:** Has movido el archivo `.pyd` a otro lado pero te has olvidado de copiar las DLLs asociadas. Todos los archivos `.dll` y el archivo `.pyd` deben estar siempre en la misma carpeta.
