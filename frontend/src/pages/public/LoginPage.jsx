import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { LoginForm } from '../../features/auth/LoginForm';
import { useAuth } from '../../features/auth/useAuth';
import { ROUTES } from '../../constants/routes';

export default function LoginPage() {
  const { isAuthenticated, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect them directly to their portal dashboard
    if (!loading && isAuthenticated) {
      if (role === 'patient') {
        navigate(ROUTES.PATIENT.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.HOSPITAL.DASHBOARD, { replace: true });
      }
    }
  }, [isAuthenticated, role, loading, navigate]);

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Portal Authentication</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your authorized clinical or patient credentials
        </p>
      </div>
      <LoginForm />
    </AuthLayout>
  );
}
