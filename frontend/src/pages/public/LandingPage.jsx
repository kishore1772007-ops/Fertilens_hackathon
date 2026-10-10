import React, { useState } from 'react';
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
  Activity,
  Phone,
  Calendar,
  User,
  Brain,
  CheckCircle2,
  TrendingUp,
  Award,
  ChevronRight,
  ChevronLeft,
  Heart
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedInterest, setSelectedInterest] = useState('Primary IVF Cycle');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const testimonials = [
    {
      name: 'Nadia & James K.',
      detail: 'After 3 failed cycles elsewhere • Welcomed baby Maya',
      quote:
        'The clinical AI evaluation helped spot hormonal nuances previously missed. FertiLens made us feel seen, grounded, and scientifically protected every single step.',
    },
    {
      name: 'Rohan & Daniel M.',
      detail: 'Surrogacy & PGT-A Pathway • Welcomed twins Leo & Ezra',
      quote:
        'The transparency of daily cycle telemetry gave us immense reassurance. Dr. Mehta guided our protocol selection with mathematical precision and heart.',
    },
  ];

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fe] text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Header (GetTalky Style) */}
      <header className="border-b border-blue-100/80 bg-white/95 backdrop-blur-xl sticky top-0 z-50 shadow-[0_1px_8px_rgba(37,99,235,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0f172a]">
                  FertiLens <span className="text-blue-600">AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-100">
                  Care Portal
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-[11px] font-medium text-slate-500">
                  Accredited Clinical ART Centre
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.LOGIN}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-2"
            >
              <span>Sign In &amp; Access Portals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner Card (GetTalky style) */}
        <section className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-10 border border-blue-100/90 shadow-[0_4px_24px_rgba(37,99,235,0.06)] flex flex-col gap-6">
          <div className="flex flex-col gap-4 max-w-3xl">
            {/* Signature Pill Tag */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 tracking-wide">
                HIPAA Compliant • Encrypted Clinical Telemetry
              </span>
            </div>

            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Continuous Deep Reproductive Synthesis
            </span>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-[1.15]">
              Effortless Reproductive Care Guided by{' '}
              <span className="text-blue-600 underline decoration-blue-200 decoration-wavy decoration-2">
                Clinical AI
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Synthesizing ultrasound scans, hormone bloodwork panels, and embryology time-lapse records into actionable consultation briefs and empathetic patient care.
            </p>

            {/* Dual Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={ROUTES.LOGIN}
                className="px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-[0_4px_16px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Launch Portal Gateway</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.LOGIN_PATIENT}
                className="px-6 py-3.5 rounded-full bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <Heart className="w-4 h-4 text-blue-600" />
                <span>Patient Access</span>
              </Link>
            </div>

            {/* Trust Partner Badges */}
            <div className="flex flex-wrap items-center gap-5 pt-4 border-t border-slate-100 text-slate-500 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>ASRM &amp; ESHRE Benchmarked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>AES-256-GCM Encrypted at Rest</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Evidence Ground-Truth Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Portal Access Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            to={ROUTES.LOGIN_HOSPITAL}
            className="p-6 rounded-3xl bg-white border border-blue-100 hover:border-blue-300 shadow-[0_2px_12px_rgba(37,99,235,0.04)] hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  Doctor &amp; Staff
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Hospital Clinical Hub</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Review patient cohorts, upload diagnostic ultrasound scans &amp; blood test reports, and synthesize clinical telemetry instantly.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-blue-600 font-bold text-xs">
              <span>Sign in as Clinician &rarr;</span>
            </div>
          </Link>

          <Link
            to={ROUTES.LOGIN_PATIENT}
            className="p-6 rounded-3xl bg-white border border-blue-100 hover:border-blue-300 shadow-[0_2px_12px_rgba(37,99,235,0.04)] hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                  <Heart className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  Patient Portal
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Patient Care Portal</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Access your IVF cycle progression, approved lab results, medication reminders, and personalized care guidance.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-blue-600 font-bold text-xs">
              <span>Sign in as Patient &rarr;</span>
            </div>
          </Link>
        </section>

        {/* Clinical Outcomes Metric Grid */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-[#0f172a]">Verified Clinical Telemetry</h2>
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <TrendingUp className="w-3.5 h-3.5" />
              Live Lab Standards
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative CPR</span>
              <span className="text-3xl font-extrabold text-[#0f172a] my-1">78.4%</span>
              <span className="text-xs font-semibold text-blue-600">Optimal blastocyst transfer rates</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indexed Clinical Dossiers</span>
              <span className="text-3xl font-extrabold text-[#0f172a] my-1">100%</span>
              <span className="text-xs font-semibold text-blue-600">Zero hallucination guarantee</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Cycle Monitoring</span>
              <span className="text-3xl font-extrabold text-[#0f172a] my-1">24 / 7</span>
              <span className="text-xs font-semibold text-blue-600">Continuous patient care triage</span>
            </div>
          </div>
        </section>

        {/* Voices of Hope (Testimonial Card) */}
        <section className="rounded-3xl bg-white border border-blue-100 p-6 sm:p-8 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600 fill-blue-600" />
              <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">Voices of Hope</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentSlide((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100/70">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-900">{testimonials[currentSlide].name}</span>
              <span className="text-xs font-semibold text-blue-600">{testimonials[currentSlide].detail}</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 italic leading-relaxed">
              "{testimonials[currentSlide].quote}"
            </p>
          </div>
        </section>
      </main>

      {/* Footer (Zero Tech Jargon) */}
      <footer className="mt-auto py-8 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} FertiLens AI • Clinical Reproductive Medicine Platform.</p>
          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <span>HIPAA Compliant</span>
            <span>PHI Encrypted</span>
            <span>Evidence-Based ART</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
