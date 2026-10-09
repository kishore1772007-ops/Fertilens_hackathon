import React, { useState } from 'react';
import { Bot, Sparkles, Send, ShieldCheck, RefreshCw, User, FileText, Heart } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function PatientAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'assistant',
      text: "### Welcome to your FertiLens Care Assistant\n\nI am here to help you navigate your fertility journey. I can explain your lab results, upcoming visit preparation, and medication schedule in clear, comforting language.\n\nTry asking:\n- *\"What was my AMH result?\"*\n- *\"Explain my follicle count\"*\n- *\"When is my next clinical appointment?\"*\n- *\"What medications are currently scheduled?\"*",
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const sampleQuestions = [
    'What was my AMH result?',
    'Explain my follicle count',
    'When is my next appointment?',
    'What medications are scheduled?'
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
          text: "⚠️ I could not retrieve your records at the moment. Please try again shortly.",
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Care Assistant</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              Personalized & Encrypted
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Confidential guidance and answers based on your official medical records
          </p>
        </div>

        <button
          onClick={() => {
            setSessionId(null);
            setMessages([messages[0]]);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restart Chat
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-sky-50/20">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0 text-xs mt-1">
                  <Bot className="w-4 h-4 text-sky-700" />
                </div>
              )}

              <div className="max-w-[80%] space-y-2">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {m.text}
                </div>

                {m.sources?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pl-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Verified from:</span>
                    {m.sources.map((src, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200"
                      >
                        <FileText className="w-3 h-3 text-slate-400" />
                        {src.document_title || 'Report'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 text-xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0 text-xs">
                <Bot className="w-4 h-4 text-sky-700" />
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-500 ml-1">Consulting your clinical file...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">
            Quick Ask:
          </span>
          {sampleQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="whitespace-nowrap px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-full transition-colors flex-shrink-0"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Ask a question about your IVF cycle or lab results..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-2xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
