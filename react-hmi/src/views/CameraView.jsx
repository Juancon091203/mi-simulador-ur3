import React from 'react';
import CameraViewer from '../components/panels/CameraViewer';
import styles from '../styles/appStyles';

/**
 * 2D camera live feed view with sensor settings and IMU stability panel.
 * Props: cameraConnected, stabilityThreshold, setStabilityThreshold
 */
const CameraView = ({ cameraConnected, stabilityThreshold, setStabilityThreshold }) => (
  <div className="camera-view-container">
    {/* Live feed */}
    <div className="camera-feed-panel glass">
      <img
        src={cameraConnected ? 'http://localhost:5005/camera/stream' : 'http://localhost:5005/bota_ejemplo.png'}
        alt="Camera 2D View"
        className="camera-feed-image"
      />
      <div style={{
        position: 'absolute', top: '15px', left: '15px',
        background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '4px',
        fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ width: '6px', height: '6px', background: '#00ff88', borderRadius: '50%' }} />
        LIVE FEED (2D) - STATION CAMERA
      </div>
    </div>

    {/* Config side panel */}
    <div className="camera-config-panel">
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>Sensor Settings</h3>
        <div style={styles.section}>
          <label style={styles.label}>Auto Exposure</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '5px' }}>
            <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
            Enabled
          </label>
        </div>
        <div style={styles.section}>
          <label style={styles.label}>Exposure Time (ms)</label>
          <input type="range" min="1" max="40" defaultValue="10" />
        </div>
        <div style={styles.section}>
          <label style={styles.label}>Gain</label>
          <input type="range" min="1" max="128" defaultValue="64" />
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>Stability (Physical/IMU)</h3>
        <CameraViewer
          stabilityThreshold={stabilityThreshold}
          setStabilityThreshold={setStabilityThreshold}
          inlineIMU={true}
        />
      </div>
    </div>
  </div>
);

export default CameraView;
