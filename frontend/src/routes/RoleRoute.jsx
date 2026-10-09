import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { Loader } from '../components/common/Loader';
import { ROUTES } from '../constants/routes';

export function RoleRoute({ allowedRoles = [], children }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="lg" message="Verifying access rights..." />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children;
}
