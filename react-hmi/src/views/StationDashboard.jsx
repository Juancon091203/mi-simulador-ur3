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
  // Robot connection toggle
  isRobotConnected, setIsRobotConnected,
}) => {
  const status = stationQueueStatus[currentStation.id] || { isPlaying: false, currentIndex: 0 };
  const sQueue = stationQueues[currentStation.id] || [];
  const isPlayingQueue = status.isPlaying;

  return (
    <div style={{
      display: 'flex', flex: 1, overflow: 'hidden',
      height: 'calc(100vh - 170px)', borderRadius: '16px',
      border: '1px solid var(--border-glass)',
      background: 'var(--bg-panel)', backdropFilter: 'blur(10px)',
    }}>
      {/* Left: 3D Viewer */}
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
        <CameraViewer
          stabilityThreshold={stabilityThreshold}
          setStabilityThreshold={setStabilityThreshold}
          inlineIMU={false}
        />
      </div>

      {/* Right: Controls panel */}
      <div style={{ width: '340px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', borderLeft: '1px solid var(--border-glass)' }}>
        {/* Station Controls */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Station Controls
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
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
                ...styles.button, flex: 1, padding: '10px', fontSize: '0.75rem', fontWeight: '800',
                background: isPlayingQueue ? 'rgba(255, 157, 0, 0.15)' : 'rgba(0, 255, 136, 0.12)',
                borderColor: isPlayingQueue ? '#ff9d00' : '#00ff88',
                color: isPlayingQueue ? '#ff9d00' : '#00ff88',
                opacity: sQueue.length === 0 ? 0.4 : 1,
                cursor: sQueue.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {isPlayingQueue ? '❚❚ PAUSE RUN' : '▶ PLAY RUN'}
            </button>
            <button
              onClick={() => setIsRobotConnected(!isRobotConnected)}
              style={{
                ...styles.button, flex: 1, padding: '10px', fontSize: '0.75rem', fontWeight: '800',
                background: isRobotConnected ? 'rgba(0, 210, 255, 0.12)' : 'var(--input-bg)',
                borderColor: isRobotConnected ? '#00d2ff' : 'var(--border-glass)',
                color: isRobotConnected ? '#00d2ff' : 'var(--text-color)',
                cursor: 'pointer',
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
