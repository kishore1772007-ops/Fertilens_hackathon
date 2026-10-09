export const ROUTES = {
  // Public & Login
  HOME: '/',
  LOGIN: '/login',
  LOGIN_CHOOSER: '/login',
  LOGIN_HOSPITAL: '/login/hospital',
  LOGIN_PATIENT: '/login/patient',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',

  // Hospital Portal
  HOSPITAL: {
    DASHBOARD: '/hospital/dashboard',
    ASSISTANT: '/hospital/assistant',
    PATIENTS: '/hospital/patients',
    PATIENT_SEARCH: '/hospital/patients/search',
    PATIENT_DETAILS: '/hospital/patients/:patientId',
    PATIENT_RECORDS: '/hospital/patients/:patientId/records',
    PATIENT_UPLOAD: '/hospital/patients/:patientId/upload',
    PATIENT_AI_HISTORY: '/hospital/patients/:patientId/ai-history',
    PATIENT_TIMELINE: '/hospital/patients/:patientId/timeline',
    PATIENT_BRIEF: '/hospital/patients/:patientId/brief',
    PENDING: '/hospital/pending',
    APPOINTMENTS: '/hospital/appointments',
    FOLLOWUPS: '/hospital/followups',
    NOTIFICATIONS: '/hospital/notifications',
    STAFF: '/hospital/staff',
    AUDIT_LOGS: '/hospital/audit-logs',
    
    // Dynamic path helpers
    patientDetails: (id) => `/hospital/patients/${id}`,
    patientRecords: (id) => `/hospital/patients/${id}/records`,
    patientUpload: (id) => `/hospital/patients/${id}/upload`,
    patientAiHistory: (id) => `/hospital/patients/${id}/ai-history`,
    patientTimeline: (id) => `/hospital/patients/${id}/timeline`,
    patientBrief: (id) => `/hospital/patients/${id}/brief`,
  },

  // Patient Portal
  PATIENT: {
    DASHBOARD: '/patient/dashboard',
    ASSISTANT: '/patient/assistant',
    PROFILE: '/patient/profile',
    APPOINTMENTS: '/patient/appointments',
    DOCUMENTS: '/patient/documents',
    FOLLOWUPS: '/patient/followups',
    JOURNEY: '/patient/journey',
    NOTIFICATIONS: '/patient/notifications',
  },
};
