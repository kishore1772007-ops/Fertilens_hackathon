import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Clock,
  Check,
  Sparkles,
  Heart
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function MyNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data.items || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching patient notifications:', err);
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
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err.normalizedMessage || 'Failed to mark all read');
    }
  };

  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.read)
    : notifications;

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return 'Recently';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
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
            <Bell className="w-7 h-7 text-blue-600" />
            My Notifications & Updates
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay informed with clinic updates, appointment reminders, and test results notifications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-full shadow-md shadow-blue-500/20 transition"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-5 py-2 text-xs font-semibold rounded-full transition ${
            !filterUnread ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-blue-50/50'
          }`}
        >
          All Updates ({notifications.length})
        </button>

        <button
          onClick={() => setFilterUnread(true)}
          className={`px-5 py-2 text-xs font-semibold rounded-full transition flex items-center gap-1.5 ${
            filterUnread ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-blue-50/50'
          }`}
        >
          Unread Only
          {unreadCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                filterUnread ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading your updates...</p>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-blue-100/80 p-12 text-center shadow-sm">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">All Caught Up!</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {filterUnread
              ? 'You have read all of your recent updates and alerts.'
              : 'You do not have any notifications yet. New clinic notices will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((n) => (
            <div
              key={n.notification_id || n.id}
              className={`rounded-3xl border p-5 sm:p-6 transition hover:shadow-md flex items-start gap-4 ${
                !n.read
                  ? 'bg-white border-blue-200 ring-1 ring-blue-100 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 opacity-90'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  !n.read ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-bold ${
                        !n.read ? 'text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {n.title}
                    </h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimestamp(n.created_at)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>

              <div className="shrink-0 self-center">
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.notification_id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
