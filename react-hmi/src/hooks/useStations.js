import { useState, useEffect } from 'react';

const INITIAL_STATIONS = [
  { id: 1, name: 'Station 1', ip: '192.168.3.10', status: 'idle',      product: 'None',          savePath: 'C:/Photos/Station1', progress: 0,  photoCount: 0,  maxPhotos: 100, speed: 0.0 },
  { id: 2, name: 'Station 2', ip: '192.168.3.11', status: 'running',   product: 'Running Shoes', savePath: 'C:/Photos/Station2', progress: 45, photoCount: 45, maxPhotos: 100, speed: 0.8 },
  { id: 3, name: 'Station 3', ip: '192.168.3.12', status: 'warning',   product: 'Sunglasses',    savePath: 'C:/Photos/Station3', progress: 75, photoCount: 75, maxPhotos: 100, speed: 0.5 },
  { id: 4, name: 'Station 4', ip: '192.168.3.13', status: 'emergency', product: 'Wristwatch',    savePath: 'C:/Photos/Station4', progress: 20, photoCount: 20, maxPhotos: 100, speed: 0.2 },
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

  // Config modal state (lifted here so queue operations can open it)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configStationId, setConfigStationId] = useState(null);
  const [configActiveTab, setConfigActiveTab] = useState('basic');
  const [configFormData, setConfigFormData] = useState({
    productName: '',
    savePath: 'C:/Photos/Product',
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
      productName: '', savePath: 'C:/Photos/Product',
      robotSpeed: 0.5, cameraAutoExposure: true,
      cameraShutterMs: 5.0, cameraGain: 64, presetName: '',
    });
  };

  const handlePlayStationQueue = (stationId) => {
    setStationQueueStatus(prev => {
      const status = prev[stationId] || { isPlaying: false, currentIndex: 0 };
      const queue = stationQueues[stationId] || [];
      if (queue.length === 0) return prev;
      return { ...prev, [stationId]: { ...status, isPlaying: true } };
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
        return { ...prev, [stationId]: { ...status, currentIndex: nextIndex, isPlaying: queue.length > 1 ? status.isPlaying : false } };
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
        const status = prev[stationId];
        const nextIndex = status.currentIndex + 1;
        setStations(stPrev => stPrev.map(st =>
          st.id === stationId ? { ...st, progress: 0, photoCount: 0 } : st,
        ));
        return { ...prev, [stationId]: { isPlaying: true, currentIndex: nextIndex } };
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
        return { ...prev, [stationId]: { ...status, isPlaying: false } };
      } else {
        alert(`Station ${stationId} queue completed successfully!`);
        setStations(stPrev => stPrev.map(st =>
          st.id === stationId ? { ...st, status: 'idle', product: 'None', progress: 0, photoCount: 0, speed: 0.0 } : st,
        ));
        setStationQueues(qPrev => ({ ...qPrev, [stationId]: [] }));
        return { ...prev, [stationId]: { isPlaying: false, currentIndex: 0 } };
      }
    });
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
                ...st, status: 'running', product: currentItem.productName,
                speed: currentItem.robotSpeed, photoCount: nextCount,
                progress: Math.round((nextCount / st.maxPhotos) * 100),
              };
            }
            return st;
          });
          if (itemFinished) setTimeout(() => handleStationQueueItemFinished(stationId), 50);
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
