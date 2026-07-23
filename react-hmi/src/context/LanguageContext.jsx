import React, { createContext, useContext, useState } from 'react';

const translations = {
  es: {
    // Header & Navigation
    app_title: "Estudio de Fotografía Automatizado",
    app_subtitle: "HMI Industrial UR3",
    general_view: "Vista General",
    general_view_subtitle: "Consola Central de Monitorización Multi-Estación",
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

    // Queue & Actions
    queue_header: "Cola de Ejecución",
    queue_empty: "Sin tareas en cola. Configura ejecuciones para empezar.",
    add_execution: "Añadir",
    play: "▶ Ejecutar",
    pause: "❚❚ Pausar",
    rearm: "🔄 Rearmar",
    speed: "Velocidad",
    robot_ip: "Dirección IP del Robot",

    // Fibonacci & 3D
    calculating_points: "Calculando puntos Fibonacci...",
    points_calculated: "Puntos calculados",

    // Presets & Models
    preset_name: "Nombre del Preset",
    save_preset: "Guardar Preset",
    new_preset: "Nuevo Preset",
    object_model: "Modelo del Objeto 3D",
    object_scale: "Escala del Objeto",
    shoe_model: "Zapato (zapato.glb)",
    bag_model: "Bolsito (bolsito.glb)",

    // Camera & IMU
    camera_connected: "Cámara Conectada",
    camera_disconnected: "Cámara Desconectada",
    stability_threshold: "Tolerancia IMU (Giroscopio)",

    // Auth & Modals
    anonymous_user: "Usuario Anónimo",
    login_change_role: "Iniciar Sesión / Cambiar Rol",
    simulate_alert: "Simular Alerta",
    warning_stop_banner: "🔍 Inspección previa completada (4 fotos en Gajo 1 - Warning Stop)",
    warning_stop_banner_sub: "Pulsa ▶ PLAY de nuevo para ejecutar la captura completa de fotos.",
  },
  en: {
    // Header & Navigation
    app_title: "Automated Photography Studio",
    app_subtitle: "Industrial UR3 HMI Dashboard",
    general_view: "General View",
    general_view_subtitle: "Central Multi-Station Monitoring Console",
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

    // Queue & Actions
    queue_header: "Execution Queue",
    queue_empty: "No tasks in queue. Configure executions to start.",
    add_execution: "Add",
    play: "▶ Play",
    pause: "❚❚ Pause",
    rearm: "🔄 Rearm",
    speed: "Speed",
    robot_ip: "Robot IP Address",

    // Fibonacci & 3D
    calculating_points: "Calculating Fibonacci points...",
    points_calculated: "Points calculated",

    // Presets & Models
    preset_name: "Preset Name",
    save_preset: "Save Preset",
    new_preset: "New Preset",
    object_model: "3D Object Model",
    object_scale: "Object Scale",
    shoe_model: "Shoe (zapato.glb)",
    bag_model: "Handbag (bolsito.glb)",

    // Camera & IMU
    camera_connected: "Camera Connected",
    camera_disconnected: "Camera Disconnected",
    stability_threshold: "IMU Tolerance (Gyroscope)",

    // Auth & Modals
    anonymous_user: "Anonymous User",
    login_change_role: "Log In / Change Role",
    simulate_alert: "Simulate Alert",
    warning_stop_banner: "🔍 Pre-inspection completed (4 photos in Sector 1 - Warning Stop)",
    warning_stop_banner_sub: "Press ▶ PLAY again to run the full photo capture sequence.",
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
