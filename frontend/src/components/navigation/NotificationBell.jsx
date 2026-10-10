import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export function NotificationBell({ isPatientPortal = false }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(1);

  const targetRoute = isPatientPortal
    ? ROUTES.PATIENT.NOTIFICATIONS
    : ROUTES.HOSPITAL.NOTIFICATIONS;

  return (
    <button
      type="button"
      onClick={() => navigate(targetRoute)}
      aria-label="View notifications"
      className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
      )}
    </button>
  );
}
