import React from 'react';

/**
 * PhotoSimulationPanel - Panel flotante simplificado para controlar la secuencia de fotos.
 */
const PhotoSimulationPanel = ({
  currentPhotoStep = 0,
  setCurrentPhotoStep,
  pointCount = 100
}) => {
  const isFinished = currentPhotoStep >= pointCount;

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

  return (
    <div className="glass photo-simulation-panel" style={styles.panel}>
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
    </div>
  );
};

const styles = {
  panel: {
    width: '100%',
    padding: '12px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-color)',
    transition: 'all 0.3s ease',
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
  }
};

export default PhotoSimulationPanel;
