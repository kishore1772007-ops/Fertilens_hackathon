import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Info,
  Clock,
  Check,
  User,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('all'); // all, unread, clinical, system
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data.items || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err.normalizedMessage || 'Failed to mark all as read');
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'unread' && item.read) return false;
    if (activeTab === 'clinical' && item.type !== 'clinical_alert') return false;
    if (activeTab === 'system' && item.type !== 'system') return false;

    const q = searchQuery.toLowerCase();
    if (
      q &&
      !item.title?.toLowerCase().includes(q) &&
      !item.message?.toLowerCase().includes(q)
    ) {
      return false;
    }

    return true;
  });

  const extractPatientId = (text) => {
    const match = text?.match(/P\d{4}/);
    return match ? match[0] : null;
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return 'Just now';
    const d = new Date(isoStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
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
            <Bell className="w-7 h-7 text-teal-600" />
            Hospital Alerts & Notifications
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time clinical triggers, laboratory results indexed, and system audit broadcasts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-sm transition"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { key: 'all', label: 'All Alerts', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            {
              key: 'clinical',
              label: 'Clinical Triggers',
              count: notifications.filter((n) => n.type === 'clinical_alert').length
            },
            {
              key: 'system',
              label: 'System & Ingestion',
              count: notifications.filter((n) => n.type === 'system').length
            }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-teal-700 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading hospital alert feed...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No alerts found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {activeTab !== 'all' || searchQuery
              ? 'No notifications match your current filter settings.'
              : 'You have zero pending notifications. All alerts are cleared!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const isClinical = item.type === 'clinical_alert';
            const patId = extractPatientId(item.message) || extractPatientId(item.title);

            return (
              <div
                key={item.notification_id || item.id}
                className={`rounded-2xl border p-4 sm:p-5 transition hover:shadow-md flex items-start gap-4 ${
                  !item.read
                    ? 'bg-white border-teal-200 ring-1 ring-teal-100 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 opacity-90'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isClinical
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  {isClinical ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-bold ${
                          !item.read ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h3>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      )}
                    </div>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimestamp(item.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {patId && (
                      <Link
                        to={`/hospital/patients/${patId}`}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 hover:underline"
                      >
                        <User className="w-3.5 h-3.5" />
                        View Patient ({patId})
                      </Link>
                    )}

                    {patId && (
                      <Link
                        to={`/hospital/patients/${patId}/timeline`}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Open Timeline →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 self-center">
                  {!item.read && (
                    <button
                      onClick={() => handleMarkRead(item.notification_id)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
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
