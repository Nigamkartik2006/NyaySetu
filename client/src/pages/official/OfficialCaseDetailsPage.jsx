import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  Users, 
  Eye, 
  ShieldCheck, 
  Upload, 
  Send, 
  FileCheck, 
  History, 
  Loader2, 
  Lock,
  Download,
  Shield,
  MessageSquare
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import CountdownTimer from '../../components/CountdownTimer';
import { officialApi } from '../../services/api';

const OfficialCaseDetailsPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [complaint, setComplaint] = useState(null);
  const [complainant, setComplainant] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [actions, setActions] = useState([]);
  const [timeoutMinutes, setTimeoutMinutes] = useState(2);

  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Action form states
  const [actionType, setActionType] = useState('Inquiry Initiated');
  const [actionDescription, setActionDescription] = useState('');
  const [actionFiles, setActionFiles] = useState([]);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await officialApi.getComplaintDetails(caseId);
      if (res.success) {
        setComplaint(res.complaint);
        setComplainant(res.complainant);
        setEvidence(res.evidence || []);
        setStatusHistory(res.status_history || []);
        setActions(res.institutional_actions || []);
        setTimeoutMinutes(res.response_timeout_minutes || 2);
        setNewStatus(res.complaint.status);
      }
    } catch (err) {
      console.error('[OfficialCaseDetailsPage fetch error]:', err);
      setError(err.message || 'Failed to retrieve complaint case details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusNote.trim()) {
      setError('An investigation action note is mandatory when updating complaint status.');
      return;
    }
    if (newStatus === 'Closed' && !closureReason.trim()) {
      setError('A formal closure reason is required when closing a case.');
      return;
    }

    try {
      setUpdatingStatus(true);
      setError('');
      setSuccessMsg('');

      const res = await officialApi.updateStatus(caseId, {
        status: newStatus,
        action_note: statusNote,
        closure_reason: newStatus === 'Closed' ? closureReason : null
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Case status updated successfully.');
        setStatusNote('');
        setClosureReason('');
        await fetchDetails();
      }
    } catch (err) {
      console.error('[handleStatusSubmit error]:', err);
      setError(err.message || 'Failed to update complaint status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionDescription.trim()) {
      setError('Please provide a detailed description of the institutional action taken.');
      return;
    }

    try {
      setSubmittingAction(true);
      setError('');
      setSuccessMsg('');

      const formData = new FormData();
      formData.append('action_type', actionType);
      formData.append('action_description', actionDescription);

      if (actionFiles && actionFiles.length > 0) {
        for (let i = 0; i < actionFiles.length; i++) {
          formData.append('actionFiles', actionFiles[i]);
        }
      }

      const res = await officialApi.addAction(caseId, formData);
      if (res.success) {
        setSuccessMsg(res.message || 'Institutional action recorded successfully.');
        setActionDescription('');
        setActionFiles([]);
        await fetchDetails();
      }
    } catch (err) {
      console.error('[handleActionSubmit error]:', err);
      setError(err.message || 'Failed to record institutional action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <Navbar title="Institutional Case Review" />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#EE712B]" />
            <p className="text-sm font-bold text-slate-700">Loading case details & evidence vault...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <Navbar title="Institutional Case Review" />
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full flex items-center justify-center">
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-8 text-center space-y-4 max-w-md w-full shadow-sm">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="text-xl font-extrabold text-slate-900">Case Access Error</h2>
            <p className="text-xs text-slate-600 font-semibold">{error}</p>
            <Link
              to="/official/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EE712B] text-white rounded-lg text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Official Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title={`Case Review: ${complaint.case_id}`} />

      {/* Header Banner */}
      <div className="bg-[#0f172a] text-white border-b border-slate-800 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/official/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Official Dashboard
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-black text-white">
                {complaint.case_id}
              </span>
              <span className="bg-[#EE712B]/20 text-[#EE712B] border border-[#EE712B]/40 px-3 py-1 rounded-full text-xs font-extrabold">
                {complaint.category}
              </span>
              {complaint.danger_status === 'Yes' && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Immediate Threat
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Submitted on {new Date(complaint.created_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shrink-0 shadow-inner">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                SLA Response Status
              </span>
              <CountdownTimer
                createdAt={complaint.created_at}
                isEscalated={complaint.is_escalated}
                status={complaint.status}
                timeoutMinutes={timeoutMinutes}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6">

        {/* Global Notifications */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Complaint Details & Evidence (2 Columns wide) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Complaint Overview Card */}
            <div className="bg-white p-6 rounded-xl border border-[#e2d7cd] shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#DC4712]" />
                  <h2 className="text-base font-extrabold text-slate-900">Official Case Overview</h2>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-800 rounded-full border border-slate-200">
                  Current Status: {complaint.status}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Incident Description</h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm font-medium leading-relaxed whitespace-pre-line">
                  {complaint.description}
                </div>
              </div>

              {complaint.public_summary && (
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Public Summary</h3>
                  <p className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded border border-amber-200 font-medium">
                    {complaint.public_summary}
                  </p>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#EE712B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-slate-500 block text-[10px] uppercase">Incident Date</span>
                    <span className="font-bold text-slate-900">
                      {complaint.incident_date ? new Date(complaint.incident_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#EE712B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-slate-500 block text-[10px] uppercase">Incident Location</span>
                    <span className="font-bold text-slate-900">{complaint.incident_location || 'Campus Premises'}</span>
                  </div>
                </div>

                {complaint.people_involved && (
                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <Users className="w-4 h-4 text-[#EE712B] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-500 block text-[10px] uppercase">Persons Involved / Accused</span>
                      <span className="font-bold text-slate-900">{complaint.people_involved}</span>
                    </div>
                  </div>
                )}

                {complaint.witness_information && (
                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <Eye className="w-4 h-4 text-[#EE712B] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-500 block text-[10px] uppercase">Witness Information</span>
                      <span className="font-bold text-slate-900">{complaint.witness_information}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Vault Card */}
            <div className="bg-white p-6 rounded-xl border border-[#e2d7cd] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#DC4712]" />
                  <h2 className="text-base font-extrabold text-slate-900">Uploaded Evidence Vault</h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {evidence.length} Attachments
                </span>
              </div>

              {evidence.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center font-medium italic">
                  No evidence files were attached to this complaint submission.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {evidence.map((ev) => {
                    const streamUrl = officialApi.getEvidenceStreamUrl(complaint.case_id, ev.id);
                    const isImage = ev.mime_type && ev.mime_type.startsWith('image/');

                    return (
                      <div key={ev.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 flex flex-col justify-between">
                        <div>
                          {isImage ? (
                            <div className="h-44 bg-slate-900 rounded overflow-hidden mb-2 flex items-center justify-center relative group">
                              <img
                                src={streamUrl}
                                alt={ev.original_filename}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/400x300?text=Preview+Unavailable';
                                }}
                              />
                              <a
                                href={streamUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1.5"
                              >
                                <Eye className="w-4 h-4" /> Full Preview
                              </a>
                            </div>
                          ) : (
                            <div className="h-24 bg-slate-200/60 rounded mb-2 flex items-center justify-center text-slate-600">
                              <FileText className="w-10 h-10 text-slate-500" />
                            </div>
                          )}

                          <p className="text-xs font-bold text-slate-900 truncate" title={ev.original_filename}>
                            {ev.original_filename}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                            <span>{(ev.file_size / 1024).toFixed(1)} KB</span>
                            <span>{ev.mime_type}</span>
                          </div>
                          {ev.file_hash && (
                            <p className="text-[9px] font-mono text-slate-400 truncate mt-1">
                              SHA256: {ev.file_hash.substring(0, 16)}...
                            </p>
                          )}
                        </div>

                        <a
                          href={streamUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Stream / View File
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Audit Log & Status History */}
            <div className="bg-white p-6 rounded-xl border border-[#e2d7cd] shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-5 h-5 text-[#DC4712]" />
                <h2 className="text-base font-extrabold text-slate-900">Case Audit Trail & Activity Log</h2>
              </div>

              <div className="space-y-4">
                {/* Institutional Actions Log */}
                {actions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Recorded Institutional Actions</h3>
                    <div className="space-y-2">
                      {actions.map((act) => (
                        <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900">{act.action_type}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(act.performed_at).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium">{act.action_description}</p>
                          <span className="text-[10px] font-bold text-slate-500 block">
                            By: {act.actor_name} ({act.actor_role})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status History */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Status Updates History</h3>
                  {statusHistory.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No previous status updates recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {statusHistory.map((h) => (
                        <div key={h.id} className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              Status changed from <span className="text-slate-600">{h.previous_status || 'Initial'}</span> to <span className="text-[#DC4712] font-extrabold">{h.new_status}</span>
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(h.created_at).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {h.action_note && (
                            <p className="text-slate-700 italic">"{h.action_note}"</p>
                          )}
                          {h.closure_reason && (
                            <p className="text-rose-900 font-bold text-[11px]">Closure Reason: {h.closure_reason}</p>
                          )}
                          <span className="text-[10px] font-bold text-slate-500 block">
                            Actor: {h.actor_name} ({h.actor_role})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Complainant Info, Status Management & Action Note Form */}
          <div className="space-y-6">

            {/* Student Complainant Card */}
            <div className="bg-white p-6 rounded-xl border border-[#e2d7cd] shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-5 h-5 text-[#DC4712]" />
                <h2 className="text-base font-extrabold text-slate-900">Complainant Identity</h2>
              </div>

              {complainant ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Full Name</span>
                    <span className="font-extrabold text-slate-900 text-sm">{complainant.full_name}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Student ID Number</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                      {complainant.student_id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Campus Email Address</span>
                    <span className="font-semibold text-slate-800">{complainant.email}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      Registered Student Account
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Complainant details unavailable.</p>
              )}
            </div>

            {/* Official Status Update Form */}
            <div className="bg-white p-6 rounded-xl border border-[#e2d7cd] shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileCheck className="w-5 h-5 text-[#DC4712]" />
                <h2 className="text-base font-extrabold text-slate-900">Update Complaint Status</h2>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Select New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-[#EE712B] focus:outline-none"
                  >
                    <option value="Submitted">Submitted (Pending Review)</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Action Taken">Action Taken</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Action Justification / Investigation Note <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Enter official investigation rationale or action details..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-[#EE712B] focus:outline-none"
                    required
                  />
                </div>

                {newStatus === 'Closed' && (
                  <div>
                    <label className="block font-extrabold text-rose-800 mb-1">
                      Formal Closure Reason <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={closureReason}
                      onChange={(e) => setClosureReason(e.target.value)}
                      placeholder="State why this complaint is formally closed..."
                      className="w-full px-3 py-2 bg-rose-50/50 border border-rose-300 rounded-lg text-rose-950 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="w-full py-2.5 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Save Status Change</span>
                </button>
              </form>
            </div>

            {/* Record Institutional Action & Evidence Upload Form */}
            <div className="bg-white p-6 rounded-xl border border-[#e2d7cd] shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-[#DC4712]" />
                <h2 className="text-base font-extrabold text-slate-900">Record Institutional Action</h2>
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-[#EE712B] focus:outline-none"
                  >
                    <option value="Inquiry Initiated">Inquiry Initiated</option>
                    <option value="Witness Statement Recorded">Witness Statement Recorded</option>
                    <option value="Disciplinary Hearing Scheduled">Disciplinary Hearing Scheduled</option>
                    <option value="Precautionary Suspension Issued">Precautionary Suspension Issued</option>
                    <option value="Safety Escort Provided">Safety Escort Provided</option>
                    <option value="Warning Letter Issued">Warning Letter Issued</option>
                    <option value="Counseling Referred">Counseling Referred</option>
                    <option value="Institutional Action Completed">Institutional Action Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Action Description <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    placeholder="Describe exact measures, meetings, or decisions taken by college authority..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-[#EE712B] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Attach Action Document / Official Proof (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setActionFiles(Array.from(e.target.files))}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Upload office orders, hearing notices, or resolution letters.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingAction}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submittingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Record Official Action</span>
                </button>
              </form>
            </div>

            {/* Security Guarantee Card */}
            <div className="bg-slate-900 text-slate-300 p-5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Lock className="w-4 h-4" /> Strict Audit & Immutability Policy
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                All status updates, action notes, and uploaded documents are permanently logged in the audit history with your user credentials, timestamp, and IP address. College officials do not have permission to delete or alter past records.
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};

export default OfficialCaseDetailsPage;
