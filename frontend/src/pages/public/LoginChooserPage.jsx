import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { ROUTES } from '../../constants/routes';

export default function LoginChooserPage() {
  const { isAuthenticated, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (role === 'patient') {
        navigate(ROUTES.PATIENT.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.HOSPITAL.DASHBOARD, { replace: true });
      }
    }
  }, [isAuthenticated, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-sky-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200 mb-4">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          FertiLens <span className="text-teal-600">AI</span>
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Select your portal gateway to authenticate
        </p>
      </div>

      <div className="max-w-xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Hospital Staff Login Card */}
        <Link
          to={ROUTES.LOGIN_HOSPITAL}
          className="group relative bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 mb-2">
              Clinicians & Staff
            </span>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
              Hospital Portal
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              For Reproductive Endocrinologists, IVF Embryologists, Nurses, and Clinic Administrators.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
            <span>Staff Sign In</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Patient Login Card */}
        <Link
          to={ROUTES.LOGIN_PATIENT}
          className="group relative bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-sky-500 shadow-sm hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 mb-2">
              Patients
            </span>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
              Patient Portal
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Access your treatment timeline, approved lab results, medication calendar, and care visits.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>Patient Sign In</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      <div className="mt-10 text-center text-xs text-slate-400">
        <Link to={ROUTES.HOME} className="hover:text-slate-600 underline">
          &larr; Back to Platform Overview
        </Link>
      </div>
    </div>
  );
}
