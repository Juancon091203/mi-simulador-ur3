import React, { useState } from 'react';

/**
 * SpheroidPanel - Panel de interfaz flotante para controlar el esferoide 3D.
 */
const SpheroidPanel = ({
  spheroidSize,
  setSpheroidSize,
  showSpheroid,
  setShowSpheroid,
  pointCount = 100,
  setPointCount,
  robotPositionIndex = 0,
  setRobotPositionIndex,
  objectCenter = { x: 1.2, y: 0.2, z: 0.0 },
  setObjectCenter,
  zBounds = { min: -1.0, max: 1.0 },
  setZBounds
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showCenter, setShowCenter] = useState(false);
  const [showCuts, setShowCuts] = useState(false);

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
    if (setRobotPositionIndex) setRobotPositionIndex(0);
    if (setObjectCenter) setObjectCenter({ x: 1.2, y: 0.2, z: 0.0 });
    if (setZBounds) setZBounds({ min: -1.0, max: 1.0 });
  };

  return (
    <div className="glass spheroid-panel" style={styles.panel}>
      <header style={styles.header}>
        <h2 style={styles.title} className="text-gradient">SPHEROID VOLUME</h2>
        <p style={styles.subtitle}>Calibration & Bounds</p>
      </header>

      {/* Control de visibilidad */}
      <div style={styles.row}>
        <span style={styles.label}>RENDER VOLUME</span>
        <label style={styles.switch}>
          <input
            type="checkbox"
            checked={showSpheroid}
            onChange={(e) => setShowSpheroid(e.target.checked)}
            style={styles.switchInput}
          />
          <span style={{
            ...styles.switchSlider,
            backgroundColor: showSpheroid ? '#00d2ff' : 'rgba(255,255,255,0.1)',
            boxShadow: showSpheroid ? '0 0 10px rgba(0, 210, 255, 0.5)' : 'none'
          }}>
            <span style={{
              ...styles.switchKnob,
              transform: showSpheroid ? 'translateX(18px)' : 'translateX(0px)'
            }} />
          </span>
        </label>
      </div>

      <div style={{ ...styles.divider, opacity: 0.15 }} />

      {/* Sliders de Tamaño */}
      <div style={styles.slidersList}>
        {/* Slider Uniforme Principal */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}><span style={{ color: '#00d2ff' }}>Spheroid</span> Size (Uniform)</span>
            <span style={styles.sliderValue}>{spheroidSize.x.toFixed(2)}m</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={spheroidSize.x}
            disabled={!showSpheroid}
            onChange={(e) => handleUniformChange(e.target.value)}
            style={{
              ...styles.rangeInput,
              opacity: showSpheroid ? 1 : 0.4,
              cursor: showSpheroid ? 'pointer' : 'not-allowed'
            }}
          />
        </div>

        {/* Botón para desplegar detalles X, Y, Z */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            disabled={!showSpheroid}
            style={{
              ...styles.detailsButton,
              opacity: showSpheroid ? 1 : 0.5,
              cursor: showSpheroid ? 'pointer' : 'not-allowed'
            }}
          >
            {showDetails ? 'Hide Advanced Dimensions ▲' : 'Show Advanced Dimensions (X, Y, Z) ▼'}
          </button>
        </div>

        {/* Detalle de Sliders X, Y, Z (desplegable) */}
        {showDetails && showSpheroid && (
          <div style={{ ...styles.slidersList, paddingLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.08)', gap: '12px' }}>
            {/* Slider X */}
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
                disabled={!showSpheroid}
                onChange={(e) => handleSliderChange('x', e.target.value)}
                style={{
                  ...styles.rangeInput,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Slider Y */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#00ff88' }}>Y</span> Dimension</span>
                <span style={styles.sliderValue}>{spheroidSize.y.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={spheroidSize.y}
                disabled={!showSpheroid}
                onChange={(e) => handleSliderChange('y', e.target.value)}
                style={{
                  ...styles.rangeInput,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Slider Z */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#00d2ff' }}>Z</span> Dimension</span>
                <span style={styles.sliderValue}>{spheroidSize.z.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={spheroidSize.z}
                disabled={!showSpheroid}
                onChange={(e) => handleSliderChange('z', e.target.value)}
                style={{
                  ...styles.rangeInput,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        )}

        {/* Botón para desplegar Centro del Objeto */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setShowCenter(!showCenter)}
            disabled={!showSpheroid}
            style={{
              ...styles.detailsButton,
              opacity: showSpheroid ? 1 : 0.5,
              cursor: showSpheroid ? 'pointer' : 'not-allowed'
            }}
          >
            {showCenter ? 'Hide Center Position ▲' : 'Show Center Position (X, Y, Z) ▼'}
          </button>
        </div>

        {/* Detalle de Sliders del Centro (desplegable) */}
        {showCenter && showSpheroid && (
          <div style={{ ...styles.slidersList, paddingLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.08)', gap: '12px' }}>
            {/* Center X */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#ff4b5c' }}>X</span> Center</span>
                <span style={styles.sliderValue}>{objectCenter.x.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={objectCenter.x}
                disabled={!showSpheroid}
                onChange={(e) => handleCenterChange('x', e.target.value)}
                style={{
                  ...styles.rangeInput,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Center Y (vertical) */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#00ff88' }}>Y</span> Center (Height)</span>
                <span style={styles.sliderValue}>{objectCenter.y.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="-0.5"
                max="1.0"
                step="0.05"
                value={objectCenter.y}
                disabled={!showSpheroid}
                onChange={(e) => handleCenterChange('y', e.target.value)}
                style={{
                  ...styles.rangeInput,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Center Z (depth) */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#00d2ff' }}>Z</span> Center (Depth)</span>
                <span style={styles.sliderValue}>{objectCenter.z.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.05"
                value={objectCenter.z}
                disabled={!showSpheroid}
                onChange={(e) => handleCenterChange('z', e.target.value)}
                style={{
                  ...styles.rangeInput,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        )}

        {/* Botón para desplegar Límites de Altura Z (Cortes) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setShowCuts(!showCuts)}
            disabled={!showSpheroid}
            style={{
              ...styles.detailsButton,
              opacity: showSpheroid ? 1 : 0.5,
              cursor: showSpheroid ? 'pointer' : 'not-allowed'
            }}
          >
            {showCuts ? 'Hide Height Cuts ▲' : 'Show Height Cuts (Min/Max Z) ▼'}
          </button>
        </div>

        {/* Detalle de Sliders de Cortes Z (desplegable) */}
        {showCuts && showSpheroid && (
          <div style={{ ...styles.slidersList, paddingLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.08)', gap: '12px' }}>
            {/* Min Z Cut */}
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
                disabled={!showSpheroid}
                onChange={(e) => handleMinZChange(e.target.value)}
                style={{
                  ...styles.rangeInput,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Max Z Cut */}
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
                disabled={!showSpheroid}
                onChange={(e) => handleMaxZChange(e.target.value)}
                style={{
                  ...styles.rangeInput,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        )}

        {/* Slider de Puntos de Fibonacci */}
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
            disabled={!showSpheroid}
            onChange={(e) => setPointCount(parseInt(e.target.value))}
            style={{
              ...styles.rangeInput,
              opacity: showSpheroid ? 1 : 0.4,
              cursor: showSpheroid ? 'pointer' : 'not-allowed'
            }}
          />
        </div>

        {/* Slider de Posición del Robot (1 a 6) */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}><span style={{ color: '#00ffcc' }}>Robot</span> Position</span>
            <span style={styles.sliderValue}>P{robotPositionIndex + 1}</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={robotPositionIndex}
            onChange={(e) => setRobotPositionIndex(parseInt(e.target.value))}
            style={{
              ...styles.rangeInput,
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      <button
        onClick={handleReset}
        disabled={!showSpheroid}
        style={{
          ...styles.button,
          opacity: showSpheroid ? 1 : 0.5,
          cursor: showSpheroid ? 'pointer' : 'not-allowed'
        }}
      >
        RESET TO DEFAULTS
      </button>
    </div>
  );
};

const styles = {
  panel: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '280px',
    padding: '20px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    color: '#ffffff',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
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
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: 0,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '1px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#ffffff',
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
    color: 'rgba(255,255,255,0.8)',
  },
  sliderValue: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#3aedff',
    background: 'rgba(58,237,255,0.08)',
    padding: '2px 6px',
    borderRadius: '4px',
    minWidth: '50px',
    textAlign: 'center',
  },
  rangeInput: {
    width: '100%',
    accentColor: '#00d2ff',
    background: 'rgba(255,255,255,0.05)',
    height: '4px',
    borderRadius: '2px',
    outline: 'none',
    transition: 'opacity 0.2s',
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
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  detailsButton: {
    background: 'none',
    border: 'none',
    color: '#00d2ff',
    fontSize: '0.7rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'all 0.2s ease',
    textDecoration: 'underline',
    outline: 'none',
  }
};

export default SpheroidPanel;
