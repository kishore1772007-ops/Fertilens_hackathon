import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Minimize2
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export function ChatbotWidget({ isPatient = false, defaultPatientId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const theme = isPatient
    ? {
        primary: 'sky',
        bgButton: 'bg-sky-600 hover:bg-sky-700',
        textAccent: 'text-sky-600',
        badgeBg: 'bg-sky-100 text-sky-800',
        borderAccent: 'border-sky-200',
        bubbleUser: 'bg-sky-600 text-white',
        portalName: 'Patient Care AI'
      }
    : {
        primary: 'teal',
        bgButton: 'bg-teal-600 hover:bg-teal-700',
        textAccent: 'text-teal-600',
        badgeBg: 'bg-teal-100 text-teal-800',
        borderAccent: 'border-teal-200',
        bubbleUser: 'bg-teal-600 text-white',
        portalName: 'Clinical RAG AI'
      };

  const samplePrompts = isPatient
    ? [
        'What was my AMH result?',
        'Explain my follicle count',
        'When is my next visit?',
        'What are my medications?'
      ]
    : [
        'Summarize Priya Sharma P1001',
        "What is Priya's AMH level?",
        'Show Ananya Roy P1002 AFC',
        'Summarize Rahul Verma P1006'
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting = isPatient
        ? "Hello! I am your **FertiLens Care Assistant**. I can help explain your hormone values, ultrasound results, and upcoming visit details based strictly on your verified clinical records."
        : "Welcome to **FertiLens Clinical Assistant**. Ask me any question about our synthetic patient cohort (P1001-P1007) by name or ID (e.g. *Priya Sharma AMH*, *P1002 protocol*).";
      
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: initialGreeting,
          sources: []
        }
      ]);
    }
  }, [isPatient]);

  const handleSend = async (messageText = null) => {
    const textToSend = (messageText || inputValue).trim();
    if (!textToSend || loading) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMessages = [
      ...messages,
      { id: userMsgId, sender: 'user', text: textToSend }
    ];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    try {
      const response = await apiClient.post('/chat/message', {
        message: textToSend,
        session_id: sessionId,
        patient_id: defaultPatientId
      });

      const { reply, session_id: newSessionId, sources } = response.data;
      if (newSessionId) setSessionId(newSessionId);

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          sources: sources || []
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: "⚠️ I encountered an issue connecting to the clinical knowledge base. Please try again in a moment.",
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setSessionId(null);
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: isPatient
          ? "Session cleared. How can I assist you with your treatment cycle today?"
          : "Session reset. Enter a patient name or ID to analyze clinical records.",
        sources: []
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 ${theme.bgButton}`}
          aria-label="Open FertiLens AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-sm font-semibold tracking-wide">FertiLens AI</span>
        </button>
      )}

      {/* Slide-over / Modal Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[590px] max-h-[85vh] bg-white rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <Bot className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm leading-none">FertiLens AI Assistant</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-200 uppercase tracking-wider">
                    {theme.portalName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Strict Ground Truth Evidence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetSession}
                title="Reset conversation"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 text-xs mt-1">
                    <Bot className="w-4 h-4 text-slate-700" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? `${theme.bubbleUser} rounded-tr-none font-medium`
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Sources tag if provided */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pl-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Sources:</span>
                      {msg.sources.map((s, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200"
                        >
                          📄 {s.document_title || 'Document'} {s.page_number ? `(p.${s.page_number})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 text-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 text-xs">
                  <Bot className="w-4 h-4 text-slate-700" />
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-slate-500 ml-1">Analyzing clinical records...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-full transition-colors flex-shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={isPatient ? "Ask a question about your care..." : "Ask about a patient (e.g. Priya Sharma AMH)..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className={`p-2 rounded-xl text-white disabled:opacity-40 transition-colors shadow-sm ${theme.bgButton}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
