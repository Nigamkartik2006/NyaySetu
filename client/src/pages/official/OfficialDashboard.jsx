import React from 'react';
import Navbar from '../../components/Navbar';

const OfficialDashboard = () => {
  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="Institutional Review Portal — NyaySetu" />

      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="bg-white border border-[#e2d7cd] rounded-xl p-8 sm:p-12 text-center space-y-3 max-w-lg w-full shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            College Official Dashboard
          </h1>
          <p className="text-xs text-slate-600 font-bold">
            Complaint review and case-management features are coming soon.
          </p>
        </div>
      </main>
    </div>
  );
};

export default OfficialDashboard;
