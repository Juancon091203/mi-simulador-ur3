import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/** Simple VNC snapshot viewer for the teach pendant. */
const VncView = () => {
  const { t } = useLanguage();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-panel)', border: '1px solid var(--border-glass)',
      borderRadius: '16px', padding: '20px',
      maxWidth: '960px', width: '100%', margin: '0 auto',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
    }}>
      {/* VNC Header info bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', marginBottom: '15px', paddingBottom: '10px',
        borderBottom: '1px solid var(--border-glass)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
            {t('vnc_title')}
          </span>
        </div>
      </div>

    {/* VNC Screen Container */}
    <div style={{
      width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
      maxHeight: 'calc(100vh - 270px)', overflow: 'hidden', borderRadius: '12px',
      background: 'rgba(0, 0, 0, 0.2)', padding: '8px',
    }}>
      {/* TODO: BACKEND_ENDPOINT_REQUIRED */}
      {/* ENDPOINT: GET /VNC_UR.png (o noVNC WebSocket / VNC Stream) */}
      {/* DESCRIPCIÓN: Stream de vídeo en tiempo real del TeachPendant del Robot. */}
      <img
        src="http://127.0.0.1:5005/VNC_UR.png"
        alt="TeachPendant VNC"
        style={{
          maxWidth: '100%', maxHeight: 'calc(100vh - 290px)',
          objectFit: 'contain', borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  </div>
  );
};

export default VncView;
