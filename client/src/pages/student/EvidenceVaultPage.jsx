import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { complaintApi } from '../../services/api';
import { 
  FolderLock, 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Lock, 
  Loader2, 
  AlertTriangle,
  ExternalLink,
  HardDrive,
  CheckCircle2,
  FileCode
} from 'lucide-react';

const EvidenceVaultPage = () => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [stats, setStats] = useState({ total_files: 0, total_bytes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    fetchVaultData();
  }, []);

  const fetchVaultData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await complaintApi.getEvidenceVault();
      if (res.success) {
        setEvidenceList(res.evidence || []);
        setStats(res.stats || { total_files: 0, total_bytes: 0 });
      }
    } catch (err) {
      console.error('[fetchVaultData error]:', err);
      setError(err.message || 'Failed to load your evidence vault records.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    if (bytes < 1024) return bytes + ' Bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mime) => {
    if (!mime) return <FileText className="w-6 h-6 text-slate-500" />;
    if (mime.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-600" />;
    if (mime.startsWith('video/')) return <Video className="w-6 h-6 text-rose-600" />;
    return <FileText className="w-6 h-6 text-emerald-600" />;
  };

  const filteredEvidence = evidenceList.filter((item) => {
    const matchesSearch = 
      item.original_filename.toLowerCase().includes(search.toLowerCase()) ||
      item.case_id.toLowerCase().includes(search.toLowerCase()) ||
      (item.file_hash && item.file_hash.toLowerCase().includes(search.toLowerCase()));

    let matchesType = true;
    if (selectedType === 'IMAGE') matchesType = item.mime_type && item.mime_type.startsWith('image/');
    else if (selectedType === 'DOCUMENT') matchesType = item.mime_type && (item.mime_type.includes('pdf') || item.mime_type.includes('text') || item.mime_type.includes('word') || item.mime_type.includes('document'));
    else if (selectedType === 'MEDIA') matchesType = item.mime_type && (item.mime_type.startsWith('video/') || item.mime_type.startsWith('audio/'));

    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu — Encrypted Evidence Vault" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#DC4712] shrink-0">
                <FolderLock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Student Encrypted Evidence Vault
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Centralized secure repository of all evidence documents and files attached to your submitted complaints.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SHA-256 Tamper Protection Enabled</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2d7cd] shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Attachments</span>
                <FolderLock className="w-4 h-4 text-[#EE712B]" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.total_files}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Evidence files stored</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2d7cd] shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Vault Storage Used</span>
                <HardDrive className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{formatFileSize(stats.total_bytes)}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Encrypted file storage</span>
            </div>

            <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-xl border border-emerald-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-emerald-900">
                <span className="text-xs font-bold uppercase tracking-wider">Integrity Assurance</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-extrabold text-emerald-950 pt-1">SHA-256 Immutable Hash</p>
              <span className="text-[10px] text-emerald-700 font-semibold">Immutable evidence checksums</span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-[#e2d7cd] shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by file name, Case ID, or SHA256 checksum..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE712B]"
              >
                <option value="ALL">All File Types</option>
                <option value="IMAGE">Images (JPEG/PNG/WebP)</option>
                <option value="DOCUMENT">Documents (PDF/Docs)</option>
                <option value="MEDIA">Audio / Video Files</option>
              </select>
            </div>
          </div>

          {/* Evidence Items Grid */}
          {loading ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center text-slate-600">
              <Loader2 className="w-8 h-8 text-[#EE712B] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold">Loading secure evidence vault...</p>
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-12 text-center space-y-3 shadow-sm">
              <FolderLock className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                No Evidence Files Found
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
                {search ? 'No files match your search criteria.' : 'You have not uploaded any evidence files with your complaints yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvidence.map((file) => (
                <div key={file.id} className="bg-white border border-[#e2d7cd] hover:border-[#EE712B] rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between space-y-4">
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F1E9E3] border border-[#e2d7cd] flex items-center justify-center shrink-0">
                        {getFileIcon(file.mime_type)}
                      </div>

                      <div className="text-right min-w-0 flex-1">
                        <Link
                          to={`/student/complaints/${file.case_id}`}
                          className="font-mono text-xs font-black text-[#DC4712] hover:underline flex items-center justify-end gap-1"
                        >
                          Case #{file.case_id} <ExternalLink className="w-3 h-3" />
                        </Link>
                        <span className="text-[10px] font-bold text-slate-500 block truncate">
                          {file.complaint_category}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-slate-900 truncate" title={file.original_filename}>
                        {file.original_filename}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-1">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{new Date(file.uploaded_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    {file.file_hash && (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[9px] text-slate-600 space-y-0.5">
                        <span className="font-bold text-slate-400 block uppercase text-[8px]">SHA256 Checksum</span>
                        <p className="truncate" title={file.file_hash}>{file.file_hash}</p>
                      </div>
                    )}
                  </div>

                  <a
                    href={complaintApi.getDownloadUrl(file.case_id, file.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Evidence File</span>
                  </a>

                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default EvidenceVaultPage;
