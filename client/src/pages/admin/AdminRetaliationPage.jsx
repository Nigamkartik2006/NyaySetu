import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Lock, 
  AlertTriangle, 
  Clock, 
  User, 
  FileText, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  Shield, 
  Mail, 
  CheckCircle2, 
  Building2,
  Calendar
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { retaliationApi, adminApi } from '../../services/api';

const AdminRetaliationPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await retaliationApi.getAllOversightReports();
      if (res.success) {
        setReports(res.reports || res.retaliation_reports || []);
      }
    } catch (err) {
      console.error('[AdminRetaliationPage fetch error]:', err);
      setError(err.message || 'Failed to retrieve confidential retaliation reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <AdminLayout title="Confidential Retaliation Reports Oversight">
      <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">

        {/* Security & Oversight Banner */}
        <div className="bg-[#0f172a] text-white p-6 rounded-xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> High-Priority Oversight
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> End-to-End Encryption & Discretion
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white pt-1">
              Confidential Student Retaliation Reports
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-3xl">
              Reports submitted by students facing intimidation, academic punishment, or personal threats after filing complaints. Automatically copied to Independent Oversight Officer (<span className="text-amber-300 font-mono">asayusingh243@gmail.com</span>).
            </p>
          </div>

          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors shadow-sm disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Reports</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#e2d7cd] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{reports.length}</p>
            <span className="text-[10px] text-slate-500 font-semibold">Retaliation cases filed</span>
          </div>

          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-xs font-bold uppercase tracking-wider">Academic Threats</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-950">
              {reports.filter(r => r.retaliation_type === 'Academic Retaliation' || r.retaliation_type === 'Grade Tampering').length}
            </p>
            <span className="text-[10px] text-rose-700 font-semibold">Grade tampering or exam bias</span>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-amber-900">
              <span className="text-xs font-bold uppercase tracking-wider">Oversight Recipient</span>
              <Mail className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs font-extrabold font-mono text-amber-950 truncate pt-1">
              asayusingh243@gmail.com
            </p>
            <span className="text-[10px] text-amber-700 font-semibold">Direct email escalation enabled</span>
          </div>
        </div>

        {/* Reports Directory */}
        <div className="bg-white rounded-xl border border-[#e2d7cd] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#DC4712]" />
              <h2 className="text-base font-extrabold text-slate-900">Confidential Retaliation Docket</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {reports.length} Reports Registered
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#EE712B]" />
              <p className="text-xs font-bold">Loading retaliation reports database...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-800">No retaliation reports submitted yet.</p>
              <p className="text-xs text-slate-500">Students have not filed any post-complaint retaliation grievances.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {reports.map((r) => (
                <div key={r.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-black text-rose-900 bg-rose-100 px-2.5 py-1 rounded border border-rose-300">
                        {r.retaliation_id || r.report_code || `RET-${r.id}`}
                      </span>
                      <Link
                        to={`/admin/complaints/${r.case_id || r.original_case_id}`}
                        className="text-xs font-bold text-[#EE712B] hover:underline flex items-center gap-1"
                      >
                        Original Case: {r.case_id || r.original_case_id} <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Filed: {new Date(r.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Student Complainant */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Complainant Student</span>
                      <p className="font-extrabold text-slate-900">{r.complainant_name || r.student_name || 'Protected Identity'}</p>
                      <p className="text-slate-600 font-mono text-[11px]">ID: {r.complainant_student_id || r.student_id_number || 'N/A'}</p>
                      <p className="text-slate-600">{r.complainant_email || r.student_email}</p>
                    </div>

                    {/* Retaliation Nature */}
                    <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-rose-600 block">Retaliation Nature</span>
                      <p className="font-extrabold text-rose-950">{r.retaliation_type}</p>
                      <p className="text-rose-900 font-bold text-[11px]">
                        Incident Date: {r.incident_date ? new Date(r.incident_date).toLocaleDateString('en-IN') : 'Recent'}
                      </p>
                      <p className="text-rose-800 text-[10px]">Status: {r.status}</p>
                    </div>

                    {/* Retaliation Type */}
                    <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-amber-700 block">Retaliation Nature</span>
                      <p className="font-extrabold text-amber-950">{r.retaliation_type}</p>
                      <p className="text-amber-900 font-semibold text-[11px]">
                        Incident Date: {r.incident_date ? new Date(r.incident_date).toLocaleDateString('en-IN') : 'Recent'}
                      </p>
                    </div>
                  </div>

                  {/* Narrative Description */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Detailed Retaliation Narrative</span>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-medium leading-relaxed whitespace-pre-line">
                      {r.description}
                    </div>
                  </div>

                  {/* Attached Evidence */}
                  {r.evidence_files && (
                    <div className="pt-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Attached Evidence Files</span>
                      <div className="p-3 bg-slate-100 rounded border border-slate-200 text-xs font-mono text-slate-700">
                        {r.evidence_files}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminRetaliationPage;
