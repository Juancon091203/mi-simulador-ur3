import React, { useState, Suspense, useMemo, useEffect } from 'react';
import RobotViewer from './components/three/RobotViewer';
import { useRobotConnection } from './hooks/useRobotConnection';
import { useRobotWebSocket } from './hooks/useRobotWebSocket';
import { useRobotHttp } from './hooks/useRobotHttp';
import BasicOptionsPanel from './components/panels/BasicOptionsPanel';
import PhotoSimulationPanel from './components/panels/PhotoSimulationPanel';
import CameraViewer from './components/panels/CameraViewer';
import PhotosGalleryModal from './components/panels/PhotosGalleryModal';
import vibrationIcon from './icon_vibracion-03.svg';

const App = () => {
  const [modelType, setModelType] = useState('UR8L_con_garra');
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
  const [cameraConnected, setCameraConnected] = useState(false);

  // Poll camera status to detect online/offline state
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const response = await fetch('http://localhost:5005/camera/status');
        const data = await response.json();
        setCameraConnected(data.camera_connected);
      } catch (err) {
        setCameraConnected(false);
      }
    };
    checkCamera();
    const interval = setInterval(checkCamera, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- NUEVOS ESTADOS MULTI-ESTACIÓN Y LOGIN CON ROLES ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // 'admin' | 'operator'
  const [currentUser, setCurrentUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Estados de navegación principal y sub-vistas
  const [activeStationTab, setActiveStationTab] = useState('general'); // 'general' | stationId (number)
  const [activeSubView, setActiveSubView] = useState('dashboard'); // 'dashboard' | 'vnc' | 'camera' | 'config'

  // Cuadrícula de 4 estaciones
  const [stations, setStations] = useState([
    { id: 1, name: 'Station 1', ip: '192.168.3.10', status: 'idle', product: 'None', savePath: 'C:/Photos/Station1', progress: 0, photoCount: 0, maxPhotos: 100, speed: 0.0 },
    { id: 2, name: 'Station 2', ip: '192.168.3.11', status: 'running', product: 'Running Shoes', savePath: 'C:/Photos/Station2', progress: 45, photoCount: 45, maxPhotos: 100, speed: 0.8 },
    { id: 3, name: 'Station 3', ip: '192.168.3.12', status: 'warning', product: 'Sunglasses', savePath: 'C:/Photos/Station3', progress: 75, photoCount: 75, maxPhotos: 100, speed: 0.5 },
    { id: 4, name: 'Station 4', ip: '192.168.3.13', status: 'emergency', product: 'Wristwatch', savePath: 'C:/Photos/Station4', progress: 20, photoCount: 20, maxPhotos: 100, speed: 0.2 },
  ]);
  const [showAddStationInput, setShowAddStationInput] = useState(false);
  const [newStationIp, setNewStationIp] = useState('');

  // Modal de Configuración (3 Pestañas)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configStationId, setConfigStationId] = useState(null);
  const [configActiveTab, setConfigActiveTab] = useState('basic'); // 'basic' | 'camera' | 'station'
  const [configFormData, setConfigFormData] = useState({
    productName: '',
    savePath: 'C:/Photos/Product',
    robotSpeed: 0.5,
    cameraAutoExposure: true,
    cameraShutterMs: 5.0,
    cameraGain: 64,
  });

  // Cola de ejecuciones por estación
  const [stationQueues, setStationQueues] = useState({
    1: [],
    2: [],
    3: [],
    4: []
  });
  const [stationQueueStatus, setStationQueueStatus] = useState({
    1: { isPlaying: false, currentIndex: 0 },
    2: { isPlaying: false, currentIndex: 0 },
    3: { isPlaying: false, currentIndex: 0 },
    4: { isPlaying: false, currentIndex: 0 }
  });
  const [promptStationId, setPromptStationId] = useState(null);
  const [showObjectChangePrompt, setShowObjectChangePrompt] = useState(false);
  const [editingQueueItem, setEditingQueueItem] = useState(null); // Para editar elementos de la cola

  // Estados para la gestión y creación de presets
  const [editingPresetName, setEditingPresetName] = useState(null); // nombre o '__new__'
  const [editingPresetForm, setEditingPresetForm] = useState(''); // nombre del nuevo preset

  // Alerta de Emergencia
  const [emergencyAlert, setEmergencyAlert] = useState(null); // { stationName: string, problem: string } | null

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

  // --- HELPERS AND EFFECTS FOR COWORKER BACKEND + QUEUE + ALERTS ---

  // 1. Add Station Helper
  const handleAddStation = (e) => {
    e.preventDefault();
    if (!newStationIp) return;
    setStations(prev => [
      ...prev,
      {
        id: prev.length + 1,
        name: `Station ${prev.length + 1}`,
        ip: newStationIp,
        status: 'idle',
        product: 'None',
        progress: 0,
        photoCount: 0,
        maxPhotos: 100,
        speed: 0.0
      }
    ]);
    setNewStationIp('');
    setShowAddStationInput(false);
  };

  const handleUpdateStationConfig = (id, newProduct, newPath) => {
    setStations(prev => prev.map(st => {
      if (st.id === id) {
        return { ...st, product: newProduct, savePath: newPath };
      }
      return st;
    }));
  };

  // 2. Add to Queue Helper (per-station)
  const handleAddToQueue = () => {
    const newItem = {
      id: editingQueueItem ? editingQueueItem.id : Date.now(),
      productName: configFormData.productName || 'Unnamed Product',
      savePath: configFormData.savePath,
      robotSpeed: configFormData.robotSpeed,
      stationId: configStationId,
      stationName: stations.find(s => s.id === configStationId)?.name || `Station ${configStationId}`,
      ...configFormData
    };

    if (editingQueueItem) {
      // Edit queue item in-place
      setStationQueues(prev => {
        const stationId = editingQueueItem.stationId;
        const updatedQueue = prev[stationId].map(item => item.id === editingQueueItem.id ? newItem : item);
        return { ...prev, [stationId]: updatedQueue };
      });
      setEditingQueueItem(null);
    } else {
      // Append to the station's queue
      setStationQueues(prev => ({
        ...prev,
        [configStationId]: [...(prev[configStationId] || []), newItem]
      }));
    }

    setIsConfigModalOpen(false);
    setConfigFormData({
      productName: '',
      savePath: 'C:/Photos/Product',
      robotSpeed: 0.5,
      cameraAutoExposure: true,
      cameraShutterMs: 5.0,
      cameraGain: 64,
    });
  };

  // 3. Station Specific Queue Controls
  const handlePlayStationQueue = (stationId) => {
    setStationQueueStatus(prev => {
      const status = prev[stationId] || { isPlaying: false, currentIndex: 0 };
      const queue = stationQueues[stationId] || [];
      if (queue.length === 0) return prev;
      return {
        ...prev,
        [stationId]: { ...status, isPlaying: true }
      };
    });
  };

  const handlePauseStationQueue = (stationId) => {
    setStationQueueStatus(prev => {
      const status = prev[stationId] || { isPlaying: false, currentIndex: 0 };
      return {
        ...prev,
        [stationId]: { ...status, isPlaying: false }
      };
    });
  };

  const handleRemoveQueueItem = (stationId, itemId) => {
    setStationQueues(prev => {
      const queue = prev[stationId] || [];
      const updated = queue.filter(item => item.id !== itemId);
      return { ...prev, [stationId]: updated };
    });
    // Adjust currentIndex if necessary
    setStationQueueStatus(prev => {
      const status = prev[stationId];
      const queue = stationQueues[stationId] || [];
      const removedIndex = queue.findIndex(item => item.id === itemId);
      if (removedIndex !== -1 && status.currentIndex >= removedIndex) {
        const nextIndex = Math.max(0, status.currentIndex - 1);
        return {
          ...prev,
          [stationId]: { ...status, currentIndex: nextIndex, isPlaying: queue.length > 1 ? status.isPlaying : false }
        };
      }
      return prev;
    });
  };

  const handleEditQueueItem = (item) => {
    setEditingQueueItem(item);
    setConfigStationId(item.stationId);
    setConfigFormData({
      productName: item.productName,
      savePath: item.savePath,
      robotSpeed: item.robotSpeed,
      cameraAutoExposure: item.cameraAutoExposure,
      cameraShutterMs: item.cameraShutterMs,
      cameraGain: item.cameraGain,
    });
    setIsConfigModalOpen(true);
  };

  const handleMoveQueueItem = (stationId, index, direction) => {
    setStationQueues(prev => {
      const queue = [...(prev[stationId] || [])];
      if (direction === 'up' && index > 0) {
        const temp = queue[index];
        queue[index] = queue[index - 1];
        queue[index - 1] = temp;
      } else if (direction === 'down' && index < queue.length - 1) {
        const temp = queue[index];
        queue[index] = queue[index + 1];
        queue[index + 1] = temp;
      }
      return { ...prev, [stationId]: queue };
    });
  };

  const handleContinueQueue = () => {
    setShowObjectChangePrompt(false);
    if (promptStationId) {
      const stationId = promptStationId;
      setStationQueueStatus(prev => {
        const status = prev[stationId];
        const nextIndex = status.currentIndex + 1;
        setStations(stPrev => stPrev.map(st => {
          if (st.id === stationId) {
            return { ...st, progress: 0, photoCount: 0 };
          }
          return st;
        }));
        return {
          ...prev,
          [stationId]: { isPlaying: true, currentIndex: nextIndex }
        };
      });
      setPromptStationId(null);
    }
  };

  const handleStationQueueItemFinished = (stationId) => {
    setStationQueueStatus(prev => {
      const status = prev[stationId];
      const queue = stationQueues[stationId] || [];
      const nextIndex = status.currentIndex + 1;

      if (nextIndex < queue.length) {
        setPromptStationId(stationId);
        setShowObjectChangePrompt(true);
        return {
          ...prev,
          [stationId]: { ...status, isPlaying: false }
        };
      } else {
        alert(`Station ${stationId} queue completed successfully!`);
        setStations(stPrev => stPrev.map(st => {
          if (st.id === stationId) {
            return { ...st, status: 'idle', product: 'None', progress: 0, photoCount: 0, speed: 0.0 };
          }
          return st;
        }));
        setStationQueues(qPrev => ({ ...qPrev, [stationId]: [] }));
        return {
          ...prev,
          [stationId]: { isPlaying: false, currentIndex: 0 }
        };
      }
    });
  };

  // 4. Parallel Queue runner effect
  useEffect(() => {
    const activeStations = Object.keys(stationQueueStatus).filter(stationIdStr => {
      const stationId = parseInt(stationIdStr);
      const status = stationQueueStatus[stationId];
      const queue = stationQueues[stationId] || [];
      return status.isPlaying && queue.length > 0 && status.currentIndex < queue.length;
    });

    if (activeStations.length === 0) return;

    const interval = setInterval(() => {
      activeStations.forEach(stationIdStr => {
        const stationId = parseInt(stationIdStr);
        const status = stationQueueStatus[stationId];
        const queue = stationQueues[stationId];
        const currentItem = queue[status.currentIndex];

        setStations(prev => {
          let itemFinished = false;
          const updated = prev.map(st => {
            if (st.id === stationId) {
              const nextCount = st.photoCount + 5;
              if (nextCount >= st.maxPhotos) {
                itemFinished = true;
                return { ...st, status: 'idle', photoCount: st.maxPhotos, progress: 100 };
              }
              return {
                ...st,
                status: 'running',
                product: currentItem.productName,
                speed: currentItem.robotSpeed,
                photoCount: nextCount,
                progress: Math.round((nextCount / st.maxPhotos) * 100)
              };
            }
            return st;
          });

          if (itemFinished) {
            setTimeout(() => handleStationQueueItemFinished(stationId), 50);
          }
          return updated;
        });
      });
    }, 500);

    return () => clearInterval(interval);
  }, [stationQueueStatus, stationQueues]);

  // 5. Emergency Alert Poller effect
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5005/api/alert_status');
        if (response.ok) {
          const data = await response.json();
          if (data.alert) {
            setEmergencyAlert(data.alert);
            setStations(prev => prev.map(st => {
              if (st.name === data.alert.station) {
                return { ...st, status: 'emergency' };
              }
              return st;
            }));
          }
        }
      } catch (err) {
        // silent
      }
    };
    const interval = setInterval(checkAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAlert = async () => {
    try {
      await fetch('http://127.0.0.1:5005/api/clear_alert', { method: 'POST' });
      // Reset that station to idle
      setStations(prev => prev.map(st => {
        if (st.name === emergencyAlert?.station) {
          return { ...st, status: 'idle' };
        }
        return st;
      }));
      setEmergencyAlert(null);
    } catch (err) {
      console.error('Failed to clear alert:', err);
    }
  };

  const currentJointAngles = manualMode
    ? manualJoints.map(deg => deg * Math.PI / 180)
    : activeConn.jointAngles;

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card glass">
          <header>
            <h1 className="login-title text-gradient">Automated Photography Studio</h1>
            <p className="login-subtitle">Control Panel Access</p>
          </header>
          <form className="login-form" onSubmit={(e) => {
            e.preventDefault();
            setIsAuthenticated(true);
          }}>
            <div className="login-field">
              <label>Username</label>
              <input
                type="text"
                placeholder="e.g. operator1"
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                style={styles.input}
              />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                style={styles.input}
              />
            </div>
            <div className="login-field">
              <label>Testing Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                style={styles.select}
              >
                <option value="admin">Administrator (Full Control)</option>
                <option value="operator">Operator (Read / Queue Only)</option>
              </select>
            </div>
            <button
              type="submit"
              className="glass"
              style={{
                ...styles.button,
                backgroundColor: 'var(--accent-blue)',
                boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)',
                marginTop: '10px'
              }}
            >
              SIGN IN
            </button>
            <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', padding: '0 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentUser('BypassUser');
                setUserRole('admin');
                setIsAuthenticated(true);
              }}
              style={{
                ...styles.button,
                background: 'linear-gradient(135deg, #00ff88, #00d2ff)',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
                color: '#000000',
                fontWeight: '900',
              }}
            >
              ⚡ QUICK ACCESS (BYPASS)
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentStation = activeStationTab !== 'general'
    ? stations.find(st => st.id === activeStationTab)
    : null;

  return (
    <div className="dashboard" style={styles.container}>
      {/* Botón de Modo Claro / Oscuro en la esquina superior derecha */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '8px 12px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-glass)',
          borderRadius: '20px',
          color: 'var(--text-color)',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-focus)',
          backdropFilter: 'blur(10px)',
          fontSize: '0.8rem',
          width: 'auto',
        }}
      >
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {/* Sidebar de Control */}
      <aside className="sidebar glass" style={styles.sidebar}>
        <header style={styles.header}>
          <h1 className="text-gradient" style={{ fontSize: '1.1rem', marginBottom: '5px' }}>Automated Photography Studio</h1>
          <p style={styles.subtitle}>Industrial HMI Dashboard</p>
        </header>

        {/* --- Dropdown Navegador de Estaciones --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={styles.label}>Navigation / View</label>
          <select
            value={activeStationTab}
            onChange={(e) => {
              const val = e.target.value;
              setActiveStationTab(val === 'general' ? 'general' : parseInt(val));
              setActiveSubView('dashboard'); // Restablecer a Dashboard por defecto
            }}
            style={styles.select}
          >
            <option value="general">🌐 General View (4 Stations)</option>
            {stations.map(st => (
              <option key={st.id} value={st.id}>🤖 {st.name} ({st.ip})</option>
            ))}
          </select>
        </div>

        {/* --- Sub-View Buttons (dependiendo del contexto activo) --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveSubView('dashboard')}
            style={{
              ...styles.button,
              padding: '12px',
              fontSize: '0.8rem',
              textAlign: 'left',
              background: activeSubView === 'dashboard' ? 'var(--accent-blue)' : 'var(--input-bg)',
              border: '1px solid var(--border-glass)',
              color: activeSubView === 'dashboard' ? '#000000' : 'var(--text-color)',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeSubView === 'dashboard' ? '0 0 10px rgba(0,210,255,0.2)' : 'none'
            }}
          >
            🖥️ Dashboard {activeStationTab !== 'general' ? '(3D)' : ''}
          </button>

          {activeStationTab === 'general' && (
            <button
              onClick={() => setActiveSubView('presets')}
              style={{
                ...styles.button,
                padding: '12px',
                fontSize: '0.8rem',
                textAlign: 'left',
                background: activeSubView === 'presets' || activeSubView === 'calibration' ? 'var(--accent-blue)' : 'var(--input-bg)',
                border: '1px solid var(--border-glass)',
                color: activeSubView === 'presets' || activeSubView === 'calibration' ? '#000000' : 'var(--text-color)',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeSubView === 'presets' || activeSubView === 'calibration' ? '0 0 10px rgba(0,210,255,0.2)' : 'none'
              }}
            >
              📐 Presets
            </button>
          )}

          {activeStationTab !== 'general' && (
            <>
              <button
                onClick={() => setActiveSubView('vnc')}
                style={{
                  ...styles.button,
                  padding: '12px',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  background: activeSubView === 'vnc' ? 'var(--accent-blue)' : 'var(--input-bg)',
                  border: '1px solid var(--border-glass)',
                  color: activeSubView === 'vnc' ? '#000000' : 'var(--text-color)',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: activeSubView === 'vnc' ? '0 0 10px rgba(0,210,255,0.2)' : 'none'
                }}
              >
                🎮 VNC Viewer (TeachPendant)
              </button>
              <button
                onClick={() => setActiveSubView('camera')}
                style={{
                  ...styles.button,
                  padding: '12px',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  background: activeSubView === 'camera' ? 'var(--accent-blue)' : 'var(--input-bg)',
                  border: '1px solid var(--border-glass)',
                  color: activeSubView === 'camera' ? '#000000' : 'var(--text-color)',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: activeSubView === 'camera' ? '0 0 10px rgba(0,210,255,0.2)' : 'none'
                }}
              >
                📷 Camera (2D)
              </button>
              <button
                onClick={() => setActiveSubView('config')}
                style={{
                  ...styles.button,
                  padding: '12px',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  background: activeSubView === 'config' ? 'var(--accent-blue)' : 'var(--input-bg)',
                  border: '1px solid var(--border-glass)',
                  color: activeSubView === 'config' ? '#000000' : 'var(--text-color)',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: activeSubView === 'config' ? '0 0 10px rgba(0,210,255,0.2)' : 'none'
                }}
              >
                ⚙️ Station Settings
              </button>
            </>
          )}
        </div>

        {/* Execution Queue Controls & List */}
        {activeStationTab !== 'general' && (() => {
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
                    <div key={item.id} className={`queue-item ${idx === status.currentIndex ? 'active' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '6px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{item.productName}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>{item.robotSpeed} m/s • {item.pointCount || 100} pts</span>
                      </div>
                      
                      {/* Controls inside the queue item */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {idx === status.currentIndex && status.isPlaying && (
                          <span className="spinner" style={{ width: '8px', height: '8px', border: '1px solid var(--text-dim)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }} />
                        )}
                        <button
                          onClick={() => handleMoveQueueItem(currentStation.id, idx, 'up')}
                          disabled={idx === 0}
                          style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-color)', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '2px', fontSize: '0.7rem', opacity: idx === 0 ? 0.3 : 1 }}
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveQueueItem(currentStation.id, idx, 'down')}
                          disabled={idx === sQueue.length - 1}
                          style={{ background: 'none', border: 'none', color: idx === sQueue.length - 1 ? 'var(--text-dim)' : 'var(--text-color)', cursor: idx === sQueue.length - 1 ? 'not-allowed' : 'pointer', padding: '2px', fontSize: '0.7rem', opacity: idx === sQueue.length - 1 ? 0.3 : 1 }}
                          title="Move Down"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => handleEditQueueItem(item)}
                          style={{ background: 'none', border: 'none', color: '#00d2ff', cursor: 'pointer', padding: '2px', fontSize: '0.85rem' }}
                          title="Edit task"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleRemoveQueueItem(currentStation.id, item.id)}
                          style={{ background: 'none', border: 'none', color: '#ff4b2b', cursor: 'pointer', padding: '2px', fontSize: '0.8rem' }}
                          title="Remove task"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* User Card info & Logout (smaller, at the bottom of sidebar) */}
        <div style={{
          marginTop: 'auto',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>{currentUser || 'Anonymous User'}</span>
            <span style={{
              fontSize: '0.55rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              background: userRole === 'admin' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 210, 255, 0.15)',
              color: userRole === 'admin' ? '#00ff88' : 'var(--accent-blue)',
              padding: '1px 6px',
              borderRadius: '8px'
            }}>
              {userRole}
            </span>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            style={{
              ...styles.button,
              padding: '6px 10px',
              fontSize: '0.7rem',
              background: 'none',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-color)',
              marginTop: '2px',
              width: '100%'
            }}
          >
            Log Out / Change Role
          </button>
        </div>
      </aside>

      {/* --- PANEL PRINCIPAL DE CONTENIDO (DERECHA) --- */}
      {activeStationTab === 'general' && activeSubView !== 'presets' && activeSubView !== 'calibration' ? (
        /* VISTA GENERAL (DASHBOARD DE LAS 4 ESTACIONES) */
        <main className="stations-container">
          <header className="stations-header-row">
            <div>
              <h2 style={{ fontSize: '1.6rem' }}>Station Overview</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>Central Multi-Station Monitoring Console</p>
            </div>
            {userRole === 'admin' && (
              <button
                onClick={() => {
                  setConfigStationId(stations[0]?.id || null);
                  setIsConfigModalOpen(true);
                }}
                style={{ ...styles.button, width: '180px', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                ⚙️ New Execution
              </button>
            )}
          </header>

          <div className="stations-grid">
            {stations.map(st => (
              <div
                key={st.id}
                className={`station-card glass status-${st.status}`}
                onClick={() => {
                  setActiveStationTab(st.id);
                  setActiveSubView('dashboard');
                }}
              >
                <div className="station-header">
                  <div>
                    <div className="station-title">{st.name}</div>
                    <div className="station-ip">{st.ip}</div>
                  </div>
                  <span className={`station-status-pill status-pill-${st.status}`}>
                    {st.status === 'running' ? 'Running' : st.status === 'idle' ? 'Idle' : st.status === 'warning' ? 'Warning Stop' : 'Emergency'}
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

                  {/* Progress Circle SVG Graphic */}
                  <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                    <svg width={70} height={70} viewBox="0 0 100 100" style={{ transform: 'rotate(140deg)' }}>
                      <circle
                        cx={50}
                        cy={50}
                        r={40}
                        fill="transparent"
                        stroke="var(--progress-track)"
                        strokeWidth={8}
                        strokeDasharray={`${2 * Math.PI * 40 * 260 / 360} ${2 * Math.PI * 40}`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx={50}
                        cy={50}
                        r={40}
                        fill="transparent"
                        stroke="var(--accent-blue)"
                        strokeWidth={8}
                        strokeDasharray={`${(st.maxPhotos > 0 ? (st.photoCount / st.maxPhotos) : 0) * (2 * Math.PI * 40 * 260 / 360)} ${2 * Math.PI * 40}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '70px',
                      height: '70px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      pointerEvents: 'none'
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
      ) : (
        /* VISTA INDIVIDUAL DE ESTACIÓN DETALLADA */
        <main className="stations-container">
          {currentStation && (
            <header className="stations-header-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button
                    onClick={() => {
                      setActiveStationTab('general');
                      setActiveSubView('dashboard');
                    }}
                    style={{
                      width: 'auto',
                      padding: '8px 16px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'var(--text-color)',
                      fontWeight: 'bold'
                    }}
                  >
                    ← Back
                  </button>
                  <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{currentStation.name}</h2>
                  <span className={`station-status-pill status-pill-${currentStation.status}`}>
                    {currentStation.status === 'running' ? 'Running' : currentStation.status === 'idle' ? 'Idle' : currentStation.status === 'warning' ? 'Warning Stop' : 'Emergency'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '6px' }}>Robot IP Address: {currentStation.ip}</p>
              </div>
              {userRole === 'admin' && (
                <button
                  onClick={() => {
                    setConfigStationId(currentStation.id);
                    setIsConfigModalOpen(true);
                  }}
                  style={{ ...styles.button, width: '180px', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  ⚙️ Configure Execution
                </button>
              )}
            </header>
          )}

          {/* Renderizado de las Sub-Vistas específicas de la estación */}
          {activeSubView === 'dashboard' && (
            /* SUB-VISTA 1: DASHBOARD (3D DIGITAL TWIN & CONTROLES DE SECUENCIA) */
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 170px)', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-panel)', backdropFilter: 'blur(10px)' }}>
              {/* Lado Izquierdo: Visor 3D */}
              <div style={{ flex: 1, position: 'relative', borderRight: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.1)' }}>
                <Suspense fallback={
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-dim)' }}>
                    Loading digital twin...
                  </div>
                }>
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
                </Suspense>
                {/* Botón flotante para abrir la transmisión de vídeo de la cámara FRAMOS en tiempo real */}
                <CameraViewer
                  stabilityThreshold={stabilityThreshold}
                  setStabilityThreshold={setStabilityThreshold}
                  inlineIMU={false}
                />
              </div>

              {/* Lado Derecho: Paneles de Simulación y Monitoreo IMU */}
              <div style={{ width: '340px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', borderLeft: '1px solid var(--border-glass)' }}>
                {/* Station Controls: Run Queue, Connect Robot */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Station Controls</h3>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(() => {
                      const status = stationQueueStatus[currentStation.id] || { isPlaying: false, currentIndex: 0 };
                      const sQueue = stationQueues[currentStation.id] || [];
                      const isPlayingQueue = status.isPlaying;
                      return (
                        <button
                          onClick={() => {
                            if (isPlayingQueue) {
                              handlePauseStationQueue(currentStation.id);
                            } else {
                              handlePlayStationQueue(currentStation.id);
                            }
                          }}
                          disabled={sQueue.length === 0}
                          style={{
                            ...styles.button,
                            flex: 1,
                            padding: '10px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            background: isPlayingQueue ? 'rgba(255, 157, 0, 0.15)' : 'rgba(0, 255, 136, 0.12)',
                            borderColor: isPlayingQueue ? '#ff9d00' : '#00ff88',
                            color: isPlayingQueue ? '#ff9d00' : '#00ff88',
                            opacity: sQueue.length === 0 ? 0.4 : 1,
                            cursor: sQueue.length === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isPlayingQueue ? '❚❚ PAUSE RUN' : '▶ PLAY RUN'}
                        </button>
                      );
                    })()}

                    <button
                      onClick={() => setIsRobotConnected(!isRobotConnected)}
                      style={{
                        ...styles.button,
                        flex: 1,
                        padding: '10px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        background: isRobotConnected ? 'rgba(0, 210, 255, 0.12)' : 'var(--input-bg)',
                        borderColor: isRobotConnected ? '#00d2ff' : 'var(--border-glass)',
                        color: isRobotConnected ? '#00d2ff' : 'var(--text-color)',
                        cursor: 'pointer'
                      }}
                    >
                      {isRobotConnected ? 'CONNECTED' : 'CONNECT ROBOT'}
                    </button>
                  </div>
                </div>

                <PhotoSimulationPanel
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  currentPhotoStep={currentPhotoStep}
                  setCurrentPhotoStep={setCurrentPhotoStep}
                  pointCount={pointCount}
                  photos={photos}
                  setPhotos={setPhotos}
                  isGalleryOpen={isGalleryOpen}
                  setIsGalleryOpen={setIsGalleryOpen}
                  onNext={handleManualNext}
                  onPrev={handleManualPrev}
                  onViewPhotos={() => setIsGalleryOpen(true)}
                />
                {/* Tolerancias de Vibración (IMU) en línea */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Vibration Tolerances (IMU)</h3>
                  <CameraViewer
                    stabilityThreshold={stabilityThreshold}
                    setStabilityThreshold={setStabilityThreshold}
                    inlineIMU={true}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubView === 'presets' && (
            /* SUB-VISTA 1.25: PRESETS LIST VIEW */
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '20px', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-panel)', backdropFilter: 'blur(10px)', color: 'var(--text-color)', overflowY: 'auto', height: 'calc(100vh - 170px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Configuration Presets</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>Manage 3D scanning boundary and path presets</p>
                </div>
                <button
                  onClick={() => {
                    // Set to defaults
                    setSpheroidSize({ x: 0.6, y: 0.6, z: 0.6 });
                    setObjectCenter({ x: 0.0, y: 1.0, z: 0.0 });
                    setZBounds({ min: -1.0, max: 1.0 });
                    setPointCount(100);
                    setColumnHeight(0.5);
                    setOrbitRadius(1.6);
                    setEditingPresetName('__new__');
                    setEditingPresetForm('');
                    setActiveSubView('calibration');
                  }}
                  style={{
                    ...styles.button,
                    backgroundColor: 'var(--accent-blue)',
                    color: '#000000',
                    fontWeight: 'bold',
                    width: '180px',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Create New Preset
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
                {Object.keys(presets).length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-dim)', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
                    No presets found. Click "Create New Preset" to get started.
                  </div>
                ) : (
                  Object.keys(presets).map(name => {
                    const cfg = presets[name] || {};
                    const sSize = cfg.spheroidSize || { x: 0.6, y: 0.6, z: 0.6 };
                    return (
                      <div key={name} className="glass" style={{ padding: '20px', border: '1px solid var(--border-glass)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-blue)', marginBottom: '8px' }}>{name}</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Fibonacci Points:</span>
                              <span style={{ color: 'var(--text-color)', fontWeight: 'bold' }}>{cfg.pointCount ?? 100}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Spheroid Size (XYZ):</span>
                              <span style={{ color: 'var(--text-color)' }}>
                                {sSize.x.toFixed(2)}x{sSize.y.toFixed(2)}x{sSize.z.toFixed(2)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Orbit Radius:</span>
                              <span style={{ color: 'var(--text-color)' }}>{(cfg.orbitRadius ?? 1.6).toFixed(2)}m</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Base Height:</span>
                              <span style={{ color: 'var(--text-color)' }}>{(cfg.columnHeight ?? 0.5).toFixed(2)}m</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button
                            onClick={() => {
                              handleLoadPreset(name);
                              setEditingPresetName(name);
                              setActiveSubView('calibration');
                            }}
                            style={{
                              ...styles.button,
                              flex: 1,
                              width: 'auto',
                              padding: '8px',
                              fontSize: '0.75rem',
                              backgroundColor: 'rgba(0, 210, 255, 0.1)',
                              border: '1px solid var(--accent-blue)',
                              color: 'var(--accent-blue)',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Edit & View
                          </button>
                          <button
                            onClick={() => {
                              const confirmDelete = window.confirm(`Are you sure you want to delete the preset "${name}"?`);
                              if (confirmDelete) {
                                handleDeletePreset(name);
                              }
                            }}
                            style={{
                              ...styles.button,
                              width: 'auto',
                              flex: '0 0 50px',
                              padding: '8px 12px',
                              fontSize: '0.75rem',
                              backgroundColor: 'rgba(255, 75, 43, 0.1)',
                              border: '1px solid #ff4b2b',
                              color: '#ff4b2b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeSubView === 'calibration' && (
            /* SUB-VISTA 1.5: CALIBRACIÓN (3D DIGITAL TWIN & CONFIGURACIÓN DEL ESFEROIDE / PRESETS) */
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 170px)', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-panel)', backdropFilter: 'blur(10px)' }}>
              {/* Lado Izquierdo: Visor 3D (para feedback visual en tiempo real) */}
              <div style={{ flex: 1, position: 'relative', borderRight: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.1)' }}>
                <Suspense fallback={
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-dim)' }}>
                    Loading digital twin...
                  </div>
                }>
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
                </Suspense>
                {/* Botón flotante para abrir la transmisión de vídeo de la cámara FRAMOS en tiempo real */}
                <CameraViewer
                  stabilityThreshold={stabilityThreshold}
                  setStabilityThreshold={setStabilityThreshold}
                  inlineIMU={false}
                />
              </div>

              {/* Lado Derecho: Configuración del Esferoide y Presets */}
              <div style={{ width: '340px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', borderLeft: '1px solid var(--border-glass)' }}>
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
                  presets={presets}
                  editingPresetName={editingPresetName}
                  editingPresetForm={editingPresetForm}
                  setEditingPresetForm={setEditingPresetForm}
                  onSavePreset={async (name) => {
                    await handleSavePreset(name);
                    setActiveSubView('presets');
                  }}
                  onBackToPresets={() => setActiveSubView('presets')}
                />
              </div>
            </div>
          )}

          {activeSubView === 'vnc' && (
            /* SUB-VISTA 2: VISOR VNC (VNC DEL ROBOT CON IMAGEN ESTÁTICA) */
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-panel)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px', height: 'calc(100vh - 170px)' }}>
              <img
                src="http://127.0.0.1:5005/VNC_UR.png"
                alt="TeachPendant VNC"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
              />
            </div>
          )}

          {activeSubView === 'camera' && (
            /* SUB-VISTA 3: CÁMARA (VISTA PREVIA 2D - FEED EN VIVO DE CÁMARA FRAMOS) */
            <div className="camera-view-container">
              <div className="camera-feed-panel glass">
                <img
                  src={cameraConnected ? "http://localhost:5005/camera/stream" : "http://localhost:5005/bota_ejemplo.png"}
                  alt="Camera 2D View"
                  className="camera-feed-image"
                />
                <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#00ff88', borderRadius: '50%' }}></span>
                  LIVE FEED (2D) - STATION CAMERA
                </div>
              </div>
              <div className="camera-config-panel">
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>Sensor Settings</h3>
                  <div style={styles.section}>
                    <label style={styles.label}>Auto Exposure</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '5px' }}>
                      <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
                      Enabled
                    </label>
                  </div>
                  <div style={styles.section}>
                    <label style={styles.label}>Exposure Time (ms)</label>
                    <input type="range" min="1" max="40" defaultValue="10" />
                  </div>
                  <div style={styles.section}>
                    <label style={styles.label}>Gain</label>
                    <input type="range" min="1" max="128" defaultValue="64" />
                  </div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>Stability (Physical/IMU)</h3>
                  <CameraViewer
                    stabilityThreshold={stabilityThreshold}
                    setStabilityThreshold={setStabilityThreshold}
                    inlineIMU={true}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubView === 'config' && (
            /* SUB-VISTA 4: CONFIGURACIÓN (RUTA DE GUARDADO Y PRODUCTO) */
            <div style={{ display: 'flex', gap: '25px', height: 'calc(100vh - 170px)', width: '100%' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '30px', borderRadius: '16px', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: 'bold' }}>Storage Settings</h3>
                <div className="form-field">
                  <label>Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Carrera Sunglasses"
                    value={currentStation.product}
                    onChange={(e) => handleUpdateStationConfig(currentStation.id, e.target.value, currentStation.savePath)}
                    style={styles.input}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    This name will define the storage folder for captured images.
                  </span>
                </div>
                <div className="form-field">
                  <label>Save Path</label>
                  <input
                    type="text"
                    placeholder="e.g. C:/Photos/Station"
                    value={currentStation.savePath}
                    onChange={(e) => handleUpdateStationConfig(currentStation.id, currentStation.product, e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)', borderRadius: '8px', fontSize: '0.75rem', lineHeight: '1.6' }}>
                  ℹ️ Final save path for this product:
                  <br />
                  <strong>{currentStation.savePath}/{currentStation.product.replace(/\s+/g, '_') || 'unnamed'}/</strong>
                </div>
              </div>

              {/* Información General de la estación y velocidad actual */}
              <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>Station Telemetry</h3>
                  <div style={styles.section}>
                    <label style={styles.label}>Assigned Product</label>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{currentStation.product || 'None'}</div>
                  </div>
                  <div style={styles.section}>
                    <label style={styles.label}>Current Robot Speed</label>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{currentStation.speed > 0 ? `${currentStation.speed} m/s` : 'Robot stopped'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* --- MODAL CONFIGURACIÓN CON 3 PESTAÑAS (COMÚN) --- */}
      {isConfigModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-full glass">
            <header className="modal-header">
              <h2 style={{ margin: 0 }}>Configure Station Execution</h2>
              <button className="modal-close-btn" onClick={() => setIsConfigModalOpen(false)}>×</button>
            </header>

            <nav className="modal-tabs">
              <button
                className={`modal-tab-btn ${configActiveTab === 'basic' ? 'active' : ''}`}
                onClick={() => setConfigActiveTab('basic')}
              >
                Basic Info
              </button>
              <button
                className={`modal-tab-btn ${configActiveTab === 'camera' ? 'active' : ''}`}
                onClick={() => setConfigActiveTab('camera')}
              >
                Camera
              </button>
              <button
                className={`modal-tab-btn ${configActiveTab === 'station' ? 'active' : ''}`}
                onClick={() => setConfigActiveTab('station')}
              >
                Station
              </button>
            </nav>

            <div className="modal-body-scroll">
              {configActiveTab === 'basic' && (
                <div className="form-grid">
                  <div className="form-field">
                    <label>Product Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Nike Running Shoes"
                      value={configFormData.productName}
                      onChange={(e) => setConfigFormData(prev => ({ ...prev, productName: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                  <div className="form-field">
                    <label>Photo Save Path</label>
                    <input
                      type="text"
                      placeholder="e.g. C:/Photos/Nike"
                      value={configFormData.savePath}
                      onChange={(e) => setConfigFormData(prev => ({ ...prev, savePath: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                  <div className="form-field" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label>Robot Speed (m/s)</label>
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{configFormData.robotSpeed} m/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.1"
                      value={configFormData.robotSpeed}
                      onChange={(e) => setConfigFormData(prev => ({ ...prev, robotSpeed: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              {configActiveTab === 'camera' && (
                <div className="form-grid">
                  <div className="form-field" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={configFormData.cameraAutoExposure}
                        onChange={(e) => setConfigFormData(prev => ({ ...prev, cameraAutoExposure: e.target.checked }))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      Enable Auto Exposure
                    </label>
                  </div>
                  {!configFormData.cameraAutoExposure && (
                    <>
                      <div className="form-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <label>Shutter Speed (ms)</label>
                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{configFormData.cameraShutterMs} ms</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="40.0"
                          step="0.5"
                          value={configFormData.cameraShutterMs}
                          onChange={(e) => setConfigFormData(prev => ({ ...prev, cameraShutterMs: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <label>Sensor Gain</label>
                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{configFormData.cameraGain}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="128"
                          step="1"
                          value={configFormData.cameraGain}
                          onChange={(e) => setConfigFormData(prev => ({ ...prev, cameraGain: parseInt(e.target.value) }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {configActiveTab === 'station' && (
                <div className="form-grid">
                  <div className="form-field">
                    <label>Select Target Station</label>
                    <select
                      value={configStationId || ''}
                      onChange={(e) => setConfigStationId(parseInt(e.target.value))}
                      style={styles.select}
                    >
                      <option value="" disabled>Select a station...</option>
                      {stations.map(st => (
                        <option key={st.id} value={st.id}>{st.name} ({st.ip})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Number of Capture Points</label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={pointCount}
                      onChange={(e) => setPointCount(parseInt(e.target.value))}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}
            </div>

            <footer className="modal-footer">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                style={{ ...styles.button, width: '120px', background: 'none', border: '1px solid var(--border-glass)', color: 'var(--text-color)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToQueue}
                disabled={!configStationId}
                style={{
                  ...styles.button,
                  width: '180px',
                  backgroundColor: !configStationId ? 'var(--button-disabled-bg)' : 'var(--accent-blue)',
                  cursor: !configStationId ? 'not-allowed' : 'pointer',
                  boxShadow: !configStationId ? 'none' : '0 0 15px rgba(0, 210, 255, 0.3)'
                }}
              >
                Add to Queue
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* --- MOCK / TEST BUTTON FOR ADMINS TO TRIGGER AN EMERGENCY ALERT --- */}
      {userRole === 'admin' && (
        <button
          onClick={async () => {
            try {
              const targetName = currentStation ? currentStation.name : 'Station 2';
              await fetch('http://127.0.0.1:5005/api/trigger_alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station: targetName, problem: 'Emergency Stop physically pressed' })
              });
            } catch (err) {
              console.error(err);
            }
          }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: 'auto',
            zIndex: 10,
            padding: '10px 15px',
            backgroundColor: '#ff4b2b',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(255,75,43,0.3)',
            fontWeight: 'bold'
          }}
        >
          🚨 Simulate Alert {currentStation ? currentStation.name : 'Station 2'}
        </button>
      )}

      {/* --- MODAL CRÍTICO DE ALERTA DE EMERGENCIA --- */}
      {emergencyAlert && (
        <div className="modal-backdrop">
          <div className="modal-content-full glass alert-dialog" style={{ height: 'auto', maxHeight: '350px', maxWidth: '480px', padding: '24px' }}>
            <h2 style={{ color: '#ff4b2b', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' }}>
              🚨 CRITICAL STATION ALERT
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              A critical issue has been detected at <strong>{emergencyAlert.station}</strong>.
              <br />
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Error details: {emergencyAlert.problem}</span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleClearAlert}
                style={{ ...styles.button, padding: '12px 24px', backgroundColor: '#ff4b2b', fontWeight: 'bold' }}
              >
                Acknowledge and Clear Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CAMBIO FÍSICO DE OBJETO --- */}
      {showObjectChangePrompt && (
        <div className="modal-backdrop">
          <div className="modal-content-full glass" style={{ height: 'auto', maxHeight: '350px', maxWidth: '480px', padding: '24px', borderLeft: '6px solid var(--accent-orange)' }}>
            <h2 style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' }}>
              🔄 OBJECT CHANGE REQUIRED
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              The previous product execution has finished.
              <br />
              <strong>Please remove the current object from the turntable and physically place the next object to be photographed.</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleContinueQueue}
                style={{ ...styles.button, padding: '12px 24px', backgroundColor: 'var(--accent-blue)', fontWeight: 'bold' }}
              >
                Object Changed - Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- GALLERY MODAL --- */}
      <PhotosGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={photos}
        onClearPhotos={handleClearPhotos}
        onDeletePhoto={handleDeletePhoto}
      />
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
