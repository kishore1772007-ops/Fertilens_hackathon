import React, { useState } from 'react';
import { Bot, Sparkles, Send, ShieldCheck, RefreshCw, User, FileText, Activity, Database, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { ClinicalMarkdown } from '../../components/chat/ClinicalMarkdown';

export default function HospitalAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'assistant',
      text: "### Welcome to the FertiLens Clinical AI Assistant\n\nI am equipped with complete ground-truth access to our verified 7-patient ART clinical cohort (P1001 – P1007), encrypted medical records, and diagnostic scans.\n\nYou can ask clinical inquiries such as:\n- *\"Summarize Priya Sharma (P1001)\"*\n- *\"What is Ananya Roy's AMH level and AFC?\"*\n- *\"Compare protocol response between P1001 and P1002\"*\n- *\"Show latest follicular monitoring ultrasound for P1003\"*",
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const sampleQueries = [
    'Summarize Priya Sharma (P1001)',
    "What is Priya's AMH level and AFC?",
    'Compare protocol response between P1001 and P1002',
    'Show latest follicular ultrasound for P1003',
    'Review Rahul Verma P1006 records',
    'Summarize Sneha Reddy P1007'
  ];

  const handleSend = async (text = null) => {
    const q = (text || input).trim();
    if (!q || loading) return;

    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/chat/message', {
        message: q,
        session_id: sessionId
      });
      if (res.data.session_id) setSessionId(res.data.session_id);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: res.data.reply,
          sources: res.data.sources || []
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          sender: 'assistant',
          text: "⚠️ An error occurred communicating with the clinical intelligence engine. Please try again.",
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Assistant Meta Bar (GetTalky Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100/90 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical AI Assistant</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              FertiLens Live Synthesizer • Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Multi-document clinical synthesis & telemetry across encrypted patient health records
          </p>
        </div>

        <button
          onClick={() => {
            setSessionId(null);
            setMessages([messages[0]]);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 rounded-full transition-all active:scale-95 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New Session
        </button>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-blue-100 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] flex flex-col h-[calc(100vh-14rem)] min-h-[520px] max-h-[820px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-[#f8faff]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs mt-1 shadow-sm shadow-blue-500/20">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className="max-w-[85%] sm:max-w-[80%] space-y-2">
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm font-medium shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-800 border border-blue-100/80 rounded-tl-sm shadow-xs'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  ) : (
                    <ClinicalMarkdown content={m.text} isPatient={false} />
                  )}
                </div>

                {m.sources?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pl-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Grounding Citations:</span>
                    {m.sources.map((src, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200/60"
                      >
                        <FileText className="w-3 h-3 text-blue-500" />
                        {src.document_title || 'Report'} {src.page_number ? `(p.${src.page_number})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 text-xs mt-1 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm shadow-blue-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 bg-white border border-blue-100 rounded-2xl rounded-tl-sm shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs font-semibold text-slate-600 ml-1">Synthesizing clinical health records & scans...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="shrink-0 px-4 sm:px-5 py-2.5 bg-white border-t border-blue-50 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex-shrink-0">
            Suggested:
          </span>
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="whitespace-nowrap px-3.5 py-1 text-xs font-semibold bg-blue-50/80 hover:bg-blue-100/90 text-blue-700 border border-blue-200/60 rounded-full transition-all active:scale-95 flex-shrink-0"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <footer className="shrink-0 p-3 sm:p-4 bg-white border-t border-slate-100 shadow-floating">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <div className="flex-1 flex items-center bg-white rounded-full border-2 border-blue-200/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3 py-1.5 shadow-inner">
              <input
                type="text"
                placeholder="Ask Clinical AI about patient records, scans, AFC, AMH levels (e.g. Priya Sharma P1001)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                className="flex-1 bg-transparent border-0 focus:ring-0 text-[13px] text-slate-800 placeholder-slate-400 px-2 py-1 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white font-semibold text-xs px-4 py-2.5 rounded-full flex items-center space-x-1.5 shadow-md shadow-blue-500/25 transition-all active:scale-95"
            >
              <span>Ask AI</span>
              <svg className="w-3.5 h-3.5 transform rotate-45 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
