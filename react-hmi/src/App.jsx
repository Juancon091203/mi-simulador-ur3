import React, { useState, Suspense, useMemo, useEffect } from 'react';
import RobotViewer from './components/three/RobotViewer';
import { useRobotConnection } from './hooks/useRobotConnection';
import { useRobotWebSocket } from './hooks/useRobotWebSocket';
import { useRobotHttp } from './hooks/useRobotHttp';
import BasicOptionsPanel from './components/panels/BasicOptionsPanel';
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
  const [objectCenter, setObjectCenter] = useState({ x: 0.0, y: 1.0, z: 0.0 });
  // Estado para los límites vertical de corte Z en la esfera (relativos al centro, de -1.0 a 1.0)
  const [zBounds, setZBounds] = useState({ min: -1.0, max: 1.0 });
  // Estado para visualizar los gajos de división de los sectores
  const [showSectors, setShowSectors] = useState(false);

  // Estado para la altura de la columna del robot y radio de órbita
  const [columnHeight, setColumnHeight] = useState(0.5);
  const [orbitRadius, setOrbitRadius] = useState(1.6);

  // Estado para la trayectoria obtenida del backend de Python
  const [backendSequence, setBackendSequence] = useState([]);

  // Estado para el modo oscuro/claro
  const [darkMode, setDarkMode] = useState(true);

  // Estado para saber si se está calculando la trayectoria en el backend
  const [isCalculating, setIsCalculating] = useState(false);

  // Presets
  const [presets, setPresets] = useState({});

  // Fetch presets on load
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch('http://localhost:5000/presets');
        const data = await response.json();
        setPresets(data);
      } catch (err) {
        console.error('Failed to fetch presets:', err);
      }
    };
    fetchPresets();
  }, []);

  const handleSavePreset = async (name) => {
    const config = {
      spheroidSize,
      objectCenter,
      zBounds,
      pointCount,
      columnHeight,
      orbitRadius,
      modelType
    };
    try {
      const response = await fetch('http://localhost:5000/save_preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPresets(data.presets);
      }
    } catch (err) {
      console.error('Failed to save preset:', err);
    }
  };

  const handleDeletePreset = async (name) => {
    try {
      const response = await fetch('http://localhost:5000/delete_preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPresets(data.presets);
      }
    } catch (err) {
      console.error('Failed to delete preset:', err);
    }
  };

  const handleLoadPreset = (name) => {
    const config = presets[name];
    if (!config) return;
    if (config.spheroidSize) setSpheroidSize(config.spheroidSize);
    if (config.objectCenter) setObjectCenter(config.objectCenter);
    if (config.zBounds) setZBounds(config.zBounds);
    if (config.pointCount !== undefined) setPointCount(config.pointCount);
    if (config.columnHeight !== undefined) setColumnHeight(config.columnHeight);
    if (config.orbitRadius !== undefined) setOrbitRadius(config.orbitRadius);
    if (config.modelType) setModelType(config.modelType);
  };

  // Efecto para aplicar el tema al body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  // Fetch de la trayectoria desde el backend con debouncing para evitar congelar la interfaz al arrastrar sliders
  useEffect(() => {
    let active = true;
    setIsCalculating(true);
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
        if (active) {
          if (data.status === 'success' && Array.isArray(data.points)) {
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
          } else {
            setBackendSequence([]);
          }
          setIsCalculating(false);
        }
      } catch (err) {
        console.error('Failed to fetch trajectory from backend:', err);
        if (active) {
          setBackendSequence([]);
          setIsCalculating(false);
        }
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

  // Calcular posición del robot en la circunferencia alrededor del objeto
  const robotPosition = useMemo(() => {
    const angle = robotPositionIndex * (Math.PI / 3);
    const centerX = objectCenter.x;
    const centerZ = objectCenter.z;
    return [
      centerX + orbitRadius * Math.cos(angle),
      -0.543 + columnHeight,
      centerZ + orbitRadius * Math.sin(angle)
    ];
  }, [robotPositionIndex, objectCenter.x, objectCenter.z, orbitRadius, columnHeight]);

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
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
                    style={{
                      width: '100%',
                      accentColor: 'var(--accent-blue)',
                      background: 'var(--slider-track-bg)',
                      height: '8px',
                      borderRadius: '4px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
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
        {/* Progress Circle Floating HUD */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 100,
          pointerEvents: 'none', // Permite click-through
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-focus)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: 'rotate(140deg)' }}>
              <defs>
                <linearGradient id="hudProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d2ff" />
                  <stop offset="100%" stopColor="#ff9d00" />
                </linearGradient>
              </defs>
              <circle
                cx={50}
                cy={50}
                r={40}
                fill="transparent"
                stroke="var(--progress-track)"
                strokeWidth={6}
                strokeDasharray={`${2 * Math.PI * 40 * 260 / 360} ${2 * Math.PI * 40}`}
                strokeLinecap="round"
              />
              <circle
                cx={50}
                cy={50}
                r={40}
                fill="transparent"
                stroke="url(#hudProgressGrad)"
                strokeWidth={6}
                strokeDasharray={`${(pointCount > 0 ? (currentPhotoStep / pointCount) : 0) * (2 * Math.PI * 40 * 260 / 360)} ${2 * Math.PI * 40}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100px',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-color)', lineHeight: '1.2' }}>
                {(pointCount > 0 ? (currentPhotoStep / pointCount) * 100 : 0).toFixed(0)}%
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>
                {currentPhotoStep >= pointCount ? 'DONE' : `${currentPhotoStep}/${pointCount}`}
              </span>
            </div>
          </div>
        </div>

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
          darkMode={darkMode}
          columnHeight={columnHeight}
          orbitRadius={orbitRadius}
        />

        {/* Indicador de cálculo de Fibonacci */}
        {isCalculating && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'var(--bg-panel)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border-glass)',
            padding: '10px 18px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            color: 'var(--text-color)',
            transition: 'all 0.3s ease'
          }}>
            <div className="spinner" style={{
              width: '12px',
              height: '12px',
              border: '2px solid var(--text-dim)',
              borderTopColor: 'var(--accent-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--accent-blue)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Calculating...
            </span>
          </div>
        )}

        {/* Contenedor lateral derecho para los paneles de control */}
        <div className="right-panels-container" style={styles.rightPanelsContainer}>
          <BasicOptionsPanel
            spheroidSize={spheroidSize}
            setSpheroidSize={setSpheroidSize}
            showSpheroid={showSpheroid}
            setShowSpheroid={setShowSpheroid}
            pointCount={pointCount}
            setPointCount={setPointCount}
            objectCenter={objectCenter}
            setObjectCenter={setObjectCenter}
            zBounds={zBounds}
            setZBounds={setZBounds}
            showSectors={showSectors}
            setShowSectors={setShowSectors}
            columnHeight={columnHeight}
            setColumnHeight={setColumnHeight}
            orbitRadius={orbitRadius}
            setOrbitRadius={setOrbitRadius}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            presets={presets}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            onLoadPreset={handleLoadPreset}
          />
          <PhotoSimulationPanel
            currentPhotoStep={currentPhotoStep}
            setCurrentPhotoStep={setCurrentPhotoStep}
            pointCount={pointCount}
          />
        </div>
      </main>
    </div>
  );
};

const styles = {
  rightPanelsContainer: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    bottom: '20px',
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowY: 'auto',
    overflowX: 'hidden',
    zIndex: 100,
    paddingRight: '6px', // Espacio para el gutter de la barra de desplazamiento
  },
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    background: 'var(--bg-dark)',
    transition: 'background 0.3s ease',
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
    overflowY: 'auto',
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
    color: 'var(--text-dim)',
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
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  select: {
    padding: '12px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    color: 'var(--text-color)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  input: {
    padding: '12px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    color: 'var(--text-color)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
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
    background: 'var(--card-bg)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    boxShadow: '0 0 10px currentColor',
  },
  statusText: {
    fontSize: '0.8rem',
    color: 'var(--text-color)',
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
    background: 'var(--card-bg)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.3s ease',
  },
  jointLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
  },
  jointValue: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--accent-blue)',
  },
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '15px',
    background: 'var(--card-bg)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    maxHeight: '220px',
    overflowY: 'auto',
    transition: 'all 0.3s ease',
  },
  sliderItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }
};

export default App;
