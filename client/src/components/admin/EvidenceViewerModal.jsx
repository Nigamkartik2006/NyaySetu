import React, { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Video, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { adminApi } from '../../services/api';

const EvidenceViewerModal = ({ caseId, evidence, onClose }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [activeFileIndex]);

  if (!evidence || evidence.length === 0) return null;

  const currentFile = evidence[activeFileIndex] || evidence[0];
  const streamUrl = adminApi.getEvidenceStreamUrl(caseId, currentFile.id);

  const isImage = currentFile.mime_type?.startsWith('image/');
  const isPdf = currentFile.mime_type === 'application/pdf';
  const isVideo = currentFile.mime_type?.startsWith('video/');

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EE712B] text-white">
              {isImage && <ImageIcon className="w-5 h-5" />}
              {isPdf && <FileText className="w-5 h-5" />}
              {isVideo && <Video className="w-5 h-5" />}
              {!isImage && !isPdf && !isVideo && <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Official Evidence Vault</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  Case #{caseId}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {currentFile.original_filename} ({activeFileIndex + 1} of {evidence.length})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={streamUrl}
              download={currentFile.original_filename}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-[#EE712B] hover:bg-[#DC4712] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-950">
          
          {/* Main Viewer Display Panel */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-[350px] md:min-h-[500px] relative overflow-auto bg-slate-950">
            {isImage && !imageError && (
              <img
                src={streamUrl}
                alt={currentFile.original_filename}
                onError={() => setImageError(true)}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800"
              />
            )}

            {isImage && imageError && (
              <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-xl text-rose-300 space-y-3 max-w-md">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h4 className="font-bold text-sm text-white">Evidence Image Unavailable</h4>
                <p className="text-xs text-slate-400">
                  Physical image file "{currentFile.original_filename}" could not be loaded from server storage.
                </p>
              </div>
            )}

            {isPdf && (
              <iframe
                src={`${streamUrl}#toolbar=1`}
                title={currentFile.original_filename}
                className="w-full h-[65vh] rounded-lg border border-slate-800 bg-white"
              />
            )}

            {isVideo && (
              <video
                controls
                src={streamUrl}
                className="max-h-[65vh] max-w-full rounded-lg shadow-2xl border border-slate-800"
              >
                Your browser does not support HTML video playback.
              </video>
            )}

            {!isImage && !isPdf && !isVideo && (
              <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 space-y-4 max-w-md">
                <FileText className="w-12 h-12 text-[#EE712B] mx-auto" />
                <h4 className="font-bold text-sm text-white">Preview unavailable for this format</h4>
                <p className="text-xs text-slate-400">
                  {currentFile.original_filename} ({currentFile.mime_type}) can be opened directly or downloaded securely.
                </p>
                <a
                  href={streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#EE712B] text-white font-bold text-xs rounded-lg hover:bg-[#DC4712] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open File Directly</span>
                </a>
              </div>
            )}
          </div>

          {/* Right Sidebar Details */}
          <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-5 space-y-5 text-slate-300 shrink-0 overflow-y-auto">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Evidence Metadata</span>
              </h4>
              
              <div className="space-y-2.5 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 font-medium">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Filename</span>
                  <span className="text-white font-bold break-all">{currentFile.original_filename}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">MIME Type</span>
                  <span className="text-slate-300 font-mono text-[11px]">{currentFile.mime_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">File Size</span>
                  <span className="text-slate-300">{formatBytes(currentFile.file_size)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Upload Timestamp</span>
                  <span className="text-slate-300">
                    {new Date(currentFile.uploaded_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                {currentFile.file_hash && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">SHA-256 Hash Verification</span>
                    <span className="text-emerald-400 font-mono text-[10px] break-all block mt-0.5">
                      {currentFile.file_hash}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Multiple Files Thumbnail Selector */}
            {evidence.length > 1 && (
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  All Files ({evidence.length})
                </h4>
                <div className="space-y-2">
                  {evidence.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveFileIndex(idx)}
                      className={`
                        w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all
                        ${idx === activeFileIndex 
                          ? 'bg-[#EE712B] text-white border border-orange-400 shadow-sm' 
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }
                      `}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="truncate flex-1">{item.original_filename}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EvidenceViewerModal;
