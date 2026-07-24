import React from 'react';
import styles from '../styles/appStyles';
import { useLanguage } from '../context/LanguageContext';

/**
 * General overview showing the 4-station grid.
 * Props: stations, userRole, onOpenConfigModal, onSelectStation
 */
const GeneralOverview = ({
  stations,
  userRole,
  onOpenConfigModal,
  onSelectStation,
  onPlayStation,
  onPauseStation,
  onStopStation,
  stationQueueStatus = {},
}) => {
  const { t } = useLanguage();

  const getStatusText = (status) => {
    switch (status) {
      case 'running': return t('status_running');
      case 'idle': return t('status_idle');
      case 'warning': return t('status_warning');
      case 'emergency': return t('status_emergency');
      case 'off': return t('status_off');
      default: return status ? status.toUpperCase() : t('status_idle');
    }
  };

  return (
    <main className="stations-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={onOpenConfigModal}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '0.85rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            transition: 'all 0.2s ease',
            width: 'auto',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>{t('add_execution')}</span>
        </button>
      </div>

      <div className="stations-grid">
        {stations.map(st => {
          const isRunning = st.status === 'running' || stationQueueStatus[st.id]?.isPlaying;

          return (
            <div
              key={st.id}
              className={`station-card glass status-${st.status || 'idle'}`}
              onClick={() => onSelectStation(st.id)}
              style={{ padding: '24px', gap: '16px', display: 'flex', flexDirection: 'column' }}
            >
              <div className="station-header" style={{ alignItems: 'center' }}>
                <div>
                  <div className="station-title" style={{ fontSize: 'clamp(1.3rem, 1.6vw, 1.85rem)', fontWeight: '800' }}>
                    {st.name.replace('Station', t('station_name'))}
                  </div>
                  <div className="station-ip" style={{ fontSize: 'clamp(0.8rem, 0.9vw, 1.0rem)', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {st.ip}
                  </div>
                </div>
                <span
                  className={`station-status-pill status-pill-${st.status || 'idle'}`}
                  style={{
                    fontSize: 'clamp(0.85rem, 1.0vw, 1.1rem)',
                    fontWeight: '800',
                    padding: 'clamp(6px, 0.6vw, 10px) clamp(14px, 1.4vw, 24px)',
                    borderRadius: '24px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {getStatusText(st.status)}
                </span>
              </div>

              <div className="station-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div className="station-info-group">
                  <div>
                    <div className="station-info-label" style={{ fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)', fontWeight: '700', letterSpacing: '1px' }}>
                      {t('active_product')}
                    </div>
                    <div className="station-info-value" style={{ fontSize: 'clamp(1.05rem, 1.25vw, 1.4rem)', fontWeight: '800', marginTop: '4px' }}>
                      {st.product === 'None' ? t('none') : st.product === 'Running Shoes' ? t('running_shoes') : st.product === 'Sunglasses' ? t('sunglasses') : st.product === 'Wristwatch' ? t('wristwatch') : st.product}
                    </div>
                  </div>
                </div>

                {/* Enlarged Dynamic Progress Gauge Scaling Across All Screen Sizes */}
                <div style={{
                  position: 'relative',
                  width: 'clamp(95px, 8.8vw, 140px)',
                  height: 'clamp(95px, 8.8vw, 140px)',
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(140deg)' }}>
                    <circle
                      cx={50} cy={50} r={40}
                      fill="transparent"
                      stroke="var(--progress-track)"
                      strokeWidth={9}
                      strokeDasharray={`${2 * Math.PI * 40 * 260 / 360} ${2 * Math.PI * 40}`}
                      strokeLinecap="round"
                    />
                    <circle
                      cx={50} cy={50} r={40}
                      fill="transparent"
                      stroke={st.status === 'running' ? 'var(--accent-green)' : (st.status === 'warning' ? 'var(--accent-orange)' : (st.status === 'emergency' ? '#ff4b2b' : 'var(--accent-blue)'))}
                      strokeWidth={9}
                      strokeDasharray={`${(st.maxPhotos > 0 ? (st.photoCount / st.maxPhotos) : 0) * (2 * Math.PI * 40 * 260 / 360)} ${2 * Math.PI * 40}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    textAlign: 'center', pointerEvents: 'none',
                  }}>
                    <span style={{ fontSize: 'clamp(1.2rem, 1.55vw, 1.85rem)', fontWeight: '900', color: 'var(--text-color)', lineHeight: '1.1' }}>
                      {st.progress}%
                    </span>
                    <span style={{ fontSize: 'clamp(0.6rem, 0.75vw, 0.85rem)', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '2px' }}>
                      {st.photoCount}/{st.maxPhotos}
                    </span>
                  </div>
                </div>
              </div>

              {/* Station Card Controls: Play/Pause & Stop/Abort */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  marginTop: '10px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-inner-glass)',
                }}
              >
                {/* Play / Pause Button */}
                <button
                  className={isRunning ? "station-card-btn-pause" : "station-card-btn-play"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isRunning) {
                      if (onPauseStation) onPauseStation(st.id);
                    } else {
                      if (onPlayStation) onPlayStation(st.id);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isRunning ? 'rgba(255, 157, 0, 0.12)' : 'rgba(0, 210, 255, 0.12)',
                    border: `1px solid ${isRunning ? 'var(--accent-orange)' : 'var(--accent-blue)'}`,
                    color: isRunning ? 'var(--accent-orange)' : 'var(--accent-blue)',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isRunning ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                        <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                      </svg>
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      <span>Iniciar</span>
                    </>
                  )}
                </button>

                {/* Abort / Stop Button (with confirmation prompt) */}
                <button
                  className="station-card-btn-abort"
                  onClick={(e) => {
                    e.stopPropagation();
                    const stationDisplayName = st.name.replace('Station', t('station_name'));
                    const confirmAbort = window.confirm(
                      `¿Estás seguro de que deseas abortar completamente la ejecución en ${stationDisplayName}?`
                    );
                    if (confirmAbort && onStopStation) {
                      onStopStation(st.id);
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 75, 43, 0.08)',
                    border: '1px solid #ff4b2b',
                    color: '#ff4b2b',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  title="Abortar ejecución"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="5" y="5" width="14" height="14" rx="2"></rect>
                  </svg>
                  <span>Abortar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default GeneralOverview;
