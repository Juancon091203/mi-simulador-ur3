import React from 'react';
import styles from '../../styles/appStyles';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ExecutionCompletedModal - Prompt shown when a station finishes execution.
 * Asks the operator if they want to repeat the same execution or finish.
 */
const ExecutionCompletedModal = ({
  isOpen,
  stationName,
  onRepeat,
  onFinish,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 2000 }}>
      <div
        className="modal-content-full glass"
        style={{
          height: 'auto',
          maxHeight: '380px',
          maxWidth: '480px',
          padding: '28px',
          borderLeft: '6px solid var(--accent-green)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h2 style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>
          ✓ {t('execution_completed')}
        </h2>

        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: 0, color: 'var(--text-color)' }}>
          {t('execution_completed_prompt')}
        </p>

        {stationName && (
          <div style={{
            fontSize: '0.8rem', color: 'var(--text-dim)', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px'
          }}>
            <strong>{t('station_name')}:</strong> {stationName}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onFinish}
            style={{
              ...styles.button,
              width: '130px',
              background: 'none',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-color)',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {t('finish_execution')}
          </button>
          <button
            onClick={onRepeat}
            style={{
              ...styles.button,
              width: '180px',
              backgroundColor: 'var(--accent-blue)',
              color: '#000000',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)',
            }}
          >
            🔄 {t('repeat_execution')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionCompletedModal;
