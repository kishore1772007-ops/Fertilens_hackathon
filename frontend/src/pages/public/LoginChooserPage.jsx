import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, ArrowRight, ShieldCheck, UserCheck, Sparkles, User, KeyRound } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { ROUTES } from '../../constants/routes';

export default function LoginChooserPage() {
  const { isAuthenticated, role, loading, loginHospital, loginPatient } = useAuth();
  const navigate = useNavigate();
  const [quickLoginLoading, setQuickLoginLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (role === 'patient') {
        navigate(ROUTES.PATIENT.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.HOSPITAL.DASHBOARD, { replace: true });
      }
    }
  }, [isAuthenticated, role, loading, navigate]);

  const handleQuickLogin = async (type, email, password) => {
    setQuickLoginLoading(type);
    setError('');
    try {
      if (type === 'patient') {
        await loginPatient(email, password);
        navigate(ROUTES.PATIENT.DASHBOARD, { replace: true });
      } else {
        await loginHospital(email, password);
        navigate(ROUTES.HOSPITAL.DASHBOARD, { replace: true });
      }
    } catch (err) {
      setError(err.normalizedMessage || 'Login failed. Please try again.');
    } finally {
      setQuickLoginLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fe] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-4">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0f172a]">
          FertiLens <span className="text-blue-600">AI</span>
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-semibold">
          Select your portal gateway or use 1-Click Demo Login
        </p>
      </div>

      {error && (
        <div className="max-w-xl mx-auto w-full mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* Main Portal Selection Cards */}
      <div className="max-w-2xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {/* Hospital Staff Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 hover:border-blue-300 shadow-[0_4px_24px_rgba(37,99,235,0.06)] hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                Doctor &amp; Staff
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Hospital Portal
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              For Reproductive Endocrinologists, Embryologists, Nurses, and Clinic Administrators.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <Link
              to={ROUTES.LOGIN_HOSPITAL}
              className="w-full flex items-center justify-between px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>Sign In with Password</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* 1-Click Fast Login Options */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick 1-Click Access:</span>
              <button
                type="button"
                disabled={!!quickLoginLoading}
                onClick={() => handleQuickLogin('doctor', 'dr.arjun@fertilens.ai', 'Doctor@12345')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200/70 text-blue-900 text-xs font-semibold flex items-center justify-between transition-all active:scale-95 disabled:opacity-50"
              >
                <span>👨‍⚕️ <strong>Dr. Arjun Mehta</strong> (Doctor)</span>
                <span className="text-[10px] text-blue-700 font-bold">{quickLoginLoading === 'doctor' ? 'Signing in...' : '1-Click'} &rarr;</span>
              </button>
              <button
                type="button"
                disabled={!!quickLoginLoading}
                onClick={() => handleQuickLogin('staff', 'staff.elena@fertilens.ai', 'Staff@12345')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all active:scale-95 disabled:opacity-50"
              >
                <span>👩‍💼 <strong>Elena Rostova</strong> (Staff)</span>
                <span className="text-[10px] text-slate-600 font-bold">{quickLoginLoading === 'staff' ? 'Signing in...' : '1-Click'} &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Patient Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 hover:border-blue-300 shadow-[0_4px_24px_rgba(37,99,235,0.06)] hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Heart className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                Patients
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Patient Portal
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Access your treatment timeline, approved lab results, medication calendar, and care visits.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <Link
              to={ROUTES.LOGIN_PATIENT}
              className="w-full flex items-center justify-between px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>Sign In with Password</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* 1-Click Fast Login Options */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick 1-Click Access:</span>
              <button
                type="button"
                disabled={!!quickLoginLoading}
                onClick={() => handleQuickLogin('patient', 'priya.sharma@demo.fertilens.ai', 'Patient@12345')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200/70 text-blue-900 text-xs font-semibold flex items-center justify-between transition-all active:scale-95 disabled:opacity-50"
              >
                <span>🌸 <strong>Priya Sharma</strong> (P1001)</span>
                <span className="text-[10px] text-blue-700 font-bold">{quickLoginLoading === 'patient' ? 'Signing in...' : '1-Click'} &rarr;</span>
              </button>
              <button
                type="button"
                disabled={!!quickLoginLoading}
                onClick={() => handleQuickLogin('patient', 'ananya.iyer@demo.fertilens.ai', 'Patient@12345')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all active:scale-95 disabled:opacity-50"
              >
                <span>🌼 <strong>Ananya Iyer</strong> (P1002)</span>
                <span className="text-[10px] text-slate-600 font-bold">{quickLoginLoading === 'patient' ? 'Signing in...' : '1-Click'} &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto text-center">
        <Link
          to={ROUTES.HOME}
          className="text-xs text-slate-500 hover:text-blue-700 font-semibold transition-colors"
        >
          &larr; Back to FertiLens Overview
        </Link>
      </div>
    </div>
  );
}
