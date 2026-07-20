import React, { Suspense } from 'react';
import RobotViewer from '../components/three/RobotViewer';
import CameraViewer from '../components/panels/CameraViewer';
import PhotoSimulationPanel from '../components/panels/PhotoSimulationPanel';
import styles from '../styles/appStyles';

/**
 * Station-specific dashboard: 3D digital twin on the left, controls on the right.
 */
const StationDashboard = ({
  // 3D viewer props
  modelType, currentJointAngles,
  spheroidSize, showSpheroid, pendingPointsPositions, activePoint,
  robotPositionIndex, robotPosition, robotRotationY, nextFivePoints,
  objectCenter, zBounds, showSectors, darkMode, columnHeight, orbitRadius,
  isGalleryOpen,
  // Camera / IMU
  stabilityThreshold, setStabilityThreshold,
  // Photo simulation panel
  isPlaying, setIsPlaying,
  currentPhotoStep, setCurrentPhotoStep,
  pointCount, photos, setPhotos,
  setIsGalleryOpen,
  onNext, onPrev,
  // Station queue controls
  currentStation, stationQueues, stationQueueStatus,
  handlePlayStationQueue, handlePauseStationQueue,
  handleUpdateActiveSpeed, onRearmStation,
  // Robot connection toggle
  isRobotConnected, setIsRobotConnected,
}) => {
  const status = stationQueueStatus[currentStation.id] || { isPlaying: false, currentIndex: 0 };
  const sQueue = stationQueues[currentStation.id] || [];
  const isPlayingQueue = status.isPlaying;

  return (
    <div className="dashboard-container" style={{
      display: 'flex', flex: 1, overflow: 'hidden',
      height: 'calc(100vh - 170px)', borderRadius: '16px',
      border: '1px solid var(--border-glass)',
      background: 'var(--bg-panel)', backdropFilter: 'blur(10px)',
    }}>
      {/* Left: 3D Viewer */}
      <div className="dashboard-left-3d" style={{ flex: 1, position: 'relative', borderRight: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.1)' }}>
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
                  handlePauseStationQueue(currentStation.id);
                } else {
                  handlePlayStationQueue(currentStation.id);
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
              {isPlayingQueue ? '❚❚ Pause' : '▶ Play'}
            </button>
            
            <button
              onClick={() => onRearmStation(currentStation.id)}
              style={{
                ...styles.button,
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '800',
                background: (currentStation.status === 'warning' || currentStation.status === 'emergency')
                  ? 'rgba(255, 75, 43, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderColor: (currentStation.status === 'warning' || currentStation.status === 'emergency')
                  ? '#ff4b2b'
                  : 'var(--border-glass)',
                color: (currentStation.status === 'warning' || currentStation.status === 'emergency')
                  ? '#ff4b2b'
                  : 'var(--text-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: 'auto',
                boxShadow: (currentStation.status === 'warning' || currentStation.status === 'emergency')
                  ? '0 0 10px rgba(255, 75, 43, 0.4)'
                  : 'none',
              }}
            >
              🔄 Rearm
            </button>
          </div>

          {/* Speed slider & input numeric editor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end', maxWidth: '350px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
              Speed:
            </span>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.1"
              value={currentStation.speed || 0.5}
              onChange={(e) => handleUpdateActiveSpeed(currentStation.id, parseFloat(e.target.value))}
              style={{ flex: 1, minWidth: '80px', margin: 0 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                min="0.1"
                max="1.5"
                step="0.1"
                value={currentStation.speed || 0.5}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) handleUpdateActiveSpeed(currentStation.id, val);
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

      {/* Right: Controls panel */}
      <div className="dashboard-right-panel" style={{ width: '340px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', borderLeft: '1px solid var(--border-glass)' }}>
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
          onNext={onNext}
          onPrev={onPrev}
          onViewPhotos={() => setIsGalleryOpen(true)}
        />

        {/* Inline IMU / Vibration Tolerances */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Vibration Tolerances (IMU)
          </h3>
          <CameraViewer
            stabilityThreshold={stabilityThreshold}
            setStabilityThreshold={setStabilityThreshold}
            inlineIMU={true}
          />
        </div>
      </div>
    </div>
  );
};

export default StationDashboard;
