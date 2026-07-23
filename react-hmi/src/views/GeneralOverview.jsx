import React from 'react';
import styles from '../styles/appStyles';
import { useLanguage } from '../context/LanguageContext';

/**
 * General overview showing the 4-station grid.
 * Props: stations, userRole, onOpenConfigModal, onSelectStation
 */
const GeneralOverview = ({ stations, userRole, onOpenConfigModal, onSelectStation }) => {
  const { t } = useLanguage();

  return (
    <main className="stations-container">
      {userRole === 'admin' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={onOpenConfigModal}
            style={{
              ...styles.button,
              width: '180px',
              backgroundColor: 'var(--accent-blue)',
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
      )}

      <div className="stations-grid">
        {stations.map(st => (
          <div
            key={st.id}
            className={`station-card glass status-${st.status}`}
            onClick={() => onSelectStation(st.id)}
          >
            <div className="station-header">
              <div>
                <div className="station-title">{st.name.replace('Station', t('station_name'))}</div>
                <div className="station-ip">{st.ip}</div>
              </div>
              <span className={`station-status-pill status-pill-${st.status}`}>
                {st.status === 'running'
                  ? t('status_running')
                  : st.status === 'idle'
                    ? t('status_idle')
                    : st.status === 'warning'
                      ? t('status_warning')
                      : t('status_emergency')}
              </span>
            </div>

            <div className="station-body">
              <div className="station-info-group">
                <div>
                  <div className="station-info-label">{t('active_product')}</div>
                  <div className="station-info-value">
                    {st.product === 'None' ? t('none') : st.product === 'Running Shoes' ? t('running_shoes') : st.product === 'Sunglasses' ? t('sunglasses') : st.product === 'Wristwatch' ? t('wristwatch') : st.product}
                  </div>
                </div>
                <div>
                  <div className="station-info-label">{t('robot_speed')}</div>
                  <div className="station-info-value">{st.speed > 0 ? `${st.speed} m/s` : t('inactive')}</div>
                </div>
              </div>

              {/* Circular progress gauge */}
              <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                <svg width={70} height={70} viewBox="0 0 100 100" style={{ transform: 'rotate(140deg)' }}>
                  <circle
                    cx={50} cy={50} r={40}
                    fill="transparent"
                    stroke="var(--progress-track)"
                    strokeWidth={8}
                    strokeDasharray={`${2 * Math.PI * 40 * 260 / 360} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={50} cy={50} r={40}
                    fill="transparent"
                    stroke="var(--accent-blue)"
                    strokeWidth={8}
                    strokeDasharray={`${(st.maxPhotos > 0 ? (st.photoCount / st.maxPhotos) : 0) * (2 * Math.PI * 40 * 260 / 360)} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '70px', height: '70px',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center',
                  textAlign: 'center', pointerEvents: 'none',
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-color)', lineHeight: '1.2' }}>
                    {st.progress}%
                  </span>
                  <span style={{ fontSize: '0.45rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
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
