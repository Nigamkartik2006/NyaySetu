import React from 'react';
import AdminLayout from './AdminLayout';
import AdminDashboardOverview from './AdminDashboardOverview';

const AdminDashboard = () => {
  return (
    <AdminLayout title="Admin Governance Overview">
      <AdminDashboardOverview />
    </AdminLayout>
  );
};

export default AdminDashboard;
