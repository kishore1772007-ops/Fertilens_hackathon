import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateInput, formatStr = 'MMM d, yyyy') {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return isValid(date) ? format(date, formatStr) : '—';
  } catch {
    return '—';
  }
}

export function formatDateTime(dateInput) {
  return formatDate(dateInput, 'MMM d, yyyy h:mm a');
}

export function formatTime(dateInput) {
  return formatDate(dateInput, 'h:mm a');
}
