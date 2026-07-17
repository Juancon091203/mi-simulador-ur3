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
  onNewExecution,
  // User / auth
  currentUser, userRole,
  onLogout,
  className,
  setIsSidebarOpen,
}) => {
  return (
    <aside className={`sidebar glass ${className || ''}`} style={styles.sidebar}>
      {/* Header */}
      <header style={{ ...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '1.1rem', marginBottom: '5px' }}>
            Automated Photography Studio
          </h1>
          <p style={styles.subtitle}>Industrial HMI Dashboard</p>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text-color)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: 0,
            width: 'auto',
          }}
        >
          ✕
        </button>
      </header>

      {/* Station / View selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={styles.label}>Active Station / Area</label>
        <select
          value={activeStationTab}
          onChange={(e) => {
            const val = e.target.value;
            setActiveStationTab(val === 'general' ? 'general' : parseInt(val));
            setActiveSubView('dashboard');
            if (setIsSidebarOpen) setIsSidebarOpen(false);
          }}
          style={styles.select}
        >
          <option value="general">🌐 General View (4 Stations)</option>
          {stations.map(st => (
            <option key={st.id} value={st.id}>🤖 {st.name} ({st.ip})</option>
          ))}
        </select>
      </div>

      <div style={{ ...styles.divider, opacity: 0.15 }} />

      {/* Execution Queue (only in station view) */}
      {activeStationTab !== 'general' && currentStation && (() => {
        const sQueue = stationQueues[currentStation.id] || [];
        const status = stationQueueStatus[currentStation.id] || { isPlaying: false, currentIndex: 0 };
        return (
          <div className="queue-panel">
            <div className="queue-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Queue ({sQueue.length})
              </span>
              {userRole === 'admin' && (
                <button
                  onClick={() => onNewExecution(currentStation.id)}
                  style={{
                    background: 'var(--accent-blue)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    width: 'auto',
                  }}
                  title="Add new execution"
                >
                  ➕ Add
                </button>
              )}
            </div>
            <div className="queue-list" style={{ overflowY: 'auto', maxHeight: '250px', paddingRight: '4px' }}>
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
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>Preset: {item.presetName || 'None'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {idx === status.currentIndex && status.isPlaying && (
                        <span className="spinner" style={{ width: '8px', height: '8px', border: '1px solid var(--text-dim)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }} />
                      )}
                      <button onClick={() => handleMoveQueueItem(currentStation.id, idx, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-color)', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '2px', fontSize: '0.7rem', opacity: idx === 0 ? 0.3 : 1 }} title="Move Up">▲</button>
                      <button onClick={() => handleMoveQueueItem(currentStation.id, idx, 'down')} disabled={idx === sQueue.length - 1} style={{ background: 'none', border: 'none', color: idx === sQueue.length - 1 ? 'var(--text-dim)' : 'var(--text-color)', cursor: idx === sQueue.length - 1 ? 'not-allowed' : 'pointer', padding: '2px', fontSize: '0.7rem', opacity: idx === sQueue.length - 1 ? 0.3 : 1 }} title="Move Down">▼</button>
                      <button onClick={() => handleEditQueueItem(item)} style={{ background: 'none', border: 'none', color: '#00d2ff', cursor: 'pointer', padding: '2px', fontSize: '0.85rem' }} title="Edit task">✏️</button>
                      <button
                        onClick={() => handleRemoveQueueItem(currentStation.id, item.id)}
                        style={{
                          background: 'none', border: 'none', color: '#ff4b2b', cursor: 'pointer',
                          padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Remove task"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
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
