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
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-sky-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to={ROUTES.LOGIN_CHOOSER}
          className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-medium mb-6 bg-white px-3 py-1.5 rounded-full border border-teal-100 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch Portal</span>
        </Link>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200 mb-3 mx-auto">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Hospital Care Team Login
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Reproductive Endocrinology, ART Lab, & Clinical Administration
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full text-base font-semibold py-3 bg-teal-600 hover:bg-teal-700"
              >
                Sign In to Hospital Portal
              </Button>
            </div>
          </form>

          {/* Collapsible Demo Accounts Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-teal-700 py-1"
            >
              <span>Demo accounts (synthetic data)</span>
              {showDemoAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill('dr.arjun@fertilens.ai', 'Doctor@12345')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all"
                >
                  <span className="font-semibold block text-teal-800">Dr. Arjun Mehta (REI)</span>
                  <span className="text-[11px] text-slate-500">dr.arjun@fertilens.ai &bull; Doctor@12345</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('dr.lakshmi@fertilens.ai', 'Doctor@12345')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all"
                >
                  <span className="font-semibold block text-teal-800">Dr. Lakshmi Krishnan (IVF)</span>
                  <span className="text-[11px] text-slate-500">dr.lakshmi@fertilens.ai &bull; Doctor@12345</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@fertilens.ai', 'Admin@12345')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all"
                >
                  <span className="font-semibold block text-slate-800">System Admin</span>
                  <span className="text-[11px] text-slate-500">admin@fertilens.ai &bull; Admin@12345</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('staff.elena@fertilens.ai', 'Staff@12345')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all"
                >
                  <span className="font-semibold block text-slate-800">Clinical Coordinator</span>
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
