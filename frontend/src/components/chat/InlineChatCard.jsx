import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileText,
  Paperclip,
  Mic,
  MicOff,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../services/apiClient';
import { ClinicalMarkdown } from './ClinicalMarkdown';

export function InlineChatCard({ isPatient = false, defaultPatientId = null }) {
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasGauge, setHasGauge] = useState(false);

  const sampleQuestions = isPatient
    ? [
        'What was my AMH result?',
        'Explain my follicle count',
        'When is my next clinical appointment?',
        'What medications are currently scheduled?'
      ]
    : [
        'Summarize Priya Sharma (P1001)',
        "What is Priya's AMH level and AFC?",
        'Show Ananya Roy P1002 protocol',
        'Summarize Rahul Verma P1006'
      ];

  const handleAsk = async (textToAsk = null) => {
    const q = (textToAsk || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/chat/message', {
        message: q,
        patient_id: defaultPatientId
      });
      setReply(response.data.reply);
      setSources(response.data.sources || []);

      const mentionsAmh =
        /amh|anti-m[uü]llerian|ovarian reserve/i.test(q) ||
        /amh|anti-m[uü]llerian/i.test(response.data.reply);
      setHasGauge(mentionsAmh);
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to connect to clinical intelligence engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(37,99,235,0.06)] space-y-4">
      {/* Header with Brand Avatar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 flex-shrink-0" data-purpose="brand-avatar">
            <svg className="w-full h-full shadow-xs rounded-xl" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <rect fill="#2563EB" height="48" rx="14" width="48" />
              <path d="M24 35.2L22.26 33.62C16.1 28.02 12 24.3 12 19.7C12 15.96 14.96 13 18.7 13C20.81 13 22.84 13.98 24 15.54C25.16 13.98 27.19 13 29.3 13C33.04 13 36 15.96 36 19.7C36 24.3 31.9 28.02 25.74 33.64L24 35.2Z" fill="white" />
              <circle cx="33" cy="15" fill="#60A5FA" r="3" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-[15px] leading-tight text-slate-900 tracking-tight">
                FertiLens Care Assistant
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 uppercase tracking-wide">
                Live Intelligence
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 flex items-center mt-0.5">
              <span>24/7 Compassionate Care</span>
              <span className="mx-1 text-slate-300">•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Encrypted Clinical Records</span>
        </div>
      </div>

      {/* Suggested Prompts row */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 pl-1">
          SUGGESTED:
        </span>
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(sq);
              handleAsk(sq);
            }}
            className="flex-shrink-0 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all px-3 py-1 rounded-full border border-blue-200/80 whitespace-nowrap"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Capsule Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center space-x-2"
      >
        <div className="flex-1 flex items-center bg-white rounded-full border-2 border-blue-200/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3 py-1.5 shadow-inner">
          <input
            type="text"
            placeholder={
              isPatient
                ? 'Ask anything about your appointments, lab results, medications...'
                : 'Ask clinical questions (e.g. Priya Sharma AMH level and AFC)...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-[13px] text-slate-800 placeholder-slate-400 px-2 py-1 outline-none"
          />
        </div>

        {/* Pill-shaped Ask Button */}
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white font-semibold text-xs px-4 py-2.5 rounded-full flex items-center space-x-1.5 shadow-md shadow-blue-500/25 transition-all active:scale-95"
        >
          <span>Ask</span>
          <svg className="w-3.5 h-3.5 transform rotate-45 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      {/* Response Box */}
      {reply && (
        <div className="mt-4 p-5 rounded-2xl bg-[#f8fbff] border border-blue-100/90 shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-blue-100/80 pb-2.5">
            <span className="inline-flex items-center text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              <ShieldCheck className="w-3 h-3 mr-1 text-blue-600" />
              Verified Clinical Data
            </span>
            <button
              onClick={() => setReply(null)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>

          <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
            <ClinicalMarkdown content={reply} isPatient={isPatient} />
          </div>

          {/* AMH Range Gauge if applicable */}
          {hasGauge && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/80">
              <div className="flex justify-between items-center text-[11px] font-semibold mb-1">
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">Ovarian Reserve Scale</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Normal Range: 1.0 - 3.5 ng/mL
                </span>
              </div>
              <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="w-1/4 bg-amber-200 border-r border-white" title="Diminished <1.0" />
                <div className="w-2/4 bg-emerald-300 border-r border-white" title="Normal 1.0 - 3.5" />
                <div className="w-1/4 bg-blue-400" title="High >3.5" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>&lt;1.0 Low</span>
                <span className="text-emerald-700 font-semibold">1.0 - 3.5 Normal</span>
                <span>&gt;3.5 High</span>
              </div>
            </div>
          )}

          {sources && sources.length > 0 && (
            <div className="pt-2 border-t border-blue-100/60 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Sources:</span>
              {sources.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold bg-white text-blue-700 rounded-full border border-blue-200/60 shadow-2xs"
                >
                  <FileText className="w-3 h-3 text-blue-500" />
                  {s.document_title || 'Report'} {s.page_number ? `(p.${s.page_number})` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}
    </div>
  );
}
