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
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pending Information &amp; Action Queue
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Critical clinical checkpoints, outstanding lab approvals, and medication synchronization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white border border-blue-100 hover:bg-blue-50/60 text-slate-600 rounded-full transition shadow-2xs active:scale-95"
            title="Refresh action queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            to="/hospital/followups"
            className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 text-blue-700 text-xs font-bold rounded-full transition inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </Link>
        </div>
      </div>

      {/* Metric summary badges (GetTalky Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-[0_2px_12px_rgba(37,99,235,0.04)] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Queue</div>
            <div className="text-2xl font-extrabold text-slate-900">{items.length} Items Pending</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-[0_2px_12px_rgba(37,99,235,0.04)] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-2xs">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Urgent &amp; High Attention</div>
            <div className="text-2xl font-extrabold text-rose-700">{urgentCount + highCount} Critical</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-[0_2px_12px_rgba(37,99,235,0.04)] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Reviews</div>
            <div className="text-2xl font-extrabold text-blue-800">{medReviewCount} Inbound</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-[0_2px_12px_rgba(37,99,235,0.04)] flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pending items by patient name, patient ID, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8faff] border border-blue-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-blue-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium text-slate-700"
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
            className="px-3.5 py-2.5 border border-blue-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium text-slate-700"
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
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Evaluating clinical queue...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-blue-100 p-12 text-center shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
          <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Clinical Queue Cleared</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || priorityFilter || categoryFilter
              ? 'No pending items matched your filter criteria.'
              : 'There are currently no outstanding patient reviews or pending medical checkpoints.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition hover:shadow-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.priority === 'urgent'
                    ? 'border-rose-300 bg-rose-50/10'
                    : item.priority === 'high'
                    ? 'border-amber-200'
                    : 'border-blue-100/90'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] px-3 py-0.5 rounded-full font-bold border ${getPriorityStyle(
                        item.priority
                      )}`}
                    >
                      {item.priority?.toUpperCase()} PRIORITY
                    </span>
                    <span className="text-[11px] px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                      {item.category}
                    </span>
                    {item.due_date && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{item.description}</p>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <Link
                      to={`/hospital/patients/${item.patient_id}`}
                      className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      <User className="w-3.5 h-3.5" />
                      {item.patient_name || item.patient_id} ({item.patient_id})
                    </Link>

                    <Link
                      to={`/hospital/patients/${item.patient_id}/timeline`}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      View Timeline
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => openResolveModal(item)}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Resolve Checkpoint</span>
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
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Resolve Pending Checkpoint
              </h2>
              <button
                onClick={() => setResolvingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Item:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{resolvingItem.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Patient: {resolvingItem.patient_name} ({resolvingItem.patient_id})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution / Clinical Notes:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Document the clinical resolution or verification action taken..."
                  className="w-full p-3 border border-blue-100 bg-[#f8faff] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
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
