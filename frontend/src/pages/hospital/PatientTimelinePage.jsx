import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  History,
  Calendar,
  FileText,
  CheckSquare,
  Stethoscope,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function PatientTimelinePage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [events, setEvents] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & State
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch patient details
      const patRes = await apiClient.get(`/patients/${patientId}`).catch(() => null);
      if (patRes?.data) setPatient(patRes.data);

      // 2. Fetch timeline events
      const timeRes = await apiClient.get(`/patients/${patientId}/timeline`);
      const evs = timeRes.data.events || [];
      setEvents(evs);
      setTotalEvents(timeRes.data.total_events || evs.length);

      // Default expand top 3 items
      const initialExpanded = new Set(evs.slice(0, 3).map((e) => e.id));
      setExpandedIds(initialExpanded);
    } catch (err) {
      console.error('Error fetching patient timeline:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredEvents = events.filter((ev) => {
    const matchesType = typeFilter === 'all' || ev.event_type === typeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      ev.title?.toLowerCase().includes(q) ||
      ev.summary?.toLowerCase().includes(q) ||
      ev.subtype?.toLowerCase().includes(q) ||
      ev.findings?.toLowerCase().includes(q) ||
      ev.plan?.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const getEventBadge = (type) => {
    switch (type) {
      case 'clinical_record':
        return {
          icon: Stethoscope,
          bg: 'bg-emerald-500',
          ring: 'ring-emerald-200',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Clinical Record'
        };
      case 'appointment':
        return {
          icon: Calendar,
          bg: 'bg-blue-500',
          ring: 'ring-blue-200',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Appointment'
        };
      case 'document':
        return {
          icon: FileText,
          bg: 'bg-purple-500',
          ring: 'ring-purple-200',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Diagnostic Document'
        };
      case 'followup':
        return {
          icon: CheckSquare,
          bg: 'bg-amber-500',
          ring: 'ring-amber-200',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Follow-up Task'
        };
      default:
        return {
          icon: Activity,
          bg: 'bg-slate-500',
          ring: 'ring-slate-200',
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
          label: 'Event'
        };
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Date Pending';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/hospital/patients/${patientId}`}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition"
            title="Back to patient 360"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <History className="w-7 h-7 text-teal-600" />
              Patient 360 Visual Timeline: {patient?.first_name} {patient?.last_name} ({patientId})
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Unified chronological timeline aggregating consultations, lab panels, scans, visits, and follow-ups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh timeline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <Link
            to={`/hospital/patients/${patientId}/records`}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl shadow-sm transition inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Medical Records
          </Link>
        </div>
      </div>

      {/* Patient Summary Header Card */}
      {patient && (
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-teal-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold">
                  {patient.first_name} {patient.last_name}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-400/30">
                  {patient.current_ivf_stage || 'Active Treatment'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Age: {patient.age || '32'} • Primary Diagnosis: {patient.primary_diagnosis || 'Unexplained Infertility'} • IVF Cycle #{patient.ivf_cycle_count || 1}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
                <span className="text-teal-200 block text-[10px] uppercase font-bold tracking-wider">AMH Level</span>
                <span className="text-base font-bold text-white">{patient.baseline_amh || '2.4'} ng/mL</span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
                <span className="text-teal-200 block text-[10px] uppercase font-bold tracking-wider">Antral Follicles</span>
                <span className="text-base font-bold text-white">{patient.antral_follicle_count || '14'} AFC</span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
                <span className="text-teal-200 block text-[10px] uppercase font-bold tracking-wider">Total Events</span>
                <span className="text-base font-bold text-white">{totalEvents} Tracked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search timeline events, clinical observations, medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'clinical_record', label: 'Clinical Records' },
            { key: 'appointment', label: 'Appointments' },
            { key: 'document', label: 'Documents' },
            { key: 'followup', label: 'Follow-ups' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                typeFilter === tab.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Interactive Timeline */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Synthesizing clinical journey timeline...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No events matched</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || typeFilter !== 'all'
              ? 'No events match your current filter settings. Try clearing the search or changing event type.'
              : 'No clinical events recorded for this patient yet.'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 space-y-6">
          {filteredEvents.map((ev) => {
            const config = getEventBadge(ev.event_type);
            const Icon = config.icon;
            const isExpanded = expandedIds.has(ev.id);

            return (
              <div key={ev.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full ${config.bg} text-white flex items-center justify-center ring-4 ${config.ring} shadow-sm z-10 transition group-hover:scale-110`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${config.badgeBg}`}
                        >
                          {ev.subtype || config.label}
                        </span>

                        {ev.status && (
                          <StatusBadge status={ev.status} />
                        )}

                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(ev.timestamp)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{ev.title}</h3>
                    </div>

                    <button
                      onClick={() => toggleExpand(ev.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg self-end sm:self-start transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Summary */}
                  {ev.summary && (
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{ev.summary}</p>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
                      {ev.findings && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-800 block mb-0.5">Clinical Findings:</span>
                          <p className="text-slate-600 leading-relaxed">{ev.findings}</p>
                        </div>
                      )}

                      {ev.plan && (
                        <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                          <span className="font-semibold text-teal-900 block mb-0.5">Action Plan:</span>
                          <p className="text-teal-800 leading-relaxed">{ev.plan}</p>
                        </div>
                      )}

                      {ev.notes && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-800 block mb-0.5">Visit Notes:</span>
                          <p className="text-slate-600 leading-relaxed">{ev.notes}</p>
                        </div>
                      )}

                      {ev.tags && ev.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {ev.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-400 pt-2 text-[11px]">
                        <span>Event ID: {ev.id}</span>
                        {ev.doctor_name && <span>Attending: Dr. {ev.doctor_name}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
