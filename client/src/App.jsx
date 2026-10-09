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
import PlaceholderStudentPage from './pages/student/PlaceholderStudentPage';

// Official & Admin Pages
import OfficialDashboard from './pages/official/OfficialDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

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
                <MyComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/retaliation"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <PlaceholderStudentPage title="Report Retaliation" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/evidence"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <PlaceholderStudentPage title="Evidence Vault" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <PlaceholderStudentPage title="Profile" />
              </ProtectedRoute>
            }
          />

          {/* Protected Official Route */}
          <Route
            path="/official/dashboard"
            element={
              <ProtectedRoute allowedRoles={['official']}>
                <OfficialDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Route */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
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
