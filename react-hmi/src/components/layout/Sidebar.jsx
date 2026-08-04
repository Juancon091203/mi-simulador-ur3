import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../../styles/appStyles';
import { useLanguage } from '../../context/LanguageContext';

/**
 * App sidebar — navigation for a single station focus using React Router DOM.
 */
const Sidebar = ({
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

  const navBtnBaseClass = "sidebar-subview-btn";

  const getNavLinkStyle = ({ isActive }) => ({
    ...styles.button,
    width: '100%',
    textAlign: 'left',
    justifyContent: 'flex-start',
    padding: '10px 14px',
    fontSize: '0.85rem',
    fontWeight: '600',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)',
    background: isActive ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.03)',
    color: isActive ? '#ffffff' : 'var(--text-color)',
    borderColor: isActive ? 'var(--accent-blue)' : 'var(--border-glass)',
    boxShadow: isActive ? '0 0 10px rgba(0, 210, 255, 0.3)' : 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
  });

  const closeSidebar = () => {
    if (setIsSidebarOpen) setIsSidebarOpen(false);
  };

  const st = currentStation || { name: 'Station 1', status: 'idle', ip: '192.168.1.100' };

  return (
    <aside className={`sidebar sidebar-responsive glass ${className || ''}`} style={styles.sidebar}>
      {/* Header */}
      <header style={{ ...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '1.15rem', fontWeight: '800' }}>
            {t('app_title')}
          </h1>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={closeSidebar}
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

      {/* Station Header Badge (Single station focus) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '10px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-glass)',
      }}>
        <span style={{ fontSize: '1.1rem' }}>{getStatusDot(st.status)}</span>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {st.name ? st.name.replace('Station', t('station_name')) : t('station_name')}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            IP: {st.ip || '192.168.1.100'}
          </span>
        </div>
      </div>

      <div style={{ ...styles.divider, opacity: 0.15, margin: '14px 0' }} />

      {/* Vertical Navigation Menu with React Router NavLinks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        <NavLink
          to="/"
          end
          className={navBtnBaseClass}
          style={getNavLinkStyle}
          onClick={closeSidebar}
        >
          <span>🖥️</span>
          <span>{t('dashboard_3d')}</span>
        </NavLink>

        <NavLink
          to="/config-execution"
          className={navBtnBaseClass}
          style={getNavLinkStyle}
          onClick={closeSidebar}
        >
          <span>➕</span>
          <span>{t('add_execution')}</span>
        </NavLink>

        {/* VNC Viewer restricted to Developer Mode */}
        {userRole === 'admin' && (
          <NavLink
            to="/vnc"
            className={navBtnBaseClass}
            style={getNavLinkStyle}
            onClick={closeSidebar}
          >
            <span>🎮</span>
            <span>{t('vnc_viewer')}</span>
          </NavLink>
        )}

        <NavLink
          to="/camera"
          className={navBtnBaseClass}
          style={getNavLinkStyle}
          onClick={closeSidebar}
        >
          <span>📷</span>
          <span>{t('camera_2d')}</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={navBtnBaseClass}
          style={getNavLinkStyle}
          onClick={closeSidebar}
        >
          <span>⚙️</span>
          <span>{t('station_settings')}</span>
        </NavLink>

        <NavLink
          to="/presets"
          className={navBtnBaseClass}
          style={getNavLinkStyle}
          onClick={closeSidebar}
        >
          <span>📐</span>
          <span>{t('presets_calibration')}</span>
        </NavLink>
      </div>

      {/* Footer Toolbar: 3 Square Buttons */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '14px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        {/* Button 1: Dark/Light Mode */}
        <button
          className="sidebar-toolbar-btn"
          onClick={() => setDarkMode && setDarkMode(!darkMode)}
          title={darkMode ? (language === 'es' ? 'Modo Claro' : 'Light Mode') : (language === 'es' ? 'Modo Oscuro' : 'Dark Mode')}
          style={{ fontSize: '1.15rem' }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Button 2: Language (ES/EN) */}
        <button
          className="sidebar-toolbar-btn"
          onClick={toggleLanguage}
          title={language === 'es' ? 'Cambiar a Inglés (EN)' : 'Switch to Spanish (ES)'}
          style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px' }}
        >
          {language === 'es' ? 'ES' : 'EN'}
        </button>

        {/* Button 3: Auth / Dev Mode */}
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
