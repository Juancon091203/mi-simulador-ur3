import React from 'react';
import styles from '../styles/appStyles';
import { useLanguage } from '../context/LanguageContext';

/**
 * General overview showing the 4-station grid.
 * Props: stations, userRole, onOpenConfigModal, onSelectStation
 */
const GeneralOverview = ({ stations, userRole, onOpenConfigModal, onSelectStation }) => {
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
            ...styles.button,
            width: '180px',
            backgroundColor: 'var(--accent-blue)',
            color: '#000000',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.8rem',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          ➕ {t('add_execution')}
        </button>
      </div>

      <div className="stations-grid">
        {stations.map(st => (
          <div
            key={st.id}
            className={`station-card glass status-${st.status || 'idle'}`}
            onClick={() => onSelectStation(st.id)}
            style={{ padding: '28px', gap: '20px' }}
          >
            <div className="station-header" style={{ alignItems: 'center' }}>
              <div>
                <div className="station-title" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                  {st.name.replace('Station', t('station_name'))}
                </div>
                <div className="station-ip" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {st.ip}
                </div>
              </div>
              <span
                className={`station-status-pill status-pill-${st.status || 'idle'}`}
                style={{ fontSize: '0.85rem', fontWeight: '800', padding: '6px 16px', borderRadius: '24px' }}
              >
                {getStatusText(st.status)}
              </span>
            </div>

            <div className="station-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div className="station-info-group">
                <div>
                  <div className="station-info-label" style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1px' }}>
                    {t('active_product')}
                  </div>
                  <div className="station-info-value" style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '4px' }}>
                    {st.product === 'None' ? t('none') : st.product === 'Running Shoes' ? t('running_shoes') : st.product === 'Sunglasses' ? t('sunglasses') : st.product === 'Wristwatch' ? t('wristwatch') : st.product}
                  </div>
                </div>
              </div>

              {/* Enlarged Circular Progress Gauge */}
              <div style={{ position: 'relative', width: '110px', height: '110px' }}>
                <svg width={110} height={110} viewBox="0 0 100 100" style={{ transform: 'rotate(140deg)' }}>
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
                  width: '110px', height: '110px',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center',
                  textAlign: 'center', pointerEvents: 'none',
                }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-color)', lineHeight: '1.1' }}>
                    {st.progress}%
                  </span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '2px' }}>
                    {st.photoCount}/{st.maxPhotos}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default GeneralOverview;
