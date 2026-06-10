import React from 'react';

/**
 * PhotoSimulationPanel - Panel flotante para controlar la simulación
 * de capturas de fotos y desaparición de puntos de Fibonacci.
 */
const PhotoSimulationPanel = ({
  currentPhotoStep = 0,
  setCurrentPhotoStep,
  pointCount = 100,
  robotPositionIndex = 0
}) => {
  const isFinished = currentPhotoStep >= pointCount;
  const progressPercent = pointCount > 0 ? (currentPhotoStep / pointCount) * 100 : 0;

  const handleNext = () => {
    if (currentPhotoStep < pointCount) {
      setCurrentPhotoStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPhotoStep > 0) {
      setCurrentPhotoStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentPhotoStep(0);
  };

  return (
    <div className="glass photo-simulation-panel" style={styles.panel}>
      <header style={styles.header}>
        <h2 style={styles.title} className="text-gradient">PHOTO SEQUENCER</h2>
        <p style={styles.subtitle}>Inspection Runner</p>
      </header>

      {/* Indicador de Estado de Progreso */}
      <div style={styles.statusSection}>
        <div style={styles.progressTextRow}>
          <span style={styles.progressLabel}>PROGRESS</span>
          <span style={styles.progressValue}>
            {isFinished ? 'COMPLETE' : `${currentPhotoStep} / ${pointCount} Photos`}
          </span>
        </div>
        
        {/* Barra de progreso */}
        <div style={styles.progressBarBg}>
          <div style={{
            ...styles.progressBarFill,
            width: `${progressPercent}%`,
            backgroundColor: isFinished ? '#00ff88' : '#ff9d00'
          }} />
        </div>
      </div>

      {/* Detalles de la foto activa */}
      {pointCount > 0 && !isFinished ? (
        <div style={styles.activePhotoCard}>
          <div style={styles.cardRow}>
            <span style={styles.cardLabel}>ACTIVE TARGET</span>
            <span style={styles.cardValue}>#{currentPhotoStep + 1}</span>
          </div>
          <div style={styles.cardRow}>
            <span style={styles.cardLabel}>CAMERA POSITION</span>
            <span style={{ ...styles.cardValue, color: '#00ffcc' }}>
              Station P{robotPositionIndex + 1}
            </span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px', textAlign: 'center' }}>
            Point triggers automatically on camera alignment.
          </div>
        </div>
      ) : isFinished && pointCount > 0 ? (
        <div style={{ ...styles.activePhotoCard, borderColor: '#00ff88', background: 'rgba(0,255,136,0.03)' }}>
          <div style={{ color: '#00ff88', fontWeight: '700', fontSize: '0.8rem', textAlign: 'center' }}>
            ✓ ALL IMAGES CAPTURED
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px', textAlign: 'center' }}>
            Inspection sequence finished successfully.
          </div>
        </div>
      ) : (
        <div style={styles.activePhotoCard}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center' }}>
            No points to simulate. Increase "Fibonacci Points" slider.
          </div>
        </div>
      )}

      {/* Controles de Simulación */}
      <div style={styles.buttonGroup}>
        <button
          onClick={handlePrev}
          disabled={currentPhotoStep === 0}
          style={{
            ...styles.navButton,
            opacity: currentPhotoStep === 0 ? 0.3 : 1,
            cursor: currentPhotoStep === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ◀ PREV
        </button>

        <button
          onClick={handleNext}
          disabled={isFinished || pointCount === 0}
          style={{
            ...styles.navButton,
            backgroundColor: isFinished ? 'rgba(255,255,255,0.05)' : 'rgba(255, 157, 0, 0.1)',
            borderColor: isFinished ? 'rgba(255,255,255,0.1)' : '#ff9d00',
            color: isFinished ? 'rgba(255,255,255,0.3)' : '#ff9d00',
            opacity: (isFinished || pointCount === 0) ? 0.3 : 1,
            cursor: (isFinished || pointCount === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          NEXT ▶
        </button>
      </div>

      <button
        onClick={handleReset}
        disabled={currentPhotoStep === 0}
        style={{
          ...styles.resetButton,
          opacity: currentPhotoStep === 0 ? 0.3 : 1,
          cursor: currentPhotoStep === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        RESET RUNNER
      </button>
    </div>
  );
};

const styles = {
  panel: {
    position: 'absolute',
    top: '20px',
    left: '360px', // Colocado al lado del sidebar izquierdo (que tiene 320px de ancho + 20px de margen)
    width: '260px',
    padding: '18px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    color: '#ffffff',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    fontSize: '0.9rem',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '0.6rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: 0,
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressTextRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: '0.6rem',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.5px',
  },
  progressValue: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  progressBarBg: {
    width: '100%',
    height: '4px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.2s ease',
  },
  activePhotoCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.4)',
  },
  cardValue: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  navButton: {
    padding: '10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '700',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  resetButton: {
    padding: '8px',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.65rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
    outline: 'none',
  }
};

export default PhotoSimulationPanel;
