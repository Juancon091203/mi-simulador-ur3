import React from 'react';
import styles from '../../styles/appStyles';
import { useLanguage } from '../../context/LanguageContext';

/**
 * App sidebar — navigation with vertical subview buttons and bottom toolbar.
 */
const Sidebar = ({
  // Navigation
  activeStationTab, setActiveStationTab,
  activeSubView, setActiveSubView,
  stations,
  currentStation,
  // User / auth / theme
  currentUser, userRole,
  onLogout, onOpenLoginModal,
  darkMode, setDarkMode,
  className,
  setIsSidebarOpen,
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  const getStatusDot = (status) => {
    switch (status) {
      case 'running': return '🟢';
      case 'warning': return '🟡';
      case 'emergency': return '🔴';
      case 'off': return '⚪';
      case 'idle':
      default: return '🔵';
    }
  };

  const navBtnBaseStyle = {
    ...styles.button,
    width: '100%',
    textAlign: 'left',
    justifyContent: 'flex-start',
    padding: '10px 14px',
    fontSize: '0.85rem',
    fontWeight: '600',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--text-color)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  };

  const navBtnActiveStyle = {
    ...navBtnBaseStyle,
    background: 'var(--accent-blue)',
    color: '#ffffff',
    fontWeight: '600',
    borderColor: 'var(--accent-blue)',
    boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
  };

  return (
    <aside className={`sidebar glass ${className || ''}`} style={styles.sidebar}>
      {/* Header (Subtitle removed as requested) */}
      <header style={{ ...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '1.15rem', fontWeight: '800' }}>
            {t('app_title')}
          </h1>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text-color)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: 0,
            width: 'auto',
          }}
        >
          ✕
        </button>
      </header>

      {/* Station / View selector with color dot status indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={styles.label}>{t('active_station_label')}</label>
        <select
          value={activeStationTab}
          onChange={(e) => {
            const val = e.target.value;
            setActiveStationTab(val === 'general' ? 'general' : parseInt(val));
            setActiveSubView('dashboard');
            if (setIsSidebarOpen) setIsSidebarOpen(false);
          }}
          style={styles.select}
        >
          <option value="general">{t('general_view_option')}</option>
          {stations.map(st => (
            <option key={st.id} value={st.id}>
              {getStatusDot(st.status)} {st.name.replace('Station', t('station_name'))} ({st.ip})
            </option>
          ))}
        </select>

        {activeStationTab !== 'general' && (
          <button
            onClick={() => {
              setActiveStationTab('general');
              setActiveSubView('dashboard');
              if (setIsSidebarOpen) setIsSidebarOpen(false);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(0, 210, 255, 0.08)',
              border: '1px solid var(--accent-blue)',
              color: 'var(--accent-blue)',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px',
              transition: 'all 0.2s ease',
            }}
          >
            ← {t('back_to_general_overview') || 'Volver a Vista General'}
          </button>
        )}
      </div>

      <div style={{ ...styles.divider, opacity: 0.15, margin: '14px 0' }} />

      {/* Vertical Navigation Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        {activeStationTab === 'general' && (
          <button
            className={`sidebar-subview-btn ${activeSubView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveStationTab('general');
              setActiveSubView('dashboard');
              if (setIsSidebarOpen) setIsSidebarOpen(false);
            }}
            style={activeStationTab === 'general' && activeSubView === 'dashboard' ? navBtnActiveStyle : navBtnBaseStyle}
          >
            🌐 {t('general_view')}
          </button>
        )}

        {activeStationTab !== 'general' && (
          <>
            <button
              className={`sidebar-subview-btn ${activeSubView === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveSubView('dashboard');
                if (setIsSidebarOpen) setIsSidebarOpen(false);
              }}
              style={activeSubView === 'dashboard' ? navBtnActiveStyle : navBtnBaseStyle}
            >
              {t('dashboard_3d')}
            </button>

            {/* VNC Viewer restricted to Developer Mode */}
            {userRole === 'admin' && (
              <button
                className={`sidebar-subview-btn ${activeSubView === 'vnc' ? 'active' : ''}`}
                onClick={() => {
                  setActiveSubView('vnc');
                  if (setIsSidebarOpen) setIsSidebarOpen(false);
                }}
                style={activeSubView === 'vnc' ? navBtnActiveStyle : navBtnBaseStyle}
              >
                {t('vnc_viewer')}
              </button>
            )}

            <button
              className={`sidebar-subview-btn ${activeSubView === 'camera' ? 'active' : ''}`}
              onClick={() => {
                setActiveSubView('camera');
                if (setIsSidebarOpen) setIsSidebarOpen(false);
              }}
              style={activeSubView === 'camera' ? navBtnActiveStyle : navBtnBaseStyle}
            >
              {t('camera_2d')}
            </button>

            <button
              className={`sidebar-subview-btn ${activeSubView === 'config' ? 'active' : ''}`}
              onClick={() => {
                setActiveSubView('config');
                if (setIsSidebarOpen) setIsSidebarOpen(false);
              }}
              style={activeSubView === 'config' ? navBtnActiveStyle : navBtnBaseStyle}
            >
              {t('station_settings')}
            </button>
          </>
        )}

        <button
          className={`sidebar-subview-btn ${activeSubView === 'presets' || activeSubView === 'calibration' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubView('presets');
            if (setIsSidebarOpen) setIsSidebarOpen(false);
          }}
          style={(activeSubView === 'presets' || activeSubView === 'calibration') ? navBtnActiveStyle : navBtnBaseStyle}
        >
          {t('presets_calibration')}
        </button>
      </div>

      {/* Footer Toolbar: 3 Botones Cuadrados Horizontales Estéticamente Unificados */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '14px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        {/* Botón 1: Modo Claro / Oscuro (Sol / Luna) */}
        <button
          className="sidebar-toolbar-btn"
          onClick={() => setDarkMode && setDarkMode(!darkMode)}
          title={darkMode ? (language === 'es' ? 'Modo Claro' : 'Light Mode') : (language === 'es' ? 'Modo Oscuro' : 'Dark Mode')}
          style={{ fontSize: '1.15rem' }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Botón 2: Idioma (ES / EN) */}
        <button
          className="sidebar-toolbar-btn"
          onClick={toggleLanguage}
          title={language === 'es' ? 'Cambiar a Inglés (EN)' : 'Switch to Spanish (ES)'}
          style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px' }}
        >
          {language === 'es' ? 'ES' : 'EN'}
        </button>

        {/* Botón 3: Autenticación / Modo Desarrollador */}
        <button
          className="sidebar-toolbar-btn"
          onClick={() => {
            if (onOpenLoginModal) onOpenLoginModal();
            else if (onLogout) onLogout();
          }}
          title={`${currentUser || t('anonymous_user')} - ${t('login_change_role')}`}
          style={{ fontSize: '1.15rem' }}
        >
          {userRole === 'admin' ? '🔐' : '👤'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
