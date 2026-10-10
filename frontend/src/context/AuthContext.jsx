import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../features/auth/authService';
import { ROUTES } from '../constants/routes';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('csrf_token');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleAuthSuccess = (data) => {
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    if (data.csrf_token) {
      localStorage.setItem('csrf_token', data.csrf_token);
    }
    const userProfile = {
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      patient_id: data.patient_id,
      is_active: true,
    };
    setUser(userProfile);
    return userProfile;
  };

  const loginHospital = async (email, password) => {
    const data = await authService.loginHospital(email, password);
    return handleAuthSuccess(data);
  };

  const loginPatient = async (email, password) => {
    const data = await authService.loginPatient(email, password);
    return handleAuthSuccess(data);
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    return handleAuthSuccess(data);
  };

  const logout = async () => {
    const currentRole = user?.role;
    try {
      await authService.logout();
    } catch {
      // Continue cleanup
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('csrf_token');
      setUser(null);
      // Redirect to appropriate login page based on previous role
      if (currentRole === 'patient') {
        window.location.href = ROUTES.LOGIN_PATIENT;
      } else {
        window.location.href = ROUTES.LOGIN_HOSPITAL;
      }
    }
  };

  const refreshUser = async () => {
    return await fetchCurrentUser();
  };

  const role = user?.role || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        login,
        loginHospital,
        loginPatient,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
