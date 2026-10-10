import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  RefreshCw,
  CalendarCheck2,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/appointments');
      setAppointments(res.data.items || []);
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.start_time) >= now || a.status === 'scheduled'
  );
  const pastAppointments = appointments.filter(
    (a) => new Date(a.start_time) < now && a.status !== 'scheduled'
  );

  const displayedList = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'TBD';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-blue-600" />
            My Clinical Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View your upcoming scans, consultations, monitoring visits, and procedure schedule
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition self-start sm:self-auto"
          title="Refresh appointments"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2 text-xs font-semibold rounded-full transition flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:bg-blue-50/50'
          }`}
        >
          Upcoming Visits
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'upcoming' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {upcomingAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-5 py-2 text-xs font-semibold rounded-full transition flex items-center gap-2 ${
            activeTab === 'past'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:bg-blue-50/50'
          }`}
        >
          Past Visits
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'past' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {pastAppointments.length}
          </span>
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading your appointments...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-blue-100/80 p-12 text-center shadow-sm">
          <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {activeTab === 'upcoming' ? 'No Upcoming Visits Scheduled' : 'No Past Appointments'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {activeTab === 'upcoming'
              ? 'Your clinical team will notify you when your next ultrasound or monitoring visit is scheduled.'
              : 'Your past consultations and completed appointments will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((appt) => (
            <div
              key={appt.appointment_id || appt.id}
              className="bg-white rounded-3xl border border-blue-100/80 p-6 shadow-sm hover:shadow-md transition space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      {appt.appointment_type}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{appt.title}</h3>
                </div>

                <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 self-start">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {formatDate(appt.start_time)}
                </div>
              </div>

              {appt.notes && (
                <div className="bg-blue-50/30 p-3.5 rounded-2xl border border-blue-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 block mb-0.5">Instructions & Notes:</span>
                  {appt.notes}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {appt.doctor_name && (
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Attending: Dr. {appt.doctor_name}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {appt.location || 'Main Fertility Suite 4B'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
