import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera } from '@react-three/drei';
import RobotModel from './components/three/RobotModel';
import { useRobotConnection } from './hooks/useRobotConnection';
import { useRobotWebSocket } from './hooks/useRobotWebSocket';

const App = () => {
  const [modelType, setModelType] = useState('UR3');
  const [connectionMode, setConnectionMode] = useState('websocket');
  const [ipAddress, setIpAddress] = useState('192.168.3.41:7000/ws');
  
  const [manualMode, setManualMode] = useState(false);
  const [manualJoints, setManualJoints] = useState([0, 0, 0, 0, 0, 0]);
  
  const sseConn = useRobotConnection();
  const wsConn = useRobotWebSocket();
  
  const activeConn = connectionMode === 'websocket' ? wsConn : sseConn;
  
  const currentJointAngles = manualMode
    ? manualJoints.map(deg => deg * Math.PI / 180)
    : activeConn.jointAngles;

  const handleConnect = () => {
    if (activeConn.isConnected) {
      activeConn.disconnect();
    } else {
      if (connectionMode === 'websocket') {
        const url = ipAddress.startsWith('ws://') || ipAddress.startsWith('wss://')
          ? ipAddress
          : `ws://${ipAddress}`;
        activeConn.connect(url);
      } else {
        activeConn.connect(ipAddress);
      }
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
            <option value="UR20">Universal Robots UR20</option>
            <option value="iER15-1430-MI">ESTUN iER15-1430-MI</option>
          </select>
        </section>

        {/* Control Manual para Pruebas offline */}
        <section style={styles.section}>
          <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={manualMode} 
              onChange={(e) => setManualMode(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            MANUAL OVERRIDE (TEST)
          </label>
          
          {manualMode && (
            <div style={styles.sliderContainer}>
              {manualJoints.map((val, i) => (
                <div key={i} style={styles.sliderItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>
                    <span>Joint {i + 1}</span>
                    <span>{val.toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={val}
                    onChange={(e) => {
                      const newVal = parseFloat(e.target.value);
                      setManualJoints(prev => {
                        const next = [...prev];
                        next[i] = newVal;
                        return next;
                      });
                    }}
                    style={{ width: '100%', accentColor: '#00d2ff', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.section}>
          <label style={styles.label}>CONNECTION TYPE</label>
          <select
            value={connectionMode}
            onChange={(e) => {
              if (activeConn.isConnected) {
                activeConn.disconnect();
              }
              const newMode = e.target.value;
              setConnectionMode(newMode);
              if (newMode === 'websocket') {
                setIpAddress('192.168.3.41:7000/ws');
              } else {
                setIpAddress('192.168.3.5');
              }
            }}
            style={styles.select}
          >
            <option value="websocket">Partner WebSocket</option>
            <option value="sse">Local Flask (SSE)</option>
          </select>
        </section>

        <section style={styles.section}>
          <label style={styles.label}>{connectionMode === 'websocket' ? 'WEBSOCKET URL' : 'ROBOT IP'}</label>
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
              backgroundColor: activeConn.isConnected ? '#ff4b2b' : '#00d2ff',
              boxShadow: activeConn.isConnected ? '0 0 15px rgba(255, 75, 43, 0.4)' : '0 0 15px rgba(0, 210, 255, 0.4)'
            }}
          >
            {activeConn.isConnected ? 'DISCONNECT' : 'CONNECT'}
          </button>
        </section>

        <div style={styles.statusBox}>
          <div style={{ ...styles.statusDot, backgroundColor: activeConn.isConnected ? '#00ff88' : '#ff4b2b' }} />
          <span style={styles.statusText}>{activeConn.statusMessage}</span>
        </div>

        <footer style={styles.footer}>
          <label style={styles.label}>JOINT DATA</label>
          <div style={styles.jointGrid}>
            {currentJointAngles.map((angle, i) => (
              <div key={i} style={styles.jointItem}>
                <span style={styles.jointLabel}>J{i + 1}</span>
                <span style={styles.jointValue}>{(angle * 180 / Math.PI).toFixed(1)}°</span>
              </div>
            ))}
          </div>
        </footer>
      </aside>

      {/* Viewport 3D Principal */}
      <main className="main-viewport" style={{ ...styles.main, position: 'relative' }}>
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 2, 4]} fov={50} />

          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5} contactShadow={false}>
              <RobotModel modelType={modelType} jointAngles={currentJointAngles} />
            </Stage>
          </Suspense>

          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
        </Canvas>

        {/* Overlay opcional para mostrar información del modelo */}
        <div style={{ position: 'absolute', bottom: 20, right: 20, pointerEvents: 'none' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
            Rendering: {modelType} Baseline Active
          </span>
        </div>
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
  },
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '15px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  sliderItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }
};

export default App;
