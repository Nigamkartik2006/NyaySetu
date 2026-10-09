import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Send, 
  Loader2, 
  CheckCircle2, 
  FileText, 
  Paperclip, 
  ArrowLeft,
  Calendar,
  Lock,
  Mail
} from 'lucide-react';
import { complaintApi, retaliationApi } from '../../services/api';

const RETALIATION_TYPES = [
  'Intimidation / Direct Threat',
  'Academic Retaliation (Grades/Attendance)',
  'Hostel / Social Bullying',
  'Cyber Harassment',
  'Physical Threat / Stalking',
  'Institutional Pressure',
  'Other'
];

const ReportRetaliationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCaseId = searchParams.get('caseId') || '';

  const [myComplaints, setMyComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [retaliationType, setRetaliationType] = useState(RETALIATION_TYPES[0]);
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        setLoadingComplaints(true);
        const res = await complaintApi.getMyComplaints();
        if (res.success) {
          setMyComplaints(res.complaints || []);
          if (!selectedCaseId && res.complaints.length > 0) {
            setSelectedCaseId(res.complaints[0].case_id);
          }
        }
      } catch (err) {
        console.error('[Fetch complaints for retaliation error]:', err);
      } finally {
        setLoadingComplaints(false);
      }
    }
    fetchComplaints();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setEvidenceFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseId || !incidentDate || !retaliationType || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('case_id', selectedCaseId);
      formData.append('incident_date', incidentDate);
      formData.append('retaliation_type', retaliationType);
      formData.append('description', description.trim());

      evidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });

      const res = await retaliationApi.create(formData);
      if (res.success) {
        setSubmittedData(res);
      }
    } catch (err) {
      console.error('[Submit Retaliation Error]:', err);
      setError(err.message || 'Failed to submit retaliation report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu — Confidential Retaliation Reporting" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#DC4712] hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Report Incident Retaliation
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Confidential escalation channel sent directly to independent oversight (not to implicated officials)
                </p>
              </div>
            </div>
          </div>

          {/* Success State */}
          {submittedData ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-8 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Retaliation Report Submitted Confidentially
              </h2>
              <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                Your report has been assigned Retaliation ID <strong className="font-mono text-rose-700">{submittedData.retaliation_id}</strong> and routed to the independent oversight authority.
              </p>

              <div className="bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg p-4 text-xs font-mono font-bold text-slate-800 inline-block">
                Retaliation ID: {submittedData.retaliation_id}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {submittedData.previewUrl && (
                  <a
                    href={submittedData.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>View Sent Email Preview →</span>
                  </a>
                )}
                <Link
                  to="/student/dashboard"
                  className="px-5 py-2.5 bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-amber-900 text-xs">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold uppercase tracking-wider text-[11px] text-amber-950">
                    Independent Safety Protocol
                  </h4>
                  <p className="mt-0.5 text-slate-700 font-medium">
                    Retaliation reports are routed directly to system oversight (<span className="font-mono text-amber-950">thayusingh@gmail.com</span>) to protect victims from internal harassment.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Associated Complaint Selector */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Select Related Complaint Case <span className="text-rose-600">*</span>
                  </label>
                  {loadingComplaints ? (
                    <div className="p-2.5 text-xs text-slate-500 font-bold bg-[#FBF7F7] rounded border border-[#e2d7cd]">
                      Loading your submitted cases...
                    </div>
                  ) : myComplaints.length === 0 ? (
                    <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded border border-rose-200">
                      No existing complaint cases found. You must submit a primary complaint before reporting retaliation.
                    </div>
                  ) : (
                    <select
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#EE712B]"
                    >
                      {myComplaints.map((c) => (
                        <option key={c.case_id} value={c.case_id}>
                          Case #{c.case_id} — {c.category} (Submitted {new Date(c.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date & Retaliation Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                      Retaliation Incident Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg font-bold text-slate-900 focus:outline-none focus:border-[#EE712B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                      Type of Retaliation <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={retaliationType}
                      onChange={(e) => setRetaliationType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg font-bold text-slate-900 focus:outline-none focus:border-[#EE712B]"
                    >
                      {RETALIATION_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Describe Retaliation Incident <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows="5"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about who engaged in retaliation, what actions were taken, witnesses, or threats made..."
                    className="w-full p-3.5 text-xs bg-[#FBF7F7] border border-[#e2d7cd] rounded-lg focus:outline-none focus:border-[#EE712B] font-medium"
                  />
                </div>

                {/* Optional File Attachment */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Attach Supporting Retaliation Evidence (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.mp4,.webm"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#F1E9E3] file:text-slate-800 hover:file:bg-[#e6d8cb] cursor-pointer"
                  />
                  {evidenceFiles.length > 0 && (
                    <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1.5">
                      {evidenceFiles.length} file(s) selected for upload.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || myComplaints.length === 0}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit Confidential Retaliation Report</span>
                </button>

              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ReportRetaliationPage;
