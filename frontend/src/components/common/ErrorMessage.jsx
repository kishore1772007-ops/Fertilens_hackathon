import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function ErrorMessage({
  title = 'Failed to load clinical data',
  message = 'An error occurred while communicating with the server. Please check your connection and retry.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-rose-950">{title}</h4>
          <p className="text-xs sm:text-sm text-rose-700 mt-0.5 max-w-xl">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={RefreshCw}
          className="shrink-0 bg-white border-rose-300 text-rose-800 hover:bg-rose-50 hover:text-rose-900"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
