import React from 'react';
import styles from '../../styles/appStyles';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Configure Execution view/modal with 3 tabs: Basic Info, Camera, Station.
 * Can render either as a full view or as a modal.
 */
const ConfigExecutionModal = ({
  isOpen,
  onClose,
  isView = false,
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

  if (!isOpen && !isView) return null;

  const content = (
    <div className={isView ? "" : "modal-content-full glass"} style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      height: isView ? 'calc(100vh - 170px)' : '100%',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid var(--border-glass)',
      background: 'var(--bg-panel)',
      backdropFilter: 'blur(10px)',
      color: 'var(--text-color)',
      boxSizing: 'border-box',
    }}>
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
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{t('configure_execution_title')}</h2>
      </header>

      <nav className="modal-tabs" style={{ marginTop: '16px', marginBottom: '16px' }}>
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

      <div className="modal-body-scroll" style={{ flex: 1, overflowY: 'auto' }}>
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
                    padding: '8px 14px',
                    background: '#0284c7',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {t('create_preset')}
                </button>
              </div>
            </div>

            {/* Product Name */}
            <div className="form-field">
              <label>{t('product_name')}</label>
              <input
                type="text"
                placeholder="e.g. Botín Piel Marrón #42"
                style={styles.input}
                value={configFormData.productName}
                onChange={(e) => setConfigFormData(prev => ({ ...prev, productName: e.target.value }))}
              />
            </div>

            {/* Save Directory */}
            <div className="form-field">
              <label>{t('save_directory')}</label>
              <input
                type="text"
                style={styles.input}
                value={configFormData.savePath}
                onChange={(e) => setConfigFormData(prev => ({ ...prev, savePath: e.target.value }))}
              />
            </div>

            {/* Robot Speed */}
            <div className="form-field" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>{t('robot_speed_limit')} ({configFormData.robotSpeed} m/s)</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {configFormData.robotSpeed < 0.3 ? t('speed_slow') : configFormData.robotSpeed < 0.7 ? t('speed_normal') : t('speed_fast')}
                </span>
              </div>
              <input
                type="range" min="0.1" max="1.5" step="0.05"
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={configFormData.cameraAutoExposure}
                  onChange={(e) => setConfigFormData(prev => ({ ...prev, cameraAutoExposure: e.target.checked }))}
                />
                <span>{t('auto_exposure')}</span>
              </label>
            </div>

            {!configFormData.cameraAutoExposure && (
              <>
                <div className="form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label>{t('exposure_time')}</label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{configFormData.cameraShutterMs} ms</span>
                  </div>
                  <input
                    type="range" min="0.5" max="50.0" step="0.5"
                    value={configFormData.cameraShutterMs}
                    onChange={(e) => setConfigFormData(prev => ({ ...prev, cameraShutterMs: parseFloat(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label>{t('gain')}</label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{configFormData.cameraGain}</span>
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

      <footer className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={onClose}
          style={{
            ...styles.button,
            width: '120px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-color)',
            fontWeight: '600',
            cursor: 'pointer',
          }}
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
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.2s ease',
              width: '150px',
            }}
          >
            <span>{t('next_tab')}</span>
            <span>→</span>
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!configStationId}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: !configStationId ? 'var(--button-disabled-bg)' : '#0284c7',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              border: 'none',
              cursor: !configStationId ? 'not-allowed' : 'pointer',
              opacity: !configStationId ? 0.5 : 1,
              boxShadow: !configStationId ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.2s ease',
              width: '180px',
            }}
          >
            {editingQueueItem ? t('save_changes') : t('add_execution')}
          </button>
        )}
      </footer>
    </div>
  );

  if (isView) {
    return (
      <main className="stations-container">
        {content}
      </main>
    );
  }

  return (
    <div className="modal-backdrop">
      {content}
    </div>
  );
};

export default ConfigExecutionModal;
