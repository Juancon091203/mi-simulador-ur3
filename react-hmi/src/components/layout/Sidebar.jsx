import React from 'react';
import styles from '../../styles/appStyles';

/**
 * App sidebar — navigation, queue list, and user card.
 * Props: all navigation + queue + user state.
 */
const Sidebar = ({
  // Navigation
  activeStationTab, setActiveStationTab,
  activeSubView, setActiveSubView,
  stations,
  // Queue
  currentStation,
  stationQueues, stationQueueStatus,
  handleMoveQueueItem, handleEditQueueItem, handleRemoveQueueItem,
  // User / auth
  currentUser, userRole,
  onLogout,
}) => {
  const navBtnStyle = (isActive) => ({
    ...styles.button,
    padding: '12px',
    fontSize: '0.8rem',
    textAlign: 'left',
    background: isActive ? 'var(--accent-blue)' : 'var(--input-bg)',
    border: '1px solid var(--border-glass)',
    color: isActive ? '#000000' : 'var(--text-color)',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: isActive ? '0 0 10px rgba(0,210,255,0.2)' : 'none',
  });

  return (
    <aside className="sidebar glass" style={styles.sidebar}>
      {/* Header */}
      <header style={styles.header}>
        <h1 className="text-gradient" style={{ fontSize: '1.1rem', marginBottom: '5px' }}>
          Automated Photography Studio
        </h1>
        <p style={styles.subtitle}>Industrial HMI Dashboard</p>
      </header>

      {/* Station / View selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={styles.label}>Navigation / View</label>
        <select
          value={activeStationTab}
          onChange={(e) => {
            const val = e.target.value;
            setActiveStationTab(val === 'general' ? 'general' : parseInt(val));
            setActiveSubView('dashboard');
          }}
          style={styles.select}
        >
          <option value="general">🌐 General View (4 Stations)</option>
          {stations.map(st => (
            <option key={st.id} value={st.id}>🤖 {st.name} ({st.ip})</option>
          ))}
        </select>
      </div>

      {/* Sub-view buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => setActiveSubView('dashboard')}
          style={navBtnStyle(activeSubView === 'dashboard')}
        >
          🖥️ Dashboard {activeStationTab !== 'general' ? '(3D)' : ''}
        </button>

        {activeStationTab === 'general' && (
          <button
            onClick={() => setActiveSubView('presets')}
            style={navBtnStyle(activeSubView === 'presets' || activeSubView === 'calibration')}
          >
            📐 Presets
          </button>
        )}

        {activeStationTab !== 'general' && (
          <>
            <button onClick={() => setActiveSubView('vnc')} style={navBtnStyle(activeSubView === 'vnc')}>
              🎮 VNC Viewer (TeachPendant)
            </button>
            <button onClick={() => setActiveSubView('camera')} style={navBtnStyle(activeSubView === 'camera')}>
              📷 Camera (2D)
            </button>
            <button onClick={() => setActiveSubView('config')} style={navBtnStyle(activeSubView === 'config')}>
              ⚙️ Station Settings
            </button>
          </>
        )}
      </div>

      {/* Execution Queue (only in station view) */}
      {activeStationTab !== 'general' && currentStation && (() => {
        const sQueue = stationQueues[currentStation.id] || [];
        const status = stationQueueStatus[currentStation.id] || { isPlaying: false, currentIndex: 0 };
        return (
          <div className="queue-panel">
            <div className="queue-header">
              <span style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Execution Queue ({sQueue.length})
              </span>
            </div>
            <div className="queue-list" style={{ overflowY: 'auto', maxHeight: '180px', paddingRight: '4px' }}>
              {sQueue.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.7rem', padding: '15px' }}>
                  No tasks in queue. Configure executions to start.
                </div>
              ) : (
                sQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`queue-item ${idx === status.currentIndex ? 'active' : ''}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '6px', marginBottom: '6px' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{item.productName}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>{item.robotSpeed} m/s • {item.pointCount || 100} pts</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {idx === status.currentIndex && status.isPlaying && (
                        <span className="spinner" style={{ width: '8px', height: '8px', border: '1px solid var(--text-dim)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }} />
                      )}
                      <button onClick={() => handleMoveQueueItem(currentStation.id, idx, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-color)', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '2px', fontSize: '0.7rem', opacity: idx === 0 ? 0.3 : 1 }} title="Move Up">▲</button>
                      <button onClick={() => handleMoveQueueItem(currentStation.id, idx, 'down')} disabled={idx === sQueue.length - 1} style={{ background: 'none', border: 'none', color: idx === sQueue.length - 1 ? 'var(--text-dim)' : 'var(--text-color)', cursor: idx === sQueue.length - 1 ? 'not-allowed' : 'pointer', padding: '2px', fontSize: '0.7rem', opacity: idx === sQueue.length - 1 ? 0.3 : 1 }} title="Move Down">▼</button>
                      <button onClick={() => handleEditQueueItem(item)} style={{ background: 'none', border: 'none', color: '#00d2ff', cursor: 'pointer', padding: '2px', fontSize: '0.85rem' }} title="Edit task">✏️</button>
                      <button onClick={() => handleRemoveQueueItem(currentStation.id, item.id)} style={{ background: 'none', border: 'none', color: '#ff4b2b', cursor: 'pointer', padding: '2px', fontSize: '0.8rem' }} title="Remove task">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* User card */}
      <div style={{ marginTop: 'auto', padding: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>{currentUser || 'Anonymous User'}</span>
          <span style={{ fontSize: '0.55rem', fontWeight: '800', textTransform: 'uppercase', background: userRole === 'admin' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 210, 255, 0.15)', color: userRole === 'admin' ? '#00ff88' : 'var(--accent-blue)', padding: '1px 6px', borderRadius: '8px' }}>
            {userRole}
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{ ...styles.button, padding: '6px 10px', fontSize: '0.7rem', background: 'none', border: '1px solid var(--border-glass)', color: 'var(--text-color)', marginTop: '2px', width: '100%' }}
        >
          Log Out / Change Role
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
