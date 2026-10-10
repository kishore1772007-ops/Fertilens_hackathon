import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  FileText,
  Activity,
  Calendar,
  Sparkles,
  AlertCircle,
  X
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ROUTES } from '../../constants/routes';

export default function PatientListPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  const defaultDob = '1996-05-15';

  // New Patient Modal Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'Female',
    dob: defaultDob,
    age: calculateAge(defaultDob),
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
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (stageFilter) params.append('stage', stageFilter);
      params.append('page', page);
      params.append('limit', 20);

      const response = await apiClient.get(`/patients?${params.toString()}`);
      setPatients(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to retrieve clinical patient roster.');
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
      const ageNum = formData.age !== '' && formData.age !== undefined
        ? parseInt(formData.age, 10)
        : (formData.dob ? calculateAge(formData.dob) : null);
      const payload = {
        ...formData,
        age: ageNum,
        gender: formData.gender || 'Female',
        amh_level: formData.amh_level ? parseFloat(formData.amh_level) : null,
        fsh_level: formData.fsh_level ? parseFloat(formData.fsh_level) : null,
        antral_follicle_count: formData.antral_follicle_count ? parseInt(formData.antral_follicle_count, 10) : null
      };
      await apiClient.post('/patients', payload);
      setShowAddModal(false);
      setFormData({
        first_name: '',
        last_name: '',
        gender: 'Female',
        dob: defaultDob,
        age: calculateAge(defaultDob),
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Patient Roster</h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
              {total} Patients
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reproductive Endocrinology &amp; ART Cohort Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Register Patient
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-[0_2px_12px_rgba(37,99,235,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, ID (P1001), or MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#f8faff] border border-blue-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
          >
            <option value="">All Treatment Stages</option>
            <option value="Ovulation Induction">Ovulation Induction</option>
            <option value="Ovarian Stimulation">Ovarian Stimulation</option>
            <option value="Egg Retrieval">Egg Retrieval</option>
            <option value="Embryo Transfer Prep">Embryo Transfer Prep</option>
          </select>

          <button
            onClick={() => fetchPatients()}
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchPatients()} className="underline font-medium hover:text-rose-800">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-blue-100 shadow-[0_4px_24px_rgba(37,99,235,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-[#f8faff] text-slate-500 border-b border-blue-50 tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 font-bold">Patient Demographics</th>
                <th className="px-6 py-4 font-bold">Primary Diagnosis</th>
                <th className="px-6 py-4 font-bold">Active Stage</th>
                <th className="px-6 py-4 font-bold">Biomarkers</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Clinical Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length > 0 ? (
                patients.map((p) => {
                  const pId = p.patient_id;
                  return (
                    <tr key={pId} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shadow-2xs">
                            {(p.first_name?.[0] || 'P')}
                            {(p.last_name?.[0] || '')}
                          </div>
                          <div>
                            <Link
                              to={ROUTES.HOSPITAL.patientDetails(pId)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
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
                        <span className="text-slate-800 font-semibold line-clamp-1">
                          {p.primary_diagnosis || 'Infertility Evaluation'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{p.mrn}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {p.treatment_stage || 'Consultation'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5 font-medium">
                          <div className="text-blue-700 font-semibold">
                            AMH: <span className="font-bold">{p.amh_level ?? '—'}</span> ng/mL
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
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Timeline Engine"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>
                          <Link
                            to={ROUTES.HOSPITAL.patientRecords(pId)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Medical Records"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <Link
                            to={ROUTES.HOSPITAL.patientDetails(pId)}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 rounded-full transition-all active:scale-95 shadow-2xs"
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
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
                  <label className="text-xs font-bold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="e.g. Meera"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="e.g. Patel"
                  />
                </div>
              </div>

              {/* Gender, Date of Birth & Converted Age */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-medium"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDob = e.target.value;
                      const calculatedAge = calculateAge(newDob);
                      setFormData({
                        ...formData,
                        dob: newDob,
                        age: calculatedAge
                      });
                    }}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-medium"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Age</label>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">Auto from DOB</span>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.age !== undefined && formData.age !== '' ? formData.age : calculateAge(formData.dob)}
                      onChange={(e) => {
                        const newAge = e.target.value;
                        const ageNum = parseInt(newAge, 10);
                        let estimatedDob = formData.dob;
                        if (!isNaN(ageNum) && ageNum >= 0) {
                          const estYear = new Date().getFullYear() - ageNum;
                          const currentMD = formData.dob && formData.dob.length >= 10 ? formData.dob.substring(4) : '-01-01';
                          estimatedDob = `${estYear}${currentMD}`;
                        }
                        setFormData({
                          ...formData,
                          age: newAge,
                          dob: estimatedDob
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-blue-100 bg-blue-50/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-bold"
                      placeholder="e.g. 29"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                      yrs
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="meera@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Primary Diagnosis</label>
                <input
                  type="text"
                  required
                  value={formData.primary_diagnosis}
                  onChange={(e) => setFormData({ ...formData, primary_diagnosis: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">AMH (ng/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.amh_level}
                    onChange={(e) => setFormData({ ...formData, amh_level: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">FSH (mIU/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fsh_level}
                    onChange={(e) => setFormData({ ...formData, fsh_level: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">AFC Count</label>
                  <input
                    type="number"
                    value={formData.antral_follicle_count}
                    onChange={(e) => setFormData({ ...formData, antral_follicle_count: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-100 bg-[#f8faff] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
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
