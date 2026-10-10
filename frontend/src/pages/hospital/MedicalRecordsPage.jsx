import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Calendar,
  Activity,
  User,
  RefreshCw,
  X,
  Stethoscope,
  ChevronRight,
  Sparkles,
  AlertCircle,
  UploadCloud
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { ROUTES } from '../../constants/routes';

export default function MedicalRecordsPage() {
  const { patientId } = useParams();
  const [records, setRecords] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    record_type: 'Consultation Note',
    title: '',
    clinical_summary: '',
    findings: '',
    plan: '',
    vitals_bp: '120/80',
    vitals_bmi: '22.5',
    vitals_hr: '72',
    tags: 'Follow-up, ART Protocol'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patRes, recRes] = await Promise.all([
        apiClient.get(`/patients/${patientId}`),
        apiClient.get(`/patients/${patientId}/records`)
      ]);
      setPatient(patRes.data);
      setRecords(recRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const vitals = {};
      if (formData.vitals_bp) vitals.blood_pressure = formData.vitals_bp;
      if (formData.vitals_bmi) vitals.bmi = parseFloat(formData.vitals_bmi);
      if (formData.vitals_hr) vitals.heart_rate = parseInt(formData.vitals_hr, 10);

      const payload = {
        record_type: formData.record_type,
        title: formData.title,
        clinical_summary: formData.clinical_summary,
        findings: formData.findings,
        plan: formData.plan,
        vitals,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      };

      await apiClient.post(`/patients/${patientId}/records`, payload);
      setShowAddModal(false);
      setFormData({
        record_type: 'Consultation Note',
        title: '',
        clinical_summary: '',
        findings: '',
        plan: '',
        vitals_bp: '120/80',
        vitals_bmi: '22.5',
        vitals_hr: '72',
        tags: 'Follow-up, ART Protocol'
      });
      fetchData();
    } catch (err) {
      alert(err.normalizedMessage || 'Error adding medical record');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (typeFilter === 'All') return true;
    return r.record_type?.toLowerCase().includes(typeFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to={ROUTES.HOSPITAL.PATIENTS} className="hover:text-blue-600">
              Patients
            </Link>
            <span>/</span>
            <Link to={ROUTES.HOSPITAL.patientDetails(patientId)} className="hover:text-blue-600 font-mono">
              {patientId}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Records</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Clinical Records & Lab History
          </h1>
          {patient && (
            <p className="text-xs text-slate-500 mt-0.5">
              Patient: <span className="font-semibold text-slate-700">{patient.first_name} {patient.last_name}</span> ({patient.patient_id}) • MRN: {patient.mrn}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.HOSPITAL.patientUpload(patientId)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            Upload Scan / Report
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-full text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Medical Record
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200/80 pb-2">
        {['All', 'Consultation', 'Lab Result', 'Ultrasound', 'Procedure'].map((tab) => (
          <button
            key={tab}
            onClick={() => setTypeFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-blue-50/50 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Records Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs">Accessing medical records securely...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
          filteredRecords.map((r) => (
            <div
              key={r.record_id || r._id}
              className="bg-white rounded-3xl border border-blue-100/80 p-6 sm:p-7 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200/70">
                    {r.record_type}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{r.title}</h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                  {r.doctor_name && <span>• Clinician: {r.doctor_name}</span>}
                </div>
              </div>

              {/* Clinical summary */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {r.clinical_summary}
              </div>

              {/* Findings & Plan boxes */}
              {(r.findings || r.plan) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  {r.findings && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                      <p className="font-bold text-blue-800 uppercase tracking-wide text-[10px]">Clinical Findings</p>
                      <p className="text-slate-800 leading-normal">{r.findings}</p>
                    </div>
                  )}
                  {r.plan && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">Treatment Plan & Regimen</p>
                      <p className="text-slate-800 leading-normal">{r.plan}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Vitals & Tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                {r.vitals ? (
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    {r.vitals.blood_pressure && <span>BP: {r.vitals.blood_pressure}</span>}
                    {r.vitals.heart_rate && <span>HR: {r.vitals.heart_rate} bpm</span>}
                    {r.vitals.bmi && <span>BMI: {r.vitals.bmi}</span>}
                  </div>
                ) : (
                  <div />
                )}

                {r.tags?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {r.tags.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-blue-100/80 p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No clinical records found for the selected filter.</p>
          </div>
        )}
      </div>

      {/* Add Record Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add Clinical Medical Record</h3>
                <p className="text-xs text-slate-500">Document will be encrypted with HIPAA-grade security at rest</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Record Type</label>
                  <select
                    value={formData.record_type}
                    onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Consultation Note">Consultation Note</option>
                    <option value="Lab Result">Lab Result</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Embryology Report">Embryology Report</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Record Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Follicular Monitoring Protocol"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Clinical Summary</label>
                <textarea
                  required
                  rows={3}
                  value={formData.clinical_summary}
                  onChange={(e) => setFormData({ ...formData, clinical_summary: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Comprehensive clinical evaluation and patient history..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Findings</label>
                  <textarea
                    rows={2}
                    value={formData.findings}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Diagnostic ultrasound or lab values..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Treatment Plan</label>
                  <textarea
                    rows={2}
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Medications and action items..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Blood Pressure</label>
                  <input
                    type="text"
                    value={formData.vitals_bp}
                    onChange={(e) => setFormData({ ...formData, vitals_bp: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vitals_bmi}
                    onChange={(e) => setFormData({ ...formData, vitals_bmi: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Heart Rate</label>
                  <input
                    type="number"
                    value={formData.vitals_hr}
                    onChange={(e) => setFormData({ ...formData, vitals_hr: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving Record...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
