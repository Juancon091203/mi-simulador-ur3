import React, { useState } from 'react';
import styles from '../styles/appStyles';
import { useLanguage } from '../context/LanguageContext';

/**
 * Presets list view — shows all saved presets with their key params.
 * Props: presets, onCreateNew, onEditPreset, onDeletePreset
 */
const PresetsView = ({ presets, onCreateNew, onEditPreset, onDeletePreset }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const safePresets = presets || {};
  const filteredPresetNames = Object.keys(safePresets).filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex', flex: 1, flexDirection: 'column', gap: '20px', padding: '20px',
      borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-panel)',
      backdropFilter: 'blur(10px)', color: 'var(--text-color)', overflowY: 'auto',
      height: 'calc(100vh - 170px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{t('presets_title')}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {t('presets_calibration')}
          </p>
        </div>
        <button
          onClick={onCreateNew}
          style={{
            ...styles.button,
            backgroundColor: 'var(--accent-blue)',
            color: '#000000',
            fontWeight: 'bold',
            width: '180px',
            cursor: 'pointer',
          }}
        >
          {t('create_preset')}
        </button>
      </div>

      {/* Real-time search bar */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder={t('search_presets_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            ...styles.input,
            width: '100%',
            height: '42px',
            fontSize: '0.85rem',
            paddingLeft: '15px',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
        {filteredPresetNames.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-dim)', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
            {Object.keys(presets).length === 0
              ? 'No presets found. Click "Create New Preset" to get started.'
              : 'No presets match your search query.'}
          </div>
        ) : (
          filteredPresetNames.map(name => {
            const cfg = presets[name] || {};
            const sSize = cfg.spheroidSize || { x: 0.6, y: 0.6, z: 0.6 };
            return (
              <div
                key={name}
                className="glass"
                style={{
                  padding: '20px', border: '1px solid var(--border-glass)',
                  borderRadius: '12px', background: 'rgba(255,255,255,0.01)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-blue)', marginBottom: '8px' }}>{name}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {[
                      [t('model_3d'), cfg.objectModel ? (cfg.objectModel.charAt(0).toUpperCase() + cfg.objectModel.slice(1)) : 'Zapato'],
                      [t('model_scale'), `${(cfg.objectScale ?? 1.0).toFixed(2)}x`],
                      [t('fibonacci_points'), cfg.pointCount ?? 100],
                      [t('pre_inspection_points'), cfg.selectedPreInspectionPoints && cfg.selectedPreInspectionPoints.length > 0 ? `${cfg.selectedPreInspectionPoints.length}/4 pts` : 'Sin asignar (0/4)'],
                      [t('spheroid_size_card'), `${sSize.x.toFixed(2)}m`],
                      [t('center_height_z'), `${(cfg.objectCenter?.y ?? 1.0).toFixed(2)}m`],
                      [t('robot_orbit_radius'), `${(cfg.orbitRadius ?? 1.6).toFixed(2)}m`],
                      [t('robot_base_height'), `${(cfg.columnHeight ?? 0.5).toFixed(2)}m`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{label}:</span>
                        <span style={{ color: 'var(--text-color)', fontWeight: 'bold' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => onEditPreset(name)}
                    style={{
                      ...styles.button, flex: 1, width: 'auto',
                      padding: '8px', fontSize: '0.75rem',
                      backgroundColor: 'rgba(0, 210, 255, 0.1)',
                      border: '1px solid var(--accent-blue)',
                      color: 'var(--accent-blue)', cursor: 'pointer',
                    }}
                  >
                    ✏️ {t('edit')}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the preset "${name}"?`)) {
                        onDeletePreset(name);
                      }
                    }}
                    style={{
                      ...styles.button, width: 'auto', flex: '0 0 50px',
                      padding: '8px 12px', fontSize: '0.75rem',
                      backgroundColor: 'rgba(255, 75, 43, 0.1)',
                      border: '1px solid #ff4b2b', color: '#ff4b2b', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Delete preset"
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
            );
          })
        )}
      </div>
    </div>
  );
};

export default PresetsView;
