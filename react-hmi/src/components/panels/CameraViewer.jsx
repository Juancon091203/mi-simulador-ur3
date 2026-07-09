import React, { useState, useEffect } from 'react';

/**
 * CameraViewer - Componente para visualizar la cámara FRAMOS D435e
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
    camera_connected: false
  });

  // Polling periódico para verificar la conexión de la cámara (tanto abierta como cerrada)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/camera/status');
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error('Error fetching camera status:', err);
        setStatus((prev) => ({ ...prev, camera_connected: false }));
      }
    };

    // Consultar inmediatamente
    fetchStatus();

    // Intervalo de polling:
    // - Si está abierto, consultamos rápido (250ms) para refrescar la IMU en tiempo real.
    // - Si está cerrado, consultamos lento (3000ms) solo para monitorizar si se conecta/desconecta.
    const intervalTime = isOpen ? 250 : 3000;
    const interval = setInterval(fetchStatus, intervalTime);

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

  const isConnected = status.camera_connected;

  if (!isOpen) {
    return (
      <div style={styles.floatingWrapper} className="camera-tooltip-container">
        <button
          onClick={() => isConnected && setIsOpen(true)}
          disabled={!isConnected}
          style={{
            ...styles.floatingOpenBtn,
            opacity: isConnected ? 1 : 0.5,
            cursor: isConnected ? 'pointer' : 'not-allowed',
            filter: isConnected ? 'none' : 'grayscale(100%)',
          }}
        >
          📷
        </button>
        {!isConnected && (
          <span className="camera-tooltip" style={styles.tooltipText}>
            Camera offline
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="glass camera-viewer-widget" style={styles.widget}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ animation: 'pulse 1.5s infinite', color: '#ff9d00' }}>●</span>
          <span style={styles.title}>CAMERA VIEWPORT</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>✕</button>
      </header>

      {/* Stream de Vídeo de Flask (MJPEG) con retícula CSS súper fina */}
      <div style={styles.videoContainer}>
        {isConnected ? (
          <img
            src={`http://localhost:5000/camera/stream?t=${Date.now()}`}
            alt="FRAMOS Stream"
            style={styles.videoStream}
            onError={(e) => {
              e.target.src = 'https://placehold.co/640x480/1a1f2c/a2a8b4?text=Stream+Error';
            }}
          />
        ) : (
          <div style={styles.noCameraView}>
            <span>Camera Disconnected</span>
          </div>
        )}

        {/* Retícula (rejilla) central fija y muy fina */}
        {isConnected && (
          <div style={styles.reticleContainer}>
            {/* Círculo central */}
            <div style={styles.reticleCircle} />
            {/* Eje horizontal */}
            <div style={styles.reticleHorizontal} />
            {/* Eje vertical */}
            <div style={styles.reticleVertical} />
          </div>
        )}
      </div>

      {/* Datos del Giroscopio y Estabilidad */}
      <div style={styles.statusPanel}>
        <div style={styles.statusRow}>
          <span style={styles.label}>CAMERA STATUS:</span>
          <span
            style={{
              ...styles.statusText,
              color: status.stable ? '#00ff88' : '#ff4b2b',
              textShadow: status.stable ? '0 0 8px rgba(0,255,136,0.3)' : '0 0 8px rgba(255,75,43,0.3)'
            }}
          >
            {status.stable ? 'STABLE' : 'UNSTABLE (VIBRATING)'}
          </span>
        </div>

        {/* Métrica de giro */}
        <div style={styles.imuMetric}>
          <div style={styles.metricHeader}>
            <span>Rotation Speed:</span>
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
            <span style={styles.label}>STABILITY TOLERANCE</span>
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
            <span>Strict (0.01)</span>
            <span>Permissive (0.50)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  floatingWrapper: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  floatingOpenBtn: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--border-glass)',
    boxShadow: 'var(--shadow-focus)',
    backdropFilter: 'blur(10px)',
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  },
  tooltipText: {
    position: 'absolute',
    left: '60px',
    backgroundColor: 'rgba(15, 15, 20, 0.9)',
    color: '#ff4b2b',
    border: '1px solid rgba(255, 75, 43, 0.3)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
  },
  widget: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    width: '320px',
    borderRadius: '12px',
    zIndex: 200,
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
  noCameraView: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-dim)',
    fontSize: '0.85rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  reticleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleCircle: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid rgba(0, 210, 255, 0.45)',
    position: 'absolute',
  },
  reticleHorizontal: {
    width: '40px',
    height: '1px',
    backgroundColor: 'rgba(0, 210, 255, 0.45)',
    position: 'absolute',
  },
  reticleVertical: {
    width: '1px',
    height: '40px',
    backgroundColor: 'rgba(0, 210, 255, 0.45)',
    position: 'absolute',
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
