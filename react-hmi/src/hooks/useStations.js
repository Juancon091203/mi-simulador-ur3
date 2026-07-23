import { useState, useEffect } from 'react';

const FRAMOS_PHOTOS_PATH = 'C:/Users/FA507/Documents/UNI/PracticasCFZ/ProyectoFotos/UR3_Web-HMI-main/flask-server/static/photos';

const INITIAL_STATIONS = [
  { id: 1, name: 'Station 1', ip: '192.168.3.10', status: 'idle',      product: 'None',          savePath: FRAMOS_PHOTOS_PATH, progress: 0,  photoCount: 0,  maxPhotos: 100, speed: 0.0 },
  { id: 2, name: 'Station 2', ip: '192.168.3.11', status: 'running',   product: 'Running Shoes', savePath: FRAMOS_PHOTOS_PATH, progress: 45, photoCount: 45, maxPhotos: 100, speed: 0.8 },
  { id: 3, name: 'Station 3', ip: '192.168.3.12', status: 'warning',   product: 'Sunglasses',    savePath: FRAMOS_PHOTOS_PATH, progress: 75, photoCount: 75, maxPhotos: 100, speed: 0.5 },
  { id: 4, name: 'Station 4', ip: '192.168.3.13', status: 'emergency', product: 'Wristwatch',    savePath: FRAMOS_PHOTOS_PATH, progress: 20, photoCount: 20, maxPhotos: 100, speed: 0.2 },
];

const INITIAL_QUEUE_STATUS = {
  1: { isPlaying: false, currentIndex: 0 },
  2: { isPlaying: false, currentIndex: 0 },
  3: { isPlaying: false, currentIndex: 0 },
  4: { isPlaying: false, currentIndex: 0 },
};

/**
 * Manages multi-station state, per-station execution queues, and emergency alerts.
 * Exposes stations CRUD, queue controls, and alert state.
 */
export function useStations() {
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [showAddStationInput, setShowAddStationInput] = useState(false);
  const [newStationIp, setNewStationIp] = useState('');

  // Per-station execution queue
  const [stationQueues, setStationQueues] = useState({ 1: [], 2: [], 3: [], 4: [] });
  const [stationQueueStatus, setStationQueueStatus] = useState(INITIAL_QUEUE_STATUS);
  const [promptStationId, setPromptStationId] = useState(null);
  const [showObjectChangePrompt, setShowObjectChangePrompt] = useState(false);
  const [editingQueueItem, setEditingQueueItem] = useState(null);

  // Emergency alert
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  // Completion prompt modal state
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [completionStationId, setCompletionStationId] = useState(null);

  // Config modal state (lifted here so queue operations can open it)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configStationId, setConfigStationId] = useState(null);
  const [configActiveTab, setConfigActiveTab] = useState('basic');
  const [configFormData, setConfigFormData] = useState({
    productName: '',
    savePath: FRAMOS_PHOTOS_PATH,
    robotSpeed: 0.5,
    cameraAutoExposure: true,
    cameraShutterMs: 5.0,
    cameraGain: 64,
    presetName: '',
  });

  // ── Station CRUD ──────────────────────────────────────────────────────────

  const handleAddStation = (e) => {
    e.preventDefault();
    if (!newStationIp) return;
    setStations(prev => [
      ...prev,
      {
        id: prev.length + 1,
        name: `Station ${prev.length + 1}`,
        ip: newStationIp,
        status: 'idle', product: 'None',
        progress: 0, photoCount: 0, maxPhotos: 100, speed: 0.0,
      },
    ]);
    setNewStationIp('');
    setShowAddStationInput(false);
  };

  const handleUpdateStationConfig = (id, newProduct, newPath) => {
    setStations(prev => prev.map(st =>
      st.id === id ? { ...st, product: newProduct, savePath: newPath } : st,
    ));
  };

  // ── Queue Operations ──────────────────────────────────────────────────────

  const handleAddToQueue = () => {
    const newItem = {
      id: editingQueueItem ? editingQueueItem.id : Date.now(),
      productName: configFormData.productName || 'Unnamed Product',
      savePath: configFormData.savePath,
      robotSpeed: configFormData.robotSpeed,
      stationId: configStationId,
      stationName: stations.find(s => s.id === configStationId)?.name || `Station ${configStationId}`,
      ...configFormData,
    };

    if (editingQueueItem) {
      setStationQueues(prev => {
        const sid = editingQueueItem.stationId;
        return { ...prev, [sid]: prev[sid].map(item => item.id === editingQueueItem.id ? newItem : item) };
      });
      setEditingQueueItem(null);
    } else {
      setStationQueues(prev => ({
        ...prev,
        [configStationId]: [...(prev[configStationId] || []), newItem],
      }));
    }

    setIsConfigModalOpen(false);
    setConfigFormData({
      productName: '', savePath: FRAMOS_PHOTOS_PATH,
      robotSpeed: 0.5, cameraAutoExposure: true,
      cameraShutterMs: 5.0, cameraGain: 64, presetName: '',
    });
  };

  const handlePlayStationQueue = (stationId) => {
    setStationQueueStatus(prev => {
      const current = prev[stationId] || { isPlaying: false, currentIndex: 0, phase: 'idle' };
      const queue = stationQueues[stationId] || [];
      if (queue.length === 0) return prev;

      let nextPhase = current.phase;

      if (current.phase === 'waiting') {
        // Segundo clic en PLAY: Reanudar para la ejecución completa de la secuencia
        nextPhase = 'full';
        setStations(stPrev => stPrev.map(st =>
          st.id === stationId ? {
            ...st,
            status: 'running',
            progress: 0,
            photoCount: 0,
            maxPhotos: 100,
            speed: queue[current.currentIndex]?.robotSpeed || 0.5,
          } : st
        ));
      } else if (current.phase === 'idle' || !current.phase) {
        // Primer clic en PLAY: Iniciar la inspección previa de 4 fotos en el primer gajo
        nextPhase = 'inspection';
        setStations(stPrev => stPrev.map(st =>
          st.id === stationId ? {
            ...st,
            status: 'running',
            progress: 0,
            photoCount: 0,
            maxPhotos: 4, // 4 fotos del primer gajo
            product: queue[current.currentIndex]?.productName || st.product,
            speed: queue[current.currentIndex]?.robotSpeed || 0.5,
          } : st
        ));
      }

      return {
        ...prev,
        [stationId]: { ...current, isPlaying: true, phase: nextPhase }
      };
    });
  };

  const handlePauseStationQueue = (stationId) => {
    setStationQueueStatus(prev => ({
      ...prev,
      [stationId]: { ...(prev[stationId] || {}), isPlaying: false },
    }));
  };

  const handleRemoveQueueItem = (stationId, itemId) => {
    setStationQueues(prev => {
      const updated = (prev[stationId] || []).filter(item => item.id !== itemId);
      return { ...prev, [stationId]: updated };
    });
    setStationQueueStatus(prev => {
      const status = prev[stationId];
      const queue = stationQueues[stationId] || [];
      const removedIndex = queue.findIndex(item => item.id === itemId);
      if (removedIndex !== -1 && status.currentIndex >= removedIndex) {
        const nextIndex = Math.max(0, status.currentIndex - 1);
        return { ...prev, [stationId]: { ...status, currentIndex: nextIndex, isPlaying: queue.length > 1 ? status.isPlaying : false, phase: 'idle' } };
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
      presetName: item.presetName || '',
    });
    setIsConfigModalOpen(true);
  };

  const handleMoveQueueItem = (stationId, index, direction) => {
    setStationQueues(prev => {
      const queue = [...(prev[stationId] || [])];
      if (direction === 'up' && index > 0) {
        [queue[index], queue[index - 1]] = [queue[index - 1], queue[index]];
      } else if (direction === 'down' && index < queue.length - 1) {
        [queue[index], queue[index + 1]] = [queue[index + 1], queue[index]];
      }
      return { ...prev, [stationId]: queue };
    });
  };

  const handleContinueQueue = () => {
    setShowObjectChangePrompt(false);
    if (promptStationId) {
      const stationId = promptStationId;
      setStationQueueStatus(prev => {
        const queue = stationQueues[stationId] || [];
        const nextItem = queue[0];
        setStations(stPrev => stPrev.map(st =>
          st.id === stationId ? {
            ...st,
            progress: 0,
            photoCount: 0,
            product: nextItem ? nextItem.productName : 'None',
            status: 'idle',
            speed: 0.0
          } : st,
        ));
        return { ...prev, [stationId]: { isPlaying: false, currentIndex: 0, phase: 'idle' } };
      });
      setPromptStationId(null);
    }
  };

  const handleStationQueueItemFinished = (stationId) => {
    setCompletionStationId(stationId);
    setShowCompletionPrompt(true);
    setStations(stPrev => stPrev.map(st =>
      st.id === stationId ? { ...st, status: 'idle', progress: 100, speed: 0.0 } : st,
    ));
    setStationQueueStatus(prev => ({
      ...prev,
      [stationId]: { isPlaying: false, currentIndex: 0, phase: 'idle' }
    }));
  };

  const handleRepeatExecution = () => {
    if (completionStationId) {
      const stationId = completionStationId;
      setShowCompletionPrompt(false);
      setStations(stPrev => stPrev.map(st =>
        st.id === stationId ? { ...st, status: 'running', progress: 0, photoCount: 0 } : st
      ));
      setStationQueueStatus(prev => ({
        ...prev,
        [stationId]: { isPlaying: true, currentIndex: 0, phase: 'full' }
      }));
      setCompletionStationId(null);
    }
  };

  const handleFinishExecution = () => {
    if (completionStationId) {
      const stationId = completionStationId;
      setShowCompletionPrompt(false);
      setStations(stPrev => stPrev.map(st =>
        st.id === stationId ? { ...st, status: 'idle', progress: 0, photoCount: 0 } : st
      ));
      setCompletionStationId(null);
    }
  };

  // ── Parallel Queue Runner ─────────────────────────────────────────────────

  useEffect(() => {
    const activeStationsList = Object.keys(stationQueueStatus).filter(idStr => {
      const id = parseInt(idStr);
      const status = stationQueueStatus[id];
      const queue = stationQueues[id] || [];
      return status.isPlaying && queue.length > 0 && status.currentIndex < queue.length;
    });
    if (activeStationsList.length === 0) return;

    const interval = setInterval(() => {
      activeStationsList.forEach(idStr => {
        const stationId = parseInt(idStr);
        const qStatus = stationQueueStatus[stationId];
        const queue = stationQueues[stationId];
        const currentItem = queue[qStatus.currentIndex];

        setStations(prev => {
          let inspectionFinished = false;
          let itemFinished = false;

          const updated = prev.map(st => {
            if (st.id === stationId) {
              if (qStatus.phase === 'inspection') {
                // TODO: BACKEND_ENDPOINT_REQUIRED
                // ENDPOINT: POST /api/robot/move_to_point  (o RTDE / URScript socket)
                // DESCRIPCIÓN: Enviar comando de movimiento al UR3 para posicionar la cámara en el punto N del Gajo 1 durante la inspección previa.
                // PAYLOAD: { station_ip: st.ip, point_index: st.photoCount, sector: 0, speed: st.speed }
                const nextCount = st.photoCount + 1;
                if (nextCount >= 4) {
                  inspectionFinished = true;
                  return {
                    ...st,
                    status: 'warning',
                    photoCount: 4,
                    maxPhotos: 4,
                    progress: 100,
                    speed: 0.0,
                  };
                }
                return {
                  ...st,
                  status: 'running',
                  product: currentItem?.productName || st.product,
                  speed: currentItem?.robotSpeed || 0.5,
                  photoCount: nextCount,
                  progress: Math.round((nextCount / 4) * 100),
                };
              } else {
                // TODO: BACKEND_ENDPOINT_REQUIRED
                // ENDPOINT: POST /api/robot/execute_trajectory  (o RTDE / URScript socket)
                // DESCRIPCIÓN: Enviar secuencia completa de movimiento al UR3 para ejecutar el escaneo total.
                // PAYLOAD: { station_ip: st.ip, preset_name: currentItem?.presetName, speed: st.speed }
                const stepIncrement = 5;
                const nextCount = st.photoCount + stepIncrement;
                if (nextCount >= st.maxPhotos) {
                  itemFinished = true;
                  return { ...st, status: 'idle', photoCount: st.maxPhotos, progress: 100, speed: 0.0 };
                }
                return {
                  ...st,
                  status: 'running',
                  product: currentItem?.productName || st.product,
                  speed: currentItem?.robotSpeed || 0.5,
                  photoCount: nextCount,
                  progress: Math.round((nextCount / st.maxPhotos) * 100),
                };
              }
            }
            return st;
          });

          if (inspectionFinished) {
            setTimeout(() => {
              setStationQueueStatus(sqPrev => ({
                ...sqPrev,
                [stationId]: { ...(sqPrev[stationId] || {}), isPlaying: false, phase: 'waiting' }
              }));
            }, 50);
          } else if (itemFinished) {
            setTimeout(() => handleStationQueueItemFinished(stationId), 50);
          }

          return updated;
        });
      });
    }, 500);

    return () => clearInterval(interval);
  }, [stationQueueStatus, stationQueues]);

  // ── Emergency Alert Poller ────────────────────────────────────────────────

  useEffect(() => {
    const checkAlerts = async () => {
      try {
        // TODO: BACKEND_ENDPOINT_REQUIRED
        // ENDPOINT: GET /api/alert_status
        // DESCRIPCIÓN: Polling periódico para detectar si ha saltado una parada de emergencia o error de máquina.
        // RESPUESTA: { alert: null } O { alert: { station: 'Station 1', problem: 'Emergency Stop pressed' } }
        const res = await fetch('http://127.0.0.1:5005/api/alert_status');
        if (res.ok) {
          const data = await res.json();
          if (data.alert) {
            setEmergencyAlert(data.alert);
            setStations(prev => prev.map(st =>
              st.name === data.alert.station ? { ...st, status: 'emergency' } : st,
            ));
          }
        }
      } catch {
        // silent
      }
    };
    const interval = setInterval(checkAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAlert = async () => {
    try {
      // TODO: BACKEND_ENDPOINT_REQUIRED
      // ENDPOINT: POST /api/clear_alert
      // DESCRIPCIÓN: Rearma la estación y limpia la alerta de parada en el backend.
      // PAYLOAD: { station: stationName }
      // RESPUESTA: { status: 'success' }
      await fetch('http://127.0.0.1:5005/api/clear_alert', { method: 'POST' });
      setStations(prev => prev.map(st =>
        st.name === emergencyAlert?.station ? { ...st, status: 'idle' } : st,
      ));
      setEmergencyAlert(null);
    } catch (err) {
      console.error('Failed to clear alert:', err);
    }
  };

  return {
    // Stations
    stations, setStations,
    showAddStationInput, setShowAddStationInput,
    newStationIp, setNewStationIp,
    handleAddStation,
    handleUpdateStationConfig,
    // Queues
    stationQueues, setStationQueues,
    stationQueueStatus, setStationQueueStatus,
    editingQueueItem, setEditingQueueItem,
    handleAddToQueue,
    handlePlayStationQueue,
    handlePauseStationQueue,
    handleRemoveQueueItem,
    handleEditQueueItem,
    handleMoveQueueItem,
    // Object change prompt
    showObjectChangePrompt, setShowObjectChangePrompt,
    promptStationId,
    handleContinueQueue,
    // Execution completion prompt
    showCompletionPrompt, setShowCompletionPrompt,
    completionStationId,
    handleRepeatExecution,
    handleFinishExecution,
    // Alerts
    emergencyAlert,
    handleClearAlert,
    // Config modal state
    isConfigModalOpen, setIsConfigModalOpen,
    configStationId, setConfigStationId,
    configActiveTab, setConfigActiveTab,
    configFormData, setConfigFormData,
  };
}
