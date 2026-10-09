import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  Activity,
  Heart,
  Pill,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Sparkles,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { fileService } from '../../services/fileService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { InlineChatCard } from '../../components/chat/InlineChatCard';
import { ROUTES } from '../../constants/routes';

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatientData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/dashboard/patient');
      setData(response.data);
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to load your clinical care dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Retrieving your personalized care records...</p>
      </div>
    );
  }

  const patient = data?.patient || {};
  const nextAppt = data?.next_appointment;
  const approvedDocs = data?.approved_documents || [];
  const followups = data?.pending_followups || [];
  const recentRecords = data?.recent_records || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Patient Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white p-8 sm:p-10 shadow-lg">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-sky-100 border border-white/20">
                FertiLens Care Portal
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified & Encrypted
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome back, {patient.first_name || 'Patient'}
            </h1>
            <p className="text-sky-100 text-sm max-w-xl">
              Attending Physician: <span className="font-semibold text-white">{patient.assigned_doctor_name || 'Dr. Arjun Mehta, MD'}</span> • MRN: <span className="font-mono text-white/90">{patient.mrn || 'MRN-1001-PS'}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col items-start gap-1">
            <span className="text-xs uppercase tracking-wider text-sky-200 font-semibold">Active Cycle Stage</span>
            <span className="text-base font-bold text-white leading-tight">
              {patient.treatment_stage || 'Ovulation Induction & Monitoring'}
            </span>
            <span className="text-xs text-sky-200 mt-1">
              Diagnosis: {patient.primary_diagnosis || 'Infertility Evaluation'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchPatientData()} className="underline font-medium hover:text-rose-800">
            Retry
          </button>
        </div>
      )}

      {/* Inline AI Care Assistant */}
      <InlineChatCard isPatient={true} defaultPatientId={patient.patient_id} />

      {/* Key Reproductive Biomarkers Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Key Reproductive Indicators</h2>
              <p className="text-xs text-slate-500">Verified lab values extracted from your clinical records</p>
            </div>
          </div>
          <button
            onClick={() => fetchPatientData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Results
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* AMH */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50/60 to-white border border-sky-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Anti-Müllerian Hormone (AMH)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">Ovarian Reserve</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{patient.amh_level ?? '—'}</span>
              <span className="text-xs text-slate-500 font-semibold">ng/mL</span>
            </div>
            <p className="text-xs text-slate-600">
              Indicates follicular pool volume. A normal range is 1.0 - 3.5 ng/mL.
            </p>
          </div>

          {/* FSH */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Follicle Stimulating Hormone</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">Pituitary Response</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{patient.fsh_level ?? '—'}</span>
              <span className="text-xs text-slate-500 font-semibold">mIU/mL</span>
            </div>
            <p className="text-xs text-slate-600">
              Evaluates follicular maturation signal on Cycle Days 2-3.
            </p>
          </div>

          {/* Antral Follicle Count */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/60 to-white border border-teal-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Antral Follicle Count (AFC)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">Ultrasound Count</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{patient.antral_follicle_count ?? '—'}</span>
              <span className="text-xs text-slate-500 font-semibold">follicles</span>
            </div>
            <p className="text-xs text-slate-600">
              Total baseline resting follicles observed across bilateral ovaries.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Next Appointment & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Scheduled Appointment */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-base">Next Clinical Appointment</h3>
            </div>
            <Link to={ROUTES.PATIENT.APPOINTMENTS} className="text-xs font-medium text-sky-600 hover:text-sky-700">
              All Visits
            </Link>
          </div>

          {nextAppt ? (
            <div className="p-5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Confirmed Visit</span>
                <StatusBadge status={nextAppt.status} size="xs" />
              </div>
              <h4 className="text-base font-bold text-slate-900">{nextAppt.title}</h4>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>{new Date(nextAppt.start_time).toLocaleString()}</span>
                </div>
                {nextAppt.location && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>📍 {nextAppt.location}</span>
                  </div>
                )}
              </div>
              {nextAppt.notes && (
                <div className="p-3 bg-white rounded-xl border border-sky-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Preparation note:</span> {nextAppt.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No upcoming appointments scheduled at this moment.</p>
            </div>
          )}
        </div>

        {/* Action Items & Follow-ups */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Care Instructions & Follow-ups</h3>
            </div>
            <Link to={ROUTES.PATIENT.FOLLOWUPS} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {followups.length > 0 ? (
              followups.map((fol) => (
                <div
                  key={fol.followup_id || fol._id}
                  className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-xs text-slate-900">{fol.title}</p>
                    <StatusBadge status={fol.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-600">{fol.description}</p>
                  {fol.due_date && (
                    <div className="text-[11px] text-indigo-700 font-medium">
                      Target Date: {new Date(fol.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Heart className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">You are all caught up with your medication instructions.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approved Clinical Reports for Patient */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Clinical Documents & Ultrasound Reports</h2>
              <p className="text-xs text-slate-500">Official reports approved by your attending physician</p>
            </div>
          </div>
          <Link to={ROUTES.PATIENT.DOCUMENTS} className="text-xs font-medium text-sky-600 hover:text-sky-700">
            View Archive
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedDocs.length > 0 ? (
            approvedDocs.map((doc) => (
              <div
                key={doc.document_id || doc._id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Physician Approved
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{doc.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{doc.original_filename}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">PDF Document</span>
                  <button
                    onClick={() => fileService.viewFile(doc.document_id, doc.original_filename)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200"
                  >
                    View Report <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No approved documents released yet. Check back following your consultation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
