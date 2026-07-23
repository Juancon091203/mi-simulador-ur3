import React from 'react';
import styles from '../../styles/appStyles';
import { useLanguage } from '../../context/LanguageContext';

/** Modal prompting the operator to change the physical object between queue items. */
const ObjectChangeModal = ({ isOpen, stationName, onContinue }) => {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop">
      <div
        className="modal-content-full glass"
        style={{ height: 'auto', maxHeight: '350px', maxWidth: '480px', padding: '24px', borderLeft: '6px solid var(--accent-orange)' }}
      >
        <h2 style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' }}>
          🔄 {language === 'es' ? 'CAMBIO DE OBJETO REQUERIDO' : 'OBJECT CHANGE REQUIRED'}
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          {language === 'es'
            ? `La ejecución del producto anterior ha finalizado en la estación `
            : `The previous product execution has finished at `}
          <strong>{stationName ? stationName.replace('Station', t('station_name')) : ''}</strong>
          {language === 'es'
            ? `. Por favor, retira el objeto actual del plato giratorio y coloca el siguiente objeto a fotografiar.`
            : `. Please remove the current object from the turntable and place the next object to be photographed.`}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onContinue}
            style={{ ...styles.button, padding: '12px 24px', backgroundColor: 'var(--accent-blue)', fontWeight: 'bold' }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObjectChangeModal;
