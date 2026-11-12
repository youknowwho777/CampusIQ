// React context providing authenticated user session and role information across the component tree
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },
  setItem: (key, val) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch (e) {}
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = safeStorage.getItem('campusiq_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => safeStorage.getItem('campusiq_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = safeStorage.getItem('campusiq_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.data) {
            const userData = {
              id: res.data.data.id,
              name: `${res.data.data.first_name || res.data.data.firstName || ''} ${res.data.data.last_name || res.data.data.lastName || ''}`.trim() || res.data.data.email,
              email: res.data.data.email,
              role: res.data.data.role,
              department: res.data.data.department
            };
            setUser(userData);
            safeStorage.setItem('campusiq_user', JSON.stringify(userData));
          }
        } catch (err) {
          if (err.response?.status === 401) {
            safeStorage.removeItem('campusiq_token');
            safeStorage.removeItem('campusiq_user');
            setUser(null);
            setToken(null);
          }
        }
      }
    };

    initAuth();
  }, []);

  const loginUser = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    safeStorage.setItem('campusiq_token', accessToken);
    safeStorage.setItem('campusiq_user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    safeStorage.removeItem('campusiq_token');
    safeStorage.removeItem('campusiq_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser: loginUser, logout: logoutUser, token, setToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
