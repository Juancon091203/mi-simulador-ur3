import React from 'react';
import styles from '../styles/appStyles';

/**
 * Presets list view — shows all saved presets with their key params.
 * Props: presets, onCreateNew, onEditPreset, onDeletePreset
 */
const PresetsView = ({ presets, onCreateNew, onEditPreset, onDeletePreset }) => (
  <div style={{
    display: 'flex', flex: 1, flexDirection: 'column', gap: '20px', padding: '20px',
    borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-panel)',
    backdropFilter: 'blur(10px)', color: 'var(--text-color)', overflowY: 'auto',
    height: 'calc(100vh - 170px)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Configuration Presets</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Manage 3D scanning boundary and path presets
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
        ➕ Create New Preset
      </button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
      {Object.keys(presets).length === 0 ? (
        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-dim)', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
          No presets found. Click &ldquo;Create New Preset&rdquo; to get started.
        </div>
      ) : (
        Object.keys(presets).map(name => {
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
                    ['Fibonacci Points', cfg.pointCount ?? 100],
                    ['Spheroid Size (XYZ)', `${sSize.x.toFixed(2)}x${sSize.y.toFixed(2)}x${sSize.z.toFixed(2)}`],
                    ['Orbit Radius', `${(cfg.orbitRadius ?? 1.6).toFixed(2)}m`],
                    ['Base Height', `${(cfg.columnHeight ?? 0.5).toFixed(2)}m`],
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
                  ✏️ Edit &amp; View
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
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

export default PresetsView;
