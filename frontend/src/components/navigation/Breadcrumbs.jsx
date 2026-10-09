import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export function Breadcrumbs({ isPatientPortal = false }) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const homePath = isPatientPortal ? ROUTES.PATIENT.DASHBOARD : ROUTES.HOSPITAL.DASHBOARD;

  const formatCrumbName = (crumb) => {
    if (crumb === 'hospital' || crumb === 'patient') return '';
    if (crumb.startsWith('PAT-')) return `Patient (${crumb})`;
    return crumb.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const visibleCrumbs = pathnames.filter((p) => p !== 'hospital' && p !== 'patient');

  return (
    <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
      <Link
        to={homePath}
        className="flex items-center gap-1 hover:text-slate-800 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>{isPatientPortal ? 'Portal' : 'Hospital'}</span>
      </Link>
      {visibleCrumbs.map((crumb, idx) => {
        const isLast = idx === visibleCrumbs.length - 1;
        return (
          <React.Fragment key={crumb}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className={isLast ? 'font-semibold text-slate-800' : 'hover:text-slate-700'}>
              {formatCrumbName(crumb)}
            </span>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
