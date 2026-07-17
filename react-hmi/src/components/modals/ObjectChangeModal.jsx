import React from 'react';
import styles from '../../styles/appStyles';

/** Modal prompting the operator to change the physical object between queue items. */
const ObjectChangeModal = ({ isOpen, stationName, onContinue }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop">
      <div
        className="modal-content-full glass"
        style={{ height: 'auto', maxHeight: '350px', maxWidth: '480px', padding: '24px', borderLeft: '6px solid var(--accent-orange)' }}
      >
        <h2 style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' }}>
          🔄 OBJECT CHANGE REQUIRED
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          The previous product execution has finished at <strong>{stationName}</strong>. Please remove the current object from the turntable and place the next object to be photographed.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onContinue}
            style={{ ...styles.button, padding: '12px 24px', backgroundColor: 'var(--accent-blue)', fontWeight: 'bold' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObjectChangeModal;
