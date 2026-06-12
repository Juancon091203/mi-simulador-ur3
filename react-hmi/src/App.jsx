import React, { useState, Suspense, useMemo, useEffect } from 'react';
import RobotViewer from './components/three/RobotViewer';
import { useRobotConnection } from './hooks/useRobotConnection';
import { useRobotWebSocket } from './hooks/useRobotWebSocket';
import { useRobotHttp } from './hooks/useRobotHttp';
import SpheroidPanel from './components/panels/SpheroidPanel';
import PhotoSimulationPanel from './components/panels/PhotoSimulationPanel';

const App = () => {
  const [modelType, setModelType] = useState('UR3');
  const [connectionMode, setConnectionMode] = useState('websocket');
  // IP de antes de lo de ESTUN
  //const [ipAddress, setIpAddress] = useState('192.168.3.41:7000/ws');
  const [ipAddress, setIpAddress] = useState('192.168.60.10'); // IP de tu PC

  const [manualMode, setManualMode] = useState(false);
  const [manualJoints, setManualJoints] = useState([0, 0, 0, 0, 0, 0]);

  // Estado para las dimensiones y visibilidad del esferoide
  const [spheroidSize, setSpheroidSize] = useState({ x: 0.6, y: 0.6, z: 0.6 });
  const [showSpheroid, setShowSpheroid] = useState(true);
  const [pointCount, setPointCount] = useState(100);

  // Estado para el centro del objeto (centro del esferoide)
  const [objectCenter, setObjectCenter] = useState({ x: 1.2, y: 0.2, z: 0.0 });
  // Estado para los límites vertical de corte Z en la esfera (relativos al centro, de -1.0 a 1.0)
  const [zBounds, setZBounds] = useState({ min: -1.0, max: 1.0 });
  // Estado para visualizar los gajos de división de los sectores
  const [showSectors, setShowSectors] = useState(false);

  // Estado para la trayectoria obtenida del backend de Python
  const [backendSequence, setBackendSequence] = useState([]);

  // Fetch de la trayectoria desde el backend con debouncing para evitar congelar la interfaz al arrastrar sliders
  useEffect(() => {
    let active = true;
    const fetchTrajectory = async () => {
      // Capturamos el tamaño y centro exacto en el momento del envío para evitar fallos de clausura 
      // si el usuario sigue arrastrando el slider antes de que responda el servidor
      const reqSize = {
        x: spheroidSize.x,
        y: spheroidSize.y,
        z: spheroidSize.z
      };
      const reqCenter = {
        x: objectCenter.x,
        y: objectCenter.y,
        z: objectCenter.z
      };
      const reqBounds = {
        min: zBounds.min,
        max: zBounds.max
      };
      try {
        const response = await fetch('http://localhost:5000/calculate_trajectory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            n: pointCount,
            radius: 1.0,
            cx: reqCenter.x,
            cy: reqCenter.z,  // Python Y es React Z (profundidad)
            cz: reqCenter.y,  // Python Z es React Y (altura vertical)
            sx: reqSize.x,
            sy: reqSize.z,    // Escalado de Python Y es React Z
            sz: reqSize.y,    // Escalado de Python Z es React Y
            min_z: reqBounds.min,
            max_z: reqBounds.max
          })
        });
        const data = await response.json();
        if (active && data.status === 'success' && Array.isArray(data.points)) {
          // Guardamos las coordenadas normalizadas usando los valores capturados en el envío
          const pointsMapped = data.points.map((pt, index) => ({
            unitX: (pt.x - reqCenter.x) / reqSize.x,
            unitY: (pt.z - reqCenter.y) / reqSize.y, // Python Z a React Y
            unitZ: (pt.y - reqCenter.z) / reqSize.z, // Python Y a React Z
            sector: pt.sector,
            rx: pt.rx,
            ry: pt.ry,
            rz: pt.rz,
            originalIndex: index
          }));
          setBackendSequence(pointsMapped);
        }
      } catch (err) {
        console.error('Failed to fetch trajectory from backend:', err);
      }
    };

    const timer = setTimeout(() => {
      fetchTrajectory();
    }, 250); // Debounce de 250ms

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pointCount, spheroidSize.x, spheroidSize.y, spheroidSize.z, objectCenter.x, objectCenter.y, objectCenter.z, zBounds.min, zBounds.max]);

  // Estado para la posición de órbita del robot (0 a 5)
  const [robotPositionIndex, setRobotPositionIndex] = useState(0);

  // Estado para el paso actual de la simulación de fotos
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0);

  // 1. Obtener la trayectoria de Fibonacci y TSP desde el backend de Python
  const globalSequence = useMemo(() => {
    if (backendSequence && backendSequence.length > 0) {
      // Escalamos los puntos unitarios dinámicamente con los valores actuales de los sliders
      return backendSequence.map(pt => ({
        x: pt.unitX * spheroidSize.x,
        y: pt.unitY * spheroidSize.y,
        z: pt.unitZ * spheroidSize.z,
        sector: pt.sector,
        rx: pt.rx,
        ry: pt.ry,
        rz: pt.rz,
        originalIndex: pt.originalIndex
      }));
    }
    return [];
  }, [backendSequence, spheroidSize]);

  // 2. Obtener las coordenadas del punto activo (el que se está fotografiando en este paso)
  const activePoint = useMemo(() => {
    if (currentPhotoStep >= 0 && currentPhotoStep < globalSequence.length) {
      return globalSequence[currentPhotoStep];
    }
    return null;
  }, [globalSequence, currentPhotoStep]);

  // 3. Obtener las posiciones de los puntos restantes (que aún no han sido fotografiados)
  const pendingPointsPositions = useMemo(() => {
    const positions = [];
    globalSequence.forEach((pt, idx) => {
      // Solo incluimos puntos que van después del paso actual (los anteriores ya desaparecieron)
      if (idx > currentPhotoStep) {
        positions.push(pt.x, pt.y, pt.z);
      }
    });
    return new Float32Array(positions);
  }, [globalSequence, currentPhotoStep]);

  // 4. Obtener las coordenadas del punto activo y los siguientes 5 puntos para la trayectoria
  const nextFivePoints = useMemo(() => {
    const points = [];
    if (activePoint) {
      points.push([activePoint.x, activePoint.y, activePoint.z]);
    }
    const startIdx = currentPhotoStep + 1;
    const endIdx = Math.min(globalSequence.length, startIdx + 5);
    for (let i = startIdx; i < endIdx; i++) {
      const pt = globalSequence[i];
      points.push([pt.x, pt.y, pt.z]);
    }
    return points;
  }, [globalSequence, currentPhotoStep, activePoint]);

  // Auto-mover el robot a la estación correspondiente al grupo del punto activo actual
  useEffect(() => {
    if (activePoint !== null) {
      setRobotPositionIndex(activePoint.sector);
    }
  }, [activePoint]);

  // Si cambia el número de puntos totales, reiniciamos el paso de simulación para evitar desbordamientos
  useEffect(() => {
    setCurrentPhotoStep(0);
  }, [pointCount]);

  // Calcular posición del robot en la circunferencia de 1.6m alrededor del objeto
  const robotPosition = useMemo(() => {
    const angle = robotPositionIndex * (Math.PI / 3);
    const radius = 1.6;
    const centerX = objectCenter.x;
    const centerZ = objectCenter.z;
    return [
      centerX + radius * Math.cos(angle),
      0,
      centerZ + radius * Math.sin(angle)
    ];
  }, [robotPositionIndex, objectCenter.x, objectCenter.z]);

  // Calcular rotación para que el robot mire hacia el objeto central
  const robotRotationY = useMemo(() => {
    const angle = robotPositionIndex * (Math.PI / 3);
    return Math.PI - angle;
  }, [robotPositionIndex]);

  const sseConn = useRobotConnection();
  const wsConn = useRobotWebSocket();
  const httpConn = useRobotHttp(ipAddress);

  //const currentJointAngles = manualMode
  //? manualJoints.map(deg => deg * Math.PI / 180)
  //: activeConn.jointAngles;

  const handleConnect = () => {
    // Si es modo HTTP, el hook ya está "conectado" o escuchando por defecto, 
    // así que no necesitamos una acción manual de connect()
    if (connectionMode === 'http') return;

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

  const activeConn = connectionMode === 'websocket'
    ? wsConn
    : (connectionMode === 'sse' ? sseConn : httpConn);

  const currentJointAngles = manualMode
    ? manualJoints.map(deg => deg * Math.PI / 180)
    : activeConn.jointAngles;

  return (
    <div className="dashboard" style={styles.container}>
      {/* Sidebar de Control */}
      <aside className="sidebar glass" style={styles.sidebar}>
        <header style={styles.header}>
          <h1 className="text-gradient">ROBOT DT</h1>
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
              }
              else if (newMode === 'http') {
                setIpAddress('localhost'); // O '192.168.60.10' que es la IP local
              }
              else {
                setIpAddress('192.168.3.5');
              }

            }}
            style={styles.select}
          >
            <option value="websocket">Partner WebSocket</option>
            <option value="sse">Local Flask (SSE)</option>
            <option value="http">Direct HTTP (ESTUN)</option>
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
        <RobotViewer 
          modelType={modelType} 
          jointAngles={currentJointAngles} 
          spheroidSize={spheroidSize}
          showSpheroid={showSpheroid}
          pendingPointsPositions={pendingPointsPositions}
          activePoint={activePoint}
          robotPositionIndex={robotPositionIndex}
          robotPosition={robotPosition}
          robotRotationY={robotRotationY}
          nextFivePoints={nextFivePoints}
          objectCenter={objectCenter}
          zBounds={zBounds}
          showSectors={showSectors}
        />
        <SpheroidPanel 
          spheroidSize={spheroidSize}
          setSpheroidSize={setSpheroidSize}
          showSpheroid={showSpheroid}
          setShowSpheroid={setShowSpheroid}
          pointCount={pointCount}
          setPointCount={setPointCount}
          robotPositionIndex={robotPositionIndex}
          setRobotPositionIndex={setRobotPositionIndex}
          objectCenter={objectCenter}
          setObjectCenter={setObjectCenter}
          zBounds={zBounds}
          setZBounds={setZBounds}
          showSectors={showSectors}
          setShowSectors={setShowSectors}
        />
        <PhotoSimulationPanel 
          currentPhotoStep={currentPhotoStep}
          setCurrentPhotoStep={setCurrentPhotoStep}
          pointCount={pointCount}
          robotPositionIndex={robotPositionIndex}
        />
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
