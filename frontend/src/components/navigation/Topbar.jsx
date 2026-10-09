import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { NotificationBell } from './NotificationBell';
import { Breadcrumbs } from './Breadcrumbs';

export function Topbar({ onToggleSidebar, isPatientPortal = false }) {
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs isPatientPortal={isPatientPortal} />
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-3">
        <NotificationBell isPatientPortal={isPatientPortal} />

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <span className="block text-xs font-semibold text-slate-800 leading-tight">
              {user?.full_name || 'Clinical Staff'}
            </span>
            <span className="block text-[11px] font-medium text-slate-400 capitalize">
              {role || 'Staff'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
