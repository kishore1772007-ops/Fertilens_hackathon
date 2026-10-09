import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  User,
  ArrowRight,
  ShieldAlert,
  Flame,
  FileSpreadsheet,
  Stethoscope,
  X,
  History,
  Check
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function PendingInformationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Resolution modal state
  const [resolvingItem, setResolvingItem] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pending');
      setItems(res.data.items || []);
    } catch (err) {
      console.error('Error fetching pending items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPending();
  };

  const openResolveModal = (item) => {
    setResolvingItem(item);
    setNotes('Verified and resolved in clinical action queue.');
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!resolvingItem) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/followups/${resolvingItem.id}`, {
        status: 'completed',
        resolution_notes: notes
      });
      setResolvingItem(null);
      fetchPending();
    } catch (err) {
      alert(err.normalizedMessage || 'Failed to resolve item');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = !priorityFilter || item.priority === priorityFilter;
    const matchesCategory = !categoryFilter || item.category === categoryFilter;

    return matchesSearch && matchesPriority && matchesCategory;
  });

  const urgentCount = items.filter((i) => i.priority === 'urgent').length;
  const highCount = items.filter((i) => i.priority === 'high').length;
  const medReviewCount = items.filter((i) => i.category === 'Medication' || i.category === 'Lab Review').length;

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-400';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <AlertCircle className="w-7 h-7 text-amber-600" />
            Pending Information & Action Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Critical clinical checkpoints, outstanding lab approvals, and medication synchronization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh action queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <Link
            to="/hospital/followups"
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition inline-flex items-center gap-2"
          >
            View All Tasks
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Metric summary badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Action Queue</div>
            <div className="text-xl font-bold text-slate-900">{items.length} Items Pending</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Urgent & High Attention</div>
            <div className="text-xl font-bold text-red-700">{urgentCount + highCount} Critical</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Clinical Reviews</div>
            <div className="text-xl font-bold text-teal-800">{medReviewCount} Inbound</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pending items by patient name, patient ID, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="">All Categories</option>
            <option value="Medication">Medication</option>
            <option value="Lab Review">Lab Review</option>
            <option value="Ultrasound">Ultrasound</option>
            <option value="Consent">Consent</option>
            <option value="Review">Review</option>
          </select>
        </div>
      </div>

      {/* Pending Items List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Evaluating clinical queue...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Clinical Queue Cleared</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || priorityFilter || categoryFilter
              ? 'No pending items matched your filter criteria.'
              : 'There are currently no outstanding patient reviews or pending medical checkpoints.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isUrgent = item.priority === 'urgent' || item.priority === 'high';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition hover:shadow-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.priority === 'urgent'
                    ? 'border-red-300 bg-red-50/10'
                    : item.priority === 'high'
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getPriorityStyle(
                        item.priority
                      )}`}
                    >
                      {item.priority?.toUpperCase()} PRIORITY
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {item.category}
                    </span>
                    {item.due_date && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <Link
                      to={`/hospital/patients/${item.patient_id}`}
                      className="font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
                    >
                      <User className="w-3.5 h-3.5" />
                      {item.patient_name || item.patient_id} ({item.patient_id})
                    </Link>

                    <Link
                      to={`/hospital/patients/${item.patient_id}/timeline`}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      View Timeline
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => openResolveModal(item)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition"
                  >
                    <Check className="w-4 h-4" />
                    Resolve Checkpoint
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Resolve Pending Item
              </h2>
              <button
                onClick={() => setResolvingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 space-y-1">
              <div><span className="font-semibold text-slate-900">Patient:</span> {resolvingItem.patient_name} ({resolvingItem.patient_id})</div>
              <div><span className="font-semibold text-slate-900">Task:</span> {resolvingItem.title}</div>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record verification confirmation, physician notes, or completion details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2"
                >
                  {submitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
