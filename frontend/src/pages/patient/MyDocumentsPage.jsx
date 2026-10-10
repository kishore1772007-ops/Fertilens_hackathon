import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
  Activity,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../services/apiClient';
import { fileService } from '../../services/fileService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    document_type: 'blood_test',
    clinical_notes: '',
    file: null,
  });

  const fetchDocuments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get('/documents');
      // Normalize array or wrapped response
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setDocuments(list);
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to retrieve clinical documents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }
    if (!uploadForm.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title.trim());
      formData.append('document_type', uploadForm.document_type);
      if (uploadForm.clinical_notes.trim()) {
        formData.append('clinical_notes', uploadForm.clinical_notes.trim());
      }
      formData.append('file', uploadForm.file);
      formData.append('patient_id', 'me');
      formData.append('approved_for_patient', 'true');

      await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Document uploaded and indexed successfully!');
      setIsUploadOpen(false);
      setUploadForm({
        title: '',
        document_type: 'blood_test',
        clinical_notes: '',
        file: null,
      });
      fetchDocuments(true);
    } catch (err) {
      toast.error(err.normalizedMessage || 'Document upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  // Filter Categories
  const categories = [
    { id: 'all', label: 'All Documents' },
    { id: 'blood_test', label: 'Blood & Hormone Panels' },
    { id: 'ultrasound_scan', label: 'Ultrasound Imaging' },
    { id: 'embryology', label: 'Embryology & IVF' },
    { id: 'lab_report', label: 'Lab Reports' },
    { id: 'consultation_note', label: 'Consultation Summaries' },
    { id: 'other', label: 'Outside Records' },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'all' || doc.document_type === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      doc.title?.toLowerCase().includes(q) ||
      doc.original_filename?.toLowerCase().includes(q) ||
      doc.clinical_notes?.toLowerCase().includes(q) ||
      doc.doctor_name?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const getCategoryTheme = (type) => {
    switch (type) {
      case 'blood_test':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          badgeBg: 'bg-rose-100/80',
          label: 'Blood & Hormone',
        };
      case 'ultrasound_scan':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          badgeBg: 'bg-purple-100/80',
          label: 'Ultrasound Scan',
        };
      case 'embryology':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          badgeBg: 'bg-emerald-100/80',
          label: 'Embryology Report',
        };
      case 'consultation_note':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          badgeBg: 'bg-blue-100/80',
          label: 'Consultation Note',
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          badgeBg: 'bg-slate-100',
          label: 'Clinical Document',
        };
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'PDF File';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Released';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Decrypting your clinical document archive...</p>
      </div>
    );
  }

  const bloodCount = documents.filter((d) => d.document_type === 'blood_test').length;
  const scanCount = documents.filter((d) => d.document_type === 'ultrasound_scan').length;
  const embryoCount = documents.filter((d) => d.document_type === 'embryology').length;

  return (
    <div className="space-y-8 pb-14 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-800 text-white p-7 sm:p-9 shadow-lg shadow-blue-900/15">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/25">
                Medical Records Archive
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                AES-256-GCM Encrypted
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              My Clinical Documents &amp; Scans
            </h1>
            <p className="text-blue-100 text-sm max-w-xl leading-relaxed">
              Access official physician-approved diagnostic reports, serial ultrasound scans, and embryology updates released for your care.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              Upload Outside Report
            </button>
            <button
              onClick={() => fetchDocuments(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchDocuments()} className="underline font-medium hover:text-rose-800">
            Retry
          </button>
        </div>
      )}

      {/* Quick Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Released</span>
          <div className="text-2xl font-extrabold text-slate-900">{documents.length}</div>
          <span className="text-[11px] text-slate-500 block">Verified reports</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-rose-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">Blood &amp; Hormones</span>
          <div className="text-2xl font-extrabold text-slate-900">{bloodCount}</div>
          <span className="text-[11px] text-slate-500 block">AMH, FSH, Estradiol</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">Ultrasound Scans</span>
          <div className="text-2xl font-extrabold text-slate-900">{scanCount}</div>
          <span className="text-[11px] text-slate-500 block">Folliculometry &amp; AFC</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Embryology</span>
          <div className="text-2xl font-extrabold text-slate-900">{embryoCount}</div>
          <span className="text-[11px] text-slate-500 block">Culture &amp; Transfer logs</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, original filename, or clinician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredDocs.length}</strong> of {documents.length} documents
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'all' ? documents.length : documents.filter((d) => d.document_type === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const theme = getCategoryTheme(doc.document_type);
            const docId = doc.document_id || doc._id;

            return (
              <div
                key={docId}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
              >
                <div className="space-y-4">
                  {/* Top Category Badge & Physician Approval Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${theme.badgeBg} ${theme.text} ${theme.border}`}
                    >
                      {theme.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Approved
                    </span>
                  </div>

                  {/* Document Title & File Info */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono truncate">
                      {doc.original_filename || `${docId}.pdf`}
                    </p>
                  </div>

                  {/* Clinical Notes / Doctor excerpt if any */}
                  {doc.clinical_notes && (
                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {doc.clinical_notes}
                    </p>
                  )}

                  {/* Date & Metadata */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                    <span className="font-medium text-slate-500 font-mono text-[11px]">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedDocDetails(doc)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Details
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileService.downloadFile(docId, doc.original_filename || `${doc.title}.pdf`)}
                      title="Download PDF"
                      className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fileService.viewFile(docId, doc.original_filename || `${doc.title}.pdf`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 space-y-3 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <FileText className="w-12 h-12 mx-auto text-slate-300" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Documents Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No clinical records match your current filter criteria. Try resetting the category or searching a different term.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Upload Outside Document Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Clinical Document or Outside Lab"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Upload prior fertility testing, external bloodwork, partner sperm analysis, or scans for automated indexing and physician review.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Baseline AMH & FSH Bloodwork"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Report Category *</label>
            <select
              value={uploadForm.document_type}
              onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="blood_test">Blood &amp; Hormone Test (AMH, FSH, Estradiol)</option>
              <option value="ultrasound_scan">Pelvic / Antral Follicle Ultrasound</option>
              <option value="embryology">Embryology / Semen Analysis</option>
              <option value="lab_report">General Diagnostic Lab Report</option>
              <option value="consultation_note">Outside Clinic Summary / History</option>
              <option value="other">Consent Form / Identification / Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Select File (PDF, JPG, PNG) *</label>
            <input
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Clinical Context / Notes (Optional)</label>
            <textarea
              rows={3}
              placeholder="e.g., Performed on Cycle Day 3 at Quest Diagnostics..."
              value={uploadForm.clinical_notes}
              onChange={(e) => setUploadForm({ ...uploadForm, clinical_notes: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <Button type="submit" variant="primary" size="sm" loading={uploadLoading}>
              Upload &amp; Encrypt Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Details Modal */}
      {selectedDocDetails && (
        <Modal
          isOpen={Boolean(selectedDocDetails)}
          onClose={() => setSelectedDocDetails(null)}
          title={selectedDocDetails.title}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Document Identifier:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedDocDetails.document_id || selectedDocDetails._id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Original File:</span>
                <span className="font-mono text-slate-700">{selectedDocDetails.original_filename}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Uploaded On:</span>
                <span className="font-semibold text-slate-700">{formatDate(selectedDocDetails.created_at)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Security:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> AES-256-GCM Encrypted
                </span>
              </div>
            </div>

            {selectedDocDetails.clinical_notes && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clinical Notes</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedDocDetails.clinical_notes}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  fileService.downloadFile(
                    selectedDocDetails.document_id || selectedDocDetails._id,
                    selectedDocDetails.original_filename || `${selectedDocDetails.title}.pdf`
                  );
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  fileService.viewFile(
                    selectedDocDetails.document_id || selectedDocDetails._id,
                    selectedDocDetails.original_filename || `${selectedDocDetails.title}.pdf`
                  );
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open In Viewer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
