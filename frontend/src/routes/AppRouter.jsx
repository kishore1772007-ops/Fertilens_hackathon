import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { HospitalLayout } from '../layouts/HospitalLayout';
import { PatientLayout } from '../layouts/PatientLayout';
import { Loader } from '../components/common/Loader';
import { ROUTES } from '../constants/routes';

// Public Pages
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const LoginChooserPage = lazy(() => import('../pages/public/LoginChooserPage'));
const LoginHospitalPage = lazy(() => import('../pages/public/LoginHospitalPage'));
const LoginPatientPage = lazy(() => import('../pages/public/LoginPatientPage'));
const UnauthorizedPage = lazy(() => import('../pages/public/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'));

// Hospital Pages
const HospitalDashboard = lazy(() => import('../pages/hospital/HospitalDashboard'));
const HospitalAssistantPage = lazy(() => import('../pages/hospital/HospitalAssistantPage'));
const PatientListPage = lazy(() => import('../pages/hospital/PatientListPage'));
const PatientSearchPage = lazy(() => import('../pages/hospital/PatientSearchPage'));
const PatientDetailsPage = lazy(() => import('../pages/hospital/PatientDetailsPage'));
const MedicalRecordsPage = lazy(() => import('../pages/hospital/MedicalRecordsPage'));
const DocumentUploadPage = lazy(() => import('../pages/hospital/DocumentUploadPage'));
const AIHistorySearchPage = lazy(() => import('../pages/hospital/AIHistorySearchPage'));
const PatientTimelinePage = lazy(() => import('../pages/hospital/PatientTimelinePage'));
const ConsultationBriefPage = lazy(() => import('../pages/hospital/ConsultationBriefPage'));
const PendingInformationPage = lazy(() => import('../pages/hospital/PendingInformationPage'));
const AppointmentsPage = lazy(() => import('../pages/hospital/AppointmentsPage'));
const FollowUpsPage = lazy(() => import('../pages/hospital/FollowUpsPage'));
const NotificationsPage = lazy(() => import('../pages/hospital/NotificationsPage'));
const StaffManagementPage = lazy(() => import('../pages/hospital/StaffManagementPage'));
const AuditLogsPage = lazy(() => import('../pages/hospital/AuditLogsPage'));

// Patient Pages
const PatientDashboard = lazy(() => import('../pages/patient/PatientDashboard'));
const PatientAssistantPage = lazy(() => import('../pages/patient/PatientAssistantPage'));
const MyProfilePage = lazy(() => import('../pages/patient/MyProfilePage'));
const MyAppointmentsPage = lazy(() => import('../pages/patient/MyAppointmentsPage'));
const MyDocumentsPage = lazy(() => import('../pages/patient/MyDocumentsPage'));
const MyFollowUpsPage = lazy(() => import('../pages/patient/MyFollowUpsPage'));
const MyTreatmentJourneyPage = lazy(() => import('../pages/patient/MyTreatmentJourneyPage'));
const MyNotificationsPage = lazy(() => import('../pages/patient/MyNotificationsPage'));

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader size="lg" message="Loading FertiLens..." />
        </div>
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginChooserPage />} />
        <Route path={ROUTES.LOGIN_HOSPITAL} element={<LoginHospitalPage />} />
        <Route path={ROUTES.LOGIN_PATIENT} element={<LoginPatientPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        {/* Hospital Portal Routes */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['doctor', 'staff', 'admin']}>
                <HospitalLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.HOSPITAL.DASHBOARD} replace />} />
          <Route path="dashboard" element={<HospitalDashboard />} />
          <Route path="assistant" element={<HospitalAssistantPage />} />
          <Route path="patients" element={<PatientListPage />} />
          {/* Note: search defined BEFORE :patientId to prevent capture */}
          <Route path="patients/search" element={<PatientSearchPage />} />
          <Route path="patients/:patientId" element={<PatientDetailsPage />} />
          <Route path="patients/:patientId/records" element={<MedicalRecordsPage />} />
          <Route path="patients/:patientId/upload" element={<DocumentUploadPage />} />
          <Route path="patients/:patientId/ai-history" element={<AIHistorySearchPage />} />
          <Route path="patients/:patientId/timeline" element={<PatientTimelinePage />} />
          <Route path="patients/:patientId/brief" element={<ConsultationBriefPage />} />
          <Route path="pending" element={<PendingInformationPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="followups" element={<FollowUpsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Admin Restricted Hospital Routes */}
          <Route
            path="staff"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <StaffManagementPage />
              </RoleRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AuditLogsPage />
              </RoleRoute>
            }
          />
        </Route>

        {/* Patient Portal Routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['patient']}>
                <PatientLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.PATIENT.DASHBOARD} replace />} />
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="assistant" element={<PatientAssistantPage />} />
          <Route path="profile" element={<MyProfilePage />} />
          <Route path="appointments" element={<MyAppointmentsPage />} />
          <Route path="documents" element={<MyDocumentsPage />} />
          <Route path="followups" element={<MyFollowUpsPage />} />
          <Route path="journey" element={<MyTreatmentJourneyPage />} />
          <Route path="notifications" element={<MyNotificationsPage />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
