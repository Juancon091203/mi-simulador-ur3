import React, { useState } from 'react';

/**
 * PhotosGalleryModal - Un modal premium simplificado para ver la galería de fotos capturadas
 * con la cámara FRAMOS. Incorpora navegación interactiva (Lightbox) y eliminación por paso.
 */
const PhotosGalleryModal = ({ isOpen, onClose, photos = [], onClearPhotos, onDeletePhoto }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!isOpen) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (lightboxIndex < photos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div className="glass" style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.title} className="text-gradient">PHOTO ALBUM</h2>
            <p style={styles.subtitle}>Photos recorded by the system ({photos.length} photos)</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {photos.length > 0 && (
              <button onClick={onClearPhotos} style={styles.clearBtn}>
                🗑️ Clear Album
              </button>
            )}
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </header>

        {/* Listado de Fotos */}
        <div style={styles.content}>
          {photos.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📸</span>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-color)' }}>
                Empty Album
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '400px' }}>
                Photos will be automatically captured when the robot settles at each point during PLAY RUN.
              </p>
            </div>
          ) : (
            <div className="gallery-grid">
              {photos.map((photo, i) => (
                <div key={i} className="photo-card">
                  {/* Botón X para eliminar la foto individualmente en hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeletePhoto) onDeletePhoto(photo.step);
                    }}
                    className="photo-delete-btn"
                    title="Delete this photo"
                  >
                    ✕
                  </button>

                  <div className="photo-image-wrapper" onClick={() => setLightboxIndex(i)}>
                    <img src={photo.url} alt={`Step ${photo.step}`} className="photo-image" />
                    <div className="photo-card-overlay">
                      <span>🔎 Enlarge</span>
                    </div>
                  </div>

                  <div className="photo-card-details">
                    <span className="photo-step-badge">Step {photo.step}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                      Photo #{i + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox con Navegación Anterior/Siguiente */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div style={styles.lightboxBackdrop} onClick={() => setLightboxIndex(null)}>
          {/* Botón anterior */}
          {lightboxIndex > 0 && (
            <button style={styles.navArrowLeft} onClick={handlePrev}>
              ◀
            </button>
          )}

          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img src={photos[lightboxIndex].url} alt={`Step ${photos[lightboxIndex].step}`} style={styles.lightboxImage} />
            <div style={styles.lightboxDetails}>
              <span style={{ fontWeight: '600' }}>
                Station/Step {photos[lightboxIndex].step} (Photo {lightboxIndex + 1} of {photos.length})
              </span>
              <button onClick={() => setLightboxIndex(null)} style={styles.lightboxCloseBtn}>Close ✕</button>
            </div>
          </div>

          {/* Botón siguiente */}
          {lightboxIndex < photos.length - 1 && (
            <button style={styles.navArrowRight} onClick={handleNext}>
              ▶
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 8, 0.85)',
    backdropFilter: 'blur(15px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.25s ease-out',
    padding: '24px',
  },
  modalBox: {
    width: '100%',
    maxWidth: '900px',
    height: '75vh',
    borderRadius: '16px',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--header-bg)',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '2px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-color)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '4px 8px',
    outline: 'none',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    width: 'auto',
  },
  clearBtn: {
    background: 'rgba(255, 75, 43, 0.1)',
    border: '1px solid rgba(255, 75, 43, 0.25)',
    color: '#ff4b2b',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: 'auto',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: 'var(--content-bg)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-dim)',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '10px',
    opacity: 0.4,
  },
  lightboxBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.15s ease-out',
  },
  lightboxContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '80%',
    maxHeight: '90%',
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '75vh',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  lightboxDetails: {
    marginTop: '12px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.8rem',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.7rem',
    width: 'auto',
  },
  navArrowLeft: {
    position: 'absolute',
    left: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    outline: 'none',
    zIndex: 10,
  },
  navArrowRight: {
    position: 'absolute',
    right: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    outline: 'none',
    zIndex: 10,
  }
};

export default PhotosGalleryModal;
