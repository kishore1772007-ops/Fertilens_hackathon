import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { Button } from '../../components/common/Button';
import { ROUTES } from '../../constants/routes';

export default function UnauthorizedPage() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (role === 'patient') {
      navigate(ROUTES.PATIENT.DASHBOARD);
    } else {
      navigate(ROUTES.HOSPITAL.DASHBOARD);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 text-center">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">403 — Access Restricted</h1>
      <p className="mt-3 text-sm text-slate-600 max-w-md leading-relaxed">
        Your current account role does not have authorization to view this clinical partition or administrative area.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Button variant="primary" size="md" icon={ArrowLeft} onClick={handleReturn}>
          Return to My Dashboard
        </Button>
      </div>

      <div className="mt-8 text-xs text-slate-400">
        If you believe this is an error, contact your clinical administrator or medical director.
      </div>
    </div>
  );
}
