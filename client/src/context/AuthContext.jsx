import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as loginRequest, register as registerRequest } from '../services/authService';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('farmlink-token')));
  useEffect(() => {
    if (!localStorage.getItem('farmlink-token')) return;
    getMe().then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('farmlink-token')).finally(() => setLoading(false));
  }, []);
  const value = useMemo(() => ({
    user, loading,
    async login(credentials) {
      const { data } = await loginRequest(credentials);
      localStorage.setItem('farmlink-token', data.token);
      setUser(data.user);
      return data.user;
    },
    async register(details) {
      const { data } = await registerRequest(details);
      localStorage.setItem('farmlink-token', data.token);
      setUser(data.user);
      return data.user;
    },
    async refreshUser() {
      const { data } = await getMe();
      setUser(data.user);
      return data.user;
    },
    logout() { localStorage.removeItem('farmlink-token'); setUser(null); }
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
