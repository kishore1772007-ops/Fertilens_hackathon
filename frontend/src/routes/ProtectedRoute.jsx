import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { Loader } from '../components/common/Loader';
import { ROUTES } from '../constants/routes';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="lg" message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    const targetLogin = location.pathname.startsWith('/patient')
      ? ROUTES.LOGIN_PATIENT
      : location.pathname.startsWith('/hospital')
      ? ROUTES.LOGIN_HOSPITAL
      : ROUTES.LOGIN_CHOOSER;

    return <Navigate to={targetLogin} state={{ from: location }} replace />;
  }

  return children;
}
