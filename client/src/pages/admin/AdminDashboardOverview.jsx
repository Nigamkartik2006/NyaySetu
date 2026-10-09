import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  Eye, 
  CheckSquare, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { adminApi } from '../../services/api';

const AdminDashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    stats: {
      total_cases: 0,
      pending_review: 0,
      under_review: 0,
      action_taken: 0,
      escalated: 0,
      resolved: 0,
      closed: 0,
      high_danger: 0
    },
    categories: [],
    recent_complaints: []
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getDashboardStats();
      if (res.success) {
        setData({
          stats: res.stats,
          categories: res.categories || [],
          recent_complaints: res.recent_complaints || []
        });
      }
    } catch (err) {
      console.error('[AdminDashboardOverview fetch error]:', err);
      setError(err.message || 'Failed to fetch dashboard metrics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statsCards = [
    {
      title: 'Total Cases',
      count: data.stats.total_cases,
      icon: FileText,
      color: 'border-l-blue-600 text-blue-600 bg-blue-50',
      statusFilter: ''
    },
    {
      title: 'Pending Review',
      count: data.stats.pending_review,
      icon: Clock,
      color: 'border-l-amber-500 text-amber-600 bg-amber-50',
      statusFilter: 'Submitted'
    },
    {
      title: 'Under Review',
      count: data.stats.under_review,
      icon: Eye,
      color: 'border-l-purple-600 text-purple-600 bg-purple-50',
      statusFilter: 'Under Review'
    },
    {
      title: 'Action Taken',
      count: data.stats.action_taken,
      icon: CheckSquare,
      color: 'border-l-[#EE712B] text-[#DC4712] bg-orange-50',
      statusFilter: 'Action Taken'
    },
    {
      title: 'Escalated',
      count: data.stats.escalated,
      icon: AlertTriangle,
      color: 'border-l-rose-600 text-rose-600 bg-rose-50',
      statusFilter: 'Escalated'
    },
    {
      title: 'Resolved',
      count: data.stats.resolved,
      icon: CheckCircle2,
      color: 'border-l-emerald-600 text-emerald-600 bg-emerald-50',
      statusFilter: 'Resolved'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Under Review':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Action Taken':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Escalated':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Closed':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin" />
        <p className="text-xs text-slate-600 font-bold">Loading live database metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-900 space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-extrabold">Failed to Load Dashboard Metrics</h3>
        <p className="text-xs font-medium text-rose-700">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* High Danger Emergency Banner (if any cases have danger_status = 'Yes') */}
      {data.stats.high_danger > 0 && (
        <div className="bg-rose-900 text-white border border-rose-800 rounded-xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-300 shrink-0" />
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight uppercase">
                High Danger Alert — Immediate Attention Required
              </h3>
              <p className="text-xs text-rose-200 font-medium mt-0.5">
                There are currently {data.stats.high_danger} complaint(s) marked with active danger status.
              </p>
            </div>
          </div>
          <Link
            to="/admin/complaints?danger_status=Yes"
            className="px-4 py-2 bg-white text-rose-950 hover:bg-rose-100 font-extrabold text-xs rounded-lg transition-colors shrink-0 shadow-sm"
          >
            Review High Danger Cases →
          </Link>
        </div>
      )}

      {/* Top Live Statistics Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#EE712B]" />
            <span>Real-time Case Metrics</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded border border-[#e2d7cd]">
            Database Mode: Live MySQL
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => navigate(`/admin/complaints${card.statusFilter ? `?status=${encodeURIComponent(card.statusFilter)}` : ''}`)}
                className={`
                  bg-white border border-[#e2d7cd] rounded-xl p-4 border-l-4 ${card.color}
                  hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between
                `}
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      {card.title}
                    </span>
                    <Icon className="w-4 h-4 opacity-75 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {card.count}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 group-hover:text-[#DC4712]">
                  <span>Filter Cases</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complaints by Category Overview */}
      <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Complaints by Category
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Distribution of incidents calculated directly from MySQL records
            </p>
          </div>
          <Link
            to="/admin/analytics"
            className="text-xs font-bold text-[#DC4712] hover:underline flex items-center gap-1"
          >
            <span>View Full Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.categories.length === 0 ? (
          <div className="p-8 text-center bg-[#FBF7F7] rounded-lg border border-[#e2d7cd] text-slate-500 space-y-2">
            <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold">No complaint category data recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {data.categories.map((cat) => {
              const percentage = Math.round((cat.count / (data.stats.total_cases || 1)) * 100);
              return (
                <div
                  key={cat.category}
                  onClick={() => navigate(`/admin/complaints?category=${encodeURIComponent(cat.category)}`)}
                  className="bg-[#F1E9E3] border border-[#e2d7cd] hover:border-[#EE712B] p-3.5 rounded-xl cursor-pointer group transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {cat.category}
                    </span>
                    <span className="text-xs font-extrabold font-mono text-[#DC4712] bg-white px-2 py-0.5 rounded border border-[#e2d7cd]">
                      {cat.count}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#EE712B] h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-600 font-semibold">
                    <span>{percentage}% of total</span>
                    <span className="group-hover:text-[#DC4712] font-bold">View List →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Complaints Table */}
      <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Recently Submitted Complaints
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Latest grievance submissions awaiting administrative oversight
            </p>
          </div>
          <Link
            to="/admin/complaints"
            className="px-3 py-1.5 bg-[#F1E9E3] hover:bg-[#e6d8cb] text-slate-800 text-xs font-bold rounded-lg border border-[#e2d7cd] transition-colors flex items-center gap-1.5"
          >
            <span>View All Complaints</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.recent_complaints.length === 0 ? (
          <div className="p-8 text-center bg-[#FBF7F7] rounded-lg border border-[#e2d7cd] text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold">No complaints currently stored in MySQL database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#e2d7cd] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1E9E3] text-slate-800 font-extrabold border-b border-[#e2d7cd] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Complainant</th>
                  <th className="p-3">Incident Date</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Evidence</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2d7cd] bg-white font-medium text-slate-700">
                {data.recent_complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="p-3 font-mono font-extrabold text-slate-900">
                      {c.case_id}
                      {c.danger_status === 'Yes' && (
                        <span className="ml-2 text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                          DANGER
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{c.category}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{c.complainant_name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{c.complainant_student_id || 'ID N/A'}</span>
                    </td>
                    <td className="p-3 font-mono">
                      {new Date(c.incident_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3 text-slate-800">{c.incident_location}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 font-bold">
                      {c.evidence_count} file(s)
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/admin/complaints/${c.case_id}`}
                        className="px-3 py-1 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded transition-colors"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboardOverview;
