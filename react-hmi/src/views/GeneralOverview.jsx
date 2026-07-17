import React from 'react';
import styles from '../styles/appStyles';

/**
 * General overview showing the 4-station grid.
 * Props: stations, userRole, onOpenConfigModal, onSelectStation
 */
const GeneralOverview = ({ stations, userRole, onOpenConfigModal, onSelectStation }) => (
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
          ⚙️ New Execution
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
              <div className="station-title">{st.name}</div>
              <div className="station-ip">{st.ip}</div>
            </div>
            <span className={`station-status-pill status-pill-${st.status}`}>
              {st.status === 'running'
                ? 'Running'
                : st.status === 'idle'
                  ? 'Idle'
                  : st.status === 'warning'
                    ? 'Warning Stop'
                    : 'Emergency'}
            </span>
          </div>

          <div className="station-body">
            <div className="station-info-group">
              <div>
                <div className="station-info-label">Active Product</div>
                <div className="station-info-value">{st.product}</div>
              </div>
              <div>
                <div className="station-info-label">Robot Speed</div>
                <div className="station-info-value">{st.speed > 0 ? `${st.speed} m/s` : 'Inactive'}</div>
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

export default GeneralOverview;
