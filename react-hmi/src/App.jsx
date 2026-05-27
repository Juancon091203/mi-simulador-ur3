import React, { useState } from 'react';
import RobotViewer from './components/three/RobotViewer';
import { useRobotConnection } from './hooks/useRobotConnection';

const App = () => {
  const [modelType, setModelType] = useState('UR3');
  const [ipAddress, setIpAddress] = useState('192.168.3.5');
  const { jointAngles, isConnected, statusMessage, connect, disconnect } = useRobotConnection();

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect(ipAddress);
    }
  };

  return (
    <div className="dashboard" style={styles.container}>
      {/* Sidebar de Control */}
      <aside className="sidebar glass" style={styles.sidebar}>
        <header style={styles.header}>
          <h1 className="text-gradient">UR CONTROL</h1>
          <p style={styles.subtitle}>Industrial Digital Twin</p>
        </header>

        <section style={styles.section}>
          <label style={styles.label}>ROBOT MODEL</label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            style={styles.select}
          >
            <option value="UR3">Universal Robots UR3</option>
            <option value="UR5">Universal Robots UR5</option>
            {/* <option value="UR10">Universal Robots UR10</option> */}
          </select>
        </section>

        <section style={styles.section}>
          <label style={styles.label}>ROBOT IP</label>
          <input
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleConnect}
            style={{
              ...styles.button,
              backgroundColor: isConnected ? '#ff4b2b' : '#00d2ff',
              boxShadow: isConnected ? '0 0 15px rgba(255, 75, 43, 0.4)' : '0 0 15px rgba(0, 210, 255, 0.4)'
            }}
          >
            {isConnected ? 'DISCONNECT' : 'CONNECT'}
          </button>
        </section>

        <div style={styles.statusBox}>
          <div style={{ ...styles.statusDot, backgroundColor: isConnected ? '#00ff88' : '#ff4b2b' }} />
          <span style={styles.statusText}>{statusMessage}</span>
        </div>

        <footer style={styles.footer}>
          <label style={styles.label}>JOINT DATA</label>
          <div style={styles.jointGrid}>
            {jointAngles.map((angle, i) => (
              <div key={i} style={styles.jointItem}>
                <span style={styles.jointLabel}>J{i}</span>
                <span style={styles.jointValue}>{(angle * 180 / Math.PI).toFixed(1)}°</span>
              </div>
            ))}
          </div>
        </footer>
      </aside>

      {/* Viewport 3D Principal */}
      <main className="main-viewport" style={styles.main}>
        <RobotViewer modelType={modelType} jointAngles={jointAngles} />
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    background: '#0a0a0c',
  },
  sidebar: {
    width: '320px',
    height: 'calc(100vh - 40px)',
    margin: '20px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    zIndex: 10,
    overflowX: 'hidden',
  },
  main: {
    flex: 1,
    height: '100vh',
  },
  header: {
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginTop: '5px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  label: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  select: {
    padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
  },
  input: {
    padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    outline: 'none',
  },
  button: {
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  statusBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    boxShadow: '0 0 10px currentColor',
  },
  statusText: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.7)',
  },
  footer: {
    marginTop: '20px',
    paddingBottom: '10px',
  },
  jointGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '10px',
  },
  jointItem: {
    padding: '10px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jointLabel: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.3)',
  },
  jointValue: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#00d2ff',
  }
};

export default App;
