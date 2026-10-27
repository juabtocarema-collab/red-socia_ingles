import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    loadUser();
  }, []);

  // Heartbeat to keep active status real in MySQL
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      api.heartbeat();
    }, 45000);
    return () => clearInterval(interval);
  }, [currentUser]);

  async function loadUser() {
    setLoading(true);
    const token = localStorage.getItem('sena_token');
    if (!token) {
      // Auto-connect as default apprentice (Juan Pablo Tocarema Ávila)
      try {
        const data = await api.demoLogin(1);
        localStorage.setItem('sena_token', data.token);
        setCurrentUser(data.user);
      } catch (e) {
        try {
          const adm = await api.adminQuickLogin();
          localStorage.setItem('sena_token', adm.token);
          setCurrentUser(adm.user);
        } catch {
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.warn('Sesión no válida o expirada:', err.message);
      try {
        const data = await api.demoLogin(1);
        localStorage.setItem('sena_token', data.token);
        setCurrentUser(data.user);
      } catch {
        localStorage.removeItem('sena_token');
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loginAsAdmin() {
    setLoading(true);
    try {
      const data = await api.adminQuickLogin();
      localStorage.setItem('sena_token', data.token);
      setCurrentUser(data.user);
      setAuthModalOpen(false);
      return data;
    } catch (err) {
      // Fallback: try demo login 1 or direct admin credentials
      try {
        const fallback = await api.demoLogin(1);
        localStorage.setItem('sena_token', fallback.token);
        setCurrentUser(fallback.user);
        setAuthModalOpen(false);
        return fallback;
      } catch (e2) {
        console.error('Error logging in as admin:', e2);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(loginInput, password) {
    const data = await api.login(loginInput, password);
    localStorage.setItem('sena_token', data.token);
    setCurrentUser(data.user);
    setAuthModalOpen(false);
    return data;
  }

  async function register(userData) {
    const data = await api.register(userData);
    localStorage.setItem('sena_token', data.token);
    setCurrentUser(data.user);
    setAuthModalOpen(false);
    return data;
  }

  async function logout() {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    }
    localStorage.removeItem('sena_token');
    setCurrentUser(null);
  }

  async function switchDemoUser(id) {
    setLoading(true);
    try {
      const data = await api.demoLogin(id);
      localStorage.setItem('sena_token', data.token);
      setCurrentUser(data.user);
    } catch (e) {
      console.error('Error switching demo user:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        loadUser,
        login,
        loginAsAdmin,
        register,
        logout,
        switchDemoUser,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx || {};
}

