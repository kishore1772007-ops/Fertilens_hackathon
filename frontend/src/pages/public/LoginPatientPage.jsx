import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Heart, Lock, Mail, Eye, EyeOff, AlertCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { isValidEmail } from '../../utils/validators';
import { ROUTES } from '../../constants/routes';

export default function LoginPatientPage() {
  const { loginPatient, isAuthenticated, role, loading: authLoading } = useAuth();
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
      errs.email = 'Please enter your registered email address.';
    } else if (!isValidEmail(email)) {
      errs.email = 'Please enter a valid email format.';
    }

    if (!password) {
      errs.password = 'Please enter your account password.';
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
      await loginPatient(email, password);
      const intendedUrl = location.state?.from?.pathname;
      if (intendedUrl && !intendedUrl.includes('/login')) {
        navigate(intendedUrl, { replace: true });
      } else {
        navigate(ROUTES.PATIENT.DASHBOARD, { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-teal-50/20 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to={ROUTES.LOGIN_CHOOSER}
          className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-900 font-medium mb-6 bg-white px-3 py-1.5 rounded-full border border-sky-100 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch Portal</span>
        </Link>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-200 mb-3 mx-auto">
          <Heart className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Patient Portal Login
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium max-w-sm mx-auto">
          Welcome back. Sign in to view your fertility care plan, test reports, and upcoming visits.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-9 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Your Registered Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya.sharma@demo.fertilens.ai"
              icon={Mail}
              error={validationErrors.email}
              className="text-base py-2.5"
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={Lock}
              error={validationErrors.password}
              className="text-base py-2.5"
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
                className="w-full text-base font-semibold py-3.5 bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20"
              >
                Sign In to My Care Portal
              </Button>
            </div>
          </form>

          {/* Collapsible Demo Patient Accounts Box */}
          <div className="mt-7 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-sky-700 py-1"
            >
              <span>Demo accounts (synthetic data)</span>
              {showDemoAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill('priya.sharma@demo.fertilens.ai', 'Patient@12345')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition-all"
                >
                  <span className="font-semibold block text-sky-800">Priya Sharma (P1001 &bull; PCOS)</span>
                  <span className="text-[11px] text-slate-500">priya.sharma@demo.fertilens.ai &bull; Patient@12345</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('ananya.iyer@demo.fertilens.ai', 'Patient@12345')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition-all"
                >
                  <span className="font-semibold block text-sky-800">Ananya Iyer (P1002 &bull; Diminished Reserve)</span>
                  <span className="text-[11px] text-slate-500">ananya.iyer@demo.fertilens.ai &bull; Patient@12345</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('kavitha.rajan@demo.fertilens.ai', 'Patient@12345')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition-all"
                >
                  <span className="font-semibold block text-sky-800">Kavitha Rajan (P1004 &bull; Endometriosis)</span>
                  <span className="text-[11px] text-slate-500">kavitha.rajan@demo.fertilens.ai &bull; Patient@12345</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('rahul.verma@demo.fertilens.ai', 'Patient@12345')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition-all"
                >
                  <span className="font-semibold block text-sky-800">Rahul Verma (P1006 &bull; Male Factor)</span>
                  <span className="text-[11px] text-slate-500">rahul.verma@demo.fertilens.ai &bull; Patient@12345</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
