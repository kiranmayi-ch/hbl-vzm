import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(employeeId, password, remember);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-grid" />
        <div className="login-glow login-glow-1" />
        <div className="login-glow login-glow-2" />
      </div>

      <div className="login-container animate-fade-in-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={32} />
          </div>
          <h1 className="login-title">HBL Engineering</h1>
          <p className="login-subtitle">Manufacturing Excellence Cell Dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error animate-fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="employee-id">Employee ID</label>
            <input
              id="employee-id"
              type="text"
              className="form-input"
              placeholder="Enter your Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-link" onClick={(e) => {
              e.preventDefault();
              alert('Please contact your Plant Administrator to reset your password.');
            }}>Forgot Password?</a>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg w-full ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {!loading && 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="login-demo">
          <p className="text-xs text-tertiary mb-2">Demo Credentials</p>
          <div className="demo-creds">
            <button className="demo-cred" onClick={() => { setEmployeeId('ADMIN001'); setPassword('admin123'); }}>
              <span className="badge badge-admin">Admin</span>
              <span className="text-xs text-secondary">ADMIN001</span>
            </button>
            <button className="demo-cred" onClick={() => { setEmployeeId('PMD001'); setPassword('admin123'); }}>
              <span className="badge badge-section_user">Section</span>
              <span className="text-xs text-secondary">PMD001</span>
            </button>
            <button className="demo-cred" onClick={() => { setEmployeeId('VIEWER001'); setPassword('admin123'); }}>
              <span className="badge badge-viewer">Viewer</span>
              <span className="text-xs text-secondary">VIEWER001</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
