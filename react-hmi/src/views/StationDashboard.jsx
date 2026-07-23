import React, { Suspense } from 'react';
import RobotViewer from '../components/three/RobotViewer';
import CameraViewer from '../components/panels/CameraViewer';
import PhotoSimulationPanel from '../components/panels/PhotoSimulationPanel';
import styles from '../styles/appStyles';
import { useLanguage } from '../context/LanguageContext';

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
  const { t, language } = useLanguage();
  const st = currentStation || { id: 1, name: 'Station 1', speed: 0.5, status: 'idle' };
  const status = (stationQueueStatus && stationQueueStatus[st.id]) || { isPlaying: false, currentIndex: 0 };
  const sQueue = (stationQueues && stationQueues[st.id]) || [];
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
            isGalleryOpen={isGalleryOpen}
          />
        </Suspense>
        
        {/* Warning Stop Banner for Pre-inspection Phase */}
        {status.phase === 'waiting' && currentStation.status === 'warning' && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '80px',
              right: '90px',
              background: 'rgba(217, 119, 6, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#ffffff',
              zIndex: 30,
              boxShadow: '0 4px 16px rgba(217, 119, 6, 0.3)',
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>🔍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>
                {t('warning_stop_banner')}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.95, fontWeight: '500' }}>
                {t('warning_stop_banner_sub')}
              </div>
            </div>
          </div>
        )}

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

      {/* Right: Controls panel */}
      <div className="dashboard-right-panel" style={{ width: '340px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', borderLeft: '1px solid var(--border-glass)' }}>
        <PhotoSimulationPanel
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          currentPhotoStep={currentPhotoStep}
          setCurrentPhotoStep={setCurrentPhotoStep}
          pointCount={pointCount}
          savePath={st.savePath || 'C:/Users/FA507/Documents/UNI/PracticasCFZ/ProyectoFotos/UR3_Web-HMI-main/flask-server/static/photos'}
          photos={photos}
          setPhotos={setPhotos}
          isGalleryOpen={isGalleryOpen}
          setIsGalleryOpen={setIsGalleryOpen}
          onNext={() => {
            if (currentPhotoStep < pointCount) {
              const nextStep = currentPhotoStep + 1;
              setCurrentPhotoStep(nextStep);
              if (setRobotPositionIndex) setRobotPositionIndex(nextStep);
            }
          }}
          onPrev={() => {
            if (currentPhotoStep > 0) {
              const prevStep = currentPhotoStep - 1;
              setCurrentPhotoStep(prevStep);
              if (setRobotPositionIndex) setRobotPositionIndex(prevStep);
            }
          }}
          onViewPhotos={() => {
            const folderPath = st.savePath || 'C:/Users/FA507/Documents/UNI/PracticasCFZ/ProyectoFotos/UR3_Web-HMI-main/flask-server/static/photos';
            // TODO: BACKEND_ENDPOINT_REQUIRED
            // ENDPOINT: POST /api/open_folder
            // DESCRIPCIÓN: Endpoint para solicitar la apertura de la carpeta física local en Windows Explorer.
            // PAYLOAD: { save_path: 'C:/Users/FA507/Documents/UNI/PracticasCFZ/ProyectoFotos/UR3_Web-HMI-main/flask-server/static/photos' }
            fetch('http://127.0.0.1:5005/api/open_folder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ save_path: folderPath }),
            }).catch(() => {
              window.open(`file:///${folderPath.replace(/\\/g, '/')}`, '_blank');
            });
          }}
        />

        {/* Inline IMU / Vibration Tolerances */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {t('vibration_tolerances')}
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
