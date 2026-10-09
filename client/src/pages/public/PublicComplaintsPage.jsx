import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { Shield, Search, ArrowRight, Loader2, Lock, Eye, AlertTriangle } from 'lucide-react';

const PublicComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchPublicComplaints();
  }, []);

  const fetchPublicComplaints = async () => {
    setLoading(true);
    try {
      const res = await publicApi.getComplaints();
      if (res.success && Array.isArray(res.complaints)) {
        setComplaints(res.complaints);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('[fetchPublicComplaints Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.incident_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? c.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
      {/* Header */}
      <header className="h-16 border-b-2 border-[#EE712B] bg-white sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/logo.jpg" 
            alt="NyayaSetu Official Logo" 
            className="h-10 w-auto object-contain rounded border border-[#e2d7cd]"
          />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
              NyaySetu
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
              Public Anonymized Complaints Transparency Board
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login?role=student"
            className="px-3.5 py-1.5 text-xs font-bold text-[#DC4712] hover:bg-orange-50 border border-orange-300 rounded-lg transition-colors"
          >
            Student Sign In
          </Link>
          <Link
            to="/register"
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#EE712B] hover:bg-[#DC4712] rounded-lg shadow-sm transition-colors"
          >
            Report Incident
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* Transparency Banner */}
        <div className="bg-[#F1E9E3] border border-[#e2d7cd] border-l-4 border-l-[#EE712B] rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#DC4712] uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            Public Transparency Portal
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Anonymized Institutional Case Log
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            This public dashboard provides real-time visibility into reported campus grievances to ensure institutional accountability. To protect student privacy, all personal details, raw complaint descriptions, and evidence files are strictly anonymized and restricted.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#e2d7cd] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Case ID, Category, or Location..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#EE712B]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold w-full sm:w-auto">
            <span>Filter Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EE712B]"
            >
              <option value="">All Categories</option>
              <option value="Harassment">Harassment</option>
              <option value="Ragging">Ragging</option>
              <option value="Assault">Assault</option>
              <option value="Sexual Misconduct">Sexual Misconduct</option>
              <option value="Threat / Intimidation">Threat / Intimidation</option>
              <option value="Cyber Harassment">Cyber Harassment</option>
              <option value="Discrimination">Discrimination</option>
              <option value="Bullying">Bullying</option>
            </select>
          </div>
        </div>

        {/* Public Case Cards */}
        {loading ? (
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center text-slate-600">
            <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold">Loading public cases...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center space-y-2 shadow-sm">
            <Shield className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-900">
              No Public Cases Found
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              No anonymized complaint records match your filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredComplaints.map((item) => (
              <div
                key={item.case_id}
                className="bg-white border border-[#e2d7cd] hover:border-[#EE712B] rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-[#DC4712] font-mono tracking-wider">
                      #{item.case_id}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">
                    {item.category}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-600 font-medium">
                    <p>Date: <span className="font-bold text-slate-800">{new Date(item.incident_date).toLocaleDateString()}</span></p>
                    <p>Location: <span className="font-bold text-slate-800">{item.incident_location}</span></p>
                    <p className="flex items-center gap-1 pt-1 text-[11px] font-bold text-slate-500">
                      <Lock className="w-3 h-3 text-emerald-700" />
                      Reported by: <span className="text-slate-800">{item.reported_by}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e2d7cd]">
                  <Link
                    to={`/public/complaints/${item.case_id}`}
                    className="w-full py-2 px-3 rounded-lg bg-[#F1E9E3] hover:bg-slate-200 text-[#DC4712] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Public Case Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-[#e2d7cd] text-xs text-slate-600 font-semibold">
        NyaySetu &copy; {new Date().getFullYear()} — Public Accountability & Grievance Transparency Mechanism
      </footer>
    </div>
  );
};

export default PublicComplaintsPage;
