import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Activity,
  FileText,
  ChevronRight,
  Filter,
  X,
  Stethoscope,
  ShieldCheck
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ROUTES } from '../../constants/routes';

export default function PatientListPage() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '1995-05-15',
    gender: 'Female',
    blood_type: 'B+',
    email: '',
    phone: '',
    primary_diagnosis: 'PCOS & Primary Infertility',
    treatment_stage: 'Ovulation Induction',
    amh_level: '3.5',
    fsh_level: '5.2',
    antral_follicle_count: '18'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stageFilter) params.stage = stageFilter;
      const res = await apiClient.get('/patients', { params });
      setPatients(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, stageFilter]);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amh_level: formData.amh_level ? parseFloat(formData.amh_level) : null,
        fsh_level: formData.fsh_level ? parseFloat(formData.fsh_level) : null,
        antral_follicle_count: formData.antral_follicle_count ? parseInt(formData.antral_follicle_count, 10) : null
      };
      await apiClient.post('/patients', payload);
      setShowAddModal(false);
      setFormData({
        first_name: '',
        last_name: '',
        dob: '1995-05-15',
        gender: 'Female',
        blood_type: 'B+',
        email: '',
        phone: '',
        primary_diagnosis: 'PCOS & Primary Infertility',
        treatment_stage: 'Ovulation Induction',
        amh_level: '3.5',
        fsh_level: '5.2',
        antral_follicle_count: '18'
      });
      fetchPatients();
    } catch (err) {
      alert(err.normalizedMessage || 'Error registering patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Patient Roster</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              {total} Patients
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Reproductive Endocrinology & ART Cohort Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Patient
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, ID (P1001), or MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
          >
            <option value="">All Treatment Stages</option>
            <option value="Initial Consultation">Initial Consultation</option>
            <option value="Ovulation Induction">Ovulation Induction</option>
            <option value="Controlled Ovarian Stimulation">Controlled Ovarian Stimulation</option>
            <option value="Egg Retrieval">Egg Retrieval</option>
            <option value="Embryo Transfer Prep">Embryo Transfer Prep</option>
          </select>

          <button
            onClick={() => fetchPatients()}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-100/70 text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient Demographics</th>
                <th className="px-6 py-4 font-semibold">Primary Diagnosis</th>
                <th className="px-6 py-4 font-semibold">Active Stage</th>
                <th className="px-6 py-4 font-semibold">Biomarkers</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Clinical Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length > 0 ? (
                patients.map((p) => {
                  const pId = p.patient_id;
                  return (
                    <tr key={pId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100/70 text-teal-800 font-bold flex items-center justify-center text-xs">
                            {(p.first_name?.[0] || 'P')}
                            {(p.last_name?.[0] || '')}
                          </div>
                          <div>
                            <Link
                              to={ROUTES.HOSPITAL.patientDetails(pId)}
                              className="font-bold text-slate-900 hover:text-teal-600 transition-colors"
                            >
                              {p.first_name} {p.last_name}
                            </Link>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {p.patient_id} • {p.gender}, {p.age || 32}y • {p.blood_type || 'O+'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-800 font-medium line-clamp-1">
                          {p.primary_diagnosis || 'Infertility Evaluation'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{p.mrn}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {p.treatment_stage || 'Consultation'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5 font-medium">
                          <div className="text-teal-700">
                            AMH: <span className="font-semibold">{p.amh_level ?? '—'}</span> ng/mL
                          </div>
                          <div className="text-slate-500">
                            AFC: <span className="font-semibold">{p.antral_follicle_count ?? '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status || 'active'} size="xs" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={ROUTES.HOSPITAL.patientTimeline(pId)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Timeline Engine"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>
                          <Link
                            to={ROUTES.HOSPITAL.patientRecords(pId)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Medical Records"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <Link
                            to={ROUTES.HOSPITAL.patientDetails(pId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                          >
                            360° Profile
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
                    {loading ? 'Loading patient records...' : 'No patient records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register New Clinical Patient</h3>
                <p className="text-xs text-slate-500">Demographics will be encrypted at rest automatically</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="e.g. Meera"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="e.g. Patel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="meera@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Primary Diagnosis</label>
                <input
                  type="text"
                  required
                  value={formData.primary_diagnosis}
                  onChange={(e) => setFormData({ ...formData, primary_diagnosis: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">AMH (ng/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.amh_level}
                    onChange={(e) => setFormData({ ...formData, amh_level: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">FSH (mIU/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fsh_level}
                    onChange={(e) => setFormData({ ...formData, fsh_level: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">AFC Count</label>
                  <input
                    type="number"
                    value={formData.antral_follicle_count}
                    onChange={(e) => setFormData({ ...formData, antral_follicle_count: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
