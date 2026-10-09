import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { complaintApi } from '../../services/api';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Check, 
  Loader2, 
  Info,
  Lock
} from 'lucide-react';

const CATEGORIES = [
  'Harassment',
  'Ragging',
  'Assault',
  'Sexual Misconduct',
  'Threat / Intimidation',
  'Cyber Harassment',
  'Discrimination',
  'Bullying',
  'Academic Misconduct',
  'Infrastructure / Safety Issue',
  'Theft',
  'Accident / Injury',
  'Other'
];

const ReportIncidentPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [replacingIndex, setReplacingIndex] = useState(null);

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    public_summary: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_location: '',
    people_involved: '',
    witness_information: '',
    danger_status: 'No',
    declaration_accepted: false
  });

  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleCategorySelect = (cat) => {
    setFormData((prev) => ({ ...prev, category: cat }));
    if (error) setError('');
  };

  // File Upload Handlers
  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = [];
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB

    for (const f of files) {
      if (f.size > maxSizeBytes) {
        setError(`File "${f.name}" exceeds the 25 MB size limit.`);
        return;
      }
      validFiles.push({
        file: f,
        previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
        id: Math.random().toString(36).substring(7)
      });
    }

    setEvidenceFiles((prev) => [...prev, ...validFiles]);
    if (error) setError('');
    e.target.value = null;
  };

  const handleFileRemove = (index) => {
    setEvidenceFiles((prev) => {
      const updated = [...prev];
      if (updated[index].previewUrl) {
        URL.revokeObjectURL(updated[index].previewUrl);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const triggerReplace = (index) => {
    setReplacingIndex(index);
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
    }
  };

  const handleFileReplace = (e) => {
    const file = e.target.files[0];
    if (!file || replacingIndex === null) return;

    if (file.size > 25 * 1024 * 1024) {
      setError(`Replacement file "${file.name}" exceeds 25 MB limit.`);
      return;
    }

    setEvidenceFiles((prev) => {
      const updated = [...prev];
      if (updated[replacingIndex].previewUrl) {
        URL.revokeObjectURL(updated[replacingIndex].previewUrl);
      }
      updated[replacingIndex] = {
        file: file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        id: Math.random().toString(36).substring(7)
      };
      return updated;
    });

    setReplacingIndex(null);
    e.target.value = null;
  };

  // Step Validation
  const validateStep = (step) => {
    setError('');
    if (step === 1) {
      if (!formData.category) {
        setError('Please select an incident category to proceed.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.description.trim()) {
        setError('Please enter a detailed description of what happened.');
        return false;
      }
      if (!formData.incident_date) {
        setError('Please select the incident date.');
        return false;
      }
      if (!formData.incident_location.trim()) {
        setError('Please specify where the incident occurred.');
        return false;
      }
    } else if (step === 4) {
      if (!formData.declaration_accepted) {
        setError('You must confirm that you have read and understood the declaration before submitting.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Submission
  const executeSubmission = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError('');

    try {
      const uploadData = new FormData();
      uploadData.append('category', formData.category);
      uploadData.append('description', formData.description);
      uploadData.append('public_summary', formData.public_summary || `Category: ${formData.category} | Location: ${formData.incident_location}`);
      uploadData.append('incident_date', formData.incident_date);
      uploadData.append('incident_location', formData.incident_location);
      uploadData.append('people_involved', formData.people_involved);
      uploadData.append('witness_information', formData.witness_information);
      uploadData.append('danger_status', formData.danger_status);
      uploadData.append('false_declaration_accepted', 'true');

      evidenceFiles.forEach((item) => {
        uploadData.append('evidenceFiles', item.file);
      });

      const response = await complaintApi.create(uploadData);

      if (response.success && response.case_id) {
        setSubmittedCaseId(response.case_id);
        setCurrentStep(5); // Success step
      } else {
        throw new Error(response.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      console.error('[Submit Error]:', err);
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCaseId = () => {
    if (submittedCaseId) {
      navigator.clipboard.writeText(submittedCaseId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const stepsList = [
    { num: 1, name: 'Incident' },
    { num: 2, name: 'Details' },
    { num: 3, name: 'Evidence' },
    { num: 4, name: 'Review & Submit' }
  ];

  return (
    <div className="min-h-screen bg-[#FBF7F7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar title="NyaySetu" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link to="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#DC4712] mb-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Report Campus Incident
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Submit an official grievance report. Your identity remains strictly confidential.
              </p>
            </div>
          </div>

          {/* Stepper Header (Steps 1-4) */}
          {currentStep <= 4 && (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between relative">
                {stepsList.map((st, idx) => (
                  <div key={st.num} className="flex-1 flex flex-col items-center relative z-10">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-colors ${
                        currentStep === st.num
                          ? 'bg-[#EE712B] text-white shadow-sm ring-4 ring-orange-100'
                          : currentStep > st.num
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#F1E9E3] text-slate-500 border border-[#e2d7cd]'
                      }`}
                    >
                      {currentStep > st.num ? <CheckCircle2 className="w-5 h-5" /> : st.num}
                    </div>
                    <span className={`text-[11px] font-bold mt-1.5 ${currentStep === st.num ? 'text-[#DC4712]' : 'text-slate-600'}`}>
                      {st.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Hidden Replace File Input */}
          <input
            type="file"
            ref={replaceInputRef}
            onChange={handleFileReplace}
            accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4,.webm"
            className="hidden"
          />

          {/* STEP 1: CATEGORY SELECTION */}
          {currentStep === 1 && (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Step 1: What type of incident are you reporting?
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Select the primary category that best describes the incident.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-3.5 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      formData.category === cat
                        ? 'bg-[#F1E9E3] border-2 border-[#EE712B] text-[#DC4712] shadow-sm'
                        : 'bg-white border-[#e2d7cd] text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {formData.category === cat && <CheckCircle2 className="w-4 h-4 text-[#DC4712]" />}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-[#e2d7cd] flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INCIDENT DETAILS */}
          {currentStep === 2 && (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Step 2: Incident Details & Context
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Provide factual details regarding when, where, and what occurred.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    When did it happen? *
                  </label>
                  <input
                    type="date"
                    name="incident_date"
                    value={formData.incident_date}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#EE712B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Where did it happen? (Location) *
                  </label>
                  <input
                    type="text"
                    name="incident_location"
                    value={formData.incident_location}
                    onChange={handleInputChange}
                    placeholder="e.g. Academic Block 2, Library 3rd Floor"
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#EE712B]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold text-slate-800">
                    What happened? (Detailed Description) *
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    {formData.description.length} / 3000 characters
                  </span>
                </div>
                <textarea
                  name="description"
                  rows="5"
                  maxLength="3000"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide a clear and accurate account of the incident..."
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#EE712B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Who was involved? (Optional)
                  </label>
                  <input
                    type="text"
                    name="people_involved"
                    value={formData.people_involved}
                    onChange={handleInputChange}
                    placeholder="Names, designations, or descriptions if known"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#EE712B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Were there witnesses? (Optional)
                  </label>
                  <input
                    type="text"
                    name="witness_information"
                    value={formData.witness_information}
                    onChange={handleInputChange}
                    placeholder="Witness names or contact details if applicable"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#EE712B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-2">
                  Is anyone currently in immediate physical danger?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="danger_status"
                      value="No"
                      checked={formData.danger_status === 'No'}
                      onChange={handleInputChange}
                      className="text-[#EE712B] focus:ring-[#EE712B]"
                    />
                    <span>No</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#DC4712] cursor-pointer">
                    <input
                      type="radio"
                      name="danger_status"
                      value="Yes"
                      checked={formData.danger_status === 'Yes'}
                      onChange={handleInputChange}
                      className="text-[#DC4712] focus:ring-[#DC4712]"
                    />
                    <span>Yes (Immediate Danger)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e2d7cd] flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 rounded-lg bg-[#F1E9E3] hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span>Continue to Evidence</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: EVIDENCE UPLOAD & PREVIEW */}
          {currentStep === 3 && (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Step 3: Upload Supporting Evidence
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Attach photos, documents, or video clips to support your complaint. Max 25 MB per file.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#EE712B] bg-[#FBF7F7] hover:bg-[#F1E9E3] rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAdd}
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4,.webm"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-[#DC4712] mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-900">
                  Click or drag files to upload evidence
                </p>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  Supported: JPG, PNG, WEBP, PDF, MP4, WEBM (Max: 25 MB per file)
                </p>
              </div>

              {/* Uploaded Files Preview Grid */}
              {evidenceFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Uploaded Evidence Files ({evidenceFiles.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evidenceFiles.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt="preview"
                              className="w-12 h-12 object-cover rounded border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-white border border-slate-300 flex items-center justify-center shrink-0">
                              {getFileIcon(item.file.type)}
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {item.file.name}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-600">
                              {formatFileSize(item.file.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => triggerReplace(index)}
                            className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-[#DC4712]"
                            title="Replace File"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFileRemove(index)}
                            className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-rose-600"
                            title="Remove File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Reassurance Notice */}
              <div className="bg-[#F1E9E3] border border-[#e2d7cd] border-l-4 border-l-[#EE712B] rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#DC4712] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  Please review your evidence carefully before submitting. You can replace or remove uploaded evidence at this stage. Once the complaint is submitted, the submitted evidence becomes part of the official case record.
                </p>
              </div>

              <div className="pt-4 border-t border-[#e2d7cd] flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 rounded-lg bg-[#F1E9E3] hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span>Continue to Declaration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & DECLARATION */}
          {currentStep === 4 && (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Step 4: Review & False Accusation Declaration
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Review your complaint summary and sign the official declaration before final submission.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-[#F1E9E3] border border-[#e2d7cd] rounded-lg p-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#e2d7cd] pb-2">
                  <span className="font-extrabold text-slate-600">Category:</span>
                  <span className="font-bold text-slate-900">{formData.category}</span>
                </div>
                <div className="flex justify-between border-b border-[#e2d7cd] pb-2">
                  <span className="font-extrabold text-slate-600">Incident Date:</span>
                  <span className="font-bold text-slate-900">{formData.incident_date}</span>
                </div>
                <div className="flex justify-between border-b border-[#e2d7cd] pb-2">
                  <span className="font-extrabold text-slate-600">Location:</span>
                  <span className="font-bold text-slate-900">{formData.incident_location}</span>
                </div>
                <div className="flex justify-between border-b border-[#e2d7cd] pb-2">
                  <span className="font-extrabold text-slate-600">Attached Evidence Files:</span>
                  <span className="font-bold text-slate-900">{evidenceFiles.length} file(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-extrabold text-slate-600">Victim Privacy Protection:</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-700" />
                    Identity Protected & Anonymized
                  </span>
                </div>
              </div>

              {/* False Accusation Warning Declaration Box */}
              <div className="bg-orange-50 border-2 border-[#EE712B] rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-extrabold text-[#DC4712] uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Important Declaration
                </h3>
                <div className="text-xs text-slate-800 font-medium leading-relaxed space-y-2">
                  <p>
                    I confirm that the information provided in this complaint is true and accurate to the best of my knowledge.
                  </p>
                  <p>
                    I understand that knowingly submitting a false accusation, deliberately fabricating evidence, or intentionally misleading the investigation may result in appropriate action under applicable institutional policies and law.
                  </p>
                  <p className="font-bold text-slate-900 border-l-2 border-[#DC4712] pl-3 py-0.5">
                    I understand that making a complaint in good faith will not by itself result in action simply because the allegation cannot ultimately be substantiated.
                  </p>
                </div>

                <div className="pt-3 border-t border-orange-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="declaration_accepted"
                      checked={formData.declaration_accepted}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#EE712B] rounded focus:ring-[#EE712B] mt-0.5"
                    />
                    <span className="text-xs font-extrabold text-slate-900">
                      I have read and understood the above declaration.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e2d7cd] flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 rounded-lg bg-[#F1E9E3] hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  ← Edit Evidence
                </button>
                <button
                  type="button"
                  disabled={!formData.declaration_accepted || loading}
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-2.5 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Complaint</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS & CASE ID DISPLAY */}
          {currentStep === 5 && submittedCaseId && (
            <div className="bg-white border border-[#e2d7cd] rounded-xl p-8 text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Complaint Submitted Successfully
                </h2>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Your grievance report has been encrypted and recorded under official case management.
                </p>
              </div>

              {/* Case ID Box */}
              <div className="bg-[#F1E9E3] border border-[#e2d7cd] rounded-xl p-6 max-w-md mx-auto space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Official Case ID
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-black text-[#DC4712] font-mono tracking-wider">
                    {submittedCaseId}
                  </span>
                  <button
                    onClick={copyCaseId}
                    className="p-2 rounded bg-white border border-slate-300 text-slate-700 hover:text-[#DC4712]"
                    title="Copy Case ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] font-semibold text-slate-500">
                  Keep this Case ID to track status updates and official actions.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <Link
                  to="/student/complaints"
                  className="px-5 py-2.5 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs transition-colors shadow-sm"
                >
                  Go to My Complaints
                </Link>
                <Link
                  to={`/student/complaints/${submittedCaseId}`}
                  className="px-5 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors"
                >
                  View Case Details
                </Link>
              </div>
            </div>
          )}

          {/* FINAL SUBMISSION CONFIRMATION MODAL */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-[#e2d7cd] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  Confirm Complaint Submission
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Are you sure you want to submit this complaint? After submission, the complaint and submitted evidence will become part of the official case record.
                </p>

                <div className="pt-4 border-t border-[#e2d7cd] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={executeSubmission}
                    className="px-5 py-2 rounded-lg bg-[#EE712B] hover:bg-[#DC4712] text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Complaint</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ReportIncidentPage;
