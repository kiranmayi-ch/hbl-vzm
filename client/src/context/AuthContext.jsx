import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('mec_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('mec_token'));
  const [loading, setLoading] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    api.clearToken();
  }, []);

  // Session timeout check
  useEffect(() => {
    if (!token) return;

    const checkTimeout = () => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        logout();
      }
    };

    const interval = setInterval(checkTimeout, 60000);

    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [token, lastActivity, logout, SESSION_TIMEOUT]);

  const login = async (employee_id, password, remember = false) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { employee_id, password });
      setUser(data.user);
      setToken(data.token);
      api.setToken(data.token);
      localStorage.setItem('mec_user', JSON.stringify(data.user));
      setLastActivity(Date.now());
      return data;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';
  const isSectionUser = user?.role === 'section_user';
  const isViewer = user?.role === 'viewer';
  const canEdit = isAdmin || isSectionUser;

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isSectionUser,
    isViewer,
    canEdit,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
