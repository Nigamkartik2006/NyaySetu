import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { Shield, ArrowLeft, Lock, Loader2, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';

const PublicCaseDetailsPage = () => {
  const { caseId } = useParams();
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicCase();
  }, [caseId]);

  const fetchPublicCase = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await publicApi.getCaseDetails(caseId);
      if (res.success && res.case) {
        setCaseDetails(res.case);
      } else {
        throw new Error('Public case record not found.');
      }
    } catch (err) {
      console.error('[fetchPublicCase Error]:', err);
      setError(err.message || 'Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
      {/* Header */}
      <header className="h-16 border-b-2 border-[#EE712B] bg-white sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/logo.jpg" 
            alt="NyayaSetu Official Logo" 
            className="h-10 w-auto object-contain rounded border border-[#e2d7cd]"
          />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
              NyaySetu
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
              Public Case Transparency Board
            </p>
          </div>
        </Link>

        <Link
          to="/public/complaints"
          className="px-3.5 py-1.5 text-xs font-bold text-[#DC4712] hover:bg-orange-50 border border-orange-300 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Public Cases</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {loading ? (
          <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center text-slate-600">
            <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold">Loading public case details...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl text-xs font-bold flex items-center gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : caseDetails ? (
          <div className="space-y-6">
            {/* Anonymization Guarantee Card */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <Lock className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                  Victim Identity & Evidence Protection Guaranteed
                </h3>
                <p className="text-xs text-emerald-900 font-semibold mt-0.5 leading-relaxed">
                  Personal complainant details, raw evidence files, and internal committee notes are strictly confidential and excluded from public view.
                </p>
              </div>
            </div>

            {/* Public Case Metadata Card */}
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#e2d7cd] pb-4">
                <div>
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                    Public Case Record
                  </span>
                  <h2 className="text-2xl font-black text-[#DC4712] font-mono tracking-wider">
                    #{caseDetails.case_id}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold px-3 py-1 rounded bg-blue-100 text-blue-900 border border-blue-300 inline-block">
                    Status: {caseDetails.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-extrabold text-slate-500 block">Category:</span>
                  <span className="font-bold text-slate-900 text-sm">{caseDetails.category}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block">Incident Date:</span>
                  <span className="font-bold text-slate-900">{new Date(caseDetails.incident_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block">General Location:</span>
                  <span className="font-bold text-slate-900">{caseDetails.incident_location}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block">Date Reported:</span>
                  <span className="font-bold text-slate-900">{new Date(caseDetails.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block">Current Stage:</span>
                  <span className="font-bold text-slate-900">{caseDetails.current_stage || 'Awaiting Review'}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block">Reported By:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-700" />
                    {caseDetails.reported_by}
                  </span>
                </div>
              </div>

              {caseDetails.public_summary && (
                <div className="pt-2">
                  <span className="font-extrabold text-slate-500 text-xs block mb-1">Public Case Summary:</span>
                  <div className="bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg p-4 text-xs font-medium text-slate-900 leading-relaxed">
                    {caseDetails.public_summary}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-[#e2d7cd] text-xs text-slate-600 font-semibold">
        NyaySetu &copy; {new Date().getFullYear()} — Public Accountability & Grievance Transparency Mechanism
      </footer>
    </div>
  );
};

export default PublicCaseDetailsPage;
