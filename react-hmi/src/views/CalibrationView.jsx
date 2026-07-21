import React, { Suspense } from 'react';
import RobotViewer from '../components/three/RobotViewer';
import BasicOptionsPanel from '../components/panels/BasicOptionsPanel';
import CameraViewer from '../components/panels/CameraViewer';

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
}) => (
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
          objectModel={objectModel}
          objectScale={objectScale}
          isGalleryOpen={isGalleryOpen}
        />
      </Suspense>
      <CameraViewer
        stabilityThreshold={stabilityThreshold}
        setStabilityThreshold={setStabilityThreshold}
        inlineIMU={false}
      />
    </div>

    {/* Right: Spheroid / Preset config panel */}
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

export default CalibrationView;
