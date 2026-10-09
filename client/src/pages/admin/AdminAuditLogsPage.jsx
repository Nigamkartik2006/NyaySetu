import React, { useEffect, useState } from 'react';
import { History, Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../services/api';

const AdminAuditLogsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getAuditLogs({ search, page, limit: 20 });
      if (res.success) {
        setLogs(res.audit_logs || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (err) {
      console.error('[AdminAuditLogsPage error]:', err);
      setError(err.message || 'Failed to retrieve system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" />
            <span>System Audit Logs & Security Trail</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Append-only security audit trail recording all administrative case reviews, status modifications, and file access
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search action or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-xs bg-white border border-[#e2d7cd] rounded-lg focus:outline-none focus:border-[#EE712B] w-full font-medium"
          />
        </form>
      </div>

      <div className="bg-white border border-[#e2d7cd] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto" />
            <p className="text-xs text-slate-600 font-bold">Retrieving audit logs from MySQL...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 bg-rose-50 space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-xs font-bold">No audit log records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1E9E3] text-slate-800 font-extrabold border-b border-[#e2d7cd] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Event Action</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Target</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2d7cd] bg-white font-medium text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">#{log.id}</td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-900 bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200 inline-block">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 block">{log.actor_email || 'System'}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">{log.actor_role}</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {log.target_type}: {log.target_id || 'N/A'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="p-3.5">
                      <pre className="text-[10px] font-mono text-slate-600 max-w-xs truncate bg-slate-50 p-1 rounded border border-slate-200">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#F1E9E3] border-t border-[#e2d7cd] flex items-center justify-between text-xs font-bold text-slate-700">
            <div>Page {pagination.page} of {pagination.totalPages} ({pagination.total} logs)</div>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-[#e2d7cd] rounded disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-[#e2d7cd] rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAuditLogsPage;
