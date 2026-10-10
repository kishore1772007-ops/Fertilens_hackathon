import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Sparkles,
  ShieldCheck,
  User,
  ArrowLeft,
  RefreshCw,
  Eye,
  Bot
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { ROUTES } from '../../constants/routes';

const DOCUMENT_TYPES = [
  {
    id: 'blood_test',
    label: 'Blood Test & Hormone Panel',
    desc: 'AMH, Beta-hCG, FSH, LH, Estradiol (E2), Progesterone',
    icon: Activity,
    color: 'blue'
  },
  {
    id: 'ultrasound_scan',
    label: 'Ultrasound & Follicular Scan',
    desc: 'Follicular monitoring, Endometrial thickness, Pelvic US',
    icon: FileText,
    color: 'blue'
  },
  {
    id: 'embryology',
    label: 'Embryology & IVF Lab Report',
    desc: 'Oocyte retrieval, Fertilization rate, Blastocyst grading',
    icon: Sparkles,
    color: 'blue'
  },
  {
    id: 'semen_analysis',
    label: 'Semen Analysis & Andrology',
    desc: 'Sperm count, Motility, Kruger strict morphology',
    icon: Activity,
    color: 'blue'
  },
  {
    id: 'consultation_note',
    label: 'Clinical Consultation Notes',
    desc: 'Physician assessment, Cycle planning, Clinical instructions',
    icon: FileText,
    color: 'blue'
  },
  {
    id: 'other',
    label: 'Other Diagnostic Record',
    desc: 'Genetic screening, Hysterosalpingogram (HSG), General lab',
    icon: FileUp,
    color: 'slate'
  }
];

export default function DocumentUploadPage() {
  const { patientId: paramPatientId } = useParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(paramPatientId || '');
  const [patientDetails, setPatientDetails] = useState(null);

  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('blood_test');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [approvedForPatient, setApprovedForPatient] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Load patients roster for dropdown selector
  useEffect(() => {
    apiClient.get('/patients?limit=50').then((res) => {
      const items = res.data?.items || [];
      setPatients(items);
      if (!selectedPatientId && items.length > 0) {
        setSelectedPatientId(items[0].patient_id);
      }
    }).catch(() => {});
  }, []);

  // Update patient details when patient selection changes
  useEffect(() => {
    if (selectedPatientId) {
      apiClient.get(`/patients/${selectedPatientId}`).then((res) => {
        setPatientDetails(res.data);
      }).catch(() => {
        setPatientDetails(null);
      });
      fetchRecentDocuments(selectedPatientId);
    }
  }, [selectedPatientId]);

  const fetchRecentDocuments = async (pId) => {
    setLoadingDocs(true);
    try {
      const res = await apiClient.get(`/documents?patient_id=${pId}&limit=10`);
      setRecentDocuments(res.data?.items || []);
    } catch {
      setRecentDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        // Auto-populate clean title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('Please select a patient.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a document title.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('patient_id', selectedPatientId);
    formData.append('title', title.trim());
    formData.append('document_type', documentType);
    formData.append('clinical_notes', clinicalNotes.trim());
    formData.append('approved_for_patient', approvedForPatient.toString());

    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      const res = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess({
        message: res.data.message || 'Report uploaded and encrypted successfully.',
        docId: res.data.document_id,
        patientName: patientDetails?.first_name || selectedPatientId
      });

      // Clear input form
      setTitle('');
      setClinicalNotes('');
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

      fetchRecentDocuments(selectedPatientId);
    } catch (err) {
      setError(err.normalizedMessage || 'Failed to upload diagnostic document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {paramPatientId && (
              <Link
                to={ROUTES.HOSPITAL.patientDetails(paramPatientId)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <FileUp className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Upload Diagnostic Scans &amp; Lab Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            AES-256-GCM encrypted document intake with automatic clinical AI indexing &amp; record synthesis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Zero-Knowledge Encryption
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {uploadSuccess && (
        <div className="p-5 rounded-3xl bg-blue-50 border border-blue-200 text-blue-900 shadow-sm flex items-start justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Diagnostic Document Successfully Ingested &amp; Encrypted</h4>
              <p className="text-xs text-blue-700 mt-0.5">{uploadSuccess.message}</p>
              <div className="mt-2 flex items-center gap-2">
                <Link
                  to={ROUTES.HOSPITAL.ASSISTANT}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-xs hover:bg-blue-700 transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask AI Assistant About This Report &rarr;</span>
                </Link>
                {selectedPatientId && (
                  <Link
                    to={ROUTES.HOSPITAL.patientRecords(selectedPatientId)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white text-blue-700 text-xs font-bold rounded-full border border-blue-200 hover:bg-blue-50 transition"
                  >
                    <span>View Patient EMR</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setUploadSuccess(null)}
            className="text-blue-500 hover:text-blue-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Upload Card */}
      <form
        onSubmit={handleUploadSubmit}
        className="bg-white rounded-3xl border border-blue-100 p-6 sm:p-8 shadow-[0_4px_24px_rgba(37,99,235,0.06)] space-y-6"
      >
        {/* Step 1: Patient Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            1. Select Patient Dossier
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-4 py-3 text-xs sm:text-sm bg-[#f8faff] border border-blue-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800"
                required
              >
                <option value="" disabled>-- Choose a Patient --</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_id} — {p.first_name} {p.last_name} ({p.primary_diagnosis || 'Patient'})
                  </option>
                ))}
              </select>
            </div>

            {patientDetails && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-center justify-between text-xs text-blue-950">
                <div>
                  <span className="font-bold text-blue-900 block">
                    {patientDetails.first_name} {patientDetails.last_name} ({patientDetails.patient_id})
                  </span>
                  <span className="text-blue-700 text-[11px] font-medium">
                    Age: {patientDetails.age} • Stage: {patientDetails.treatment_stage}
                  </span>
                </div>
                <span className="px-3 py-1 bg-white text-blue-800 font-bold rounded-full border border-blue-200 shadow-2xs">
                  AMH: {patientDetails.amh_level} ng/mL
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Document Category */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            2. Report Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DOCUMENT_TYPES.map((dt) => {
              const Icon = dt.icon;
              const isSelected = documentType === dt.id;
              return (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => setDocumentType(dt.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-600/20'
                      : 'border-blue-100 hover:border-blue-300 bg-white hover:bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {dt.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {dt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Document Title & File Upload */}
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            3. Document Title &amp; Attachment
          </label>
          <div>
            <input
              type="text"
              placeholder="e.g. Day 10 Follicular Monitoring Ultrasound Scan or Cycle Day 3 Hormone Panel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-xs sm:text-sm bg-[#f8faff] border border-blue-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
              required
            />
          </div>

          {/* File Dropzone */}
          <div className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/30 rounded-3xl p-6 text-center transition-colors">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag and drop your clinical scan / report
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF, Ultrasound images (PNG/JPG), and laboratory text files (Up to 10 MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Step 4: Clinical Findings & Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            4. Clinical Findings &amp; Key Biomarkers (Indexed for AI Assistant)
          </label>
          <textarea
            rows={4}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="e.g., Ultrasound Findings: Right ovary leading follicle 18mm, left ovary 14mm. Endometrial lining 8.4mm trilaminar. Hormone Panel: AMH 4.8 ng/mL, LH surge positive, Estradiol 320 pg/mL. Recommended for Ovidrel 250mcg trigger shot tonight."
            className="w-full px-4 py-3 text-xs sm:text-sm bg-[#f8faff] border border-blue-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 leading-relaxed"
          />
        </div>

        {/* Step 5: Patient Access & Submit */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={approvedForPatient}
              onChange={(e) => setApprovedForPatient(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-700">
              Approved for patient viewing on the Patient Care Portal
            </span>
          </label>

          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Encrypting &amp; Indexing Report...</span>
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4" />
                <span>Encrypt &amp; Upload Diagnostic Report</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Patient's Recent Documents Section */}
      {selectedPatientId && (
        <div className="bg-white rounded-3xl border border-blue-100 p-6 sm:p-7 shadow-[0_4px_24px_rgba(37,99,235,0.06)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Recent Uploaded Reports for {patientDetails ? `${patientDetails.first_name} ${patientDetails.last_name}` : selectedPatientId}
              </h3>
            </div>
            <button
              onClick={() => fetchRecentDocuments(selectedPatientId)}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              Refresh List
            </button>
          </div>

          {loadingDocs ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading documents...</div>
          ) : recentDocuments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No diagnostic documents uploaded for this patient yet. Use the form above to attach scans or lab tests.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDocuments.map((doc) => (
                <div key={doc.id || doc._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700 mt-0.5 shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{doc.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Type: <span className="capitalize">{doc.document_type?.replace(/_/g, ' ')}</span> • Uploaded: {new Date(doc.created_at || Date.now()).toLocaleDateString()}
                      </p>
                      {doc.clinical_notes && (
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
                          "{doc.clinical_notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-200/70">
                      {doc.status || 'Indexed'}
                    </span>
                    <Link
                      to={ROUTES.HOSPITAL.ASSISTANT}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full border border-blue-200/80 transition-all active:scale-95"
                    >
                      Query AI
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
