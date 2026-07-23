import React from 'react';
import styles from '../styles/appStyles';
import { useLanguage } from '../context/LanguageContext';

/**
 * Station settings sub-view: product name, save path, and telemetry summary.
 * Props: currentStation, handleUpdateStationConfig
 */
const StationConfigView = ({ currentStation, handleUpdateStationConfig }) => {
  const { t } = useLanguage();
  const st = currentStation || { id: 1, name: 'Station 1', product: 'None', savePath: 'C:/Users/FA507/Documents/UNI/PracticasCFZ/ProyectoFotos/UR3_Web-HMI-main/flask-server/static/photos' };

  return (
    <div className="station-config-container" style={{ display: 'flex', gap: '25px', width: '100%', minHeight: 'calc(100vh - 170px)', flexWrap: 'wrap', overflowY: 'auto' }}>
      {/* Storage settings */}
      <div style={{
        flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '20px',
        background: 'var(--card-bg)', border: '1px solid var(--border-glass)',
        padding: '24px', borderRadius: '16px',
      }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: 'bold' }}>{t('storage_settings')}</h3>

        <div className="form-field">
          <label>{t('active_product')}</label>
          <input
            type="text"
            placeholder="e.g. Carrera Sunglasses"
            value={st.product === 'None' ? t('none') : (st.product === 'Running Shoes' ? t('running_shoes') : st.product === 'Sunglasses' ? t('sunglasses') : st.product === 'Wristwatch' ? t('wristwatch') : st.product)}
            onChange={(e) => handleUpdateStationConfig && handleUpdateStationConfig(st.id, e.target.value, st.savePath)}
            style={styles.input}
          />
        </div>

        <div className="form-field">
          <label>{t('save_directory')}</label>
          <input
            type="text"
            placeholder="e.g. C:/Photos/Station"
            value={st.savePath}
            onChange={(e) => handleUpdateStationConfig && handleUpdateStationConfig(st.id, st.product, e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={{
          marginTop: '10px', padding: '15px',
          background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)',
          borderRadius: '8px', fontSize: '0.75rem', lineHeight: '1.6',
        }}>
          ℹ️ {t('save_directory')}:<br />
          <strong>
            {st.savePath}/{(st.product || 'unnamed').replace(/\s+/g, '_')}/
          </strong>
        </div>
      </div>

      {/* Telemetry summary */}
      <div style={{ flex: '1', minWidth: '280px', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>{t('station_telemetry')}</h3>
          <div style={styles.section}>
            <label style={styles.label}>{t('active_product')}</label>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
              {currentStation.product === 'None' ? t('none') : (currentStation.product === 'Running Shoes' ? t('running_shoes') : currentStation.product === 'Sunglasses' ? t('sunglasses') : currentStation.product === 'Wristwatch' ? t('wristwatch') : currentStation.product)}
            </div>
          </div>
          <div style={styles.section}>
            <label style={styles.label}>{t('robot_speed')}</label>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              {currentStation.speed > 0 ? `${currentStation.speed} m/s` : t('inactive')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationConfigView;
