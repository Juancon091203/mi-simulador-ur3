import React, { useState } from 'react';

/**
 * PhotosGalleryModal - Un modal premium para ver la galería de fotos capturadas
 * durante la simulación o de forma manual.
 */
const PhotosGalleryModal = ({ isOpen, onClose, photos = [], onClearPhotos }) => {
  const [lightboxImage, setLightboxImage] = useState(null);

  if (!isOpen) return null;

  return (
    <div style={styles.backdrop}>
      <div className="glass" style={styles.modalBox}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.title} className="text-gradient">GALERÍA DE CAPTURAS</h2>
            <p style={styles.subtitle}>Fotos registradas por la cámara FRAMOS</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {photos.length > 0 && (
              <button onClick={onClearPhotos} style={styles.clearBtn}>
                🗑️ Borrar Todo
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
              <h3>Sin capturas registradas</h3>
              <p>Inicia el escaneo o avanza paso a paso para capturar fotos automáticamente cuando el robot se estabilice.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {photos.map((photo, i) => (
                <div key={i} className="glass" style={styles.photoCard}>
                  <div style={styles.imageWrapper} onClick={() => setLightboxImage(photo)}>
                    <img src={photo.url} alt={`Captura ${photo.step}`} style={styles.image} />
                    <div style={styles.overlay}>
                      <span>🔎 Ampliar</span>
                    </div>
                  </div>
                  <div style={styles.cardDetails}>
                    <div style={styles.cardHeader}>
                      <span style={styles.stepBadge}>Paso {photo.step}</span>
                      <span style={styles.timeText}>{photo.timestamp.split(' ')[1] || photo.timestamp}</span>
                    </div>
                    <span style={styles.dateText}>{photo.timestamp.split(' ')[0] || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox para ver la imagen ampliada */}
      {lightboxImage && (
        <div style={styles.lightboxBackdrop} onClick={() => setLightboxImage(null)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage.url} alt={`Captura ampliada`} style={styles.lightboxImage} />
            <div style={styles.lightboxDetails}>
              <span>Captura del Paso {lightboxImage.step} | Registrada: {lightboxImage.timestamp}</span>
              <button onClick={() => setLightboxImage(null)} style={styles.lightboxCloseBtn}>Cerrar ✕</button>
            </div>
          </div>
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
    animation: 'fadeIn 0.3s ease-out',
    padding: '40px',
  },
  modalBox: {
    width: '100%',
    maxWidth: '960px',
    height: '80vh',
    borderRadius: '16px',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 15, 20, 0.4)',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '3px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-color)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '4px 8px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  clearBtn: {
    background: 'rgba(255, 75, 43, 0.12)',
    border: '1px solid rgba(255, 75, 43, 0.3)',
    color: '#ff4b2b',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: 'rgba(14, 15, 20, 0.2)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-dim)',
    textAlign: 'center',
    padding: '40px',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '15px',
    opacity: 0.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  photoCard: {
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid var(--border-glass)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }
  },
  imageWrapper: {
    width: '100%',
    height: '130px',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    transition: 'opacity 0.2s ease',
    ':hover': {
      opacity: 1,
    }
  },
  cardDetails: {
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    backgroundColor: 'rgba(14, 15, 20, 0.5)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    backgroundColor: 'rgba(255, 157, 0, 0.12)',
    color: 'var(--accent-orange)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  timeText: {
    fontSize: '0.6rem',
    color: 'var(--text-color)',
    opacity: 0.8,
  },
  dateText: {
    fontSize: '0.55rem',
    color: 'var(--text-dim)',
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
    animation: 'fadeIn 0.2s',
  },
  lightboxContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '90%',
    maxHeight: '90%',
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
    borderRadius: '8px',
    border: '2px solid rgba(255,255,255,0.05)',
  },
  lightboxDetails: {
    marginTop: '15px',
    color: 'white',
    fontSize: '0.85rem',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  }
};

export default PhotosGalleryModal;
