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
  const [darkMode, setDarkMode] = useState(true);
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
  const wsConn  = useRobotWebSocket();
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
  });

  // ── Camera / Photos ───────────────────────────────────────────────────────
  const cameraHook = useCamera({
    globalSequence: calibration.globalSequence,
    pointCount: calibration.pointCount,
    setRobotPositionIndex: calibration.setRobotPositionIndex,
  });

  // ── Stations / Queues / Alerts ────────────────────────────────────────────
  const stationsHook = useStations();

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
    isGalleryOpen: cameraHook.isGalleryOpen,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard" style={styles.container}>
      {/* Dark / Light mode toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          padding: '8px 12px', background: 'var(--card-bg)',
          border: '1px solid var(--border-glass)', borderRadius: '20px',
          color: 'var(--text-color)', cursor: 'pointer', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: 'var(--shadow-focus)', backdropFilter: 'blur(10px)',
          fontSize: '0.8rem', width: 'auto',
        }}
      >
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

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
        currentUser={currentUser} userRole={userRole}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* ── Main content ────────────────────────────────────────────────── */}
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

      {/* STATION-SPECIFIC VIEWS ─────────────────────────────────────────── */}
      {activeStationTab !== 'general' && activeSubView !== 'presets' && activeSubView !== 'calibration' && currentStation && (
        <main className="stations-container">
          {/* Station header */}
          <header className="stations-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button
                  onClick={() => { setActiveStationTab('general'); setActiveSubView('dashboard'); }}
                  style={{ width: 'auto', padding: '8px 16px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-color)', fontWeight: 'bold' }}
                >
                  ← Back
                </button>
                <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{currentStation.name}</h2>
                <span className={`station-status-pill status-pill-${currentStation.status}`}>
                  {currentStation.status === 'running' ? 'Running' : currentStation.status === 'idle' ? 'Idle' : currentStation.status === 'warning' ? 'Warning Stop' : 'Emergency'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                Robot IP Address: {currentStation.ip}
              </p>
            </div>
            {userRole === 'admin' && (
              <button
                onClick={() => {
                  stationsHook.setConfigStationId(currentStation.id);
                  stationsHook.setIsConfigModalOpen(true);
                }}
                style={{ ...styles.button, width: '180px', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                ⚙️ Configure Execution
              </button>
            )}
          </header>

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
        pointCount={calibration.pointCount}
        setPointCount={calibration.setPointCount}
        onSubmit={stationsHook.handleAddToQueue}
        editingQueueItem={stationsHook.editingQueueItem}
      />

      <EmergencyAlertModal
        alert={stationsHook.emergencyAlert}
        onClear={stationsHook.handleClearAlert}
      />

      <ObjectChangeModal
        isOpen={stationsHook.showObjectChangePrompt}
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
            position: 'fixed', bottom: '20px', right: '20px',
            width: 'auto', zIndex: 10, padding: '10px 15px',
            backgroundColor: '#ff4b2b', color: 'white', border: 'none',
            borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer',
            boxShadow: '0 0 10px rgba(255,75,43,0.3)', fontWeight: 'bold',
          }}
        >
          🚨 Simulate Alert {currentStation ? currentStation.name : 'Station 2'}
        </button>
      )}
    </div>
  );
};

export default App;
