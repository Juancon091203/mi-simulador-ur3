import React from 'react';
import styles from '../styles/appStyles';
import { useLanguage } from '../context/LanguageContext';

/**
 * Developer Mode Access Modal / View.
 * Unlocks developer features across the application.
 */
const LoginView = ({
  isOpen = true,
  onClose,
  currentUser,
  setCurrentUser,
  loginPass,
  setLoginPass,
  isDeveloperMode = false,
  onUnlockDeveloper,
  onLockDeveloper,
}) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.trim() === '') {
      setCurrentUser(t('developer_user'));
    }
    if (onUnlockDeveloper) onUnlockDeveloper();
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 2000 }}>
      <div className="modal-content-full glass login-card" style={{ maxWidth: '440px', position: 'relative', padding: '30px' }}>
        {onClose && (
          <button
            className="modal-close-btn"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '18px',
              right: '22px',
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '1.4rem',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        )}

        <header style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="login-title text-gradient" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
            {t('dev_unlock_title')}
          </h2>
          <p className="login-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.5', margin: 0 }}>
            {t('dev_unlock_subtitle')}
          </p>
        </header>

        {isDeveloperMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{
              padding: '16px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.08)',
              border: '1px solid var(--accent-green)', color: 'var(--accent-green)',
              textAlign: 'center', width: '100%', fontSize: '0.9rem', fontWeight: 'bold'
            }}>
              ✓ {t('developer_mode_active')} ({currentUser || t('developer_user')})
            </div>
            <button
              onClick={() => {
                if (onLockDeveloper) onLockDeveloper();
              }}
              className="glass"
              style={{
                ...styles.button,
                backgroundColor: 'rgba(255, 75, 43, 0.15)',
                borderColor: '#ff4b2b',
                color: '#ff4b2b',
                fontWeight: 'bold',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              {t('lock_developer')}
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="login-field">
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                {t('username_optional')}
              </label>
              <input
                type="text"
                placeholder={t('username_placeholder')}
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                style={styles.input}
              />
            </div>

            <div className="login-field">
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                {t('password_optional')}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              className="glass"
              style={{
                ...styles.button,
                backgroundColor: 'var(--accent-blue)',
                boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)',
                marginTop: '10px',
                fontWeight: 'bold',
                color: '#000000',
                cursor: 'pointer',
              }}
            >
              {t('unlock_developer')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginView;
