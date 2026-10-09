import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HeartHandshake
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function MyFollowUpsPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // pending, completed

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/followups');
      setTasks(res.data.items || []);
    } catch (err) {
      console.error('Error fetching patient follow-up tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'waived');

  const displayedTasks = activeTab === 'pending' ? pendingTasks : completedTasks;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Date Pending';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-rose-500" />
            My Action Items & Care Instructions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalized treatment steps, medication instructions, and upcoming health checkpoints
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition self-start sm:self-auto"
          title="Refresh tasks"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          To Do
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'pending' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {pendingTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Completed
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'completed' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {completedTasks.length}
          </span>
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Checking your care plan...</p>
        </div>
      ) : displayedTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {activeTab === 'pending' ? 'All Care Tasks Completed!' : 'No Past Items'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {activeTab === 'pending'
              ? 'You are all caught up with your cycle instructions and clinical checkpoints.'
              : 'Completed tasks will be recorded here for your treatment history.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedTasks.map((t) => (
            <div
              key={t.followup_id || t.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                      {t.category}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
                </div>

                {t.due_date && (
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Due by: {formatDate(t.due_date)}
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{t.description}</p>

              {t.resolution_notes && (
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Clinical Note:</span>
                    {t.resolution_notes}
                  </div>
                </div>
              )}

              {t.creator_name && (
                <div className="text-xs text-slate-400 pt-1">
                  Assigned by Dr. {t.creator_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
