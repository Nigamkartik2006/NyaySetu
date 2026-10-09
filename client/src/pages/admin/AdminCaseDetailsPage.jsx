import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  ShieldAlert, 
  User, 
  Mail, 
  IdCard, 
  Calendar, 
  MapPin, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Send, 
  History,
  Lock,
  Building2,
  FileCheck,
  CheckSquare
} from 'lucide-react';
import { adminApi } from '../../services/api';
import EvidenceViewerModal from '../../components/admin/EvidenceViewerModal';

const STATUS_OPTIONS = [
  { value: 'Submitted', label: 'Submitted (Initial state)' },
  { value: 'Under Review', label: 'Under Review (Substantive examination started)' },
  { value: 'Action Taken', label: 'Action Taken (Documented institutional action executed)' },
  { value: 'Escalated', label: 'Escalated (Referred to higher authority)' },
  { value: 'Resolved', label: 'Resolved (Outcome recorded and finalized)' },
  { value: 'Closed', label: 'Closed (Case formally closed with documented reason)' }
];

const AdminCaseDetailsPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    complaint: null,
    complainant: null,
    evidence: [],
    status_history: [],
    institutional_actions: [],
    audit_timeline: []
  });

  // Modal State for Evidence Viewer
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState(false);

  // Form State for Status Update
  const [newStatus, setNewStatus] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState('');
  const [statusErrorMsg, setStatusErrorMsg] = useState('');

  // Form State for Institutional Action Note
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('Official Hearing Scheduled');
  const [actionDesc, setActionDesc] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Confirmation Dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getComplaintDetails(caseId);
      if (res.success) {
        setData(res);
        setNewStatus(res.complaint.status);
      }
    } catch (err) {
      console.error('[AdminCaseDetailsPage fetch error]:', err);
      setError(err.message || 'Failed to retrieve complaint case details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  // Execute Status Update inside transaction
  const handleConfirmStatusUpdate = async () => {
    if (!actionNote || actionNote.trim().length === 0) {
      setStatusErrorMsg('Action note or review justification is required.');
      return;
    }

    if (newStatus === 'Closed' && (!closureReason || closureReason.trim().length === 0)) {
      setStatusErrorMsg('Closure reason is mandatory when closing a complaint.');
      return;
    }

    try {
      setSubmittingStatus(true);
      setStatusErrorMsg('');
      setStatusSuccessMsg('');

      const res = await adminApi.updateStatus(caseId, {
        status: newStatus,
        action_note: actionNote.trim(),
        closure_reason: newStatus === 'Closed' ? closureReason.trim() : null
      });

      if (res.success) {
        setStatusSuccessMsg(res.message || 'Case status updated successfully.');
        setActionNote('');
        setClosureReason('');
        setShowConfirmDialog(false);
        fetchCaseDetails(); // Refresh details
      }
    } catch (err) {
      console.error('[Update Status Error]:', err);
      setStatusErrorMsg(err.message || 'Failed to update case status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Record Institutional Action Note
  const handleAddAction = async (e) => {
    e.preventDefault();
    if (!actionDesc || actionDesc.trim().length === 0) return;

    try {
      setSubmittingAction(true);
      const res = await adminApi.addAction(caseId, {
        action_type: actionType,
        action_description: actionDesc.trim()
      });

      if (res.success) {
        setActionDesc('');
        setShowActionModal(false);
        fetchCaseDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to record institutional action.');
    } finally {
      setSubmittingAction(false);
    }
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin" />
        <p className="text-xs text-slate-600 font-bold">Loading full case record & evidence vault from MySQL...</p>
      </div>
    );
  }

  if (error || !data.complaint) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-rose-900 space-y-4 max-w-lg mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-extrabold">Error Loading Complaint Record</h3>
        <p className="text-xs font-medium text-rose-700">{error || 'Case not found.'}</p>
        <Link
          to="/admin/complaints"
          className="inline-block px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-colors"
        >
          ← Back to Complaints Directory
        </Link>
      </div>
    );
  }

  const { complaint, complainant, evidence, status_history, institutional_actions, audit_timeline } = data;

  return (
    <div className="space-y-8">
      
      {/* Back Link & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2d7cd] pb-4">
        <div>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#DC4712] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Complaints Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              Case #{complaint.case_id}
            </h1>
            <span className={`px-3 py-1 text-xs font-extrabold rounded-full border ${getStatusBadge(complaint.status)}`}>
              {complaint.status}
            </span>
            {complaint.danger_status === 'Yes' && (
              <span className="px-2.5 py-1 text-xs font-extrabold text-rose-700 bg-rose-100 border border-rose-300 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>ACTIVE DANGER</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-right text-xs text-slate-500 font-medium">
          <p>Submitted: <span className="font-mono text-slate-800 font-bold">{new Date(complaint.created_at).toLocaleString('en-IN')}</span></p>
          <p>Last Updated: <span className="font-mono text-slate-800 font-bold">{new Date(complaint.updated_at).toLocaleString('en-IN')}</span></p>
        </div>
      </div>

      {/* Grid Layout: Left Column (Case Details & Evidence) | Right Column (Complainant Profile & Status Management) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column — 2 Cols Wide */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Complaint Overview & Details */}
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#EE712B]" />
              <span>Incident Overview & Details</span>
            </h2>

            {/* Key Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F1E9E3] border border-[#e2d7cd] p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block font-bold text-[10px] uppercase">Incident Category</span>
                <span className="text-slate-900 font-extrabold text-sm block mt-0.5">{complaint.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold text-[10px] uppercase">Incident Date</span>
                <span className="text-slate-900 font-bold block mt-0.5 font-mono">
                  {new Date(complaint.incident_date).toLocaleDateString('en-IN', {
                    dateStyle: 'medium'
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold text-[10px] uppercase">General Location</span>
                <span className="text-slate-900 font-bold block mt-0.5">{complaint.incident_location}</span>
              </div>
            </div>

            {/* Full Original Description */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Full Complaint Description (Original Record)
              </h3>
              <div className="bg-[#FBF7F7] border border-[#e2d7cd] p-4 rounded-xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                {complaint.description}
              </div>
            </div>

            {/* People Involved & Witnesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[11px] font-extrabold text-slate-700 uppercase block mb-1">People Involved</span>
                <p className="text-xs bg-white border border-[#e2d7cd] p-3 rounded-lg text-slate-800 font-medium">
                  {complaint.people_involved || 'None specified'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-extrabold text-slate-700 uppercase block mb-1">Witness Information</span>
                <p className="text-xs bg-white border border-[#e2d7cd] p-3 rounded-lg text-slate-800 font-medium">
                  {complaint.witness_information || 'None specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Authentic Evidence Vault Viewer (CRITICAL FEATURE) */}
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Student Evidence Vault ({evidence.length} files)</span>
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Exact original student upload records retrieved directly from server storage
                </p>
              </div>

              {evidence.length > 0 && (
                <button
                  onClick={() => setSelectedEvidenceModal(true)}
                  className="px-3.5 py-1.5 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>Open Interactive Lightbox</span>
                </button>
              )}
            </div>

            {evidence.length === 0 ? (
              <div className="p-8 text-center bg-[#FBF7F7] border border-[#e2d7cd] rounded-xl text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold">No evidence files were attached to this complaint submission.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {evidence.map((item) => {
                  const streamUrl = adminApi.getEvidenceStreamUrl(caseId, item.id);
                  const isImage = item.mime_type?.startsWith('image/');

                  return (
                    <div
                      key={item.id}
                      className="bg-[#FBF7F7] border border-[#e2d7cd] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-[#EE712B] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {isImage ? (
                          <img
                            src={streamUrl}
                            alt={item.original_filename}
                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-orange-100 text-[#DC4712] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200">
                            {item.mime_type?.includes('pdf') ? 'PDF' : 'FILE'}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate" title={item.original_filename}>
                            {item.original_filename}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                            {(item.file_size / (1024 * 1024)).toFixed(2)} MB • {item.mime_type}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-700 block mt-0.5 font-bold truncate">
                            HASH: {item.file_hash?.substring(0, 16)}...
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#e2d7cd]">
                        <button
                          onClick={() => setSelectedEvidenceModal(true)}
                          className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded border border-[#e2d7cd] transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#EE712B]" />
                          <span>Preview File</span>
                        </button>
                        <a
                          href={streamUrl}
                          download={item.original_filename}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded transition-colors"
                          title="Download Original File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Audit Timeline */}
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <span>Case Audit Timeline & Event Logs</span>
            </h2>

            {audit_timeline.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No events recorded in audit trail yet.</p>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {audit_timeline.map((log) => (
                  <div key={log.id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-[#EE712B] border-2 border-white shadow-sm" />
                    <div className="bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg p-3 text-xs flex-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{log.action}</span>
                        <span className="text-[10px] font-mono text-slate-500 font-medium">
                          {new Date(log.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Actor: <span className="font-semibold text-slate-800">{log.actor_email}</span> ({log.actor_role})
                      </p>
                      {log.details && (
                        <pre className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 mt-2 overflow-x-auto">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column — 1 Col Wide */}
        <div className="space-y-8">
          
          {/* Complainant Identity Card (Restricted Authorized Admin View) */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Complainant Identity</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                Admin Authorized Only
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <User className="w-4 h-4 text-[#EE712B] shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Student Full Name</span>
                  <span className="text-white font-extrabold text-sm block">{complainant?.full_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <IdCard className="w-4 h-4 text-[#EE712B] shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Institutional Student ID</span>
                  <span className="text-amber-300 font-mono font-bold block">{complainant?.student_id || 'Not Supplied'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <Mail className="w-4 h-4 text-[#EE712B] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Registered Email</span>
                  <span className="text-slate-200 font-mono block truncate">{complainant?.email}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800">
              🔒 Privacy Protocol: Complainant details are restricted to authorized administrators and never served to public APIs.
            </p>
          </div>

          {/* Case Status & Institutional Action Form */}
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#EE712B]" />
              <span>Case Status & Action Management</span>
            </h3>

            {statusSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusSuccessMsg}</span>
              </div>
            )}

            {statusErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{statusErrorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Select Handling Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg font-bold text-slate-900 focus:outline-none focus:border-[#EE712B]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Action Note / Review Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows="3"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Record formal administrative review details, decision notes, or actions taken..."
                  className="w-full p-3 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg focus:outline-none focus:border-[#EE712B] font-medium"
                />
              </div>

              {newStatus === 'Closed' && (
                <div>
                  <label className="block text-xs font-extrabold text-rose-800 uppercase tracking-wider mb-1.5">
                    Formal Case Closure Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows="2"
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    placeholder="Provide mandatory legal/institutional reason for closing case..."
                    className="w-full p-3 text-xs bg-rose-50 border border-rose-300 rounded-lg focus:outline-none focus:border-rose-600 font-medium text-rose-950"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowConfirmDialog(true)}
                disabled={submittingStatus}
                className="w-full py-2.5 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {submittingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Save & Commit Status Update</span>
              </button>
            </div>
          </div>

          {/* College Response Tracking Section */}
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>College Response Tracking</span>
              </h3>
              <button
                onClick={() => setShowActionModal(true)}
                className="px-2.5 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold border border-indigo-200 rounded transition-colors"
              >
                + Record Action
              </button>
            </div>

            {institutional_actions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg">
                No formal institutional responses recorded yet. Click "+ Record Action" to log hearings or disciplinary steps.
              </p>
            ) : (
              <div className="space-y-2.5">
                {institutional_actions.map((act) => (
                  <div key={act.id} className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span>{act.action_type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(act.performed_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{act.action_description}</p>
                    <span className="text-[10px] text-slate-500 block italic">Logged by: {act.actor_name} ({act.actor_role})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Confirmation Modal for Status Change */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2d7cd] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#EE712B]" />
              <span>Confirm Status Change</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to update case <strong>#{caseId}</strong> status from <strong>"{complaint.status}"</strong> to <strong>"{newStatus}"</strong>?
              This operation will be logged permanently in the system audit trail.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusUpdate}
                disabled={submittingStatus}
                className="px-4 py-2 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                {submittingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Status Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Recording Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddAction} className="bg-white border border-[#e2d7cd] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Record Institutional Action</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg font-bold text-slate-800"
              >
                <option value="Official Hearing Scheduled">Official Hearing Scheduled</option>
                <option value="Committee Review Initiated">Committee Review Initiated</option>
                <option value="Warning Letter Issued">Warning Letter Issued</option>
                <option value="Escalated to Disciplinary Board">Escalated to Disciplinary Board</option>
                <option value="Interim Protection Granted">Interim Protection Granted</option>
                <option value="Sanctions Imposed">Sanctions Imposed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Action Description</label>
              <textarea
                rows="3"
                required
                value={actionDesc}
                onChange={(e) => setActionDesc(e.target.value)}
                placeholder="Describe official action details, attendees, or findings..."
                className="w-full p-3 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                {submittingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Action'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lightbox Evidence Modal */}
      {selectedEvidenceModal && (
        <EvidenceViewerModal
          caseId={caseId}
          evidence={evidence}
          onClose={() => setSelectedEvidenceModal(false)}
        />
      )}

    </div>
  );
};

export default AdminCaseDetailsPage;
