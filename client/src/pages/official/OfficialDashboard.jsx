import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  Eye, 
  CheckSquare, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowRight, 
  Building2, 
  Shield, 
  LogOut,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import CountdownTimer from '../../components/CountdownTimer';
import { officialApi } from '../../services/api';

const OfficialDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total_cases: 0,
    pending_review: 0,
    under_investigation: 0,
    action_taken: 0,
    overdue_escalated: 0,
    resolved: 0,
    high_danger: 0,
    response_timeout_minutes: 2
  });

  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDanger, setSelectedDanger] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, complaintsRes] = await Promise.all([
        officialApi.getDashboardStats(),
        officialApi.getComplaints({
          search,
          status: selectedStatus,
          category: selectedCategory,
          danger_status: selectedDanger,
          page,
          limit: 10
        })
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (complaintsRes.success) {
        setComplaints(complaintsRes.complaints || []);
        setPagination(complaintsRes.pagination || { totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error('[OfficialDashboard error]:', err);
      setError(err.message || 'Failed to fetch College Head dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedCategory, selectedDanger, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted':
        return <span className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full">Pending Review</span>;
      case 'Acknowledged':
        return <span className="px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-100 border border-blue-300 rounded-full">Acknowledged</span>;
      case 'Under Investigation':
      case 'Under Review':
        return <span className="px-2.5 py-1 text-xs font-bold text-purple-800 bg-purple-100 border border-purple-300 rounded-full">Under Investigation</span>;
      case 'Action Taken':
        return <span className="px-2.5 py-1 text-xs font-bold text-orange-900 bg-orange-100 border border-orange-300 rounded-full">Action Taken</span>;
      case 'Escalated':
        return <span className="px-2.5 py-1 text-xs font-bold text-rose-900 bg-rose-100 border border-rose-300 rounded-full animate-pulse">Escalated</span>;
      case 'Resolved':
        return <span className="px-2.5 py-1 text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 rounded-full">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="College Official Case Review Portal" />

      {/* Hero Header */}
      <div className="bg-[#0f172a] text-white border-b border-slate-800 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#EE712B]/20 text-[#EE712B] border border-[#EE712B]/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Institutional Review Authority
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> 2-Min SLA Timer Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              College Head Grievance Oversight Panel
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Review incoming student complaints, record institutional actions, upload supporting evidence, and maintain mandatory campus response deadlines.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6">

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#e2d7cd] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Cases</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.total_cases}</p>
            <span className="text-[10px] text-slate-500 font-semibold">Registered in system</span>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Action</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-950">{stats.pending_review}</p>
            <span className="text-[10px] text-amber-700 font-semibold">Awaiting official response</span>
          </div>

          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-purple-800">
              <span className="text-xs font-bold uppercase tracking-wider">Investigating</span>
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-950">{stats.under_investigation}</p>
            <span className="text-[10px] text-purple-700 font-semibold">Under active inquiry</span>
          </div>

          <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[#DC4712]">
              <span className="text-xs font-bold uppercase tracking-wider">Action Taken</span>
              <CheckSquare className="w-4 h-4 text-[#EE712B]" />
            </div>
            <p className="text-2xl font-black text-orange-950">{stats.action_taken}</p>
            <span className="text-[10px] text-orange-800 font-semibold">Institutional action logged</span>
          </div>

          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-xs font-bold uppercase tracking-wider">Overdue SLA</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
            </div>
            <p className="text-2xl font-black text-rose-950">{stats.overdue_escalated}</p>
            <span className="text-[10px] text-rose-700 font-bold">&gt; 2 mins unresponded</span>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-950">{stats.resolved}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">Formally closed cases</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2d7cd] shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Case ID, Student Name, Student ID, or Location..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Pending Review</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Action Taken">Action Taken</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
              >
                <option value="">All Categories</option>
                <option value="Harassment & Bullying">Harassment & Bullying</option>
                <option value="Ragging Incident">Ragging Incident</option>
                <option value="Academic Misconduct">Academic Misconduct</option>
                <option value="Facility Grievance">Facility Grievance</option>
                <option value="Hostel Safety">Hostel Safety</option>
                <option value="Security Violation">Security Violation</option>
              </select>

              <select
                value={selectedDanger}
                onChange={(e) => { setSelectedDanger(e.target.value); setPage(1); }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
              >
                <option value="">All Danger Levels</option>
                <option value="Yes">High Danger / Immediate Threat</option>
                <option value="No">Standard Complaint</option>
              </select>
            </div>
          </form>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-xl border border-[#e2d7cd] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#DC4712]" />
              <h2 className="text-base font-extrabold text-slate-900">Assigned Campus Grievances</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Showing {complaints.length} of {pagination.total} cases
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#EE712B]" />
              <p className="text-xs font-bold">Loading case database records...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <ShieldAlert className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-800">No matching complaint records found.</p>
              <p className="text-xs text-slate-500">Try clearing your search query or status filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-6">Case ID</th>
                    <th className="py-3.5 px-4">Complainant</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Response Timer (SLA)</th>
                    <th className="py-3.5 px-4">Threat Level</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Case ID */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {c.case_id}
                      </td>

                      {/* Student Info */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{c.complainant_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {c.complainant_student_id}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                          {c.category}
                        </span>
                      </td>

                      {/* Live SLA Countdown Timer */}
                      <td className="py-4 px-4">
                        <CountdownTimer 
                          createdAt={c.created_at} 
                          isEscalated={c.is_escalated} 
                          status={c.status}
                          timeoutMinutes={stats.response_timeout_minutes || 2}
                        />
                      </td>

                      {/* Threat Level */}
                      <td className="py-4 px-4">
                        {c.danger_status === 'Yes' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Immediate Threat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            Standard
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(c.status)}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-4 px-4 text-slate-600 text-[11px]">
                        {new Date(c.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/official/complaints/${c.case_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EE712B] hover:bg-[#DC4712] text-white rounded-md text-xs font-bold transition-all shadow-sm hover:shadow"
                        >
                          <span>Review Case</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default OfficialDashboard;
