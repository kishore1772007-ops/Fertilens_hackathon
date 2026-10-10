import React from 'react';
import { Stethoscope } from 'lucide-react';

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-4">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          FertiLens <span className="text-blue-600">AI</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Assisted Reproductive Technology Clinical Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-blue-100/70">
          {children}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        <p>HIPAA & ISO-27001 Clinical Architecture Standards</p>
        <p className="mt-1 font-mono text-[11px] text-blue-600/80">
          Secure Medical Portal &bull; Verified ART Records
        </p>
      </div>
    </div>
  );
}
