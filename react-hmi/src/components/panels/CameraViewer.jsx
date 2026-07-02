import React, { useState, useEffect } from 'react';

/**
 * CameraViewer - Componente independiente para visualizar la cámara FRAMOS D435e
 * y la estabilidad de su IMU en tiempo real.
 */
const CameraViewer = ({ stabilityThreshold, setStabilityThreshold }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState({
    stable: true,
    gyro_magnitude: 0.0,
    accel_deviation: 0.0,
    umbral_giro: 0.08,
    umbral_accel: 0.20,
    simulation_mode: true
  });

  // Polling de estado de estabilidad e IMU sólo si el visor está abierto
  useEffect(() => {
    if (!isOpen) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/camera/status');
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error('Error fetching camera status:', err);
      }
    };

    // Primer fetch inmediato
    fetchStatus();

    // Intervalo cada 250ms para lecturas fluidas de la IMU
    const interval = setInterval(fetchStatus, 250);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Manejo del slider de umbral de estabilidad
  const handleThresholdChange = async (e) => {
    const val = parseFloat(e.target.value);
    setStabilityThreshold(val);
    try {
      await fetch('http://localhost:5000/camera/threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ umbral_giro: val })
      });
    } catch (err) {
      console.error('Failed to update threshold:', err);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={styles.floatingOpenBtn}
        title="Mostrar visor de cámara"
      >
        📷
      </button>
    );
  }

  return (
    <div className="glass camera-viewer-widget" style={styles.widget}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ animation: 'pulse 1.5s infinite', color: '#ff9d00' }}>●</span>
          <span style={styles.title}>CÁMARA FRAMOS D435e</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>✕</button>
      </header>

      {/* Stream de Vídeo de Flask (MJPEG) */}
      <div style={styles.videoContainer}>
        <img
          src={`http://localhost:5000/camera/stream?t=${Date.now()}`}
          alt="FRAMOS Stream"
          style={styles.videoStream}
          onError={(e) => {
            // Reemplazo en caso de error de conexión
            e.target.src = 'https://placehold.co/640x480/1a1f2c/a2a8b4?text=Cámara+Desconectada';
          }}
        />
        {status.simulation_mode && (
          <span style={styles.simBadge}>SIMULADOR</span>
        )}
      </div>

      {/* Datos del Giroscopio y Estabilidad */}
      <div style={styles.statusPanel}>
        <div style={styles.statusRow}>
          <span style={styles.label}>ESTADO CÁMARA:</span>
          <span
            style={{
              ...styles.statusText,
              color: status.stable ? '#00ff88' : '#ff4b2b',
              textShadow: status.stable ? '0 0 8px rgba(0,255,136,0.3)' : '0 0 8px rgba(255,75,43,0.3)'
            }}
          >
            {status.stable ? 'ESTABLE' : 'INESTABLE (VIBRANDO)'}
          </span>
        </div>

        {/* Métrica de giro */}
        <div style={styles.imuMetric}>
          <div style={styles.metricHeader}>
            <span>Velocidad de Giro:</span>
            <span>{status.gyro_magnitude.toFixed(3)} rad/s</span>
          </div>
          <div style={styles.metricTrack}>
            <div
              style={{
                ...styles.metricBar,
                width: `${Math.min(100, (status.gyro_magnitude / (status.umbral_giro || 0.08)) * 100)}%`,
                backgroundColor: status.gyro_magnitude < status.umbral_giro ? '#00ff88' : '#ff4b2b'
              }}
            />
          </div>
        </div>

        {/* Umbral de estabilidad (Slider integrado en el visor) */}
        <div style={styles.thresholdControl}>
          <div style={styles.sliderHeader}>
            <span style={styles.label}>TOLERANCIA DE ESTABILIDAD</span>
            <span style={styles.sliderValue}>{stabilityThreshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.50"
            step="0.01"
            value={stabilityThreshold}
            onChange={handleThresholdChange}
            style={styles.rangeInput}
          />
          <div style={styles.sliderLabels}>
            <span>Estricto (0.01)</span>
            <span>Permisivo (0.50)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  floatingOpenBtn: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--border-glass)',
    boxShadow: 'var(--shadow-focus)',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'auto',
  },
  widget: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    width: '320px',
    borderRadius: '12px',
    zIndex: 101,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    pointerEvents: 'auto',
    border: '1px solid var(--border-glass)',
  },
  header: {
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    backgroundColor: 'rgba(14, 15, 20, 0.4)',
  },
  title: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--text-color)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-dim)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '2px',
    outline: 'none',
  },
  videoContainer: {
    width: '100%',
    height: '240px',
    position: 'relative',
    backgroundColor: '#000',
  },
  videoStream: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  simBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 210, 255, 0.85)',
    color: 'black',
    fontSize: '0.55rem',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  statusPanel: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(14, 15, 20, 0.65)',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.6rem',
    fontWeight: '700',
    color: 'var(--text-dim)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: '0.7rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
  },
  imuMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.65rem',
    color: 'var(--text-color)',
  },
  metricTrack: {
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  metricBar: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.15s ease-out',
  },
  thresholdControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '10px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: 'var(--accent-orange)',
    background: 'rgba(255, 157, 0, 0.12)',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  rangeInput: {
    width: '100%',
    accentColor: 'var(--accent-orange)',
    background: 'var(--slider-track-bg)',
    height: '8px',
    borderRadius: '4px',
    outline: 'none',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.55rem',
    color: 'var(--text-dim)',
  }
};

export default CameraViewer;
