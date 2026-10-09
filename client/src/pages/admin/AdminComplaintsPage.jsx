import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  Loader2, 
  AlertTriangle, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { adminApi } from '../../services/api';

const CATEGORY_OPTIONS = [
  'Harassment',
  'Ragging',
  'Assault',
  'Sexual Misconduct',
  'Threat / Intimidation',
  'Cyber Harassment',
  'Discrimination',
  'Bullying',
  'Academic Misconduct',
  'Infrastructure / Safety Issue',
  'Theft',
  'Accident / Injury',
  'Other'
];

const STATUS_OPTIONS = [
  'Submitted',
  'Under Review',
  'Action Taken',
  'Escalated',
  'Resolved',
  'Closed'
];

const AdminComplaintsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [dangerStatus, setDangerStatus] = useState(searchParams.get('danger_status') || '');
  const [hasEvidence, setHasEvidence] = useState(searchParams.get('has_evidence') || '');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  // Sync state from URL query params
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
    setStatus(searchParams.get('status') || '');
    setDangerStatus(searchParams.get('danger_status') || '');
    setHasEvidence(searchParams.get('has_evidence') || '');
    setPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = {
        search,
        category,
        status,
        danger_status: dangerStatus,
        has_evidence: hasEvidence,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 10
      };

      const res = await adminApi.getComplaints(queryParams);
      if (res.success) {
        setComplaints(res.complaints || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      console.error('[AdminComplaintsPage fetch error]:', err);
      setError(err.message || 'Failed to load complaints directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [search, category, status, dangerStatus, hasEvidence, sortBy, sortOrder, page]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setSearch('');
    setCategory('');
    setStatus('');
    setDangerStatus('');
    setHasEvidence('');
    setPage(1);
  };

  const getStatusBadge = (s) => {
    switch (s) {
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

  return (
    <div className="space-y-6">
      
      {/* Title Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Complaints Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Searchable, filterable, and paginated complaint cases backed by MySQL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaints}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-[#e2d7cd] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#e2d7cd] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Case ID, Student Name, Location..."
              value={search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg focus:outline-none focus:border-[#EE712B] w-full font-medium"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg focus:outline-none focus:border-[#EE712B] w-full font-semibold text-slate-800"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg focus:outline-none focus:border-[#EE712B] w-full font-semibold text-slate-800"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Danger & Evidence Filters */}
          <div className="flex gap-2">
            <select
              value={dangerStatus}
              onChange={(e) => handleFilterChange('danger_status', e.target.value)}
              className="px-2.5 py-2 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg focus:outline-none focus:border-[#EE712B] w-1/2 font-semibold text-slate-800"
            >
              <option value="">Danger: All</option>
              <option value="Yes">Danger: YES</option>
              <option value="No">Danger: NO</option>
            </select>

            <button
              onClick={handleClearFilters}
              className="w-1/2 px-2.5 py-2 bg-[#F1E9E3] hover:bg-[#e6d8cb] text-slate-700 font-bold text-xs rounded-lg border border-[#e2d7cd] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(search || category || status || dangerStatus || hasEvidence) && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-500 text-[11px] uppercase">Active Filters:</span>
            {search && <span className="bg-orange-100 text-[#DC4712] px-2 py-0.5 rounded font-bold border border-orange-200">Search: "{search}"</span>}
            {category && <span className="bg-orange-100 text-[#DC4712] px-2 py-0.5 rounded font-bold border border-orange-200">Cat: {category}</span>}
            {status && <span className="bg-orange-100 text-[#DC4712] px-2 py-0.5 rounded font-bold border border-orange-200">Status: {status}</span>}
            {dangerStatus && <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold border border-rose-200">Danger: {dangerStatus}</span>}
          </div>
        )}
      </div>

      {/* Main Complaints Table */}
      <div className="bg-white border border-[#e2d7cd] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto" />
            <p className="text-xs text-slate-600 font-bold">Querying MySQL complaints database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 bg-rose-50 space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-800">No Complaints Found</h3>
            <p className="text-xs text-slate-500">No records matched your search or filter parameters.</p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-[#EE712B] text-white font-bold text-xs rounded-lg hover:bg-[#DC4712] transition-colors"
            >
              Clear Search Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1E9E3] text-slate-800 font-extrabold border-b border-[#e2d7cd] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Case ID</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Complainant (Admin View)</th>
                  <th className="p-3.5">Incident Date</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Evidence</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2d7cd] bg-white font-medium text-slate-700">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-orange-50/40 transition-colors">
                    
                    {/* Case ID */}
                    <td className="p-3.5 font-mono font-extrabold text-slate-900">
                      <Link to={`/admin/complaints/${c.case_id}`} className="hover:text-[#DC4712]">
                        {c.case_id}
                      </Link>
                      {c.danger_status === 'Yes' && (
                        <span className="block mt-1 text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 w-fit">
                          DANGER
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-3.5 font-bold text-slate-800">
                      {c.category}
                    </td>

                    {/* Complainant Identity */}
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{c.complainant_name}</span>
                      <span className="text-[10px] font-mono text-slate-500 block">{c.complainant_student_id || c.complainant_email}</span>
                    </td>

                    {/* Incident Date */}
                    <td className="p-3.5 font-mono text-slate-700">
                      {new Date(c.incident_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Location */}
                    <td className="p-3.5 text-slate-800 max-w-[150px] truncate" title={c.incident_location}>
                      {c.incident_location}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Evidence Count */}
                    <td className="p-3.5 font-mono text-slate-600 font-bold">
                      {c.evidence_count > 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {c.evidence_count} file(s)
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    {/* Submission Date */}
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(c.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </td>

                    {/* Action Button */}
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/admin/complaints/${c.case_id}`}
                        className="px-3 py-1.5 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded transition-colors shadow-sm inline-block"
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

        {/* Server-side Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#F1E9E3] border-t border-[#e2d7cd] flex items-center justify-between text-xs font-bold text-slate-700">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total cases)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => handleFilterChange('page', String(pagination.page - 1))}
                className="px-3 py-1.5 bg-white border border-[#e2d7cd] rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handleFilterChange('page', String(pagination.page + 1))}
                className="px-3 py-1.5 bg-white border border-[#e2d7cd] rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminComplaintsPage;
