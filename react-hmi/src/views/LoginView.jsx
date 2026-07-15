import React from 'react';
import styles from '../styles/appStyles';

/**
 * Login / authentication screen.
 * Props: currentUser, setCurrentUser, loginPass, setLoginPass,
 *        userRole, setUserRole, onLogin
 */
const LoginView = ({
  currentUser, setCurrentUser,
  loginPass, setLoginPass,
  userRole, setUserRole,
  onLogin,
}) => (
  <div className="login-container">
    <div className="login-card glass">
      <header>
        <h1 className="login-title text-gradient">Automated Photography Studio</h1>
        <p className="login-subtitle">Control Panel Access</p>
      </header>
      <form
        className="login-form"
        onSubmit={(e) => { e.preventDefault(); onLogin(); }}
      >
        <div className="login-field">
          <label>Username</label>
          <input
            type="text"
            placeholder="e.g. operator1"
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
            style={styles.input}
          />
        </div>
        <div className="login-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={loginPass}
            onChange={(e) => setLoginPass(e.target.value)}
            style={styles.input}
          />
        </div>
        <div className="login-field">
          <label>Testing Role</label>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            style={styles.select}
          >
            <option value="admin">Administrator (Full Control)</option>
            <option value="operator">Operator (Read / Queue Only)</option>
          </select>
        </div>
        <button
          type="submit"
          className="glass"
          style={{
            ...styles.button,
            backgroundColor: 'var(--accent-blue)',
            boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)',
            marginTop: '10px',
          }}
        >
          SIGN IN
        </button>
        <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', padding: '0 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
        </div>
        <button
          type="button"
          onClick={() => {
            setCurrentUser('BypassUser');
            setUserRole('admin');
            onLogin();
          }}
          style={{
            ...styles.button,
            background: 'linear-gradient(135deg, #00ff88, #00d2ff)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
            color: '#000000',
            fontWeight: '900',
          }}
        >
          ⚡ QUICK ACCESS (BYPASS)
        </button>
      </form>
    </div>
  </div>
);

export default LoginView;
