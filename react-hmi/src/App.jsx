import React, { useState, Suspense, useMemo, useEffect } from 'react';
import RobotViewer from './components/three/RobotViewer';
import { useRobotConnection } from './hooks/useRobotConnection';
import { useRobotWebSocket } from './hooks/useRobotWebSocket';
import { useRobotHttp } from './hooks/useRobotHttp';
import BasicOptionsPanel from './components/panels/BasicOptionsPanel';
import PhotoSimulationPanel from './components/panels/PhotoSimulationPanel';
import CameraViewer from './components/panels/CameraViewer';
import PhotosGalleryModal from './components/panels/PhotosGalleryModal';

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

  // Lifted and camera states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRobotConnected, setIsRobotConnected] = useState(false);
  const [stabilityThreshold, setStabilityThreshold] = useState(0.25);
  const [photos, setPhotos] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Fetch presets and photos on load
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch('http://localhost:5005/presets');
        const data = await response.json();
        setPresets(data);
      } catch (err) {
        console.error('Failed to fetch presets:', err);
      }
    };
    const fetchPhotos = async () => {
      try {
        const response = await fetch('http://localhost:5005/camera/photos');
        const data = await response.json();
        setPhotos(data);
      } catch (err) {
        console.error('Failed to fetch photos on load:', err);
      }
    };
    fetchPresets();
    fetchPhotos();
  }, []);



  const handleSavePreset = async (name) => {
    const config = {
      spheroidSize,
      objectCenter,
      zBounds,
      pointCount,
      columnHeight,
      orbitRadius
    };
    try {
      const response = await fetch('http://localhost:5005/save_preset', {
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
      const response = await fetch('http://localhost:5005/delete_preset', {
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
        const response = await fetch('http://localhost:5005/calculate_trajectory', {
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

  // Clear photos
  const handleClearPhotos = async () => {
    try {
      const response = await fetch('http://localhost:5005/camera/clear_photos', { method: 'POST' });
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error('Failed to clear photos:', err);
    }
  };

  // Delete individual photo
  const handleDeletePhoto = async (stepIndex) => {
    try {
      const response = await fetch('http://localhost:5005/camera/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepIndex })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  // Manual capture and next/prev
  const handleManualNext = async () => {
    if (currentPhotoStep < pointCount) {
      try {
        const response = await fetch('http://localhost:5005/camera/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: currentPhotoStep })
        });
        const data = await response.json();
        if (data.status === 'success') {
          setPhotos(data.photos);
        }
      } catch (err) {
        console.error('Failed manual photo capture:', err);
      }
      setCurrentPhotoStep((prev) => prev + 1);
    }
  };

  const handleManualPrev = () => {
    if (currentPhotoStep > 0) {
      setCurrentPhotoStep((prev) => prev - 1);
    }
  };

  // Automated Event-Driven Run Sequence based on camera stability transitions (unstable -> stable)
  useEffect(() => {
    if (!isPlaying) return;

    let active = true;
    let hasSeenUnstable = false;
    let isCapturing = false;

    const checkLoop = async () => {
      while (active && isPlaying) {
        try {
          const response = await fetch('http://localhost:5005/camera/status');
          if (!response.ok) throw new Error('Status request failed');
          const statusData = await response.json();

          if (!active || !isPlaying) break;

          const isStable = statusData.stable;

          if (!isStable) {
            // Camera is currently moving/vibrating (unstable)
            hasSeenUnstable = true;
          } else if (isStable && !isCapturing) {
            // Camera settled (stable)
            // Check if we already have a photo for the current step to avoid duplicate captures
            const hasPhotoForStep = photos.some((p) => p.step === currentPhotoStep);

            // We capture if we have either seen it unstable first (due to robot movement),
            // OR if it's the very beginning of the run (step 0) and we don't have a photo yet.
            if (hasSeenUnstable || (!hasPhotoForStep && currentPhotoStep === 0)) {
              isCapturing = true;

              try {
                const captureRes = await fetch('http://localhost:5005/camera/capture', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ step: currentPhotoStep })
                });
                const captureData = await captureRes.json();

                if (captureData.status === 'success' && active) {
                  setPhotos(captureData.photos);
                }
              } catch (err) {
                console.error('Error capturing photo in play run:', err);
              }

              if (!active || !isPlaying) break;

              // Move to the next step
              setCurrentPhotoStep((prev) => {
                const next = prev + 1;
                if (next >= pointCount) {
                  setIsPlaying(false);
                }
                return next;
              });

              // Reset flags for the next step
              hasSeenUnstable = false;
              isCapturing = false;
            }
          }
        } catch (err) {
          console.error('Error polling camera stability in run loop:', err);
        }

        // Poll every 250ms for snappy responsiveness
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    };

    checkLoop();

    return () => {
      active = false;
    };
  }, [isPlaying, currentPhotoStep, pointCount, photos]);

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

  const activeConn = connectionMode === 'websocket'
    ? wsConn
    : (connectionMode === 'sse' ? sseConn : httpConn);

  // Auto-connect to the active robot connection on mount or parameter changes
  useEffect(() => {
    if (connectionMode === 'websocket') {
      const url = ipAddress.startsWith('ws://') || ipAddress.startsWith('wss://')
        ? ipAddress
        : `ws://${ipAddress}`;
      console.log(`[HMI] Auto-connecting to WebSocket: ${url}`);
      wsConn.connect(url);
      return () => {
        console.log('[HMI] Disconnecting WebSocket.');
        wsConn.disconnect();
      };
    } else if (connectionMode === 'sse') {
      console.log(`[HMI] Auto-connecting to SSE Server: ${ipAddress}`);
      sseConn.connect(ipAddress);
      return () => {
        console.log('[HMI] Disconnecting SSE.');
        sseConn.disconnect();
      };
    }
  }, [connectionMode, ipAddress]);

  const currentJointAngles = manualMode
    ? manualJoints.map(deg => deg * Math.PI / 180)
    : activeConn.jointAngles;

  return (
    <div className="dashboard" style={styles.container}>
      {/* Sidebar de Control */}
      <aside className="sidebar glass" style={styles.sidebar}>
        <header style={styles.header}>
          <h1 className="text-gradient">Automated Photography Studio</h1>
        </header>
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
          isGalleryOpen={isGalleryOpen}
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
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            isRobotConnected={isRobotConnected}
            setIsRobotConnected={setIsRobotConnected}
          />
          <PhotoSimulationPanel
            currentPhotoStep={currentPhotoStep}
            pointCount={pointCount}
            onNext={handleManualNext}
            onPrev={handleManualPrev}
            onViewPhotos={() => setIsGalleryOpen(true)}
          />
        </div>

        {/* Visor pequeño flotante de la cámara FRAMOS */}
        <CameraViewer
          stabilityThreshold={stabilityThreshold}
          setStabilityThreshold={setStabilityThreshold}
        />

        {/* Modal de la Galería de fotos */}
        <PhotosGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          photos={photos}
          onClearPhotos={handleClearPhotos}
          onDeletePhoto={handleDeletePhoto}
        />
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
    zIndex: 150,
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
