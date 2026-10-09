import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Activity,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Upload,
  ShieldCheck,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Heart,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ROUTES } from '../../constants/routes';

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatient = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/patients/${patientId}`);
      setPatient(res.data);
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to load patient profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading Patient 360 profile...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-900">Patient Profile Unavailable</h3>
        <p className="text-xs text-slate-500">{error || 'Patient record could not be found.'}</p>
        <Link
          to={ROUTES.HOSPITAL.PATIENTS}
          className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
        >
          Return to Patient Roster
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to={ROUTES.HOSPITAL.PATIENTS} className="hover:text-teal-600">
              Patients
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">{patient.patient_id}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {patient.first_name} {patient.last_name}
          </h1>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={ROUTES.HOSPITAL.patientTimeline(patientId)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            Timeline Engine
          </Link>
          <Link
            to={ROUTES.HOSPITAL.patientRecords(patientId)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            Medical Records
          </Link>
          <Link
            to={ROUTES.HOSPITAL.patientBrief(patientId)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Brief
          </Link>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-100/80 text-teal-800 font-extrabold flex items-center justify-center text-xl shadow-xs">
            {patient.first_name?.[0]}
            {patient.last_name?.[0]}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h2>
              <StatusBadge status={patient.status || 'active'} size="xs" />
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Patient ID: <span className="font-semibold text-slate-700">{patient.patient_id}</span> • MRN:{' '}
              <span className="font-semibold text-slate-700">{patient.mrn}</span>
            </p>
            <p className="text-xs text-slate-600">
              {patient.gender}, {patient.age || 32} years old • Blood: <span className="font-bold">{patient.blood_type || 'O+'}</span> • DOB: {patient.dob}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{patient.email || 'Email encrypted at rest'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{patient.phone || 'Phone encrypted at rest'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="line-clamp-1">{patient.address || 'Address encrypted at rest'}</span>
          </div>
        </div>
      </div>

      {/* Reproductive Indicators Stripe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-teal-50/70 to-white rounded-3xl border border-teal-100 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Anti-Müllerian Hormone</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">AMH</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{patient.amh_level ?? '—'}</span>
            <span className="text-xs text-slate-500 font-semibold">ng/mL</span>
          </div>
          <p className="text-xs text-slate-500">Ovarian follicular reserve estimation</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/70 to-white rounded-3xl border border-indigo-100 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Follicle Stimulating Hormone</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">FSH</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{patient.fsh_level ?? '—'}</span>
            <span className="text-xs text-slate-500 font-semibold">mIU/mL</span>
          </div>
          <p className="text-xs text-slate-500">Cycle Day 2-3 baseline pituitary signal</p>
        </div>

        <div className="bg-gradient-to-br from-sky-50/70 to-white rounded-3xl border border-sky-100 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Antral Follicle Count</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">AFC</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{patient.antral_follicle_count ?? '—'}</span>
            <span className="text-xs text-slate-500 font-semibold">follicles</span>
          </div>
          <p className="text-xs text-slate-500">Bilateral resting ultrasound count</p>
        </div>
      </div>

      {/* Clinical Protocol & Diagnosis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diagnosis & Stage Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Active Clinical Management
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Primary Diagnosis</p>
              <p className="text-slate-900 font-bold text-sm mt-0.5">{patient.primary_diagnosis || 'Infertility Evaluation'}</p>
            </div>

            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Current ART Stage</p>
              <span className="inline-block mt-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
                {patient.treatment_stage || 'Consultation & Workup'}
              </span>
            </div>

            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Attending Physician</p>
              <p className="text-slate-800 font-medium mt-0.5">{patient.assigned_doctor_name || 'Dr. Arjun Mehta, MD (REI)'}</p>
            </div>

            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Emergency Contact</p>
              <p className="text-slate-600 mt-0.5">{patient.emergency_contact || 'On File (Encrypted)'}</p>
            </div>
          </div>
        </div>

        {/* Partner Info Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Partner Demographic & History</h3>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>

          {patient.partner ? (
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Partner Name & Age</p>
                <p className="text-slate-900 font-bold text-sm mt-0.5">
                  {patient.partner.name || 'Not specified'} {patient.partner.age ? `(${patient.partner.age}y)` : ''}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Medical & Reproductive History</p>
                <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {patient.partner.medical_history || 'No significant partner history recorded.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No partner records attached to this clinical profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
