import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  MoreVertical,
  Paperclip,
  Mic,
  MicOff,
  ChevronLeft,
  FileText,
  Activity,
  Heart,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../services/apiClient';
import { ClinicalMarkdown } from '../../components/chat/ClinicalMarkdown';
import { ROUTES } from '../../constants/routes';

export default function PatientAssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'init-welcome',
      sender: 'assistant',
      isWelcome: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const samplePrompts = [
    'What was my AMH result?',
    'Explain my follicle count',
    'When is my next clinical appointment?',
    'What medications are currently scheduled?'
  ];

  // Fetch patient profile for cycle context
  useEffect(() => {
    apiClient
      .get('/dashboard/patient')
      .then((res) => {
        if (res.data?.patient) setPatientInfo(res.data.patient);
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast('Speech recognition is supported in modern Chrome and Edge browsers.', { icon: '🎙️' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast('Listening... Speak your fertility question', { icon: '🎙️' });
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = async (customText = null) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: userTime
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/chat/message', {
        message: textToSend,
        session_id: sessionId
      });

      if (res.data.session_id) setSessionId(res.data.session_id);

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Check if reply discusses AMH or ovarian reserve to trigger gauge
      const mentionsAmh =
        /amh|anti-m[uü]llerian|ovarian reserve/i.test(textToSend) ||
        /amh|anti-m[uü]llerian/i.test(res.data.reply);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: res.data.reply,
          sources: res.data.sources || [],
          timestamp: replyTime,
          hasGauge: mentionsAmh
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          sender: 'assistant',
          text: "I could not retrieve your records at this moment. Please try asking again shortly or consult your clinical care team directly.",
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const restartChat = () => {
    setSessionId(null);
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        isWelcome: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    toast.success('Conversation restarted');
  };

  return (
    <div className="flex justify-center items-center py-2 sm:py-6 min-h-[calc(100vh-6rem)]">
      {/* Mobile Device Canvas Container */}
      <div className="relative w-full max-w-[440px] md:max-w-[480px] h-[92vh] max-h-[920px] bg-[#f8fbff] flex flex-col shadow-2xl overflow-hidden border border-slate-200/90 sm:rounded-[44px]">
        
        {/* BEGIN: MainHeader */}
        <header className="px-4 py-3 bg-white/95 backdrop-blur-md border-b border-blue-50/80 shadow-xs z-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Back Navigation Button */}
            <button
              onClick={() => navigate(ROUTES.PATIENT.DASHBOARD)}
              aria-label="Go back"
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 active:scale-95 transition-all rounded-lg hover:bg-slate-50"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* Brand Avatar with Heart Emblem */}
            <div className="relative w-10 h-10 flex-shrink-0" data-purpose="brand-avatar">
              <svg className="w-full h-full shadow-xs rounded-xl" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#2563EB" height="48" rx="14" width="48" />
                <path d="M24 35.2L22.26 33.62C16.1 28.02 12 24.3 12 19.7C12 15.96 14.96 13 18.7 13C20.81 13 22.84 13.98 24 15.54C25.16 13.98 27.19 13 29.3 13C33.04 13 36 15.96 36 19.7C36 24.3 31.9 28.02 25.74 33.64L24 35.2Z" fill="white" />
                <circle cx="33" cy="15" fill="#60A5FA" r="3" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            {/* Assistant Title & Status */}
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-bold text-[15px] leading-tight text-slate-900 tracking-tight">
                  FertiLens Care Assistant
                </h1>
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

          {/* Action Icons: Voice & Reset */}
          <div className="flex items-center space-x-1">
            <button
              onClick={restartChat}
              title="Restart Conversation"
              className="p-2 text-slate-400 hover:text-blue-600 active:scale-95 transition-colors rounded-full hover:bg-blue-50"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(ROUTES.PATIENT.DOCUMENTS)}
              title="View Documents"
              className="p-2 text-slate-400 hover:text-slate-700 active:scale-95 transition-colors rounded-full hover:bg-slate-100"
              type="button"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </header>
        {/* END: MainHeader */}

        {/* BEGIN: ChatScrollArea */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-scroll bg-[#f8fbff]" id="chat-messages">
          {/* Timestamp Divider */}
          <div className="flex justify-center my-1">
            <span className="text-[11px] font-medium tracking-wide uppercase px-3 py-1 rounded-full bg-slate-200/70 text-slate-600">
              Today • {patientInfo?.treatment_stage || 'Active Treatment Protocol'}
            </span>
          </div>

          {messages.map((m) => {
            if (m.isWelcome) {
              return (
                <section key={m.id} className="flex items-start space-x-3" data-purpose="welcome-banner">
                  {/* Circular Blue Heart Emblem */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm mt-0.5">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>

                  {/* Bordered Welcome Card */}
                  <div className="flex-1 bg-white border border-blue-100 rounded-2xl p-4 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-start space-x-2.5 mb-2.5">
                      <span className="w-1.5 h-4.5 bg-blue-600 rounded-full mt-0.5 inline-block flex-shrink-0" />
                      <h2 className="text-sm font-bold text-slate-900 leading-snug">
                        Welcome to your FertiLens Care Assistant
                      </h2>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed font-normal mb-3">
                      I am here to help you navigate your fertility journey. I can explain your lab results, upcoming visit preparation, and medication schedule in clear, comforting language.
                    </p>

                    {/* Suggested Questions Section */}
                    <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/60">
                      <p className="text-[12px] font-semibold text-slate-700 mb-2">Try asking:</p>
                      <ul className="space-y-1.5 text-[12.5px] text-slate-600">
                        {samplePrompts.map((p, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleSend(p)}
                            className="flex items-center space-x-2 cursor-pointer hover:text-blue-700 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                            <span className="italic text-slate-700 hover:text-blue-700 font-medium">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              );
            }

            if (m.sender === 'user') {
              return (
                <div key={m.id} className="flex justify-end items-end space-x-2 pt-1" data-purpose="user-query">
                  <div className="flex flex-col items-end max-w-[85%]">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-br-xs px-4 py-3 shadow-md shadow-blue-500/15">
                      <p className="text-[13.5px] leading-relaxed font-medium whitespace-pre-wrap">
                        {m.text}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 mr-1">
                      {m.timestamp || 'Just now'} • Delivered
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <section key={m.id} className="flex items-start space-x-2.5" data-purpose="assistant-response">
                {/* Assistant Avatar mini badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mt-1 shadow-xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  {/* Main Response Card */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="inline-flex items-center text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        <ShieldCheck className="w-3 h-3 mr-1 text-blue-600" />
                        Verified Clinical Data
                      </span>
                      <span className="text-[11px] text-slate-400">{m.timestamp || '10:24 AM'}</span>
                    </div>

                    {/* Markdown Body */}
                    <div className="text-[13px] text-slate-700 leading-relaxed">
                      <ClinicalMarkdown content={m.text} isPatient={true} />
                    </div>

                    {/* Interactive Visual: AMH Range Gauge (If discussing AMH) */}
                    {m.hasGauge && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100" data-purpose="gauge-visualizer">
                        <div className="flex justify-between items-center text-[11px] font-semibold mb-1.5">
                          <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                            Ovarian Reserve Reference Scale
                          </span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Normal Cohort: 1.0 - 3.5 ng/mL
                          </span>
                        </div>
                        {/* Range Bar */}
                        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="w-1/4 bg-amber-200 border-r border-white" title="Diminished <1.0" />
                          <div className="w-2/4 bg-emerald-300 border-r border-white" title="Normal 1.0 - 3.5" />
                          <div className="w-1/4 bg-blue-400" title="High >3.5" />
                        </div>
                        {/* Markers Label */}
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                          <span>&lt;1.0 Low</span>
                          <span className="text-emerald-700 font-semibold">1.0 - 3.5 Normal</span>
                          <span>&gt;3.5 High</span>
                        </div>
                      </div>
                    )}

                    {/* Sources Attribution */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Verified from:</span>
                        {m.sources.map((src, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200/60"
                          >
                            <FileText className="w-3 h-3 text-blue-500" />
                            {src.document_title || 'Official Clinical Report'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Action Buttons */}
                    <div className="mt-3.5 flex flex-wrap gap-2 pt-2 border-t border-slate-100/70">
                      <Link
                        to={ROUTES.PATIENT.DOCUMENTS}
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200/80 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Lab Report PDF</span>
                      </Link>
                      <button
                        onClick={() => handleSend("Explain my current medications")}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                        type="button"
                      >
                        <span>Ask Medication Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          {/* Loading Indicator Bubble */}
          {loading && (
            <section className="flex items-start space-x-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mt-1 shadow-xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-sm flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs font-semibold text-slate-600 ml-1">
                  Retrieving your clinical care details...
                </span>
              </div>
            </section>
          )}

          <div ref={messagesEndRef} />
        </main>
        {/* END: ChatScrollArea */}

        {/* BEGIN: SuggestedPromptsBar */}
        <div className="bg-white/95 backdrop-blur-md pt-2 pb-2.5 px-3 border-t border-slate-100" data-purpose="suggested-prompts">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 pl-1">
              SUGGESTED:
            </span>
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sp)}
                className="flex-shrink-0 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all px-3.5 py-1.5 rounded-full border border-blue-200/80 whitespace-nowrap"
                type="button"
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
        {/* END: SuggestedPromptsBar */}

        {/* BEGIN: InputDock */}
        <footer className="bg-white px-3 pt-2 pb-5 border-t border-slate-100 shadow-floating" data-purpose="bottom-chat-input">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            {/* Input capsule container */}
            <div className="flex-1 flex items-center bg-white rounded-full border-2 border-blue-200/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3 py-1.5 shadow-inner">
              {/* Attachment clip icon */}
              <button
                type="button"
                onClick={() => navigate(ROUTES.PATIENT.DOCUMENTS)}
                aria-label="Attach or view documents"
                title="View Clinical Documents"
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Input field matching reference placeholder */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your appointments, lab results, medications..."
                autoComplete="off"
                className="flex-1 bg-transparent border-0 focus:ring-0 text-[13px] text-slate-800 placeholder-slate-400 px-2 py-1 outline-none"
              />

              {/* Microphone voice dictation button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                aria-label="Use microphone"
                title={isListening ? "Listening... click to stop" : "Speak your message"}
                className={`p-1 transition-colors ${
                  isListening ? 'text-rose-600 animate-pulse' : 'text-slate-400 hover:text-blue-600'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Pill-shaped Ask Button */}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white font-semibold text-xs px-4 py-2.5 rounded-full flex items-center space-x-1.5 shadow-md shadow-blue-500/25 transition-all active:scale-95"
            >
              <span>Ask</span>
              <svg className="w-3.5 h-3.5 transform rotate-45 -mt-0.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </form>

          {/* iOS Home Bar Indicator */}
          <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-3" />
        </footer>
        {/* END: InputDock */}

      </div>
    </div>
  );
}
