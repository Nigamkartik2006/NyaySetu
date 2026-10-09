import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { complaintApi } from '../../services/api';
import { FileText, PlusCircle, ArrowRight, Loader2, Paperclip, AlertTriangle, ShieldAlert } from 'lucide-react';

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintApi.getMyComplaints();
      if (res.success && Array.isArray(res.complaints)) {
        setComplaints(res.complaints);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('[fetchMyComplaints Error]:', err);
      setError('Failed to load your complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Under Review':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Escalated':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                My Reported Complaints
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Track status and view details of all grievances you have submitted.
              </p>
            </div>
            <Link
              to="/student/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Report New Incident</span>
            </Link>
          </div>

          {/* Loading / Error States */}
          {loading ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center text-slate-600">
              <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold">Loading your complaints...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center space-y-3 shadow-sm">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                No Complaints Submitted Yet
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
                You have not filed any complaints. If you experience or witness an incident, click below to report.
              </p>
              <div className="pt-2">
                <Link
                  to="/student/report"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report An Incident Now</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((item) => (
                <div
                  key={item.case_id}
                  className="bg-white border border-[#e2d7cd] hover:border-[#EE712B] rounded-xl p-5 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-black text-[#DC4712] font-mono tracking-wider">
                        #{item.case_id}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900">
                      Category: {item.category}
                    </h3>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                      <span>Date: {new Date(item.incident_date).toLocaleDateString()}</span>
                      <span>Location: {item.incident_location}</span>
                      {item.evidence_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Paperclip className="w-3.5 h-3.5" />
                          {item.evidence_count} evidence file(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/student/retaliation?caseId=${item.case_id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Retaliation</span>
                    </Link>

                    <Link
                      to={`/student/complaints/${item.case_id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F1E9E3] hover:bg-slate-200 text-[#DC4712] font-bold text-xs transition-colors"
                    >
                      <span>View Case Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyComplaintsPage;
