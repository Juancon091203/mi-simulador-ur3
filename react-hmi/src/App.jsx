import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

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
import ExecutionCompletedModal from './components/modals/ExecutionCompletedModal';
import PhotosGalleryModal from './components/panels/PhotosGalleryModal';

// ── Views ──────────────────────────────────────────────────────────────────
import LoginView from './views/LoginView';
import PresetsView from './views/PresetsView';
import CalibrationView from './views/CalibrationView';
import StationDashboard from './views/StationDashboard';
import VncView from './views/VncView';
import CameraView from './views/CameraView';
import StationConfigView from './views/StationConfigView';

// ── Context ────────────────────────────────────────────────────────────────
import { useLanguage } from './context/LanguageContext.jsx';

// ── Styles ─────────────────────────────────────────────────────────────────
import styles from './styles/appStyles';

// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Active station (Single station focus, defaults to station 1)
  const [activeStationId, setActiveStationId] = useState(1);

  // Auth / Role state
  const [currentUser, setCurrentUser] = useState(t('anonymous_user'));
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [loginPass, setLoginPass] = useState('');
  const userRole = isDeveloperMode ? 'admin' : 'operator';

  // Responsive mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Custom Hooks
  const cameraHook = useCamera();
  const stationsHook = useStations();
  const presetsHook = usePresets();

  const currentStation = stationsHook.stations.find(st => st.id === activeStationId) || stationsHook.stations[0];

  const handleUnlockDeveloper = () => {
    setIsDeveloperMode(true);
    setCurrentUser(t('developer_user'));
    setIsDevModalOpen(false);
    setLoginPass('');
  };

  const handleLockDeveloper = () => {
    setIsDeveloperMode(false);
    setCurrentUser(t('anonymous_user'));
    setIsDevModalOpen(false);
  };

  // Robot communication & state
  const robotConn = useRobotConnection({ currentStation });

  const calibration = useCalibration({
    robotIp: currentStation?.ip,
    isRobotConnected: robotConn.isRobotConnected,
  });

  useRobotWebSocket({
    robotIp: currentStation?.ip,
    isRobotConnected: robotConn.isRobotConnected,
    setIsRobotConnected: robotConn.setIsRobotConnected,
    setLiveJointAngles: robotConn.setLiveJointAngles,
  });

  const { onRearmStation, handleUpdateActiveSpeed } = useRobotHttp({
    robotIp: currentStation?.ip,
    currentStation,
    setStations: stationsHook.setStations,
    activeSpeed: robotConn.activeSpeed,
    setActiveSpeed: robotConn.setActiveSpeed,
  });

  const robotViewerProps = {
    modelType: robotConn.modelType,
    currentJointAngles: robotConn.currentJointAngles,
    spheroidSize: calibration.spheroidSize,
    showSpheroid: calibration.showSpheroid,
    pendingPointsPositions: calibration.pendingPointsPositions,
    activePoint: calibration.activePoint,
    robotPositionIndex: calibration.robotPositionIndex,
    setRobotPositionIndex: calibration.setRobotPositionIndex,
    robotPosition: calibration.robotPosition,
    robotRotationY: calibration.robotRotationY,
    nextFivePoints: calibration.nextFivePoints,
    objectCenter: calibration.objectCenter,
    zBounds: calibration.zBounds,
    showSectors: calibration.showSectors,
    darkMode: stationsHook.darkMode,
    columnHeight: calibration.columnHeight,
    orbitRadius: calibration.orbitRadius,
    isGalleryOpen: cameraHook.isGalleryOpen,
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
        <Sidebar
          currentStation={currentStation}
          currentUser={currentUser}
          userRole={userRole}
          onLogout={() => {
            if (isDeveloperMode) handleLockDeveloper();
            else setIsDevModalOpen(true);
          }}
          onOpenLoginModal={() => setIsDevModalOpen(true)}
          darkMode={stationsHook.darkMode}
          setDarkMode={stationsHook.setDarkMode}
          className={isSidebarOpen ? 'open' : ''}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Main Content View */}
        <main className="main-content-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <header style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-glass)',
            background: 'var(--header-bg)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              {currentStation && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '700' }}>
                      {currentStation.name ? currentStation.name.replace('Station', t('station_name')) : t('station_name')}
                    </h2>
                    <span className={`station-status-pill status-pill-${currentStation.status}`}>
                      {currentStation.status === 'running' ? t('status_running') : currentStation.status === 'idle' ? t('status_idle') : currentStation.status === 'emergency' ? t('status_emergency') : t('status_warning')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {t('robot_ip')}: {currentStation.ip}
                  </p>
                </div>
              )}
            </div>
          </header>

          {/* React Router Routes */}
          <Routes>
            {/* Dashboard (3D) */}
            <Route path="/" element={
              <main className="stations-container">
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
                  isRobotConnected={robotConn.isRobotConnected}
                  setIsRobotConnected={robotConn.setIsRobotConnected}
                  onNewExecution={(stId) => {
                    const validId = (typeof stId === 'number') ? stId : null;
                    stationsHook.setConfigStationId(validId || currentStation.id);
                    navigate('/config-execution');
                  }}
                />
              </main>
            } />

            {/* Configurar Nueva Ejecución */}
            <Route path="/config-execution" element={
              <main className="stations-container">
                <ConfigExecutionModal
                  isView={true}
                  isOpen={true}
                  onClose={() => navigate('/')}
                  configActiveTab={stationsHook.configActiveTab}
                  setConfigActiveTab={stationsHook.setConfigActiveTab}
                  configFormData={stationsHook.configFormData}
                  setConfigFormData={stationsHook.setConfigFormData}
                  configStationId={stationsHook.configStationId || currentStation.id}
                  setConfigStationId={stationsHook.setConfigStationId}
                  presets={presetsHook.presets}
                  stations={stationsHook.stations}
                  onSubmit={() => {
                    stationsHook.handleAddToQueue();
                    navigate('/');
                  }}
                  editingQueueItem={stationsHook.editingQueueItem}
                  onCreateNewPreset={() => {
                    calibration.setSpheroidSize({ x: 0.6, y: 0.6, z: 0.6 });
                    calibration.setObjectCenter({ x: 0.0, y: 1.0, z: 0.0 });
                    calibration.setZBounds({ min: -1.0, max: 1.0 });
                    calibration.setPointCount(100);
                    calibration.setColumnHeight(0.5);
                    calibration.setOrbitRadius(1.6);
                    presetsHook.setEditingPresetName('__new__');
                    presetsHook.setEditingPresetForm('');
                    navigate('/calibration');
                  }}
                />
              </main>
            } />

            {/* VNC Viewer */}
            {userRole === 'admin' && (
              <Route path="/vnc" element={
                <main className="stations-container">
                  <VncView />
                </main>
              } />
            )}

            {/* Cámara 2D */}
            <Route path="/camera" element={
              <main className="stations-container">
                <CameraView
                  cameraConnected={cameraHook.cameraConnected}
                  stabilityThreshold={cameraHook.stabilityThreshold}
                  setStabilityThreshold={cameraHook.setStabilityThreshold}
                />
              </main>
            } />

            {/* Ajustes de Estación */}
            <Route path="/settings" element={
              <main className="stations-container">
                <StationConfigView
                  currentStation={currentStation}
                  handleUpdateStationConfig={stationsHook.handleUpdateStationConfig}
                />
              </main>
            } />

            {/* Presets List */}
            <Route path="/presets" element={
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
                    navigate('/calibration');
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
                    navigate('/calibration');
                  }}
                  onDeletePreset={presetsHook.handleDeletePreset}
                />
              </main>
            } />

            {/* Calibración / Preset Editor */}
            <Route path="/calibration" element={
              <main className="stations-container" style={{ flex: 1, overflow: 'hidden', padding: '12px 24px 16px 24px', height: 'calc(100vh - 145px)', boxSizing: 'border-box' }}>
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
                  currentStation={currentStation}
                  stationQueues={stationsHook.stationQueues}
                  stationQueueStatus={stationsHook.stationQueueStatus}
                  handlePlayStationQueue={stationsHook.handlePlayStationQueue}
                  handlePauseStationQueue={stationsHook.handlePauseStationQueue}
                  handleUpdateActiveSpeed={handleUpdateActiveSpeed}
                  onRearmStation={onRearmStation}
                  userRole={userRole}
                  selectedPreInspectionPoints={calibration.selectedPreInspectionPoints}
                  setSelectedPreInspectionPoints={calibration.setSelectedPreInspectionPoints}
                  isPointSelectionMode={calibration.isPointSelectionMode}
                  setIsPointSelectionMode={calibration.setIsPointSelectionMode}
                  handleToggleSelectPoint={calibration.handleToggleSelectPoint}
                  globalSequence={calibration.globalSequence}
                  onSavePreset={async (name) => {
                    await presetsHook.handleSavePreset(name, calibration.selectedPreInspectionPoints);
                    navigate('/presets');
                  }}
                  onBackToPresets={() => navigate('/presets')}
                />
              </main>
            } />

            {/* Fallback to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

      {/* Modals */}
      <EmergencyAlertModal
        alert={stationsHook.emergencyAlert}
        onClear={stationsHook.handleClearAlert}
      />

      <ObjectChangeModal
        isOpen={stationsHook.showObjectChangePrompt}
        stationName={stationsHook.stations.find(st => st.id === stationsHook.promptStationId)?.name || `Station ${stationsHook.promptStationId}`}
        onContinue={stationsHook.handleContinueQueue}
      />

      <LoginView
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        loginPass={loginPass}
        setLoginPass={setLoginPass}
        isDeveloperMode={isDeveloperMode}
        onUnlockDeveloper={handleUnlockDeveloper}
        onLockDeveloper={handleLockDeveloper}
      />

      <PhotosGalleryModal
        isOpen={cameraHook.isGalleryOpen}
        onClose={() => cameraHook.setIsGalleryOpen(false)}
        photos={cameraHook.photos}
        onClearPhotos={cameraHook.handleClearPhotos}
        onDeletePhoto={cameraHook.handleDeletePhoto}
      />

      <ExecutionCompletedModal
        isOpen={stationsHook.showCompletionPrompt}
        stationName={stationsHook.completionStationId ? (stationsHook.stations.find(s => s.id === stationsHook.completionStationId)?.name || `Station ${stationsHook.completionStationId}`) : ''}
        onRepeat={stationsHook.handleRepeatExecution}
        onFinish={stationsHook.handleFinishExecution}
      />
    </div>
  );
};

export default App;
