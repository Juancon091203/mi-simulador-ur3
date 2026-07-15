import React from 'react';
import styles from '../styles/appStyles';

/**
 * Station settings sub-view: product name, save path, and telemetry summary.
 * Props: currentStation, handleUpdateStationConfig
 */
const StationConfigView = ({ currentStation, handleUpdateStationConfig }) => (
  <div style={{ display: 'flex', gap: '25px', height: 'calc(100vh - 170px)', width: '100%' }}>
    {/* Storage settings */}
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', gap: '20px',
      background: 'var(--card-bg)', border: '1px solid var(--border-glass)',
      padding: '30px', borderRadius: '16px', overflowY: 'auto',
    }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: 'bold' }}>Storage Settings</h3>

      <div className="form-field">
        <label>Product Name</label>
        <input
          type="text"
          placeholder="e.g. Carrera Sunglasses"
          value={currentStation.product}
          onChange={(e) => handleUpdateStationConfig(currentStation.id, e.target.value, currentStation.savePath)}
          style={styles.input}
        />
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          This name will define the storage folder for captured images.
        </span>
      </div>

      <div className="form-field">
        <label>Save Path</label>
        <input
          type="text"
          placeholder="e.g. C:/Photos/Station"
          value={currentStation.savePath}
          onChange={(e) => handleUpdateStationConfig(currentStation.id, currentStation.product, e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={{
        marginTop: '10px', padding: '15px',
        background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)',
        borderRadius: '8px', fontSize: '0.75rem', lineHeight: '1.6',
      }}>
        ℹ️ Final save path for this product:<br />
        <strong>
          {currentStation.savePath}/{currentStation.product.replace(/\s+/g, '_') || 'unnamed'}/
        </strong>
      </div>
    </div>

    {/* Telemetry summary */}
    <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>Station Telemetry</h3>
        <div style={styles.section}>
          <label style={styles.label}>Assigned Product</label>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
            {currentStation.product || 'None'}
          </div>
        </div>
        <div style={styles.section}>
          <label style={styles.label}>Current Robot Speed</label>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            {currentStation.speed > 0 ? `${currentStation.speed} m/s` : 'Robot stopped'}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StationConfigView;
