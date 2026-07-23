import React, { Suspense } from 'react';
import RobotViewer from '../components/three/RobotViewer';
import BasicOptionsPanel from '../components/panels/BasicOptionsPanel';
import CameraViewer from '../components/panels/CameraViewer';
import styles from '../styles/appStyles';
import { useLanguage } from '../context/LanguageContext';

/**
 * Calibration view — 3D digital twin on the left + spheroid/preset config on the right.
 */
const CalibrationView = ({
  // RobotViewer props
  modelType, currentJointAngles,
  spheroidSize, showSpheroid, pendingPointsPositions, activePoint,
  robotPositionIndex, robotPosition, robotRotationY, nextFivePoints,
  objectCenter, zBounds, showSectors, darkMode, columnHeight, orbitRadius,
  objectModel, setObjectModel, objectScale, setObjectScale,
  isCalculating = false,
  isGalleryOpen,
  // CameraViewer props
  stabilityThreshold, setStabilityThreshold,
  // BasicOptionsPanel props
  setSpheroidSize, setShowSpheroid, pointCount, setPointCount,
  setObjectCenter, setZBounds, setShowSectors, setColumnHeight, setOrbitRadius,
  presets,
  editingPresetName, editingPresetForm, setEditingPresetForm,
  onSavePreset, onBackToPresets,
  // Station & Queue controls
  currentStation, stationQueues = {}, stationQueueStatus = {},
  handlePlayStationQueue, handlePauseStationQueue,
  handleUpdateActiveSpeed, onRearmStation,
}) => {
  const { t, language } = useLanguage();
  const st = currentStation || { id: 1, speed: 0.5, status: 'idle' };
  const status = stationQueueStatus[st.id] || { isPlaying: false, currentIndex: 0 };
  const sQueue = stationQueues[st.id] || [];
  const isPlayingQueue = status.isPlaying;

  return (
    <div className="dashboard-container calibration-container" style={{
      display: 'flex', flex: 1, overflow: 'hidden',
      height: '100%', minHeight: 0, borderRadius: '16px',
      border: '1px solid var(--border-glass)',
      background: 'var(--bg-panel)', backdropFilter: 'blur(10px)',
    }}>
      {/* Left: 3D Viewer (2/3 width) */}
      <div className="dashboard-left-3d" style={{
        flex: 2, position: 'relative', borderRight: '1px solid var(--border-glass)',
        background: 'rgba(0,0,0,0.1)', height: '100%', overflow: 'hidden'
      }}>
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-dim)' }}>
            {language === 'es' ? 'Cargando gemelo digital...' : 'Loading digital twin...'}
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
            objectModel={objectModel}
            objectScale={objectScale}
            isGalleryOpen={isGalleryOpen}
          />
        </Suspense>

        {/* Floating Control Bar at the bottom of the 3D Viewer */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '80px',
          right: '20px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '15px',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
          boxShadow: 'var(--shadow-focus)',
        }}>
          {/* Buttons: Play/Pause and Rearm */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => {
                if (isPlayingQueue) {
                  if (handlePauseStationQueue) handlePauseStationQueue(st.id);
                } else {
                  if (handlePlayStationQueue) handlePlayStationQueue(st.id);
                }
              }}
              disabled={sQueue.length === 0}
              style={{
                ...styles.button,
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '800',
                background: isPlayingQueue ? 'var(--button-active-orange-bg)' : 'var(--accent-green-bg)',
                borderColor: isPlayingQueue ? 'var(--accent-orange)' : 'var(--accent-green)',
                color: isPlayingQueue ? 'var(--accent-orange)' : 'var(--accent-green)',
                opacity: sQueue.length === 0 ? 0.4 : 1,
                cursor: sQueue.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: 'auto',
              }}
            >
              {isPlayingQueue ? t('pause') : t('play')}
            </button>
            
            <button
              onClick={() => onRearmStation && onRearmStation(st.id)}
              style={{
                ...styles.button,
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '800',
                background: (st.status === 'warning' || st.status === 'emergency')
                  ? 'rgba(255, 75, 43, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderColor: (st.status === 'warning' || st.status === 'emergency')
                  ? '#ff4b2b'
                  : 'var(--border-glass)',
                color: (st.status === 'warning' || st.status === 'emergency')
                  ? '#ff4b2b'
                  : 'var(--text-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: 'auto',
                boxShadow: (st.status === 'warning' || st.status === 'emergency')
                  ? '0 0 10px rgba(255, 75, 43, 0.4)'
                  : 'none',
              }}
            >
              {t('rearm')}
            </button>
          </div>

          {/* Speed slider & input numeric editor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end', maxWidth: '350px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
              {t('speed')}:
            </span>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.1"
              value={st.speed || 0.5}
              onChange={(e) => handleUpdateActiveSpeed && handleUpdateActiveSpeed(st.id, parseFloat(e.target.value))}
              style={{ flex: 1, minWidth: '80px', margin: 0 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                min="0.1"
                max="1.5"
                step="0.1"
                value={st.speed || 0.5}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && handleUpdateActiveSpeed) handleUpdateActiveSpeed(st.id, val);
                }}
                style={{
                  width: '55px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '4px',
                  color: 'var(--text-color)',
                  fontSize: '0.75rem',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  padding: '3px 4px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-dim)' }}>m/s</span>
            </div>
          </div>
        </div>

        <CameraViewer
          stabilityThreshold={stabilityThreshold}
          setStabilityThreshold={setStabilityThreshold}
          inlineIMU={false}
        />
      </div>

    {/* Right: Spheroid / Preset config panel (1/3 width) */}
    <div className="dashboard-right-panel" style={{
      flex: 1, minWidth: '340px', maxWidth: '480px', padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '20px',
      overflowY: 'auto', borderLeft: '1px solid var(--border-glass)',
      height: '100%', boxSizing: 'border-box'
    }}>
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
        objectModel={objectModel}
        setObjectModel={setObjectModel}
        objectScale={objectScale}
        setObjectScale={setObjectScale}
        isCalculating={isCalculating}
        presets={presets}
        editingPresetName={editingPresetName}
        editingPresetForm={editingPresetForm}
        setEditingPresetForm={setEditingPresetForm}
        onSavePreset={onSavePreset}
        onBackToPresets={onBackToPresets}
      />
    </div>
  </div>
  );
};

export default CalibrationView;
