import React from 'react';
import { Loader2 } from 'lucide-react';

export function Loader({ size = 'md', message = 'Loading...', fullScreen = false }) {
  const sizeMap = {
    sm: 'w-4 h-4 text-teal-600',
    md: 'w-8 h-8 text-teal-600',
    lg: 'w-12 h-12 text-teal-600',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin`} />
      {message && <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export function SkeletonRow({ count = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-lg w-full" />
      ))}
    </div>
  );
}
