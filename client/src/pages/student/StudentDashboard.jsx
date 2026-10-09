import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { complaintApi } from '../../services/api';
import { 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  PlusCircle, 
  FileSearch, 
  ShieldCheck, 
  ArrowRight,
  Eye
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    pending: 0,
    underReview: 0,
    resolved: 0,
    escalated: 0
  });

  useEffect(() => {
    fetchComplaintCounts();
  }, []);

  const fetchComplaintCounts = async () => {
    try {
      const res = await complaintApi.getMyComplaints();
      if (res.success && Array.isArray(res.complaints)) {
        let p = 0, u = 0, r = 0, e = 0;
        res.complaints.forEach((c) => {
          if (c.status === 'Submitted') p++;
          else if (c.status === 'Under Review') u++;
          else if (c.status === 'Resolved') r++;
          else if (c.status === 'Escalated') e++;
        });
        setCounts({ pending: p, underReview: u, resolved: r, escalated: e });
      }
    } catch (err) {
      console.error('[fetchComplaintCounts Error]:', err);
    }
  };

  const statCards = [
    { label: 'Pending Complaints', value: counts.pending, icon: Clock, color: 'border-l-4 border-l-amber-500' },
    { label: 'Under Review', value: counts.underReview, icon: Search, color: 'border-l-4 border-l-blue-500' },
    { label: 'Resolved', value: counts.resolved, icon: CheckCircle2, color: 'border-l-4 border-l-emerald-500' },
    { label: 'Escalated', value: counts.escalated, icon: AlertOctagon, color: 'border-l-4 border-l-[#DC4712]' },
  ];

  const workflowSteps = [
    { step: '01', name: 'Report', desc: 'File Complaint' },
    { step: '02', name: 'AI Triage', desc: 'Category Assessment' },
    { step: '03', name: 'Human Review', desc: 'Official Committee' },
    { step: '04', name: 'Track', desc: 'Real-time Progress' },
    { step: '05', name: 'Escalate', desc: '24h Trigger' },
    { step: '06', name: 'Resolve', desc: 'Case Closed' }
  ];

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Official Clean Welcome Banner */}
          <section className="bg-[#F1E9E3] border border-[#e2d7cd] border-l-4 border-l-[#EE712B] rounded-lg p-6 shadow-sm">
            <div className="max-w-3xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#DC4712] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Official Student Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome, {user?.full_name || 'Student'}
              </h1>
              {user?.student_id && (
                <p className="text-xs font-bold text-slate-700">
                  Student ID: {user.student_id}
                </p>
              )}
              <p className="text-xs text-slate-600 leading-relaxed font-medium pt-1">
                Your reports and case activity can be monitored securely from this dashboard.
              </p>
            </div>
          </section>

          {/* Statistics Cards */}
          <section className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Grievance Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className={`bg-white border border-[#e2d7cd] ${card.color} rounded-lg p-4 shadow-sm flex items-center justify-between`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-600">
                      {card.label}
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#F1E9E3] border border-[#e2d7cd] flex items-center justify-center text-slate-700">
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions — Connected directly to functional pages */}
          <section className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/student/report"
                className="group text-left bg-white hover:bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg p-5 shadow-sm transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-[#EE712B] text-white flex items-center justify-center shadow-sm">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      + Report New Incident
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Submit an official confidential complaint report with evidence.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#DC4712] group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/student/complaints"
                className="group text-left bg-white hover:bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg p-5 shadow-sm transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-[#DC4712] text-white flex items-center justify-center shadow-sm">
                    <FileSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      Track My Complaints
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      View ongoing case status and institutional action updates.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#DC4712] group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/public/complaints"
                className="group text-left bg-white hover:bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg p-5 shadow-sm transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      Public Transparency Board
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Browse public anonymized cases for institutional transparency.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>



          {/* Security & Privacy Notice */}
          <section className="bg-[#F1E9E3] border border-[#e2d7cd] border-l-4 border-l-[#EE712B] rounded-lg p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#DC4712] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Privacy & Data Security Notice
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium mt-0.5">
                Your privacy matters. Complaint details and personal information are protected through role-based access and secure authentication.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
