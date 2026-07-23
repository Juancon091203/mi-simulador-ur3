import React, { useState, useEffect } from 'react';

// ── Hooks ──────────────────────────────────────────────────────────────────
import { useRobotConnection } from './hooks/useRobotConnection';
import { useRobotWebSocket } from './hooks/useRobotWebSocket';
import { useRobotHttp } from './hooks/useRobotHttp';
import { useCalibration } from './hooks/useCalibration';
import { useCamera } from './hooks/useCamera';
import { useStations } from './hooks/useStations';
import { usePresets } from './hooks/usePresets';

// ── Layout ─────────────────────────────────────────────────────────────────
import Sidebar from './components/layout/Sidebar';

// ── Modals ─────────────────────────────────────────────────────────────────
import ConfigExecutionModal from './components/modals/ConfigExecutionModal';
import EmergencyAlertModal from './components/modals/EmergencyAlertModal';
import ObjectChangeModal from './components/modals/ObjectChangeModal';
import PhotosGalleryModal from './components/panels/PhotosGalleryModal';

// ── Views ──────────────────────────────────────────────────────────────────
import LoginView from './views/LoginView';
import GeneralOverview from './views/GeneralOverview';
import PresetsView from './views/PresetsView';
import CalibrationView from './views/CalibrationView';
import StationDashboard from './views/StationDashboard';
import VncView from './views/VncView';
import CameraView from './views/CameraView';
import StationConfigView from './views/StationConfigView';

// ── Styles ─────────────────────────────────────────────────────────────────
import styles from './styles/appStyles';

// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [currentUser, setCurrentUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode);
  }, [darkMode]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeStationTab, setActiveStationTab] = useState('general');
  const [activeSubView, setActiveSubView] = useState('dashboard');

  // ── Robot Connection ─────────────────────────────────────────────────────
  const [modelType] = useState('UR8L_con_garra');
  const [connectionMode] = useState('websocket');
  const [ipAddress] = useState('192.168.60.10');
  const [manualMode] = useState(false);
  const [manualJoints] = useState([0, 0, 0, 0, 0, 0]);
  const [isRobotConnected, setIsRobotConnected] = useState(false);

  const sseConn = useRobotConnection();
  const wsConn = useRobotWebSocket();
  const httpConn = useRobotHttp(ipAddress);

  const activeConn = connectionMode === 'websocket' ? wsConn : (connectionMode === 'sse' ? sseConn : httpConn);

  useEffect(() => {
    if (connectionMode === 'websocket') {
      const url = ipAddress.startsWith('ws://') || ipAddress.startsWith('wss://')
        ? ipAddress : `ws://${ipAddress}`;
      wsConn.connect(url);
      return () => wsConn.disconnect();
    } else if (connectionMode === 'sse') {
      sseConn.connect(ipAddress);
      return () => sseConn.disconnect();
    }
  }, [connectionMode, ipAddress]);

  const currentJointAngles = manualMode
    ? manualJoints.map(deg => deg * Math.PI / 180)
    : activeConn.jointAngles;

  // ── Calibration ───────────────────────────────────────────────────────────
  const calibration = useCalibration();

  // ── Presets ───────────────────────────────────────────────────────────────
  const presetsHook = usePresets({
    spheroidSize: calibration.spheroidSize,
    objectCenter: calibration.objectCenter,
    zBounds: calibration.zBounds,
    pointCount: calibration.pointCount,
    columnHeight: calibration.columnHeight,
    orbitRadius: calibration.orbitRadius,
    objectModel: calibration.objectModel,
    objectScale: calibration.objectScale,
  });

  // ── Camera / Photos ───────────────────────────────────────────────────────
  const cameraHook = useCamera({
    globalSequence: calibration.globalSequence,
    pointCount: calibration.pointCount,
    setRobotPositionIndex: calibration.setRobotPositionIndex,
  });

  // ── Stations / Queues / Alerts ────────────────────────────────────────────
  const stationsHook = useStations();

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Login screen
  if (!isAuthenticated) {
    return (
      <LoginView
        currentUser={currentUser} setCurrentUser={setCurrentUser}
        loginPass={loginPass} setLoginPass={setLoginPass}
        userRole={userRole} setUserRole={setUserRole}
        onLogin={() => setIsAuthenticated(true)}
      />
    );
  }

  const currentStation = activeStationTab !== 'general'
    ? stationsHook.stations.find(st => st.id === activeStationTab)
    : null;

  // Shared RobotViewer props to avoid repetition
  const robotViewerProps = {
    modelType,
    currentJointAngles,
    spheroidSize: calibration.spheroidSize,
    showSpheroid: calibration.showSpheroid,
    pendingPointsPositions: cameraHook.pendingPointsPositions,
    activePoint: cameraHook.activePoint,
    robotPositionIndex: calibration.robotPositionIndex,
    robotPosition: calibration.robotPosition,
    robotRotationY: calibration.robotRotationY,
    nextFivePoints: cameraHook.nextFivePoints,
    objectCenter: calibration.objectCenter,
    zBounds: calibration.zBounds,
    showSectors: calibration.showSectors,
    darkMode,
    columnHeight: calibration.columnHeight,
    orbitRadius: calibration.orbitRadius,
    objectModel: calibration.objectModel,
    objectScale: calibration.objectScale,
    isCalculating: calibration.isCalculating,
    isGalleryOpen: cameraHook.isGalleryOpen,
  };

  const handleUpdateActiveSpeed = (stationId, newSpeed) => {
    stationsHook.setStations(prev => prev.map(st =>
      st.id === stationId ? { ...st, speed: newSpeed } : st
    ));
    const status = stationsHook.stationQueueStatus[stationId];
    if (status) {
      stationsHook.setStationQueues(prev => {
        const queue = [...(prev[stationId] || [])];
        const idx = status.currentIndex;
        if (queue[idx]) {
          queue[idx] = { ...queue[idx], robotSpeed: newSpeed };
        }
        return { ...prev, [stationId]: queue };
      });
    }
  };

  const onRearmStation = (stationId) => {
    stationsHook.setStations(prev => prev.map(st =>
      st.id === stationId ? { ...st, status: 'idle' } : st
    ));
    const targetName = stationsHook.stations.find(st => st.id === stationId)?.name;
    if (stationsHook.emergencyAlert && stationsHook.emergencyAlert.station === targetName) {
      stationsHook.handleClearAlert();
    }
  };

  const activeTabStyle = {
    background: 'var(--accent-blue)',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: 'auto',
    boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
    transition: 'all 0.2s',
  };

  const inactiveTabStyle = {
    background: 'var(--input-bg)',
    color: 'var(--text-dim)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: 'auto',
    transition: 'all 0.2s',
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard" style={styles.container}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        activeStationTab={activeStationTab} setActiveStationTab={setActiveStationTab}
        activeSubView={activeSubView} setActiveSubView={setActiveSubView}
        stations={stationsHook.stations}
        currentStation={currentStation}
        stationQueues={stationsHook.stationQueues}
        stationQueueStatus={stationsHook.stationQueueStatus}
        handleMoveQueueItem={stationsHook.handleMoveQueueItem}
        handleEditQueueItem={stationsHook.handleEditQueueItem}
        handleRemoveQueueItem={stationsHook.handleRemoveQueueItem}
        onNewExecution={(stationId) => {
          stationsHook.setConfigStationId(stationId);
          stationsHook.setIsConfigModalOpen(true);
        }}
        currentUser={currentUser} userRole={userRole}
        onLogout={() => setIsAuthenticated(false)}
        className={`sidebar-responsive ${isSidebarOpen ? 'open' : ''}`}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Backdrop overlay for responsive sidebar drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 998
          }}
        />
      )}

      {/* ── Main content pane ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Unified Header (Title & IP/Subtitle) */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px 10px 24px',
          background: 'transparent',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              className="hamburger-btn"
              onClick={() => setIsSidebarOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-color)',
                padding: 0
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div>
              {activeStationTab === 'general' ? (
                <>
                  <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '700' }}>General View</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Central Multi-Station Monitoring Console
                  </p>
                </>
              ) : (
                currentStation && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '700' }}>{currentStation.name}</h2>
                      <span className={`station-status-pill status-pill-${currentStation.status}`}>
                        {currentStation.status === 'running' ? 'Running' : currentStation.status === 'idle' ? 'Idle' : currentStation.status === 'emergency' ? 'Emergency' : 'Warning Stop'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Robot IP Address: {currentStation.ip}
                    </p>
                  </>
                )
              )}
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '8px 12px', background: 'var(--input-bg)',
              border: '1px solid var(--border-glass)', borderRadius: '20px',
              color: 'var(--text-color)', cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.8rem', width: 'auto',
            }}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </header>

        {/* Sticky Horizontal Tabs Navigation (Scrollable en pantallas reducidas) */}
        <div style={{
          display: 'flex',
          padding: '0 24px 12px 24px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'transparent',
          zIndex: 100,
          overflowX: 'auto',
          maxWidth: '100%',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'nowrap' }}>
            {activeStationTab === 'general' ? (
              <>
                <button
                  onClick={() => setActiveSubView('dashboard')}
                  style={activeSubView === 'dashboard' ? activeTabStyle : inactiveTabStyle}
                >
                  🌐 General Overview
                </button>
                <button
                  onClick={() => setActiveSubView('presets')}
                  style={(activeSubView === 'presets' || activeSubView === 'calibration') ? activeTabStyle : inactiveTabStyle}
                >
                  📐 Presets (3D Calibration)
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setActiveStationTab('general');
                    setActiveSubView('dashboard');
                  }}
                  style={inactiveTabStyle}
                >
                  ← Back to Stations
                </button>
                <button
                  onClick={() => setActiveSubView('dashboard')}
                  style={activeSubView === 'dashboard' ? activeTabStyle : inactiveTabStyle}
                >
                  🖥️ Dashboard (3D)
                </button>
                <button
                  onClick={() => setActiveSubView('vnc')}
                  style={activeSubView === 'vnc' ? activeTabStyle : inactiveTabStyle}
                >
                  🎮 VNC Viewer (TeachPendant)
                </button>
                <button
                  onClick={() => setActiveSubView('camera')}
                  style={activeSubView === 'camera' ? activeTabStyle : inactiveTabStyle}
                >
                  📷 Camera (2D)
                </button>
                <button
                  onClick={() => setActiveSubView('config')}
                  style={activeSubView === 'config' ? activeTabStyle : inactiveTabStyle}
                >
                  ⚙️ Station Settings
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scrollable content container (Scrollbar único principal con amplio margen inferior) */}
        <div className="main-content-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* GENERAL VIEW ──────────────────────────────────────────────────── */}
          {activeStationTab === 'general' && activeSubView !== 'presets' && activeSubView !== 'calibration' && (
            <GeneralOverview
              stations={stationsHook.stations}
              userRole={userRole}
              onOpenConfigModal={() => {
                stationsHook.setConfigStationId(stationsHook.stations[0]?.id || null);
                stationsHook.setIsConfigModalOpen(true);
              }}
              onSelectStation={(id) => {
                setActiveStationTab(id);
                setActiveSubView('dashboard');
              }}
            />
          )}

          {/* PRESETS LIST ───────────────────────────────────────────────────── */}
          {activeSubView === 'presets' && (
            <main className="stations-container">
              <PresetsView
                presets={presetsHook.presets}
                onCreateNew={() => {
                  calibration.setSpheroidSize({ x: 0.6, y: 0.6, z: 0.6 });
                  calibration.setObjectCenter({ x: 0.0, y: 1.0, z: 0.0 });
                  calibration.setZBounds({ min: -1.0, max: 1.0 });
                  calibration.setPointCount(100);
                  calibration.setColumnHeight(0.5);
                  calibration.setOrbitRadius(1.6);
                  presetsHook.setEditingPresetName('__new__');
                  presetsHook.setEditingPresetForm('');
                  setActiveSubView('calibration');
                }}
                onEditPreset={(name) => {
                  presetsHook.handleLoadPreset(name, {
                    setSpheroidSize: calibration.setSpheroidSize,
                    setObjectCenter: calibration.setObjectCenter,
                    setZBounds: calibration.setZBounds,
                    setPointCount: calibration.setPointCount,
                    setColumnHeight: calibration.setColumnHeight,
                    setOrbitRadius: calibration.setOrbitRadius,
                    setObjectModel: calibration.setObjectModel,
                    setObjectScale: calibration.setObjectScale,
                  });
                  presetsHook.setEditingPresetName(name);
                  setActiveSubView('calibration');
                }}
                onDeletePreset={presetsHook.handleDeletePreset}
              />
            </main>
          )}

          {/* CALIBRATION / PRESET EDITOR ────────────────────────────────────── */}
          {activeSubView === 'calibration' && (
            <main className="stations-container">
              <CalibrationView
                {...robotViewerProps}
                stabilityThreshold={cameraHook.stabilityThreshold}
                setStabilityThreshold={cameraHook.setStabilityThreshold}
                setSpheroidSize={calibration.setSpheroidSize}
                setShowSpheroid={calibration.setShowSpheroid}
                pointCount={calibration.pointCount}
                setPointCount={calibration.setPointCount}
                setObjectCenter={calibration.setObjectCenter}
                setZBounds={calibration.setZBounds}
                setShowSectors={calibration.setShowSectors}
                setColumnHeight={calibration.setColumnHeight}
                setOrbitRadius={calibration.setOrbitRadius}
                objectModel={calibration.objectModel}
                setObjectModel={calibration.setObjectModel}
                objectScale={calibration.objectScale}
                setObjectScale={calibration.setObjectScale}
                isCalculating={calibration.isCalculating}
                presets={presetsHook.presets}
                editingPresetName={presetsHook.editingPresetName}
                editingPresetForm={presetsHook.editingPresetForm}
                setEditingPresetForm={presetsHook.setEditingPresetForm}
                onSavePreset={async (name) => {
                  await presetsHook.handleSavePreset(name);
                  setActiveSubView('presets');
                }}
                onBackToPresets={() => setActiveSubView('presets')}
              />
            </main>
          )}

          {activeStationTab !== 'general' && activeSubView !== 'presets' && activeSubView !== 'calibration' && currentStation && (
            <main className="stations-container">
              {/* Sub-views */}
              {activeSubView === 'dashboard' && (
                <StationDashboard
                  {...robotViewerProps}
                  stabilityThreshold={cameraHook.stabilityThreshold}
                  setStabilityThreshold={cameraHook.setStabilityThreshold}
                  isPlaying={cameraHook.isPlaying}
                  setIsPlaying={cameraHook.setIsPlaying}
                  currentPhotoStep={cameraHook.currentPhotoStep}
                  setCurrentPhotoStep={cameraHook.setCurrentPhotoStep}
                  pointCount={calibration.pointCount}
                  photos={cameraHook.photos}
                  setPhotos={cameraHook.setPhotos}
                  setIsGalleryOpen={cameraHook.setIsGalleryOpen}
                  onNext={cameraHook.handleManualNext}
                  onPrev={cameraHook.handleManualPrev}
                  currentStation={currentStation}
                  stationQueues={stationsHook.stationQueues}
                  stationQueueStatus={stationsHook.stationQueueStatus}
                  handlePlayStationQueue={stationsHook.handlePlayStationQueue}
                  handlePauseStationQueue={stationsHook.handlePauseStationQueue}
                  handleUpdateActiveSpeed={handleUpdateActiveSpeed}
                  onRearmStation={onRearmStation}
                  isRobotConnected={isRobotConnected}
                  setIsRobotConnected={setIsRobotConnected}
                />
              )}

              {activeSubView === 'vnc' && <VncView />}

              {activeSubView === 'camera' && (
                <CameraView
                  cameraConnected={cameraHook.cameraConnected}
                  stabilityThreshold={cameraHook.stabilityThreshold}
                  setStabilityThreshold={cameraHook.setStabilityThreshold}
                />
              )}

              {activeSubView === 'config' && (
                <StationConfigView
                  currentStation={currentStation}
                  handleUpdateStationConfig={stationsHook.handleUpdateStationConfig}
                />
              )}
            </main>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <ConfigExecutionModal
        isOpen={stationsHook.isConfigModalOpen}
        onClose={() => stationsHook.setIsConfigModalOpen(false)}
        configActiveTab={stationsHook.configActiveTab}
        setConfigActiveTab={stationsHook.setConfigActiveTab}
        configFormData={stationsHook.configFormData}
        setConfigFormData={stationsHook.setConfigFormData}
        configStationId={stationsHook.configStationId}
        setConfigStationId={stationsHook.setConfigStationId}
        presets={presetsHook.presets}
        stations={stationsHook.stations}
        onSubmit={stationsHook.handleAddToQueue}
        editingQueueItem={stationsHook.editingQueueItem}
        onCreateNewPreset={() => {
          stationsHook.setIsConfigModalOpen(false);
          setActiveStationTab('general');
          calibration.setSpheroidSize({ x: 0.6, y: 0.6, z: 0.6 });
          calibration.setObjectCenter({ x: 0.0, y: 1.0, z: 0.0 });
          calibration.setZBounds({ min: -1.0, max: 1.0 });
          calibration.setPointCount(100);
          calibration.setColumnHeight(0.5);
          calibration.setOrbitRadius(1.6);
          presetsHook.setEditingPresetName('__new__');
          presetsHook.setEditingPresetForm('');
          setActiveSubView('calibration');
        }}
      />

      <EmergencyAlertModal
        alert={stationsHook.emergencyAlert}
        onClear={stationsHook.handleClearAlert}
      />

      <ObjectChangeModal
        isOpen={stationsHook.showObjectChangePrompt}
        stationName={stationsHook.stations.find(st => st.id === stationsHook.promptStationId)?.name || `Station ${stationsHook.promptStationId}`}
        onContinue={stationsHook.handleContinueQueue}
      />

      <PhotosGalleryModal
        isOpen={cameraHook.isGalleryOpen}
        onClose={() => cameraHook.setIsGalleryOpen(false)}
        photos={cameraHook.photos}
        onClearPhotos={cameraHook.handleClearPhotos}
        onDeletePhoto={cameraHook.handleDeletePhoto}
      />

      {/* Admin: Simulate alert button */}
      {userRole === 'admin' && (
        <button
          onClick={async () => {
            try {
              const targetName = currentStation ? currentStation.name : 'Station 2';
              // TODO: BACKEND_ENDPOINT_REQUIRED
              // ENDPOINT: POST /api/trigger_alert
              // DESCRIPCIÓN: Endpoint de desarrollo/administración para simular el salto de una alerta física de estación.
              // PAYLOAD: { station: 'Station 1', problem: 'Emergency Stop physically pressed' }
              await fetch('http://127.0.0.1:5005/api/trigger_alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station: targetName, problem: 'Emergency Stop physically pressed' }),
              });
            } catch (err) {
              console.error(err);
            }
          }}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: 'auto', zIndex: 100, padding: '10px 18px',
            backgroundColor: '#ff4b2b', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '24px', fontSize: '0.75rem', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255,75,43,0.4)', fontWeight: 'bold',
            backdropFilter: 'blur(8px)',
          }}
        >
          🚨 Simulate Alert {currentStation ? currentStation.name : 'Station 2'}
        </button>
      )}
    </div>
  );
};

export default App;
