import React from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

const PlaceholderStudentPage = ({ title = "Feature" }) => {
  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white border border-[#e2d7cd] rounded-xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-lg bg-[#F1E9E3] border border-[#e2d7cd] text-[#DC4712] flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900">
              {title}
            </h2>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              NyaySetu module <span className="text-[#DC4712] font-bold">{title}</span> is coming soon in Phase 2 of the portal rollout.
            </p>

            <div className="pt-2">
              <Link
                to="/student/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white text-xs font-bold transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Student Dashboard</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlaceholderStudentPage;
