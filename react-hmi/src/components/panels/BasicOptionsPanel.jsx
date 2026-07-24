import React, { useState } from 'react';
import { AVAILABLE_OBJECT_MODELS } from '../../constants/objectModels';
import { useLanguage } from '../../context/LanguageContext';

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
  objectModel = 'zapato',
  setObjectModel,
  objectScale = 1.0,
  setObjectScale,
  isCalculating = false,
  darkMode = false,
  setDarkMode,
  presets = {},
  editingPresetName,        // string (e.g. 'PresetA') o '__new__'
  editingPresetForm,        // state del input de texto del nombre
  setEditingPresetForm,     // setter del input
  onSavePreset,             // callback para guardar
  onBackToPresets,          // callback para volver
  userRole,
  selectedPreInspectionPoints = [],
  setSelectedPreInspectionPoints,
  isPointSelectionMode = false,
  setIsPointSelectionMode,
}) => {
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customModels, setCustomModels] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const modelName = file.name.replace(/\.glb$/i, '');
    const newModel = { id: modelName.toLowerCase(), name: modelName };
    setCustomModels(prev => [...prev, newModel]);
    if (setObjectModel) setObjectModel(newModel.id);

    // TODO: BACKEND_ENDPOINT_REQUIRED
    // ENDPOINT: POST /api/upload_model
    // DESCRIPCIÓN: Endpoint para subir un nuevo archivo de modelo 3D (.glb) al servidor.
    // PAYLOAD: FormData (file: .glb)
    const formData = new FormData();
    formData.append('file', file);
    fetch('http://127.0.0.1:5005/api/upload_model', {
      method: 'POST',
      body: formData,
    }).catch(() => console.log('Mock GLB upload recorded for:', file.name));
  };

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
    const parsed = parseFloat(value);
    const val = axis === 'y' ? Math.max(0.0, parsed) : parsed;
    setObjectCenter((prev) => ({
      ...prev,
      [axis]: val
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
  };

  return (
    <div className="glass spheroid-panel" style={styles.panel}>
      <header style={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={onBackToPresets}
            style={{
              ...styles.actionButton,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-color)',
              padding: '6px 12px',
              fontSize: '0.75rem',
              alignSelf: 'flex-start',
              cursor: 'pointer'
            }}
          >
            {t('back_to_presets_list')}
          </button>

          <div>
            <h2 style={styles.title} className="text-gradient">
              {editingPresetName === '__new__' ? t('create_new_preset_title') : t('edit_preset_title')}
            </h2>
            {editingPresetName !== '__new__' && (
              <p style={{ ...styles.subtitle, color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                {t('preset')}: {editingPresetName}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Indicador Fijo de Carga / Estado de Puntos Fibonacci (Sin desplazamiento de layout) */}
      <div style={{
        height: '34px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 12px',
        borderRadius: '8px',
        background: isCalculating ? 'rgba(0, 210, 255, 0.1)' : 'rgba(0, 255, 136, 0.08)',
        border: `1px solid ${isCalculating ? 'var(--accent-blue)' : 'rgba(0, 255, 136, 0.3)'}`,
        transition: 'all 0.2s ease',
      }}>
        {isCalculating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 'bold' }}>
            <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span>{t('calculating_points')}</span>
          </div>
        ) : (
          <span style={{ color: '#00ff88', fontSize: '0.75rem', fontWeight: 'bold' }}>
            ✓ {t('points_calculated')} ({pointCount} pts)
          </span>
        )}
      </div>

      {/* Preset Action Box (Save / Naming) */}
      <div style={{ ...styles.presetsSection, marginBottom: '20px' }}>
        {editingPresetName === '__new__' ? (
          <div style={styles.savePresetRow}>
            <input
              type="text"
              placeholder={t('preset_name') + '...'}
              value={editingPresetForm}
              onChange={(e) => setEditingPresetForm(e.target.value)}
              style={styles.input}
            />
            <button
              onClick={() => onSavePreset(editingPresetForm.trim())}
              disabled={!editingPresetForm.trim()}
              style={{
                ...styles.savePresetBtn,
                background: 'var(--accent-blue)',
                color: '#000000',
                fontWeight: 'bold',
                opacity: editingPresetForm.trim() ? 1 : 0.4,
                cursor: editingPresetForm.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {t('save_preset')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSavePreset(editingPresetName)}
            style={{
              ...styles.savePresetBtn,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              color: '#ffffff',
              fontWeight: '900',
              width: '100%',
              fontSize: '0.8rem',
              boxShadow: '0 0 10px rgba(2, 132, 199, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            {t('save_preset')}
          </button>
        )}
      </div>

      <div style={{ ...styles.divider, opacity: 0.15 }} />

      {/* Sliders Principales */}
      <div style={styles.slidersList}>
        {/* Spheroid Size */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}>{t('spheroid_size')}</span>
            <input
              type="number"
              value={spheroidSize.x}
              min="0.1"
              max="2.0"
              step="0.05"
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleUniformChange(val);
              }}
              style={{
                width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
              }}
            />
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

        {/* 3D Object Model Selector */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}>{t('object_model')}</span>
          </div>
          <select
            value={objectModel}
            onChange={(e) => setObjectModel && setObjectModel(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-color)',
              fontWeight: '600',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            {[...AVAILABLE_OBJECT_MODELS, ...customModels].map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id}.glb)
              </option>
            ))}
          </select>

          {/* Developer-Only: Add new .glb model button */}
          {userRole === 'admin' && (
            <label
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(0, 210, 255, 0.1)',
                border: '1px solid var(--accent-blue)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: 'var(--accent-blue)',
                marginTop: '6px',
              }}
            >
              {t('upload_glb_model')}
              <input
                type="file"
                accept=".glb"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        {/* 3D Object Scale Factor */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}>{t('model_scale_factor')}</span>
            <input
              type="number"
              value={objectScale}
              min="0.2"
              max="3.0"
              step="0.05"
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && setObjectScale) setObjectScale(Math.max(0.1, val));
              }}
              style={{
                width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
              }}
            />
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.05"
            value={objectScale}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && setObjectScale) setObjectScale(val);
            }}
            style={styles.rangeInput}
          />
        </div>

        {/* Center Height (Z) -> controla objectCenter.y (React altura vertical) */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.axisLabel}>{t('center_height_z')}</span>
            <input
              type="number"
              value={objectCenter.y}
              min="0.0"
              max="2.0"
              step="0.05"
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleCenterChange('y', val);
              }}
              style={{
                width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
              }}
            />
          </div>
          <input
            type="range"
            min="0.0"
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
            <span style={styles.axisLabel}>{t('fibonacci_points')}</span>
            <input
              type="number"
              value={pointCount}
              min="0"
              max="700"
              step="10"
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setPointCount(val);
              }}
              style={{
                width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
              }}
            />
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

        {/* 4-Point Pre-Inspection Selection Box */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          background: isPointSelectionMode ? 'var(--accent-green-bg)' : 'var(--card-bg)',
          border: `1px solid ${isPointSelectionMode ? 'var(--accent-green-border)' : 'var(--border-glass)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          margin: '4px 0 12px 0',
        }}>
          {/* Row 1: Section Title */}
          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-color)' }}>
            🎯 {t('pre_inspection_points')}
          </div>

          {/* Row 2: Counter Badge + Select Mode Button + Trash Bin Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '10px',
              background: isPointSelectionMode ? 'var(--accent-green-bg)' : 'var(--border-inner-glass)',
              color: isPointSelectionMode ? 'var(--accent-green)' : 'var(--text-dim)',
              border: `1px solid ${isPointSelectionMode ? 'var(--accent-green-border)' : 'var(--border-glass)'}`,
            }}>
              {selectedPreInspectionPoints.length}/4
            </span>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={() => setIsPointSelectionMode && setIsPointSelectionMode(!isPointSelectionMode)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isPointSelectionMode ? 'var(--accent-green-bg)' : 'var(--input-bg)',
                  border: `1px solid ${isPointSelectionMode ? 'var(--accent-green-border)' : 'var(--border-glass)'}`,
                  color: isPointSelectionMode ? 'var(--accent-green)' : 'var(--text-color)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: 'auto',
                  transition: 'all 0.2s ease',
                  boxShadow: isPointSelectionMode ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none',
                }}
              >
                {isPointSelectionMode ? `✓ ${t('finish_selection')}` : `🎯 ${t('select_4_points_mode')}`}
              </button>

              <button
                onClick={() => {
                  if (selectedPreInspectionPoints.length > 0 && setSelectedPreInspectionPoints) {
                    setSelectedPreInspectionPoints([]);
                  }
                }}
                disabled={selectedPreInspectionPoints.length === 0}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: selectedPreInspectionPoints.length > 0 ? 'rgba(255, 75, 43, 0.08)' : 'var(--input-bg)',
                  border: `1px solid ${selectedPreInspectionPoints.length > 0 ? '#ff4b2b' : 'var(--border-glass)'}`,
                  color: selectedPreInspectionPoints.length > 0 ? '#ff4b2b' : 'var(--text-dim)',
                  opacity: selectedPreInspectionPoints.length > 0 ? 1 : 0.5,
                  cursor: selectedPreInspectionPoints.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 'auto',
                  transition: 'all 0.2s ease',
                }}
                title={t('clear_selection')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Developer-Only: Robot Orbit Radius & Robot Base Height */}
        {userRole === 'admin' && (
          <>
            {/* Robot Orbit Radius */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}>{t('robot_orbit_radius')}</span>
                <input
                  type="number"
                  value={orbitRadius}
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) setOrbitRadius(val);
                  }}
                  style={{
                    width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                    borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                    textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                  }}
                />
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
                <span style={styles.axisLabel}>{t('robot_base_height')}</span>
                <input
                  type="number"
                  value={columnHeight}
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) setColumnHeight(val);
                  }}
                  style={{
                    width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                    borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                    textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                  }}
                />
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
          </>
        )}
      </div>

      {/* Advanced Options Collapsible */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={styles.advancedToggleBtn}
        >
          {showAdvanced ? t('hide_advanced_options') : t('show_advanced_options')}
        </button>

        {showAdvanced && (
          <div style={styles.advancedContainer}>
            <span style={styles.advancedSectionTitle}>ADVANCED CONFIGURATION</span>

            {/* Advanced Dimensions (XYZ) */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.axisLabel}><span style={{ color: '#ff4b5c' }}>X</span> Dimension</span>
                <input
                  type="number"
                  value={spheroidSize.x}
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleSliderChange('x', val);
                  }}
                  style={{
                    width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                    borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                    textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                  }}
                />
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
                <input
                  type="number"
                  value={spheroidSize.z}
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleSliderChange('z', val);
                  }}
                  style={{
                    width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                    borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                    textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                  }}
                />
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
                <span style={styles.axisLabel}><span style={{ color: 'var(--accent-green)' }}>Z</span> Dimension (Height)</span>
                <input
                  type="number"
                  value={spheroidSize.y}
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleSliderChange('y', val);
                  }}
                  style={{
                    width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                    borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                    textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                  }}
                />
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
                <input
                  type="number"
                  value={zBounds.min}
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleMinZChange(val);
                  }}
                  style={{
                    width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                    borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                    textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                  }}
                />
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
                <input
                  type="number"
                  value={zBounds.max}
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleMaxZChange(val);
                  }}
                  style={{
                    width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                    borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                    textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                  }}
                />
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
