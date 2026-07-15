import React, { useState } from 'react';

/**
 * BasicOptionsPanel - Panel de interfaz principal simplificado para fotógrafos.
 */
const BasicOptionsPanel = ({
  spheroidSize,
  setSpheroidSize,
  showSpheroid = true,
  setShowSpheroid,
  pointCount = 100,
  setPointCount,
  objectCenter = { x: 0.0, y: 1.0, z: 0.0 },
  setObjectCenter,
  zBounds = { min: -1.0, max: 1.0 },
  setZBounds,
  showSectors = false,
  setShowSectors,
  columnHeight = 0.5,
  setColumnHeight,
  orbitRadius = 1.6,
  setOrbitRadius,
  darkMode = true,
  setDarkMode,
  presets = {},
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
  isPlaying,
  setIsPlaying,
  isRobotConnected,
  setIsRobotConnected
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  const handleSliderChange = (axis, value) => {
    setSpheroidSize((prev) => ({
      ...prev,
      [axis]: parseFloat(value)
    }));
  };

  const handleUniformChange = (value) => {
    const val = parseFloat(value);
    setSpheroidSize({ x: val, y: val, z: val });
  };

  const handleCenterChange = (axis, value) => {
    setObjectCenter((prev) => ({
      ...prev,
      [axis]: parseFloat(value)
    }));
  };

  const handleMinZChange = (value) => {
    const val = parseFloat(value);
    setZBounds((prev) => ({
      ...prev,
      min: Math.min(val, prev.max - 0.05)
    }));
  };

  const handleMaxZChange = (value) => {
    const val = parseFloat(value);
    setZBounds((prev) => ({
      ...prev,
      max: Math.max(val, prev.min + 0.05)
    }));
  };

  const handleReset = () => {
    setSpheroidSize({ x: 0.6, y: 0.6, z: 0.6 });
    if (setPointCount) setPointCount(100);
    if (setObjectCenter) setObjectCenter({ x: 0.0, y: 1.0, z: 0.0 });
    if (setZBounds) setZBounds({ min: -1.0, max: 1.0 });
    if (setShowSectors) setShowSectors(false);
    if (setColumnHeight) setColumnHeight(0.5);
    if (setOrbitRadius) setOrbitRadius(1.6);
    setSelectedPreset('');
  };

  const handleSave = () => {
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim());
    setSelectedPreset(newPresetName.trim());
    setNewPresetName('');
  };

  const handleDelete = () => {
    if (!selectedPreset) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the preset "${selectedPreset}"?`);
    if (confirmDelete) {
      onDeletePreset(selectedPreset);
      setSelectedPreset('');
    }
  };

  const handlePresetSelect = (e) => {
    const name = e.target.value;
    setSelectedPreset(name);
    if (name) {
      onLoadPreset(name);
    }
  };

  return (
    <div className="glass spheroid-panel" style={styles.panel}>
      <header style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={styles.title} className="text-gradient">BASIC OPTIONS</h2>
            <p style={styles.subtitle}>Photographer Control Panel</p>
          </div>
        </div>
      </header>

      {/* Botón de Ejecución (Play/Pause y Connect Robot) */}
      <div style={styles.actionButtonGroup}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            ...styles.actionButton,
            background: isPlaying ? 'rgba(255, 157, 0, 0.15)' : 'var(--input-bg)',
            borderColor: isPlaying ? '#ff9d00' : 'var(--border-glass)',
            color: isPlaying ? '#ff9d00' : 'var(--text-color)',
            fontWeight: '800'
          }}
        >
          {isPlaying ? '❚❚ PAUSE RUN' : '▶ PLAY RUN'}
        </button>

        <button
          onClick={() => setIsRobotConnected(!isRobotConnected)}
          style={{
            ...styles.actionButton,
            background: isRobotConnected ? 'rgba(0, 255, 136, 0.12)' : 'var(--input-bg)',
            borderColor: isRobotConnected ? '#00ff88' : 'var(--border-glass)',
            color: isRobotConnected ? '#00ff88' : 'var(--text-color)',
            fontWeight: '800'
          }}
        >
          {isRobotConnected ? 'CONNECTED' : 'CONNECT ROBOT'}
        </button>
      </div>

      <div style={{ ...styles.divider, opacity: 0.15 }} />

      {/* Control de visibilidad de sectores */}
      <div style={styles.row}>
        <span style={styles.label}>SHOW SECTORS</span>
        <label style={styles.switch}>
          <input
            type="checkbox"
            checked={showSectors}
            onChange={(e) => setShowSectors(e.target.checked)}
            style={styles.switchInput}
          />
          <span style={{
            ...styles.switchSlider,
            backgroundColor: showSectors ? 'var(--accent-orange)' : 'var(--switch-off-bg)',
            boxShadow: showSectors ? '0 0 8px var(--accent-orange)' : 'none'
          }}>
            <span style={{
              ...styles.switchKnob,
              transform: showSectors ? 'translateX(18px)' : 'translateX(0px)'
            }} />
          </span>
        </label>
      </div>

      {/* Presets Configuration Section */}
      <div style={styles.presetsSection}>
        <span style={styles.label}>CONFIGURATION PRESETS</span>
        <div style={styles.presetRow}>
          <select
            value={selectedPreset}
            onChange={handlePresetSelect}
            style={styles.select}
          >
            <option value="">-- Load Preset --</option>
            {Object.keys(presets).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {selectedPreset && (
            <button
              onClick={handleDelete}
              style={styles.deletePresetBtn}
              title="Delete selected preset"
            >
              ✕
            </button>
          )}
        </div>

        <div style={styles.savePresetRow}>
          <input
            type="text"
            placeholder="New preset name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleSave}
            disabled={!newPresetName.trim()}
            style={{
              ...styles.savePresetBtn,
              opacity: newPresetName.trim() ? 1 : 0.4,
              cursor: newPresetName.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Save
          </button>
        </div>
      </div>

      <div style={{ ...styles.divider, opacity: 0.15 }} />

      {/* Sliders Principales */}
      <div style={styles.slidersList}>
        {/* Spheroid Size */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}><span style={{ color: '#00d2ff' }}>Spheroid</span> Size</span>
            <span style={styles.sliderValue}>{spheroidSize.x.toFixed(2)}m</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={spheroidSize.x}
            onChange={(e) => handleUniformChange(e.target.value)}
            style={styles.rangeInput}
          />
        </div>

        {/* Center Height (Z) -> controla objectCenter.y (React altura vertical) */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}><span style={{ color: '#00ff88' }}>Center</span> Height (Z)</span>
            <span style={styles.sliderValue}>{objectCenter.y.toFixed(2)}m</span>
          </div>
          <input
            type="range"
            min="-2.0"
            max="2.0"
            step="0.05"
            value={objectCenter.y}
            onChange={(e) => handleCenterChange('y', e.target.value)}
            style={styles.rangeInput}
          />
        </div>

        {/* Fibonacci Points */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}><span style={{ color: '#ff9d00' }}>Fibonacci</span> Points</span>
            <span style={styles.sliderValue}>{pointCount}</span>
          </div>
          <input
            type="range"
            min="0"
            max="700"
            step="10"
            value={pointCount}
            onChange={(e) => setPointCount(parseInt(e.target.value))}
            style={styles.rangeInput}
          />
        </div>

        {/* Robot Orbit Radius */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}><span style={{ color: '#ff9d00' }}>Robot</span> Orbit Radius</span>
            <span style={styles.sliderValue}>{orbitRadius.toFixed(2)}m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={orbitRadius}
            onChange={(e) => setOrbitRadius(parseFloat(e.target.value))}
            style={styles.rangeInput}
          />
        </div>

        {/* Robot Base Height */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}><span style={{ color: '#00d2ff' }}>Robot</span> Base Height</span>
            <span style={styles.sliderValue}>{columnHeight.toFixed(2)}m</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={columnHeight}
            onChange={(e) => setColumnHeight(parseFloat(e.target.value))}
            style={styles.rangeInput}
          />
        </div>
      </div>

      <button onClick={handleReset} style={styles.button}>
        RESET TO DEFAULTS
      </button>

      {/* Advanced Options Collapsible */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={styles.advancedToggleBtn}
        >
          {showAdvanced ? 'Hide Advanced Options ▲' : 'Show Advanced Options (XYZ, Cuts) ▼'}
        </button>

        {showAdvanced && (
          <div style={styles.advancedContainer}>
            <span style={styles.advancedSectionTitle}>ADVANCED CONFIGURATION</span>

            {/* Advanced Dimensions (XYZ) */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#ff4b5c' }}>X</span> Dimension</span>
                <span style={styles.sliderValue}>{spheroidSize.x.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={spheroidSize.x}
                onChange={(e) => handleSliderChange('x', e.target.value)}
                style={styles.rangeInput}
              />
            </div>

            {/* Y Dimension (Depth) -> controla spheroidSize.z (React Z) */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#00d2ff' }}>Y</span> Dimension (Depth)</span>
                <span style={styles.sliderValue}>{spheroidSize.z.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={spheroidSize.z}
                onChange={(e) => handleSliderChange('z', e.target.value)}
                style={styles.rangeInput}
              />
            </div>

            {/* Z Dimension (Height) -> controla spheroidSize.y (React Y) */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#00ff88' }}>Z</span> Dimension (Height)</span>
                <span style={styles.sliderValue}>{spheroidSize.y.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={spheroidSize.y}
                onChange={(e) => handleSliderChange('y', e.target.value)}
                style={styles.rangeInput}
              />
            </div>

            {/* Height Cuts (Min Z) */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#ff9d00' }}>Min</span> Z (Height Cut)</span>
                <span style={styles.sliderValue}>{zBounds.min.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.05"
                value={zBounds.min}
                onChange={(e) => handleMinZChange(e.target.value)}
                style={styles.rangeInput}
              />
            </div>

            {/* Height Cuts (Max Z) */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#00ffcc' }}>Max</span> Z (Height Cut)</span>
                <span style={styles.sliderValue}>{zBounds.max.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.05"
                value={zBounds.max}
                onChange={(e) => handleMaxZChange(e.target.value)}
                style={styles.rangeInput}
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  panel: {
    width: '100%',
    padding: '20px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    color: 'var(--text-color)',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: 0,
  },
  themeButton: {
    border: '1px solid var(--border-glass)',
    borderRadius: '20px',
    padding: '6px 12px',
    color: 'var(--text-color)',
    fontSize: '0.65rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxShadow: 'var(--shadow-focus)'
  },
  actionButtonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  actionButton: {
    padding: '10px 6px',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    fontSize: '0.7rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--text-dim)',
    letterSpacing: '1px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-glass)',
  },
  presetsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  presetRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  select: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    fontSize: '0.75rem',
    outline: 'none',
    cursor: 'pointer'
  },
  deletePresetBtn: {
    padding: '8px 12px',
    background: 'rgba(255, 75, 43, 0.1)',
    border: '1px solid rgba(255, 75, 43, 0.3)',
    borderRadius: '8px',
    color: '#ff4b2b',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    width: 'auto',
    flexShrink: 0
  },
  savePresetRow: {
    display: 'flex',
    gap: '8px'
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    fontSize: '0.75rem',
    outline: 'none'
  },
  savePresetBtn: {
    padding: '8px 16px',
    background: 'rgba(0, 210, 255, 0.1)',
    border: '1px solid rgba(0, 210, 255, 0.3)',
    borderRadius: '8px',
    color: 'var(--accent-cyan)',
    fontSize: '0.75rem',
    fontWeight: '700',
    transition: 'all 0.2s ease',
    width: 'auto',
    flexShrink: 0
  },
  slidersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  axisLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-color)',
  },
  sliderValue: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--accent-cyan)',
    background: 'var(--card-bg)',
    border: '1px solid var(--border-glass)',
    padding: '2px 6px',
    borderRadius: '4px',
    minWidth: '50px',
    textAlign: 'center',
  },
  rangeInput: {
    width: '100%',
    accentColor: 'var(--accent-blue)',
    background: 'var(--slider-track-bg)',
    height: '12px',
    borderRadius: '6px',
    outline: 'none',
    transition: 'opacity 0.2s',
    cursor: 'pointer'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '40px',
    height: '22px',
    cursor: 'pointer',
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  switchSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '34px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
  },
  switchKnob: {
    height: '16px',
    width: '16px',
    borderRadius: '50%',
    backgroundColor: 'white',
    transition: 'transform 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  button: {
    padding: '10px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    color: 'var(--text-color)',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
    outline: 'none',
    cursor: 'pointer'
  },
  advancedToggleBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--accent-blue)',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '6px 0',
    transition: 'all 0.2s ease',
    textDecoration: 'underline',
    outline: 'none',
    textAlign: 'center'
  },
  advancedContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '12px',
    marginTop: '10px',
    borderLeft: '2px solid var(--border-glass)',
    background: 'rgba(255, 255, 255, 0.015)'
  },
  advancedSectionTitle: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: 'var(--text-dim)',
    letterSpacing: '1.5px',
    marginBottom: '4px'
  }
};

export default BasicOptionsPanel;
