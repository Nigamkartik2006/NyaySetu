import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import RoleSelectionPage from './pages/auth/RoleSelectionPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Public Pages
import PublicComplaintsPage from './pages/public/PublicComplaintsPage';
import PublicCaseDetailsPage from './pages/public/PublicCaseDetailsPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ReportIncidentPage from './pages/student/ReportIncidentPage';
import MyComplaintsPage from './pages/student/MyComplaintsPage';
import PrivateCaseDetailsPage from './pages/student/PrivateCaseDetailsPage';
import ReportRetaliationPage from './pages/student/ReportRetaliationPage';
import EvidenceVaultPage from './pages/student/EvidenceVaultPage';
import ProfilePage from './pages/student/ProfilePage';
import TrackCasesPage from './pages/student/TrackCasesPage';
import PlaceholderStudentPage from './pages/student/PlaceholderStudentPage';

// Official & Admin Pages
import OfficialDashboard from './pages/official/OfficialDashboard';
import OfficialCaseDetailsPage from './pages/official/OfficialCaseDetailsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import AdminCaseDetailsPage from './pages/admin/AdminCaseDetailsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminRetaliationPage from './pages/admin/AdminRetaliationPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<RoleSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public Complaints Transparency Board Routes */}
          <Route path="/public/complaints" element={<PublicComplaintsPage />} />
          <Route path="/public/complaints/:caseId" element={<PublicCaseDetailsPage />} />

          {/* Protected Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/report"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ReportIncidentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaints"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaints/:caseId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <PrivateCaseDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/track"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TrackCasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/retaliation"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ReportRetaliationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/evidence"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <EvidenceVaultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Official Routes */}
          <Route
            path="/official/dashboard"
            element={
              <ProtectedRoute allowedRoles={['official']}>
                <OfficialDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/official/complaints/:caseId"
            element={
              <ProtectedRoute allowedRoles={['official']}>
                <OfficialCaseDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout title="Complaints Directory">
                  <AdminComplaintsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints/:caseId"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout title="Case Management & Oversight">
                  <AdminCaseDetailsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/retaliation"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRetaliationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout title="Governance Analytics">
                  <AdminAnalyticsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout title="Security Audit Trail">
                  <AdminAuditLogsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
