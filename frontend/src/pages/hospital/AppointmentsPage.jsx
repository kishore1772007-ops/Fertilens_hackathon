import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  X,
  User,
  MapPin
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: 'P1001',
    doctor_id: '',
    title: 'Cycle Day 12 Follicular Ultrasound & Monitoring',
    appointment_type: 'Ultrasound',
    start_time: '',
    end_time: '',
    location: 'Main Fertility Suite 4B',
    notes: 'Confirm LH surge and follicle lead dimension'
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/appointments', { params });
      setAppointments(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Pre-fetch patients for schedule dropdown
    apiClient.get('/patients?limit=50').then((res) => {
      setPatients(res.data.items || []);
    }).catch(console.error);

    // Default start time 2 days from now
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(10, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setMinutes(45);
    setFormData((prev) => ({
      ...prev,
      start_time: d.toISOString().slice(0, 16),
      end_time: dEnd.toISOString().slice(0, 16)
    }));
  }, [statusFilter]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        doctor_id: formData.doctor_id || '6ac90fac495895ca47411d5e',
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString()
      };
      await apiClient.post('/appointments', payload);
      setShowScheduleModal(false);
      fetchAppointments();
    } catch (err) {
      alert(err.normalizedMessage || 'Error scheduling appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      alert(err.normalizedMessage || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Appointment Schedule</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {total} Consultations
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            IVF Monitoring, Baseline Scans, Embryology Consultations & Trigger Schedules
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Appointment
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['', 'scheduled', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st || 'All Appointments'}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchAppointments()}
          className="p-2 text-slate-500 hover:text-teal-600 rounded-xl"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            <p className="text-xs">Loading appointments...</p>
          </div>
        ) : appointments.length > 0 ? (
          appointments.map((appt) => (
            <div
              key={appt.appointment_id || appt._id}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-teal-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {appt.appointment_type}
                  </span>
                  <StatusBadge status={appt.status} size="xs" />
                  <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 font-semibold">
                    {appt.patient_id}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{appt.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-slate-700 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Patient: {appt.patient_name || appt.patient_id}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(appt.start_time).toLocaleString()}</span>
                  </div>
                  {appt.location && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{appt.location}</span>
                    </div>
                  )}
                </div>

                {appt.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                    <span className="font-semibold text-slate-700">Clinical Note:</span> {appt.notes}
                  </p>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {appt.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(appt.appointment_id, 'completed')}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(appt.appointment_id, 'cancelled')}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No appointments match the selected filter.</p>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Schedule Clinical Visit</h3>
                <p className="text-xs text-slate-500">Encrypted visit scheduling across doctor calendar</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Patient</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20"
                >
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_id} — {p.first_name} {p.last_name} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Visit Type</label>
                  <select
                    value={formData.appointment_type}
                    onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Ultrasound">Follicular Ultrasound</option>
                    <option value="Egg Retrieval">Egg Retrieval</option>
                    <option value="Embryo Transfer">Embryo Transfer</option>
                    <option value="Follow-up">Follow-up Lab Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Appointment Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Preparation Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
