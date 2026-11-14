// React context providing authenticated user session and role information across the component tree
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campusiq_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('campusiq_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('campusiq_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.data) {
            const userData = {
              id: res.data.data.id,
              name: `${res.data.data.first_name || res.data.data.firstName || ''} ${res.data.data.last_name || res.data.data.lastName || ''}`.trim() || res.data.data.email,
              email: res.data.data.email,
              role: res.data.data.role,
              department: res.data.data.department,
              year: res.data.data.year || '2nd Year'
            };
            setUser(userData);
            localStorage.setItem('campusiq_user', JSON.stringify(userData));
          }
        } catch (err) {
          // Token invalid or network error
          if (err.response?.status === 401) {
            localStorage.removeItem('campusiq_token');
            localStorage.removeItem('campusiq_user');
            setUser(null);
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginUser = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('campusiq_token', accessToken);
    localStorage.setItem('campusiq_user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('campusiq_token');
    localStorage.removeItem('campusiq_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser: loginUser, logout: logoutUser, token, setToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
