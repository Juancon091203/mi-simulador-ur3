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

      {/* Indicador de Estado de Progreso Semicircular */}
      <div style={styles.statusSection}>
        <div style={styles.circularProgressWrapper}>
          <svg width={130} height={130} viewBox="0 0 130 130" style={{ transform: 'rotate(140deg)' }}>
            {/* Defs para gradiente */}
            <defs>
              <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="100%" stopColor="#ff9d00" />
              </linearGradient>
            </defs>
            {/* Track de fondo */}
            <circle
              cx={65}
              cy={65}
              r={50}
              fill="transparent"
              stroke="var(--progress-track)"
              strokeWidth={8}
              strokeDasharray={`${2 * Math.PI * 50 * 260 / 360} ${2 * Math.PI * 50}`}
              strokeLinecap="round"
            />
            {/* Barra de progreso activa */}
            <circle
              cx={65}
              cy={65}
              r={50}
              fill="transparent"
              stroke="url(#progressGrad)"
              strokeWidth={8}
              strokeDasharray={`${(progressPercent / 100) * (2 * Math.PI * 50 * 260 / 360)} ${2 * Math.PI * 50}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          <div style={styles.circularProgressText}>
            <span style={styles.percentNumber}>{progressPercent.toFixed(0)}%</span>
            <span style={styles.percentSub}>{isFinished ? 'DONE' : `${currentPhotoStep}/${pointCount}`}</span>
          </div>
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
            <span style={{ ...styles.cardValue, color: 'var(--accent-blue)' }}>
              Station P{robotPositionIndex + 1}
            </span>
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--accent-blue)',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            padding: '6px 10px',
            marginTop: '6px',
            textAlign: 'center',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.8rem' }}>ℹ</span>
            <span>Point triggers automatically on camera alignment.</span>
          </div>
        </div>
      ) : isFinished && pointCount > 0 ? (
        <div style={{ ...styles.activePhotoCard, borderColor: '#00ff88', background: 'rgba(0,255,136,0.03)' }}>
          <div style={{ color: '#00ff88', fontWeight: '700', fontSize: '0.8rem', textAlign: 'center' }}>
            ✓ ALL IMAGES CAPTURED
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: '#00ff88',
            background: 'rgba(0, 255, 136, 0.05)',
            border: '1px solid rgba(0, 255, 136, 0.15)',
            borderRadius: '6px',
            padding: '6px 10px',
            marginTop: '6px',
            textAlign: 'center',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.8rem' }}>✓</span>
            <span>Inspection sequence finished successfully.</span>
          </div>
        </div>
      ) : (
        <div style={styles.activePhotoCard}>
          <div style={{ color: 'var(--text-dim)', fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>
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
            backgroundColor: isFinished ? 'var(--button-disabled-bg)' : 'var(--button-active-orange-bg)',
            borderColor: isFinished ? 'var(--button-disabled-border)' : 'var(--accent-orange)',
            color: isFinished ? 'var(--button-disabled-text)' : 'var(--accent-orange)',
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
    width: '100%',
    padding: '18px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    color: 'var(--text-color)',
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
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: 0,
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'center',
  },
  circularProgressWrapper: {
    position: 'relative',
    width: '130px',
    height: '130px',
    margin: '10px auto',
  },
  circularProgressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '130px',
    height: '130px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  percentNumber: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--text-color)',
    lineHeight: '1.2',
  },
  percentSub: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px',
  },
  activePhotoCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
  },
  cardValue: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-color)',
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  navButton: {
    padding: '10px',
    background: 'var(--card-bg)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    color: 'var(--text-color)',
    fontSize: '0.75rem',
    fontWeight: '700',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  resetButton: {
    padding: '8px',
    background: 'none',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    color: 'var(--text-dim)',
    fontSize: '0.65rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
    outline: 'none',
  }
};

export default PhotoSimulationPanel;
