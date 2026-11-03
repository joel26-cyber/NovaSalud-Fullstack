import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('nova_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nova_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('nova_token')));

  const logout = useCallback(() => {
    localStorage.removeItem('nova_token');
    localStorage.removeItem('nova_user');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const login = useCallback(async (usuario, password) => {
    const { data } = await api.post('/auth/login', { usuario, password });
    localStorage.setItem('nova_token', data.token);
    localStorage.setItem('nova_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    api.get('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem('nova_user', JSON.stringify(data.user));
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [token, logout]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('nova:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('nova:unauthorized', handleUnauthorized);
  }, [logout]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.rol === 'administrador',
  }), [user, token, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
