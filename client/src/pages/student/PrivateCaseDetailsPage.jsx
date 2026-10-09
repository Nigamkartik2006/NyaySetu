import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { complaintApi } from '../../services/api';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Lock, 
  Loader2, 
  AlertTriangle,
  Clock,
  ShieldAlert
} from 'lucide-react';

const PrivateCaseDetailsPage = () => {
  const { caseId } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await complaintApi.getPrivateDetails(caseId);
      if (res.success && res.complaint) {
        setComplaint(res.complaint);
        setEvidenceList(res.evidence || []);
      } else {
        throw new Error(res.message || 'Case record not found.');
      }
    } catch (err) {
      console.error('[fetchCaseDetails Error]:', err);
      setError(err.message || 'Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' Bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mime) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-600" />;
    if (mime.startsWith('video/')) return <Video className="w-5 h-5 text-[#DC4712]" />;
    return <FileText className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Header */}
          <div>
            <Link to="/student/complaints" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#DC4712] mb-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to My Complaints
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-2xl font-black text-[#DC4712] font-mono tracking-wider">
                Case #{caseId}
              </h1>
              <div className="flex items-center gap-2">
                {complaint && (
                  <span className="text-xs font-extrabold px-3 py-1 rounded bg-blue-100 text-blue-900 border border-blue-300">
                    Status: {complaint.status}
                  </span>
                )}
                <Link
                  to={`/student/retaliation?caseId=${caseId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Report Retaliation</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Loading / Error States */}
          {loading ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center text-slate-600">
              <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold">Loading private case details...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl text-xs font-bold flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm mb-1">Access Restricted</p>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          ) : complaint ? (
            <div className="space-y-6">
              {/* Case Metadata */}
              <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900 border-b border-[#e2d7cd] pb-2">
                  Incident Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-500 block">Category:</span>
                    <span className="font-bold text-slate-900">{complaint.category}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-500 block">Incident Date:</span>
                    <span className="font-bold text-slate-900">{new Date(complaint.incident_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-500 block">Location:</span>
                    <span className="font-bold text-slate-900">{complaint.incident_location}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-500 block">Date Submitted:</span>
                    <span className="font-bold text-slate-900">{new Date(complaint.created_at).toLocaleString()}</span>
                  </div>
                  {complaint.people_involved && (
                    <div>
                      <span className="font-extrabold text-slate-500 block">People Involved:</span>
                      <span className="font-bold text-slate-900">{complaint.people_involved}</span>
                    </div>
                  )}
                  {complaint.witness_information && (
                    <div>
                      <span className="font-extrabold text-slate-500 block">Witness Information:</span>
                      <span className="font-bold text-slate-900">{complaint.witness_information}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-extrabold text-slate-500 text-xs block mb-1">Full Detailed Description:</span>
                  <div className="bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg p-4 text-xs font-medium text-slate-900 whitespace-pre-wrap leading-relaxed">
                    {complaint.description}
                  </div>
                </div>
              </div>

              {/* Private Evidence Files */}
              <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Attached Evidence ({evidenceList.length})
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-700" />
                    Protected Storage
                  </span>
                </div>

                {evidenceList.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium italic">
                    No evidence files were attached to this complaint.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evidenceList.map((file) => (
                      <div
                        key={file.id}
                        className="bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-10 h-10 rounded bg-white border border-slate-300 flex items-center justify-center shrink-0">
                            {getFileIcon(file.mime_type)}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {file.original_filename}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-500">
                              {formatFileSize(file.file_size)} | SHA256: {file.file_hash.substring(0, 8)}...
                            </p>
                          </div>
                        </div>

                        <a
                          href={complaintApi.getDownloadUrl(caseId, file.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded bg-white hover:bg-slate-100 text-[#DC4712] border border-slate-300 shadow-sm shrink-0 ml-2"
                          title="Download Evidence File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default PrivateCaseDetailsPage;
