import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ROUTES } from '../../constants/routes';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 text-center">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mb-6 shadow-sm">
        <FileQuestion className="w-8 h-8" />
      </div>

      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-semibold text-slate-700 mt-1">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The requested record or portal page could not be located. It may have been relocated or archived.
      </p>

      <div className="mt-8">
        <Button variant="primary" size="md" icon={Home} onClick={() => navigate(ROUTES.HOME)}>
          Back to Homepage
        </Button>
      </div>
    </div>
  );
}
