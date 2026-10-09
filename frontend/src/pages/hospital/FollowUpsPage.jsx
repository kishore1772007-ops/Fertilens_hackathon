import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  User,
  Calendar,
  AlertTriangle,
  FileCheck2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function FollowUpsPage() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [patients, setPatients] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: 'P1001',
    title: 'Review Day 10 Estradiol & LH Panel',
    category: 'Lab Review',
    priority: 'high',
    due_date: '',
    description: 'Verify peak E2 values prior to scheduling recombinant hCG trigger injection.'
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await apiClient.get('/followups', { params });
      setTasks(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching followups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    // Fetch patient list for quick assignment
    apiClient.get('/patients?limit=50').then((res) => {
      setPatients(res.data.items || []);
    }).catch(console.error);

    // Default due date to tomorrow at 10:00
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    setFormData((prev) => ({
      ...prev,
      due_date: d.toISOString().slice(0, 16)
    }));
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        patient_id: formData.patient_id.trim(),
        title: formData.title.trim(),
        category: formData.category,
        priority: formData.priority,
        due_date: new Date(formData.due_date).toISOString(),
        description: formData.description.trim()
      };
      await apiClient.post('/followups', payload);
      setShowCreateModal(false);
      fetchTasks();
    } catch (err) {
      alert(err.normalizedMessage || 'Failed to create follow-up task');
    } finally {
      setSubmitting(false);
    }
  };

  const openCompleteModal = (task) => {
    setActiveTask(task);
    setResolutionNotes(`Completed on ${new Date().toLocaleDateString()} - verified by clinical staff.`);
    setShowCompleteModal(true);
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!activeTask) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/followups/${activeTask.followup_id}`, {
        status: 'completed',
        resolution_notes: resolutionNotes
      });
      setShowCompleteModal(false);
      setActiveTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.normalizedMessage || 'Failed to complete follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaiveTask = async (taskId) => {
    if (!window.confirm('Waive this follow-up item?')) return;
    try {
      await apiClient.put(`/followups/${taskId}`, {
        status: 'waived',
        resolution_notes: 'Waived per attending physician decision.'
      });
      fetchTasks();
    } catch (err) {
      alert(err.normalizedMessage || 'Failed to waive task');
    }
  };

  // Filter in-memory by search and category
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || t.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Calculate summary counts
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status === 'pending').length;

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-400';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Medication':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Lab Review':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Ultrasound':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Consent':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Embryology':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-teal-600" />
            Clinical Follow-up Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active action items, lab review queues, trigger shot verifications, and patient touchpoints
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Follow-up Task
          </button>
        </div>
      </div>

      {/* Metric summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-semibold">
            {total}
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Logged</div>
            <div className="text-lg font-bold text-slate-800">{total} Tasks</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-semibold">
            {pendingCount}
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pending Action</div>
            <div className="text-lg font-bold text-slate-800">{pendingCount} Open</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-semibold">
            {completedCount}
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Resolved</div>
            <div className="text-lg font-bold text-slate-800">{completedCount} Completed</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 font-semibold">
            {urgentCount}
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Urgent Priority</div>
            <div className="text-lg font-bold text-rose-700">{urgentCount} Urgent</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, patient name, ID, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="waived">Waived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Categories</option>
            <option value="Medication">Medication</option>
            <option value="Lab Review">Lab Review</option>
            <option value="Ultrasound">Ultrasound</option>
            <option value="Consent">Consent</option>
            <option value="Embryology">Embryology</option>
            <option value="Follow-up Consultation">Follow-up Consultation</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading clinical follow-up items...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No follow-up tasks found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || priorityFilter || statusFilter || categoryFilter
              ? 'No tasks matched your current filter criteria. Try adjusting or clearing your filters.'
              : 'All patient tasks and checkpoints are up to date. Create a new task to track clinical follow-ups.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const isOverdue =
              t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date();

            return (
              <div
                key={t.followup_id || t.id}
                className={`bg-white rounded-2xl border transition hover:shadow-md p-5 ${
                  isOverdue ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getPriorityStyle(
                          t.priority
                        )}`}
                      >
                        {t.priority?.toUpperCase()} PRIORITY
                      </span>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getCategoryBadge(
                          t.category
                        )}`}
                      >
                        {t.category}
                      </span>

                      <StatusBadge status={t.status} />

                      {isOverdue && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold border border-red-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{t.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{t.description}</p>
                    </div>

                    {t.resolution_notes && (
                      <div className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 flex items-start gap-2">
                        <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900">Resolution: </span>
                          {t.resolution_notes}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <Link
                        to={`/hospital/patients/${t.patient_id}`}
                        className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        <User className="w-3.5 h-3.5" />
                        {t.patient_name || t.patient_id} ({t.patient_id})
                      </Link>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {t.due_date ? new Date(t.due_date).toLocaleString() : 'N/A'}</span>
                      </div>

                      {t.creator_name && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <span>Created by {t.creator_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex sm:flex-row lg:flex-col items-end gap-2 shrink-0">
                    {t.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => openCompleteModal(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs rounded-xl border border-emerald-200 transition"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Mark Complete
                        </button>

                        <button
                          onClick={() => handleWaiveTask(t.followup_id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-xs rounded-xl border border-slate-200 transition"
                        >
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          Waive Task
                        </button>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        {t.status === 'completed' ? 'Resolved' : 'Waived'}
                      </div>
                    )}

                    <Link
                      to={`/hospital/patients/${t.patient_id}/timeline`}
                      className="text-xs text-teal-600 hover:text-teal-800 font-medium inline-flex items-center gap-1 mt-1"
                    >
                      Patient Timeline <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-teal-600" />
                Schedule Clinical Follow-up Task
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Assign to Patient
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                  required
                >
                  {patients.length > 0 ? (
                    patients.map((p) => (
                      <option key={p.patient_id} value={p.patient_id}>
                        {p.patient_id} - {p.first_name} {p.last_name} ({p.current_ivf_stage || 'Active'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="P1001">P1001 - Priya Sharma</option>
                      <option value="P1002">P1002 - Ananya Roy</option>
                      <option value="P1003">P1003 - Meera Nair</option>
                      <option value="P1004">P1004 - Kavita Patel</option>
                      <option value="P1005">P1005 - Sneha Kulkarni</option>
                      <option value="P1006">P1006 - Deepa Raman</option>
                      <option value="P1007">P1007 - Ritu Verma</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Confirm Trigger Injection & Egg Retrieval Timing"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Medication">Medication</option>
                    <option value="Lab Review">Lab Review</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="Consent">Consent</option>
                    <option value="Embryology">Embryology</option>
                    <option value="Follow-up Consultation">Follow-up Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Clinical Instructions / Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail instructions for nurses, embryologists, or patient coordinators..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2"
                >
                  {submitting ? 'Creating...' : 'Create Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Complete Follow-up Task
              </h2>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1">
              <div><span className="font-semibold text-slate-800">Task:</span> {activeTask.title}</div>
              <div><span className="font-semibold text-slate-800">Patient:</span> {activeTask.patient_name || activeTask.patient_id}</div>
            </div>

            <form onSubmit={handleCompleteTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record outcome, patient response, lab values verified, or next clinical step..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
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
