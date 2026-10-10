import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RefreshCw,
  FileText,
  Heart,
  ShieldCheck,
  Paperclip,
  Mic,
  MicOff,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../services/apiClient';
import { ClinicalMarkdown } from './ClinicalMarkdown';

export function ChatbotWidget({ isPatient = false, defaultPatientId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const samplePrompts = isPatient
    ? [
        'What was my AMH result?',
        'Explain my follicle count',
        'When is my next clinical appointment?',
        'What medications are currently scheduled?'
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
  }, [messages, isOpen, loading]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-card',
          sender: 'assistant',
          isWelcome: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isPatient]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast('Speech recognition available in Chrome/Edge.', { icon: '🎙️' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast('Listening...', { icon: '🎙️' });
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = async (messageText = null) => {
    const textToSend = (messageText || inputValue).trim();
    if (!textToSend || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: userTime
    };

    setMessages((prev) => [...prev, userMsg]);
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

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const mentionsAmh = /amh|anti-m[uü]llerian|ovarian reserve/i.test(textToSend) || /amh|anti-m[uü]llerian/i.test(reply);

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          sources: sources || [],
          timestamp: replyTime,
          hasGauge: mentionsAmh
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: "I encountered an issue connecting to the clinical knowledge base. Please try asking again in a moment.",
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        isWelcome: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 group"
          aria-label="Open FertiLens Care Assistant"
        >
          <div className="relative">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-blue-600 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-wide">FertiLens Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal Canvas */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[640px] max-h-[88vh] bg-[#f8fbff] rounded-[32px] border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <header className="px-4 py-3 bg-white/95 backdrop-blur-md border-b border-blue-50/80 shadow-xs z-20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* Brand Avatar with Heart Emblem */}
              <div className="relative w-9 h-9 flex-shrink-0" data-purpose="brand-avatar">
                <svg className="w-full h-full shadow-xs rounded-xl" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <rect fill="#2563EB" height="48" rx="14" width="48" />
                  <path d="M24 35.2L22.26 33.62C16.1 28.02 12 24.3 12 19.7C12 15.96 14.96 13 18.7 13C20.81 13 22.84 13.98 24 15.54C25.16 13.98 27.19 13 29.3 13C33.04 13 36 15.96 36 19.7C36 24.3 31.9 28.02 25.74 33.64L24 35.2Z" fill="white" />
                  <circle cx="33" cy="15" fill="#60A5FA" r="3" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div>
                <h2 className="font-bold text-[14px] leading-tight text-slate-900 tracking-tight">
                  FertiLens Care Assistant
                </h2>
                <p className="text-[10px] font-medium text-slate-500 flex items-center mt-0.5">
                  <span>24/7 Care</span>
                  <span className="mx-1 text-slate-300">•</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={resetSession}
                title="Restart chat"
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                type="button"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Messages Feed */}
          <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 chat-scroll bg-[#f8fbff]">
            {/* Timestamp Divider */}
            <div className="flex justify-center my-0.5">
              <span className="text-[10px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                Today • Active Care Session
              </span>
            </div>

            {messages.map((msg) => {
              if (msg.isWelcome) {
                return (
                  <section key={msg.id} className="flex items-start space-x-2.5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xs mt-0.5">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>

                    <div className="flex-1 bg-white border border-blue-100 rounded-2xl p-3.5 shadow-xs">
                      <div className="flex items-start space-x-2 mb-2">
                        <span className="w-1.5 h-4 bg-blue-600 rounded-full mt-0.5 inline-block flex-shrink-0" />
                        <h3 className="text-xs font-bold text-slate-900 leading-snug">
                          Welcome to your FertiLens Care Assistant
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal mb-2.5">
                        I can explain your lab results, upcoming visit preparation, and medication schedule in clear, comforting language.
                      </p>
                      <div className="bg-blue-50/50 rounded-xl p-2.5 border border-blue-100/60">
                        <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Try asking:</p>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {samplePrompts.slice(0, 3).map((p, idx) => (
                            <li
                              key={idx}
                              onClick={() => handleSend(p)}
                              className="flex items-center space-x-1.5 cursor-pointer hover:text-blue-700 transition-colors"
                            >
                              <span className="w-1 h-1 rounded-full bg-blue-600 flex-shrink-0" />
                              <span className="italic text-slate-700 hover:text-blue-700 font-medium text-[11px] truncate">
                                "{p}"
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                );
              }

              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end items-end space-x-2 pt-0.5">
                    <div className="flex flex-col items-end max-w-[85%]">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-br-xs px-3.5 py-2.5 shadow-md shadow-blue-500/15">
                        <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium mt-1 mr-1">
                        {msg.timestamp || 'Just now'} • Delivered
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <section key={msg.id} className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white mt-1 shadow-xs">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-xs">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                        <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          <ShieldCheck className="w-2.5 h-2.5 mr-1 text-blue-600" />
                          Verified Clinical Data
                        </span>
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      </div>

                      <div className="text-xs text-slate-700 leading-relaxed">
                        <ClinicalMarkdown content={msg.text} isPatient={isPatient} />
                      </div>

                      {/* AMH Gauge if applicable */}
                      {msg.hasGauge && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center text-[10px] font-semibold mb-1">
                            <span className="text-slate-500 uppercase tracking-wider text-[9px]">Ovarian Reserve Scale</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] border border-emerald-200">
                              Normal: 1.0 - 3.5 ng/mL
                            </span>
                          </div>
                          <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="w-1/4 bg-amber-200 border-r border-white" />
                            <div className="w-2/4 bg-emerald-300 border-r border-white" />
                            <div className="w-1/4 bg-blue-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}

            {loading && (
              <section className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white mt-1 shadow-xs">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3 shadow-xs flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-semibold text-slate-500 ml-1">Analyzing...</span>
                </div>
              </section>
            )}

            <div ref={messagesEndRef} />
          </main>

          {/* Suggested Prompts Row */}
          <div className="bg-white/95 backdrop-blur-md pt-1.5 pb-2 px-3 border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              SUGGESTED:
            </span>
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sp)}
                className="flex-shrink-0 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all px-2.5 py-1 rounded-full border border-blue-200/80 whitespace-nowrap"
                type="button"
              >
                {sp}
              </button>
            ))}
          </div>

          {/* Bottom Capsule Input Dock */}
          <footer className="bg-white px-3 pt-1.5 pb-4 border-t border-slate-100 shadow-floating">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-1.5"
            >
              <div className="flex-1 flex items-center bg-white rounded-full border-2 border-blue-200/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-2.5 py-1 shadow-inner">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything about appointments, lab results..."
                  autoComplete="off"
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-xs text-slate-800 placeholder-slate-400 px-1 py-1 outline-none"
                />

                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  aria-label="Use microphone"
                  className={`p-1 transition-colors ${
                    isListening ? 'text-rose-600 animate-pulse' : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Pill-shaped Ask Button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white font-semibold text-xs px-3.5 py-2 rounded-full flex items-center space-x-1 shadow-md shadow-blue-500/25 transition-all active:scale-95"
              >
                <span>Ask</span>
                <svg className="w-3 h-3 transform rotate-45 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </footer>
        </div>
      )}
    </>
  );
}
