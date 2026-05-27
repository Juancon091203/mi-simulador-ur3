# Guía de Puesta en Marcha (UR3 Web-HMI)

Este documento explica de forma rápida cómo iniciar y poner en marcha el proyecto UR3 Web-HMI en tu máquina Windows.

El proyecto consta de:
1.  **Frontend (React):** Interfaz HMI interactiva en 3D disponible en el puerto **`3001`**.
2.  **Backend (Flask):** Servidor API Python para comunicación RTDE con el robot en el puerto **`5000`**.
3.  **Simulador (URSim):** Simulador oficial de Universal Robots corriendo en Docker.

---

## 🚀 Método A: Con Docker (Recomendado)

Este método levanta todos los componentes automáticamente utilizando contenedores aislados.

### Requisitos previos:
*   Tener instalado y abierto **Docker Desktop**.
*   Asegurarse de que el motor de Docker esté activo (icono verde abajo a la izquierda en Docker Desktop: *Engine running*).

### Instrucciones de inicio:
1.  Abre una terminal en la raíz del proyecto.
2.  Ejecuta el siguiente comando para compilar y levantar los contenedores:
    ```bash
    docker compose up --build
    ```
3.  Una vez completado el proceso, abre tu navegador e ingresa a:
    *   **Interfaz HMI (React):** [http://localhost:3001](http://localhost:3001)
    *   **Simulador del Robot (VNC/URSim):** [http://localhost:6080](http://localhost:6080) (si quieres ver la pantalla del teach pendant del robot simulado).

---

## 💻 Método B: De forma Local (Sin Docker)

Si prefieres no usar Docker, puedes ejecutar los servicios nativamente en tu sistema operativo Windows.

### Requisitos previos:
*   Tener instalado **Node.js** (versión 18 o superior).
*   Tener instalado **Python 3.10** (o versión compatible) con `pip`.

### Paso 1: Iniciar el Frontend (React)
1.  Abre una terminal en la carpeta raíz del proyecto.
2.  Navega a la carpeta de React:
    ```powershell
    cd react-hmi
    ```
3.  Instala las dependencias (solo la primera vez):
    ```powershell
    npm install
    ```
4.  Inicia el servidor de desarrollo de Vite:
    ```powershell
    npm run dev
    ```
5.  Accede a la interfaz en: [http://localhost:3001](http://localhost:3001).

### Paso 2: Iniciar el Backend (Flask)
1.  Abre **otra terminal diferente** en la carpeta raíz del proyecto.
2.  Navega a la carpeta del servidor de Flask:
    ```powershell
    cd flask-server
    ```
3.  Instala las librerías necesarias de Python (solo la primera vez):
    ```powershell
    pip install Flask flask-cors ur-rtde
    ```
4.  Inicia el servidor backend:
    ```powershell
    python app.py
    ```
5.  El backend estará escuchando comandos en [http://localhost:5000](http://localhost:5000).

---

## 🛠️ Resolución de Problemas Comunes

### 1. Error: "failed to connect to the docker API... The system cannot find the file specified"
*   **Causa:** Docker Desktop no está iniciado o se está encendiendo todavía.
*   **Solución:** Abre la aplicación **Docker Desktop** en Windows, espera a que el icono de estado se ponga verde e inténtalo de nuevo.

### 2. Error al instalar `ur-rtde` en Windows
*   **Causa:** La librería `ur_rtde` compila código C++ y puede fallar en Windows si no tienes instaladas las herramientas de compilación de Visual Studio C++.
*   **Solución:** Si tienes problemas compilando esta librería localmente, utiliza el **Método A (con Docker)** ya que el contenedor ya incluye la compilación limpia de la librería sobre Linux.
