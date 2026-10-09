export const RECORD_TYPES = [
  'Consultation Note',
  'Lab Result',
  'Ultrasound',
  'Embryology Report',
  'Prescription',
  'Surgical Note',
];

export const STATUS_TYPES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  PROCESSING: 'processing',
  INDEXED: 'indexed',
  FAILED: 'failed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PRIORITY_COLORS = {
  urgent: 'bg-rose-100 text-rose-800 border-rose-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
};
