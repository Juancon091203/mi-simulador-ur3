import React from 'react';
import styles from '../../styles/appStyles';
import { useLanguage } from '../../context/LanguageContext';

/** Emergency alert modal — blocks the UI until acknowledged. */
const EmergencyAlertModal = ({ alert, onClear }) => {
  const { t, language } = useLanguage();
  if (!alert) return null;
  return (
    <div className="modal-backdrop">
      <div
        className="modal-content-full glass alert-dialog"
        style={{ height: 'auto', maxHeight: '350px', maxWidth: '480px', padding: '24px' }}
      >
        <h2 style={{ color: '#ff4b2b', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' }}>
          🚨 {language === 'es' ? 'ALERTA CRÍTICA DE ESTACIÓN' : 'CRITICAL STATION ALERT'}
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          {language === 'es'
            ? `Se ha detectado un problema crítico en la `
            : `A critical issue has been detected at `}
          <strong>{alert.station ? alert.station.replace('Station', t('station_name')) : ''}</strong>.<br />
          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            {language === 'es' ? 'Detalles del error: ' : 'Error details: '}{alert.problem}
          </span>
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClear}
            style={{ ...styles.button, padding: '12px 24px', backgroundColor: '#ff4b2b', fontWeight: 'bold' }}
          >
            {language === 'es' ? 'Reconocer y Limpiar Alerta' : 'Acknowledge and Clear Alert'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlertModal;
