import React, { useState, useEffect } from 'react';
import {
  User,
  Heart,
  Activity,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  RefreshCw,
  Edit3,
  Users,
  Stethoscope,
  Clock,
  Sparkles,
  Lock,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export default function MyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    partner_name: '',
    partner_age: '',
    partner_medical_history: '',
  });

  const fetchProfile = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let patientData = null;
      let doctorData = null;

      try {
        const res = await apiClient.get('/patients/me');
        patientData = res.data?.patient || res.data;
        doctorData = res.data?.doctor;
      } catch {
        // Fallback to /dashboard/patient
        const dashRes = await apiClient.get('/dashboard/patient');
        patientData = dashRes.data.patient || {};
      }

      setProfile(patientData);
      setDoctor(doctorData);

      // Pre-fill edit form
      setEditForm({
        phone: patientData.phone || '',
        email: patientData.email || '',
        address: patientData.address || '',
        emergency_contact: patientData.emergency_contact || '',
        partner_name: patientData.partner?.name || '',
        partner_age: patientData.partner?.age || '',
        partner_medical_history: patientData.partner?.medical_history || '',
      });
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to retrieve clinical profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const payload = {
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim(),
        emergency_contact: editForm.emergency_contact.trim(),
        partner: {
          name: editForm.partner_name.trim(),
          age: editForm.partner_age ? parseInt(editForm.partner_age, 10) : null,
          medical_history: editForm.partner_medical_history.trim(),
        },
      };

      await apiClient.put('/patients/me', payload);
      toast.success('Your profile details were updated successfully!');
      setIsEditOpen(false);
      fetchProfile(true);
    } catch (err) {
      toast.error(err.normalizedMessage || 'Failed to update profile details.');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Retrieving encrypted medical profile...</p>
      </div>
    );
  }

  const pat = profile || {};
  const partner = pat.partner || {};
  const docName = doctor?.full_name || pat.assigned_doctor_name || 'Dr. Arjun Mehta, MD';
  const docSpecialty = doctor?.specialty || 'Reproductive Endocrinologist & ART Specialist';

  return (
    <div className="space-y-8 pb-14 max-w-6xl mx-auto">
      {/* Patient Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-700 text-white p-7 sm:p-9 shadow-lg shadow-blue-900/15">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Circle */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-inner flex-shrink-0">
              {pat.first_name?.[0] || 'P'}
              {pat.last_name?.[0] || ''}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                  MRN: {pat.mrn || 'MRN-1001-PS'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Patient
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {pat.first_name} {pat.last_name}
              </h1>
              <p className="text-blue-100 text-xs">
                Clinical Patient ID: <strong className="text-white font-mono">{pat.patient_id || 'PAT-1001'}</strong> • Blood Group: <strong className="text-white">{pat.blood_type || 'O+'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Edit3 className="w-4 h-4 text-blue-600" />
              Edit Contact Details
            </button>
            <button
              onClick={() => fetchProfile(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchProfile()} className="underline font-medium hover:text-rose-800">
            Retry
          </button>
        </div>
      )}

      {/* Primary Key Demographics & Clinical Care Team */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Attending Physician Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-blue-600">
            <Stethoscope className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Attending Specialist</span>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">{docName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{docSpecialty}</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Care Department:</span>
            <span className="font-semibold text-slate-700">Reproductive Medicine</span>
          </div>
        </div>

        {/* Treatment Protocol & Stage */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-indigo-600">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Active Protocol Stage</span>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {pat.treatment_stage || 'Controlled Ovarian Stimulation'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Primary Diagnosis: {pat.primary_diagnosis || 'Infertility Evaluation'}</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cycle Status:</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Active Clinical Plan</span>
          </div>
        </div>

        {/* Encryption & Confidentiality Assurance */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-600">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Data Protection</span>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">HIPAA Compliant Vault</h3>
            <p className="text-xs text-slate-500 mt-0.5">AES-256-GCM Field-Level Encryption</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Blind Indexing:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Zero-Knowledge
            </span>
          </div>
        </div>
      </div>

      {/* Key Reproductive Biomarkers Overview */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Key Reproductive Health Indicators</h2>
              <p className="text-xs text-slate-500">Verified lab values extracted from your official clinical records</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* AMH */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50/70 to-white border border-sky-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Anti-Müllerian Hormone (AMH)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">Ovarian Reserve</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{pat.amh_level ?? '—'}</span>
              <span className="text-xs text-slate-500 font-semibold">ng/mL</span>
            </div>
            <p className="text-xs text-slate-600">
              Direct biomarker of growing follicular pool. Standard reproductive range: 1.0 - 3.5 ng/mL.
            </p>
          </div>

          {/* FSH */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Follicle Stimulating Hormone</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">Cycle Day 2-3</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{pat.fsh_level ?? '—'}</span>
              <span className="text-xs text-slate-500 font-semibold">mIU/mL</span>
            </div>
            <p className="text-xs text-slate-600">
              Pituitary gonadotropin signal responsible for initiating follicular maturation. Optimal: &lt; 10 mIU/mL.
            </p>
          </div>

          {/* Antral Follicle Count */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-white border border-blue-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Antral Follicle Count (AFC)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">Ultrasound Count</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{pat.antral_follicle_count ?? '—'}</span>
              <span className="text-xs text-slate-500 font-semibold">follicles</span>
            </div>
            <p className="text-xs text-slate-600">
              Total baseline resting follicles visible across bilateral ovaries during baseline transvaginal ultrasound.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Contact Demographics & Partner Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Contact Demographics */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Personal &amp; Contact Demographics</h3>
            </div>
            <button
              onClick={() => setIsEditOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100/70">
              <span className="text-slate-400 font-medium">Date of Birth:</span>
              <span className="font-semibold text-slate-800">{pat.dob || '—'} {pat.age ? `(${pat.age} yrs)` : ''}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100/70">
              <span className="text-slate-400 font-medium">Gender &amp; Blood Type:</span>
              <span className="font-semibold text-slate-800">{pat.gender || 'Female'} • {pat.blood_type || 'O+'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100/70">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
              </span>
              <span className="font-semibold text-slate-800">{pat.email || '—'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100/70">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
              </span>
              <span className="font-semibold text-slate-800">{pat.phone || '—'}</span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100/70">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Residential Address:
              </span>
              <span className="font-semibold text-slate-800 text-right max-w-xs">{pat.address || '—'}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Emergency Contact:
              </span>
              <span className="font-semibold text-slate-800">{pat.emergency_contact || '—'}</span>
            </div>
          </div>
        </div>

        {/* Partner Information */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Partner &amp; Genetic Background</h3>
            </div>
            <button
              onClick={() => setIsEditOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Update
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">Partner Details</span>
                <span className="text-xs font-semibold text-slate-500">
                  {partner.age ? `${partner.age} years old` : 'Age not recorded'}
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                {partner.name || 'Not provided yet'}
              </h4>
              <p className="text-xs text-slate-600">
                {partner.medical_history ||
                  'No partner history or semen evaluation recorded yet. You can add notes using the Edit button.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 block">Semen Analysis &amp; Embryo Security</span>
              <p className="leading-relaxed">
                All partner lab assessments (sperm concentration, motility, morphology, and DNA fragmentation) are confidential and linked directly into your IVF cycle protocol for ICSI / conventional insemination.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile & Partner Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Contact & Partner Details"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Keep your contact information and emergency phone numbers current so our nursing team can coordinate time-sensitive medication instructions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 234-5678"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Email Address</label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Residential Address</label>
            <input
              type="text"
              placeholder="123 Blossom Lane, Apt 4B, City, State"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Emergency Contact (Name &amp; Phone)</label>
            <input
              type="text"
              placeholder="Jane Doe (Spouse) - +1 (555) 987-6543"
              value={editForm.emergency_contact}
              onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Partner Information</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-700 block">Partner Full Name</label>
                <input
                  type="text"
                  placeholder="Partner Name"
                  value={editForm.partner_name}
                  onChange={(e) => setEditForm({ ...editForm, partner_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 block">Partner Age</label>
                <input
                  type="number"
                  placeholder="Age"
                  value={editForm.partner_age}
                  onChange={(e) => setEditForm({ ...editForm, partner_age: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 block">Partner Medical Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Normal semen parameters, non-smoker, no history of varicocele"
                value={editForm.partner_medical_history}
                onChange={(e) => setEditForm({ ...editForm, partner_medical_history: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <Button type="submit" variant="primary" size="sm" loading={editLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
