import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { complaintApi } from '../../services/api';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  FileText,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Building,
  Paperclip,
  Calendar,
  MapPin,
  ArrowRight
} from 'lucide-react';

const TrackCasesPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('caseId') || '';

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedCaseId, setExpandedCaseId] = useState(null);

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await complaintApi.getMyComplaints();
      if (res.success && Array.isArray(res.complaints)) {
        setComplaints(res.complaints);
        // Auto-expand first case or queried case
        if (initialQuery) {
          const matched = res.complaints.find(c => c.case_id.toLowerCase().includes(initialQuery.toLowerCase()));
          if (matched) setExpandedCaseId(matched.case_id);
        } else if (res.complaints.length > 0) {
          setExpandedCaseId(res.complaints[0].case_id);
        }
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('[TrackCasesPage Error]:', err);
      setError(err.message || 'Failed to load case tracking information.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSlaStatus = (createdAt, currentStatus) => {
    if (currentStatus === 'Resolved' || currentStatus === 'Closed') {
      return { status: 'RESOLVED', label: 'Case Resolved within SLA', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }

    const createdTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - createdTime) / (1000 * 60);
    const slaMinutes = 1440; // 24 Hours SLA

    if (elapsedMinutes > slaMinutes || currentStatus === 'Escalated') {
      return {
        status: 'ESCALATED',
        label: '24-Hour SLA Exceeded — Escalated to Admin Oversight',
        color: 'text-rose-900 bg-rose-50 border-rose-200 animate-pulse'
      };
    }

    const remainingHours = Math.max(0, Math.ceil((slaMinutes - elapsedMinutes) / 60));
    return {
      status: 'ACTIVE',
      label: `24-Hour SLA Active (${remainingHours}h remaining for official response)`,
      color: 'text-amber-900 bg-amber-50 border-amber-200'
    };
  };

  const getStepProgress = (status) => {
    switch (status) {
      case 'Submitted': return 1;
      case 'Under Review': return 2;
      case 'Escalated': return 3;
      case 'Resolved': return 4;
      default: return 1;
    }
  };

  const filteredComplaints = complaints.filter((item) => {
    const matchesSearch =
      item.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.incident_location && item.incident_location.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (selectedStatus !== 'ALL') {
      matchesStatus = item.status.toLowerCase() === selectedStatus.toLowerCase();
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu — Real-Time Case SLA Tracking" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Real-Time Case SLA Tracking
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Track live investigation status, 24-hour escalation timers, and official response progress.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-lg shrink-0">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Strict 24-Hour SLA Escalation Policy Active</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#e2d7cd] shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Case ID (e.g. CMP-2026-117135), Category, or Location..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Escalated">Escalated to Admin</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Content Body */}
          {loading ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center text-slate-600">
              <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold">Loading live case tracker records...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center space-y-3 shadow-sm">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                No Trackable Cases Found
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
                {searchQuery ? 'No cases match your search criteria.' : 'You have not submitted any complaints yet.'}
              </p>
              {!searchQuery && (
                <div className="pt-2">
                  <Link
                    to="/student/report"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs shadow-sm"
                  >
                    <span>+ File a New Complaint</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((item) => {
                const sla = calculateSlaStatus(item.created_at, item.status);
                const step = getStepProgress(item.status);
                const isExpanded = expandedCaseId === item.case_id;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#e2d7cd] hover:border-[#EE712B] rounded-2xl shadow-sm transition-all overflow-hidden"
                  >
                    {/* Case Card Header Bar */}
                    <div
                      onClick={() => setExpandedCaseId(isExpanded ? null : item.case_id)}
                      className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#DC4712] font-black text-xs shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-sm font-black text-slate-900">
                              #{item.case_id}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {item.category}
                            </span>
                            {item.danger_status === 'Yes' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                🚨 Immediate Danger Flagged
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Filed: {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {item.incident_location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {item.incident_location}
                              </span>
                            )}
                            {item.evidence_count > 0 && (
                              <span className="flex items-center gap-1 text-blue-700 font-bold">
                                <Paperclip className="w-3.5 h-3.5" />
                                {item.evidence_count} Evidence File(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <span className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${sla.color}`}>
                          {sla.label}
                        </span>

                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Investigation Progress Timeline */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-100 bg-[#FBF7F7]/60 space-y-6">

                        {/* Stepper Header */}
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-4">
                            Investigation Lifecycle Progress
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">

                            {/* Stage 1 */}
                            <div className={`p-3 rounded-xl border transition-all ${
                              step >= 1 ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase">Stage 1</span>
                                <CheckCircle2 className={`w-4 h-4 ${step >= 1 ? 'text-emerald-600' : 'text-slate-300'}`} />
                              </div>
                              <p className="text-xs font-bold">Submitted</p>
                              <span className="text-[10px] opacity-80 block">Logged & Encrypted</span>
                            </div>

                            {/* Stage 2 */}
                            <div className={`p-3 rounded-xl border transition-all ${
                              step >= 2 ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : step === 1 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase">Stage 2</span>
                                <Building className={`w-4 h-4 ${step >= 2 ? 'text-emerald-600' : 'text-slate-300'}`} />
                              </div>
                              <p className="text-xs font-bold">Official Review</p>
                              <span className="text-[10px] opacity-80 block">Assigned to Authority</span>
                            </div>

                            {/* Stage 3 */}
                            <div className={`p-3 rounded-xl border transition-all ${
                              step === 3 && item.status === 'Escalated'
                                ? 'bg-rose-50 border-rose-300 text-rose-950'
                                : step >= 3
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase">Stage 3</span>
                                <AlertTriangle className={`w-4 h-4 ${step === 3 && item.status === 'Escalated' ? 'text-rose-600' : step >= 3 ? 'text-emerald-600' : 'text-slate-300'}`} />
                              </div>
                              <p className="text-xs font-bold">
                                {item.status === 'Escalated' ? 'Admin Escalation' : 'Investigation'}
                              </p>
                              <span className="text-[10px] opacity-80 block">
                                {item.status === 'Escalated' ? 'High Priority Oversight' : 'Evidence Audit'}
                              </span>
                            </div>

                            {/* Stage 4 */}
                            <div className={`p-3 rounded-xl border transition-all ${
                              step >= 4 ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase">Stage 4</span>
                                <ShieldCheck className={`w-4 h-4 ${step >= 4 ? 'text-emerald-600' : 'text-slate-300'}`} />
                              </div>
                              <p className="text-xs font-bold">Final Resolution</p>
                              <span className="text-[10px] opacity-80 block">Action & Case Closure</span>
                            </div>

                          </div>
                        </div>

                        {/* Action Quick Panel */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200/60">

                          {/* Retaliation Alert Option */}
                          <Link
                            to={`/student/retaliation?caseId=${item.case_id}`}
                            className="w-full sm:w-auto px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4 text-rose-700" />
                            <span>Facing Retaliation for this Case? Report Urgently</span>
                          </Link>

                          {/* View Full Case File */}
                          <Link
                            to={`/student/complaints/${item.case_id}`}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>View Full Case & Evidence File</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default TrackCasesPage;
