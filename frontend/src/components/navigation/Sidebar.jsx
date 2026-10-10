import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Search,
  Clock,
  Calendar,
  CheckSquare,
  Bell,
  ShieldCheck,
  UserCog,
  FileText,
  FileUp,
  Heart,
  X,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { ROUTES } from '../../constants/routes';

export function Sidebar({ isOpen, onClose, isPatientPortal = false }) {
  const { role, user } = useAuth();
  const isAdmin = role === 'admin';

  const hospitalNavItems = [
    { label: 'Overview', to: ROUTES.HOSPITAL.DASHBOARD, icon: LayoutDashboard },
    { label: 'AI Clinical Assistant', to: ROUTES.HOSPITAL.ASSISTANT, icon: Sparkles },
    { label: 'Patient Roster', to: ROUTES.HOSPITAL.PATIENTS, icon: Users },
    { label: 'Upload Scans & Labs', to: ROUTES.HOSPITAL.UPLOAD, icon: FileUp },
    { label: 'Advanced Search', to: ROUTES.HOSPITAL.PATIENT_SEARCH, icon: Search },
    { label: 'Pending Queue', to: ROUTES.HOSPITAL.PENDING, icon: CheckSquare },
    { label: 'Appointments', to: ROUTES.HOSPITAL.APPOINTMENTS, icon: Calendar },
    { label: 'Follow-ups', to: ROUTES.HOSPITAL.FOLLOWUPS, icon: Clock },
    { label: 'Alerts & Notices', to: ROUTES.HOSPITAL.NOTIFICATIONS, icon: Bell },
  ];

  const adminNavItems = [
    { label: 'Staff Management', to: ROUTES.HOSPITAL.STAFF, icon: UserCog },
    { label: 'Audit Logs', to: ROUTES.HOSPITAL.AUDIT_LOGS, icon: ShieldCheck },
  ];

  const patientNavItems = [
    { label: 'My Dashboard', to: ROUTES.PATIENT.DASHBOARD, icon: LayoutDashboard },
    { label: 'AI Care Assistant', to: ROUTES.PATIENT.ASSISTANT, icon: Sparkles },
    { label: 'Clinical Profile', to: ROUTES.PATIENT.PROFILE, icon: Heart },
    { label: 'Appointments', to: ROUTES.PATIENT.APPOINTMENTS, icon: Calendar },
    { label: 'My Documents', to: ROUTES.PATIENT.DOCUMENTS, icon: FileText },
    { label: 'Action Items', to: ROUTES.PATIENT.FOLLOWUPS, icon: CheckSquare },
    { label: 'Treatment Journey', to: ROUTES.PATIENT.JOURNEY, icon: Sparkles },
    { label: 'Notifications', to: ROUTES.PATIENT.NOTIFICATIONS, icon: Bell },
  ];

  const navItems = isPatientPortal ? patientNavItems : hospitalNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                FertiLens <span className="text-blue-600">AI</span>
              </span>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {isPatientPortal ? 'Patient Care Portal' : 'Clinical ART Platform'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {!isPatientPortal && isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Administration
                </p>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/70 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </>
          )}
        </div>

        {/* User Card in Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || 'User'}</p>
              <p className="text-[11px] text-slate-500 capitalize truncate">{role || 'Visitor'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
