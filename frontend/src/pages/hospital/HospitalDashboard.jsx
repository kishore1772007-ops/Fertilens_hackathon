import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Calendar,
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Activity,
  FileCheck,
  Stethoscope
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { fileService } from '../../services/fileService';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { InlineChatCard } from '../../components/chat/InlineChatCard';
import { ROUTES } from '../../constants/routes';

export default function HospitalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/dashboard/hospital');
      setData(response.data);
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to load clinical dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.stats || {
    total_patients: 0,
    indexed_documents: 0,
    scheduled_appointments: 0,
    pending_followups: 0
  };

  const filteredPatients = (data?.recent_patients || []).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const pId = (p.patient_id || '').toLowerCase();
    const diag = (p.primary_diagnosis || '').toLowerCase();
    const stage = (p.treatment_stage || '').toLowerCase();
    return fullName.includes(q) || pId.includes(q) || diag.includes(q) || stage.includes(q);
  });

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Compiling real-time clinical metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Clinical Dashboard</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              PHI Encrypted at Rest
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Department of Reproductive Endocrinology & Assisted Reproductive Technology (ART)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Roster
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchDashboardData()} className="underline font-medium hover:text-rose-800">
            Retry
          </button>
        </div>
      )}

      {/* Inline AI Assistant Card */}
      <InlineChatCard isPatient={false} />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Patients"
          value={stats.total_patients}
          subtitle="Assigned clinical profiles"
          icon={Users}
          color="teal"
        />
        <StatCard
          title="Indexed Documents"
          value={stats.indexed_documents}
          subtitle="PyMuPDF • AES-256 Encrypted"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Upcoming Consults"
          value={stats.scheduled_appointments}
          subtitle="Scheduled ART visits"
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Pending Follow-ups"
          value={stats.pending_followups}
          subtitle="High-priority actions required"
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Main Clinical Patient Roster Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Active Patient Roster</h2>
            <p className="text-xs text-slate-500">Real-time status, biomarkers, and clinical care links</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-100/70 text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Patient</th>
                <th className="px-6 py-3.5 font-semibold">Primary Diagnosis</th>
                <th className="px-6 py-3.5 font-semibold">Treatment Stage</th>
                <th className="px-6 py-3.5 font-semibold">Biomarkers (AMH / AFC)</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const patientId = patient.patient_id;
                  return (
                    <tr key={patientId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100/70 text-teal-800 font-bold flex items-center justify-center text-xs">
                            {(patient.first_name?.[0] || 'P')}
                            {(patient.last_name?.[0] || '')}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {patient.patient_id} • {patient.gender}, {patient.age || 32}y
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-800 font-medium line-clamp-1">
                          {patient.primary_diagnosis || 'Infertility Evaluation'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{patient.mrn}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {patient.treatment_stage || 'Consultation'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5 font-medium">
                          <div className="text-teal-700">
                            AMH: <span className="font-semibold">{patient.amh_level ?? '—'}</span> ng/mL
                          </div>
                          <div className="text-slate-500">
                            AFC: <span className="font-semibold">{patient.antral_follicle_count ?? '—'}</span> follicles
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={patient.status || 'active'} size="xs" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={ROUTES.HOSPITAL.patientTimeline(patientId)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors title='Timeline'"
                            title="Patient Timeline"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>
                          <Link
                            to={ROUTES.HOSPITAL.patientRecords(patientId)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Medical Records"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <Link
                            to={ROUTES.HOSPITAL.patientBrief(patientId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                          >
                            Brief
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No patient records matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Lower Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upcoming Consultations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Upcoming Consultations</h3>
            </div>
            <Link
              to={ROUTES.HOSPITAL.APPOINTMENTS}
              className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.upcoming_appointments?.length > 0 ? (
              data.upcoming_appointments.map((appt) => (
                <div
                  key={appt.appointment_id || appt._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-slate-900">{appt.title}</p>
                    <p className="text-xs text-slate-600">
                      Patient: <span className="font-medium">{appt.patient_name || appt.patient_id}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(appt.start_time).toLocaleString()}</span>
                      {appt.location && <span>• {appt.location}</span>}
                    </div>
                  </div>
                  <StatusBadge status={appt.status} size="xs" />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No appointments scheduled today.</p>
            )}
          </div>
        </div>

        {/* Right: High-Priority Action Items / Follow-ups */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-900 text-sm">Priority Clinical Follow-ups</h3>
            </div>
            <Link
              to={ROUTES.HOSPITAL.FOLLOWUPS}
              className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.priority_followups?.length > 0 ? (
              data.priority_followups.map((fol) => (
                <div
                  key={fol.followup_id || fol._id}
                  className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-slate-900">{fol.title}</p>
                    <p className="text-xs text-slate-600 line-clamp-1">{fol.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Patient: {fol.patient_name || fol.patient_id}</span>
                      {fol.due_date && <span>• Due: {new Date(fol.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <StatusBadge status={fol.priority || 'high'} size="xs" />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No pending high-priority clinical follow-ups.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Indexed Clinical Documents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Recently Indexed Clinical Reports</h3>
          </div>
          <span className="text-xs text-slate-400">Streamed with AES-256 in-memory decryption</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.recent_documents?.map((doc) => (
            <div
              key={doc.document_id || doc._id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    {doc.patient_id}
                  </span>
                  <StatusBadge status={doc.status} size="xs" />
                </div>
                <p className="font-semibold text-xs text-slate-900 line-clamp-1">{doc.title}</p>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{doc.original_filename}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-[11px] text-slate-400">
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recent'}
                </span>
                <button
                  onClick={() => fileService.viewFile(doc.document_id, doc.original_filename)}
                  className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-xs hover:underline"
                >
                  View PDF <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
