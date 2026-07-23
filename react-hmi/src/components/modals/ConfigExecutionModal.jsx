import React from 'react';
import styles from '../../styles/appStyles';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Configure Execution modal with 3 tabs: Basic Info, Camera, Station.
 * Storage is strictly Local Path.
 */
const ConfigExecutionModal = ({
  isOpen,
  onClose,
  // Tab state
  configActiveTab, setConfigActiveTab,
  // Form data
  configFormData, setConfigFormData,
  configStationId, setConfigStationId,
  // Data
  presets, stations,
  // Submit
  onSubmit,
  editingQueueItem,
  onCreateNewPreset,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content-full glass" style={{ position: 'relative' }}>
        <button
          className="modal-close-btn"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '25px',
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 100,
          }}
        >
          ×
        </button>
        <header className="modal-header">
          <h2 style={{ margin: 0 }}>{t('configure_execution_title')}</h2>
        </header>

        <nav className="modal-tabs">
          {['basic', 'camera', 'station'].map(tab => (
            <button
              key={tab}
              className={`modal-tab-btn ${configActiveTab === tab ? 'active' : ''}`}
              onClick={() => setConfigActiveTab(tab)}
            >
              {tab === 'basic' ? t('tab_basic_info') : tab === 'camera' ? t('tab_camera') : t('tab_station')}
            </button>
          ))}
        </nav>

        <div className="modal-body-scroll">
          {/* ── Basic Info tab ─────────────────────────────────────────────── */}
          {configActiveTab === 'basic' && (
            <div className="form-grid">
              {/* Scanning Preset selector */}
              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label>{t('scanning_preset')}</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    style={{ ...styles.select, flex: 1 }}
                    value={configFormData.presetName || ''}
                    onChange={(e) => setConfigFormData(prev => ({ ...prev, presetName: e.target.value }))}
                  >
                    <option value="">{t('no_preset_selected')}</option>
                    {Object.keys(presets).map(name => {
                      const cfg = presets[name] || {};
                      const s = cfg.spheroidSize || { x: 0.6, y: 0.6, z: 0.6 };
                      return (
                        <option key={name} value={name}>
                          {name} — {cfg.pointCount ?? 100} pts · Size: {s.x.toFixed(2)}m · Height: {(cfg.objectCenter?.y ?? 1.0).toFixed(2)}m
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={onCreateNewPreset}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(0, 210, 255, 0.1)',
                      border: '1px solid var(--accent-blue)',
                      borderRadius: '6px',
                      color: 'var(--accent-blue)',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      width: 'auto',
                    }}
                  >
                    {t('new_preset_btn')}
                  </button>
                </div>
                {configFormData.presetName && presets[configFormData.presetName] && (() => {
                  const cfg = presets[configFormData.presetName];
                  const s = cfg.spheroidSize || { x: 0.6, y: 0.6, z: 0.6 };
                  return (
                    <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)', borderRadius: '8px', fontSize: '0.72rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', color: 'var(--text-dim)' }}>
                      <span>{t('fibonacci_points')}: <strong style={{ color: 'var(--text-color)' }}>{cfg.pointCount ?? 100}</strong></span>
                      <span>{t('spheroid_size_card')}: <strong style={{ color: 'var(--text-color)' }}>{s.x.toFixed(2)} m</strong></span>
                      <span>{t('center_height_z')}: <strong style={{ color: 'var(--text-color)' }}>{(cfg.objectCenter?.y ?? 1.0).toFixed(2)} m</strong></span>
                      <span>{t('robot_orbit_radius')}: <strong style={{ color: 'var(--text-color)' }}>{(cfg.orbitRadius ?? 1.6).toFixed(2)} m</strong></span>
                      <span>{t('robot_base_height')}: <strong style={{ color: 'var(--text-color)' }}>{(cfg.columnHeight ?? 0.5).toFixed(2)} m</strong></span>
                    </div>
                  );
                })()}
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label>{t('product_name')}</label>
                <input
                  type="text"
                  placeholder={t('product_name_placeholder')}
                  value={configFormData.productName}
                  onChange={(e) => setConfigFormData(prev => ({ ...prev, productName: e.target.value }))}
                  style={styles.input}
                />
              </div>

              {/* Storage Path (Strictly Local Path) */}
              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label>{t('photo_save_path')}</label>
                <input
                  type="text"
                  placeholder="e.g. C:/Photos/Nike"
                  value={configFormData.savePath}
                  onChange={(e) => setConfigFormData(prev => ({ ...prev, savePath: e.target.value }))}
                  style={styles.input}
                />
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label>{t('robot_speed_ms')}</label>
                  <input
                    type="number"
                    value={configFormData.robotSpeed}
                    min="0.1"
                    max="1.5"
                    step="0.1"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setConfigFormData(prev => ({ ...prev, robotSpeed: val }));
                    }}
                    style={{
                      width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                      borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                      textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                    }}
                  />
                </div>
                <input
                  type="range" min="0.1" max="1.5" step="0.1"
                  value={configFormData.robotSpeed}
                  onChange={(e) => setConfigFormData(prev => ({ ...prev, robotSpeed: parseFloat(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* ── Camera tab ─────────────────────────────────────────────────── */}
          {configActiveTab === 'camera' && (
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: 'auto' }}>
                  <input
                    type="checkbox"
                    checked={configFormData.cameraAutoExposure}
                    onChange={(e) => setConfigFormData(prev => ({ ...prev, cameraAutoExposure: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {t('enable_auto_exposure')}
                </label>
              </div>
              {!configFormData.cameraAutoExposure && (
                <>
                  <div className="form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label>{t('shutter_speed_ms')}</label>
                      <input
                        type="number"
                        value={configFormData.cameraShutterMs}
                        min="0.5"
                        max="40.0"
                        step="0.5"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setConfigFormData(prev => ({ ...prev, cameraShutterMs: val }));
                        }}
                        style={{
                          width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                          borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                          textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                        }}
                      />
                    </div>
                    <input
                      type="range" min="0.5" max="40.0" step="0.5"
                      value={configFormData.cameraShutterMs}
                      onChange={(e) => setConfigFormData(prev => ({ ...prev, cameraShutterMs: parseFloat(e.target.value) }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label>{t('sensor_gain')}</label>
                      <input
                        type="number"
                        value={configFormData.cameraGain}
                        min="1"
                        max="128"
                        step="1"
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setConfigFormData(prev => ({ ...prev, cameraGain: val }));
                        }}
                        style={{
                          width: '60px', background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
                          borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.75rem',
                          textAlign: 'right', fontWeight: 'bold', padding: '2px 4px', outline: 'none'
                        }}
                      />
                    </div>
                    <input
                      type="range" min="1" max="128" step="1"
                      value={configFormData.cameraGain}
                      onChange={(e) => setConfigFormData(prev => ({ ...prev, cameraGain: parseInt(e.target.value) }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Station tab ────────────────────────────────────────────────── */}
          {configActiveTab === 'station' && (
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label>{t('select_target_station')}</label>
                <select
                  value={configStationId || ''}
                  onChange={(e) => setConfigStationId(parseInt(e.target.value))}
                  style={styles.select}
                >
                  <option value="" disabled>{t('select_a_station')}</option>
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>{st.name.replace('Station', t('station_name'))} ({st.ip})</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button
            onClick={onClose}
            style={{ ...styles.button, width: '120px', background: 'none', border: '1px solid var(--border-glass)', color: 'var(--text-color)' }}
          >
            {t('cancel')}
          </button>
          {configActiveTab !== 'station' ? (
            <button
              onClick={() => {
                if (configActiveTab === 'basic') setConfigActiveTab('camera');
                else if (configActiveTab === 'camera') setConfigActiveTab('station');
              }}
              style={{
                ...styles.button,
                width: '150px',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                color: '#000000',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 210, 255, 0.3)',
              }}
            >
              {t('next_tab')}
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={!configStationId}
              style={{
                ...styles.button,
                width: '180px',
                backgroundColor: !configStationId ? 'var(--button-disabled-bg)' : 'var(--accent-blue)',
                cursor: !configStationId ? 'not-allowed' : 'pointer',
                boxShadow: !configStationId ? 'none' : '0 0 15px rgba(0, 210, 255, 0.3)',
              }}
            >
              {editingQueueItem ? t('save_changes') : t('add_execution')}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ConfigExecutionModal;
