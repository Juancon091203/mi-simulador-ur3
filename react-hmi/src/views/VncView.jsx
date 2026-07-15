import React from 'react';

/** Simple VNC snapshot viewer for the teach pendant. */
const VncView = () => (
  <div style={{
    display: 'flex', flex: 1, flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-panel)', border: '1px solid var(--border-glass)',
    borderRadius: '16px', padding: '20px', height: 'calc(100vh - 170px)',
  }}>
    <img
      src="http://127.0.0.1:5005/VNC_UR.png"
      alt="TeachPendant VNC"
      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
    />
  </div>
);

export default VncView;
