import React from 'react';

export function StatusBadge({ status, label, size = 'sm', className = '' }) {
  const normStatus = (status || '').toLowerCase();

  const getStyle = () => {
    switch (normStatus) {
      case 'indexed':
      case 'active':
      case 'completed':
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'failed':
      case 'error':
      case 'cancelled':
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'scheduled':
      case 'info':
      case 'high':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const displayLabel = label || status || 'Unknown';

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium capitalize rounded-full border ${getStyle()} ${
        sizeClasses[size] || sizeClasses.sm
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {displayLabel}
    </span>
  );
}
