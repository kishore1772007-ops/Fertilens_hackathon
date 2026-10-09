import React, { useState } from 'react';
import { Sparkles, Send, Bot, ShieldCheck, RefreshCw, FileText } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export function InlineChatCard({ isPatient = false, defaultPatientId = null }) {
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleQuestions = isPatient
    ? [
        'What was my AMH result?',
        'Explain my follicle count',
        'When is my next appointment?',
        'What are my active medications?'
      ]
    : [
        'Summarize Priya Sharma (P1001)',
        "What is Priya's AMH level?",
        'Show Ananya Roy AFC & Stage',
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
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to connect to clinical intelligence engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-500/10 via-white to-sky-500/10 p-6 sm:p-7 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">FertiLens AI Assistant</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide">
                Ground-Truth RAG
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isPatient
                ? 'Ask any question about your active IVF cycle, lab values, or visit instructions'
                : 'Ask questions about any patient in our synthetic cohort (P1001 - P1007)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted PHI • Protected Mode</span>
        </div>
      </div>

      {/* Input row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all"
      >
        <input
          type="text"
          placeholder={
            isPatient
              ? 'e.g., What does my AMH value mean? When is my trigger shot?'
              : 'e.g., Tell me about Priya Sharma, what is her AMH and current protocol?'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">
          Try:
        </span>
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(sq);
              handleAsk(sq);
            }}
            className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-white/80 hover:bg-white text-slate-600 hover:text-teal-700 border border-slate-200/80 shadow-2xs transition-colors flex-shrink-0"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Response Box */}
      {reply && (
        <div className="mt-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-xs text-slate-900">AI Clinical Synthesis</span>
            </div>
            <button
              onClick={() => {
                setReply(null);
                setSources([]);
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {reply}
          </div>

          {sources.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Referenced Evidence:</span>
              {sources.map((src, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-slate-50 text-slate-600 rounded-md border border-slate-200"
                >
                  <FileText className="w-3 h-3 text-slate-400" />
                  {src.document_title || 'Clinical Report'} {src.page_number ? `(p.${src.page_number})` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
