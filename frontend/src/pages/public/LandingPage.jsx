import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Sparkles,
  ShieldCheck,
  FileSearch,
  ArrowRight,
  HeartPulse,
  Lock,
  Layers,
  Database,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-200">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                FertiLens <span className="text-teal-600">AI</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Clinical ART Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to={ROUTES.LOGIN}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <span>Access Portals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 bg-gradient-to-b from-slate-50 via-teal-50/20 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/70 border border-teal-200 text-teal-800 text-xs font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Reproductive Endocrinology Synthesis</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Instant Clinical Evidence & AI Briefs for{' '}
            <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
              Fertility Care Teams
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            FertiLens AI synthesizes fragmented ultrasound reports, hormonal bloodwork, and embryology
            records using vector-grounded RAG. Generate consultation briefs with exact page citations in seconds.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={ROUTES.LOGIN_HOSPITAL}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2"
            >
              <span>Clinician & Staff Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to={ROUTES.LOGIN_PATIENT}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              <span>Patient Portal Sign In</span>
            </Link>
          </div>

          <div className="mt-6 text-xs text-slate-400 font-medium">
            Demo credentials provided on the login page &bull; Instant auto-provisioning enabled
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-2">
              Clinical Architecture
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for Precision Reproductive Medicine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:border-teal-300 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center mb-6">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Ground-Truth Evidence Citations</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Zero clinical hallucinations. Every answer is retrieved from indexed lab records with direct page citations and verification snippets.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:border-teal-300 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-sky-100/80 text-sky-700 flex items-center justify-center mb-6">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Patient 360 & Timeline Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated chronologies tracing stimulation cycles, AMH changes, folliculometry progression, and embryo transfer outcomes.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:border-teal-300 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Strict Patient Boundary Isolation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Database-enforced patient data isolation. Patients access only their own verified profile and approved documents in a dedicated portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Synthetic Data Disclaimer Banner */}
      <section className="bg-slate-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Lock className="w-4 h-4" />
            <span>Compliance & Patient Privacy</span>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            This platform uses 100% synthetic reproductive records generated for demonstration purposes. No protected health information (PHI) is processed. AI outputs assist and do not replace professional medical judgment.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} FertiLens AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>FastAPI &bull; MongoDB Atlas</span>
            <span>Ollama RAG</span>
            <span>React &bull; Tailwind</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
