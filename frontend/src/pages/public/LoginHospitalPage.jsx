import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Stethoscope, Lock, Mail, Eye, EyeOff, AlertCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { isValidEmail } from '../../utils/validators';
import { ROUTES } from '../../constants/routes';

export default function LoginHospitalPage() {
  const { loginHospital, isAuthenticated, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (role === 'patient') {
        navigate(ROUTES.PATIENT.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.HOSPITAL.DASHBOARD, { replace: true });
      }
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const validate = () => {
    const errs = {};
    if (!email) {
      errs.email = 'Staff email address is required.';
    } else if (!isValidEmail(email)) {
      errs.email = 'Please enter a valid clinical email.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await loginHospital(email, password);
      const intendedUrl = location.state?.from?.pathname;
      if (intendedUrl && !intendedUrl.includes('/login')) {
        navigate(intendedUrl, { replace: true });
      } else {
        navigate(ROUTES.HOSPITAL.DASHBOARD, { replace: true });
      }
    } catch (err) {
      setError(err.normalizedMessage || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setValidationErrors({});
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f6f8fe] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to={ROUTES.LOGIN_CHOOSER}
          className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-bold mb-6 bg-white px-4 py-2 rounded-full border border-blue-100 shadow-2xs transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch Portal</span>
        </Link>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-3 mx-auto">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a]">
          Hospital Care Team Login
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Reproductive Endocrinology, ART Lab, &amp; Clinical Administration
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-[0_4px_24px_rgba(37,99,235,0.06)] rounded-3xl border border-blue-100">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email Address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dr.arjun@fertilens.ai"
              icon={Mail}
              error={validationErrors.email}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your clinical password"
              icon={Lock}
              error={validationErrors.password}
              required
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-[0_4px_16px_rgba(37,99,235,0.3)] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In to Hospital Portal'}
              </button>
            </div>
          </form>

          {/* Quick Demo Accounts Selection Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-xs font-bold text-blue-700 hover:text-blue-900 py-1"
            >
              <span>Demo Accounts (1-Click Fill)</span>
              {showDemoAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill('dr.arjun@fertilens.ai', 'Doctor@12345')}
                  className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/70 text-left transition-all"
                >
                  <span className="font-bold block text-blue-900">👨‍⚕️ Dr. Arjun Mehta (REI Specialist)</span>
                  <span className="text-[11px] text-blue-700">dr.arjun@fertilens.ai &bull; Doctor@12345</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('dr.lakshmi@fertilens.ai', 'Doctor@12345')}
                  className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/70 text-left transition-all"
                >
                  <span className="font-bold block text-blue-900">👩‍⚕️ Dr. Lakshmi Krishnan (IVF Lead)</span>
                  <span className="text-[11px] text-blue-700">dr.lakshmi@fertilens.ai &bull; Doctor@12345</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('staff.elena@fertilens.ai', 'Staff@12345')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all"
                >
                  <span className="font-bold block text-slate-800">👩‍💼 Elena Rostova (Care Coordinator)</span>
                  <span className="text-[11px] text-slate-500">staff.elena@fertilens.ai &bull; Staff@12345</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
