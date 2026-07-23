import React, { createContext, useContext, useState } from 'react';

const translations = {
  es: {
    // Header & Navigation
    app_title: "Estudio de Fotografía Automatizado",
    app_subtitle: "",
    general_view: "Vista General",
    general_view_subtitle: "",
    active_station_label: "Estación Activa / Área",
    general_view_option: "🌐 Vista General (4 Estaciones)",
    back_to_stations: "← Volver a Estaciones",
    dashboard_3d: "🖥️ Dashboard (3D)",
    vnc_viewer: "🎮 Visor VNC (TeachPendant)",
    camera_2d: "📷 Cámara (2D)",
    station_settings: "⚙️ Ajustes de Estación",
    presets_calibration: "📐 Presets (Calibración 3D)",

    // Statuses
    status_idle: "INACTIVO",
    status_running: "EJECUTANDO",
    status_warning: "PARADA ADVERTENCIA",
    status_emergency: "EMERGENCIA",
    status_off: "APAGADO",

    // General Overview Station Cards
    station_name: "Estación",
    active_product: "PRODUCTO ACTIVO",
    robot_speed: "VELOCIDAD ROBOT",
    configure_station: "Configurar Estación",
    none: "Ninguno",
    inactive: "Inactivo",
    running_shoes: "Zapatillas de Deporte",
    sunglasses: "Gafas de Sol",
    wristwatch: "Reloj de Pulsera",

    // Actions & Prompts
    add_execution: "Añadir Ejecución",
    play: "▶ Ejecutar",
    pause: "❚❚ Pausar",
    rearm: "🔄 Rearmar",
    speed: "Velocidad",
    robot_ip: "Dirección IP del Robot",
    repeat_execution: "Repetir Ejecución",
    finish_execution: "Finalizar",
    execution_completed: "Ejecución Completada",
    execution_completed_prompt: "¿Deseas repetir la misma ejecución o finalizar?",

    // Configure Execution Modal
    configure_execution_title: "Configurar Ejecución de Estación",
    tab_basic_info: "INFORMACIÓN BÁSICA",
    tab_camera: "CÁMARA",
    tab_station: "ESTACIÓN",
    scanning_preset: "PRESET DE ESCANEO",
    no_preset_selected: "— Ningún preset seleccionado —",
    new_preset_btn: "➕ Nuevo Preset",
    product_name: "NOMBRE DEL PRODUCTO",
    product_name_placeholder: "ej. Sandalia de cuero",
    storage_location: "UBICACIÓN DE ALMACENAMIENTO",
    local_path: "RUTA LOCAL",
    photo_save_path: "RUTA DE GUARDADO DE FOTOS",
    robot_speed_ms: "VELOCIDAD DEL ROBOT (M/S)",
    cancel: "Cancelar",
    next_tab: "Siguiente →",
    save_changes: "Guardar Cambios",
    select_target_station: "SELECCIONAR ESTACIÓN DESTINO",
    select_a_station: "Selecciona una estación...",
    enable_auto_exposure: "Habilitar Exposición Automática",
    shutter_speed_ms: "Tiempo de Obturación (ms)",
    sensor_gain: "Ganancia del Sensor",

    // Photo Album Modal & Cards
    photo_album: "ÁLBUM DE FOTOS",
    photos_recorded_by_system: "FOTOS REGISTRADAS POR EL SISTEMA",
    photos: "FOTOS",
    clear_album: "Vaciar Álbum",
    empty_album: "Álbum Vacío",
    step: "Paso",
    photo: "Foto",
    enlarge: "Ampliar",
    of: "de",
    close: "Cerrar",

    // Camera 2D View Sensor Settings
    auto_exposure: "EXPOSICIÓN AUTOMÁTICA",
    enabled: "Habilitado",
    exposure_time: "TIEMPO DE EXPOSICIÓN (MS)",
    gain: "GANANCIA",

    // Fibonacci & 3D Calibration Panel
    calculating_points: "Calculando puntos Fibonacci...",
    points_calculated: "Puntos calculados",
    pre_inspection_points: "Puntos de Pre-inspección (4 Puntos)",
    select_4_points_mode: "🎯 Seleccionar Puntos 3D",
    finish_selection: "✓ Finalizar Selección",
    clear_selection: "🧹 Limpiar",
    spheroid_size: "Tamaño del Esferoide (m)",
    object_center: "Centro del Objeto (m)",
    z_bounds: "Límites Z (Filtro Vertical)",
    point_count: "Número de Puntos",
    object_model: "Modelo del Objeto 3D",
    object_scale: "Escala del Objeto",
    shoe_model: "Zapato (zapato.glb)",
    bag_model: "Bolsito (bolsito.glb)",
    upload_glb_model: "➕ Añadir Modelo (.glb)",
    show_spheroid_points: "Mostrar Puntos Esferoide",
    show_sector_planes: "Mostrar Planos de Gajos",
    orbit_radius: "Radio de Órbita",
    column_height: "Altura de Columna",

    // Presets Panel Controls
    back_to_presets_list: "← Volver a Lista de Presets",
    create_new_preset_title: "CREAR NUEVO PRESET",
    edit_preset_title: "EDITAR PRESET",
    preset_name_placeholder: "Escribe el nombre del preset...",
    model_scale_factor: "Factor de Escala del Modelo",
    center_height_z: "Altura del Centro (Z)",
    fibonacci_points: "Puntos Fibonacci",
    robot_orbit_radius: "Radio Órbita Robot",
    robot_base_height: "Altura Base Robot",
    show_advanced_options: "Mostrar Opciones Avanzadas (XYZ, Cortes) ▼",
    hide_advanced_options: "Ocultar Opciones Avanzadas ▲",

    // Presets Management Cards
    search_presets_placeholder: "🔍 Buscar presets por nombre...",
    model_3d: "Modelo 3D",
    model_scale: "Escala del Modelo",
    spheroid_size_card: "Tamaño Esferoide",

    // Photo Simulation Panel & Camera / IMU
    photo_simulation_title: "Simulación de Captura de Fotos",
    prev: "◄ ANTERIOR",
    next: "SIGUIENTE ►",
    view_captures: "📁 ABRIR CARPETA DE FOTOS",
    vibration_tolerances: "TOLERANCIAS DE VIBRACIÓN (IMU)",
    gyro_threshold: "Umbral Giroscopio (rad/s)",
    camera_connected: "Cámara Conectada",
    camera_disconnected: "Cámara Desconectada",
    imu_status: "ESTADO DEL IMU:",
    imu_stable: "ESTABLE",
    rotation_speed: "Velocidad de Rotación:",
    vibration_tolerance_imu: "TOLERANCIA DE VIBRACIÓN (IMU)",
    strict: "Estricto",
    permissive: "Permisivo",

    // Presets Management View
    presets_title: "Gestión de Presets de Escaneo",
    create_preset: "➕ Crear Nuevo Preset",
    edit: "Editar",
    delete: "Eliminar",
    apply: "Aplicar",
    save_preset: "Guardar Preset",
    new_preset: "Nuevo Preset",
    back_to_presets: "← Volver a Presets",

    // Station Settings & Config
    storage_settings: "Ajustes de Almacenamiento",
    station_telemetry: "Telemetría de la Estación",
    save_directory: "Directorio de Guardado",
    auto_export_pdf: "Auto-Exportar Informe PDF",

    // VNC & Camera Views
    vnc_title: "🎮 Control Remoto UR3 TeachPendant (VNC)",
    live_stream_connected: "● Streaming en Directo Conectado",
    camera_viewport: "📷 VISTA DE CÁMARA 2D",

    // Auth & Developer Unlock
    anonymous_user: "Operador Estándar",
    developer_user: "Desarrollador",
    login_change_role: "Desbloquear Desarrollador",
    simulate_alert: "Simular Alerta",
    warning_stop_banner: "🔍 Inspección previa completada (4 fotos en Gajo 1 - Warning Stop)",
    warning_stop_banner_sub: "Pulsa ▶ PLAY de nuevo para ejecutar la captura completa de fotos.",

    dev_unlock_title: "Desbloquear Funciones de Desarrollador",
    dev_unlock_subtitle: "Accede como Desarrollador para desbloquear opciones de control avanzado de las estaciones.",
    username_optional: "Usuario (opcional)",
    username_placeholder: "ej. desarrollador",
    password_optional: "Contraseña (opcional)",
    password_placeholder: "••••••••",
    unlock_developer: "🔓 DESBLOQUEAR DESARROLLADOR",
    developer_mode_active: "Modo Desarrollador Activo",
    lock_developer: "🔒 BLOQUEAR MODO DESARROLLADOR",
  },
  en: {
    // Header & Navigation
    app_title: "Automated Photography Studio",
    app_subtitle: "",
    general_view: "General View",
    general_view_subtitle: "",
    active_station_label: "Active Station / Area",
    general_view_option: "🌐 General View (4 Stations)",
    back_to_stations: "← Back to Stations",
    dashboard_3d: "🖥️ Dashboard (3D)",
    vnc_viewer: "🎮 VNC Viewer (TeachPendant)",
    camera_2d: "📷 Camera (2D)",
    station_settings: "⚙️ Station Settings",
    presets_calibration: "📐 Presets (3D Calibration)",

    // Statuses
    status_idle: "IDLE",
    status_running: "RUNNING",
    status_warning: "WARNING STOP",
    status_emergency: "EMERGENCY",
    status_off: "OFF",

    // General Overview Station Cards
    station_name: "Station",
    active_product: "ACTIVE PRODUCT",
    robot_speed: "ROBOT SPEED",
    configure_station: "Configure Station",
    none: "None",
    inactive: "Inactive",
    running_shoes: "Running Shoes",
    sunglasses: "Sunglasses",
    wristwatch: "Wristwatch",

    // Actions & Prompts
    add_execution: "Add Execution",
    play: "▶ Play",
    pause: "❚❚ Pause",
    rearm: "🔄 Rearm",
    speed: "Speed",
    robot_ip: "Robot IP Address",
    repeat_execution: "Repeat Execution",
    finish_execution: "Finish",
    execution_completed: "Execution Completed",
    execution_completed_prompt: "Do you want to repeat the same execution or finish?",

    // Configure Execution Modal
    configure_execution_title: "Configure Station Execution",
    tab_basic_info: "BASIC INFO",
    tab_camera: "CAMERA",
    tab_station: "STATION",
    scanning_preset: "SCANNING PRESET",
    no_preset_selected: "— No preset selected —",
    new_preset_btn: "➕ New Preset",
    product_name: "PRODUCT NAME",
    product_name_placeholder: "e.g. Leather kitten-heel sandal",
    storage_location: "STORAGE LOCATION",
    local_path: "LOCAL PATH",
    photo_save_path: "PHOTO SAVE PATH",
    robot_speed_ms: "ROBOT SPEED (M/S)",
    cancel: "Cancel",
    next_tab: "Next →",
    save_changes: "Save Changes",
    select_target_station: "SELECT TARGET STATION",
    select_a_station: "Select a station...",
    enable_auto_exposure: "Enable Auto Exposure",
    shutter_speed_ms: "Shutter Speed (ms)",
    sensor_gain: "Sensor Gain",

    // Photo Album Modal & Cards
    photo_album: "PHOTO ALBUM",
    photos_recorded_by_system: "PHOTOS RECORDED BY THE SYSTEM",
    photos: "PHOTOS",
    clear_album: "Clear Album",
    empty_album: "Empty Album",
    step: "Step",
    photo: "Photo",
    enlarge: "Enlarge",
    of: "of",
    close: "Close",

    // Camera 2D View Sensor Settings
    auto_exposure: "AUTO EXPOSURE",
    enabled: "Enabled",
    exposure_time: "EXPOSURE TIME (MS)",
    gain: "GAIN",

    // Fibonacci & 3D Calibration Panel
    calculating_points: "Calculating Fibonacci points...",
    points_calculated: "Points calculated",
    pre_inspection_points: "Pre-inspection Points (4 Points)",
    select_4_points_mode: "🎯 Select 3D Points",
    finish_selection: "✓ Finish Selection",
    clear_selection: "🧹 Clear",
    spheroid_size: "Spheroid Size (m)",
    object_center: "Object Center (m)",
    z_bounds: "Z Bounds (Vertical Cut)",
    point_count: "Point Count",
    object_model: "3D Object Model",
    object_scale: "Object Scale",
    shoe_model: "Shoe (zapato.glb)",
    bag_model: "Handbag (bolsito.glb)",
    upload_glb_model: "➕ Add Model (.glb)",
    show_spheroid_points: "Show Spheroid Points",
    show_sector_planes: "Show Sector Planes",
    orbit_radius: "Orbit Radius",
    column_height: "Column Height",

    // Presets Panel Controls
    back_to_presets_list: "← Back to Presets List",
    create_new_preset_title: "CREATE NEW PRESET",
    edit_preset_title: "EDIT PRESET",
    preset_name_placeholder: "Enter preset name...",
    model_scale_factor: "Model Scale Factor",
    center_height_z: "Center Height (Z)",
    fibonacci_points: "Fibonacci Points",
    robot_orbit_radius: "Robot Orbit Radius",
    robot_base_height: "Robot Base Height",
    show_advanced_options: "Show Advanced Options (XYZ, Cuts) ▼",
    hide_advanced_options: "Hide Advanced Options ▲",

    // Presets Management Cards
    search_presets_placeholder: "🔍 Search presets by name...",
    model_3d: "3D Model",
    model_scale: "Model Scale",
    spheroid_size_card: "Spheroid Size",

    // Photo Simulation Panel & Camera / IMU
    photo_simulation_title: "Photo Capture Simulation",
    prev: "◄ PREV",
    next: "NEXT ►",
    view_captures: "📁 OPEN PHOTOS FOLDER",
    vibration_tolerances: "VIBRATION TOLERANCES (IMU)",
    gyro_threshold: "Gyro Threshold (rad/s)",
    camera_connected: "Camera Connected",
    camera_disconnected: "Camera Disconnected",
    imu_status: "IMU STATUS:",
    imu_stable: "STABLE",
    rotation_speed: "Rotation Speed:",
    vibration_tolerance_imu: "VIBRATION TOLERANCE (IMU)",
    strict: "Strict",
    permissive: "Permissive",

    // Presets Management View
    presets_title: "Scanning Presets Management",
    create_preset: "➕ Create New Preset",
    edit: "Edit",
    delete: "Delete",
    apply: "Apply",
    save_preset: "Save Preset",
    new_preset: "New Preset",
    back_to_presets: "← Back to Presets",

    // Station Settings & Config
    storage_settings: "Storage Settings",
    station_telemetry: "Station Telemetry",
    save_directory: "Save Directory",
    auto_export_pdf: "Auto-Export PDF Report",

    // VNC & Camera Views
    vnc_title: "🎮 UR3 TeachPendant Remote Control (VNC)",
    live_stream_connected: "● Live Stream Connected",
    camera_viewport: "📷 2D CAMERA VIEWPORT",

    // Auth & Developer Unlock
    anonymous_user: "Standard Operator",
    developer_user: "Developer",
    login_change_role: "Unlock Developer",
    simulate_alert: "Simulate Alert",
    warning_stop_banner: "🔍 Pre-inspection completed (4 photos in Sector 1 - Warning Stop)",
    warning_stop_banner_sub: "Press ▶ PLAY again to run the full photo capture sequence.",

    dev_unlock_title: "Unlock Developer Features",
    dev_unlock_subtitle: "Access developer mode to manage advanced station control settings.",
    username_optional: "Username (optional)",
    username_placeholder: "e.g. developer",
    password_optional: "Password (optional)",
    password_placeholder: "••••••••",
    unlock_developer: "🔓 UNLOCK DEVELOPER",
    developer_mode_active: "Developer Mode Active",
    lock_developer: "🔒 LOCK DEVELOPER MODE",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('es'); // Español por defecto

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'es' ? 'en' : 'es'));
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['es']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
