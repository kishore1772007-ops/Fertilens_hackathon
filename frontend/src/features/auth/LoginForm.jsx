import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from './useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { isValidEmail } from '../../utils/validators';
import { ROUTES } from '../../constants/routes';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(email, password);

      // Redirect destination based on role or intended route
      const intendedUrl = location.state?.from?.pathname;
      if (intendedUrl && !intendedUrl.includes(ROUTES.LOGIN)) {
        navigate(intendedUrl, { replace: true });
        return;
      }

      if (user.role === 'patient') {
        navigate(ROUTES.PATIENT.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.HOSPITAL.DASHBOARD, { replace: true });
      }
    } catch (err) {
      setError(err.normalizedMessage || 'Invalid login credentials. Please check your details.');
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
    <div>
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@fertilens.ai"
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
          placeholder="Enter your password"
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
            className="w-full text-base font-semibold py-3"
          >
            Sign In to Portal
          </Button>
        </div>
      </form>

      {/* Quick-fill demo credentials bar */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wider text-center">
          Quick Demo Logins (Click to autofill)
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickFill('dr.smith@fertilens.ai', 'Doctor@12345')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-left transition-all"
          >
            <span className="font-semibold block text-teal-700">Doctor (REI)</span>
            <span className="text-[11px] text-slate-500">dr.smith@fertilens.ai</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('admin@fertilens.ai', 'Admin@12345')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-left transition-all"
          >
            <span className="font-semibold block text-slate-800">Admin</span>
            <span className="text-[11px] text-slate-500">admin@fertilens.ai</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('staff.elena@fertilens.ai', 'Staff@12345')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-left transition-all"
          >
            <span className="font-semibold block text-slate-800">Clinical Staff</span>
            <span className="text-[11px] text-slate-500">staff.elena@fertilens.ai</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('patient.jane@fertilens.ai', 'Patient@12345')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 text-left transition-all"
          >
            <span className="font-semibold block text-sky-700">Patient Portal</span>
            <span className="text-[11px] text-slate-500">patient.jane@fertilens.ai</span>
          </button>
        </div>
      </div>
    </div>
  );
}
