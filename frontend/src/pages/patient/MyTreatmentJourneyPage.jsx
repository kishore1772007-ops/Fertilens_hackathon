import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  FileText,
  Activity,
  Heart,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Pill,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { fileService } from '../../services/fileService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ROUTES } from '../../constants/routes';

export default function MyTreatmentJourneyPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [patient, setPatient] = useState(null);
  const [stages, setStages] = useState([]);
  const [currentStageName, setCurrentStageName] = useState('');
  const [events, setEvents] = useState([]);

  // UI state
  const [selectedStageIdx, setSelectedStageIdx] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, clinical_record, appointment, document, followup
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventIds, setExpandedEventIds] = useState(new Set());

  // Default Standard IVF/ART Cycle Roadmap
  const defaultStages = [
    {
      id: 'stage_1',
      name: 'Diagnostic Workup & Baseline Evaluation',
      short_name: 'Workup & Baseline',
      phase_num: 1,
      duration: 'Cycle Days 1 - 3',
      description:
        'Comprehensive baseline hormone testing (AMH, FSH, Estradiol), infectious panels, and transvaginal ultrasound to assess ovarian reserve (AFC).',
      key_actions: [
        'Transvaginal Ultrasound (Antral Follicle Count)',
        'Baseline Bloodwork (AMH, FSH, LH, E2, TSH, Prolactin)',
        'Clinical consultation & personalized protocol formulation'
      ],
      patient_tips:
        'Stay well-hydrated before lab draws. Prepare questions regarding protocol selection with your physician.'
    },
    {
      id: 'stage_2',
      name: 'Controlled Ovarian Stimulation',
      short_name: 'Ovarian Stimulation',
      phase_num: 2,
      duration: '8 - 12 Days',
      description:
        'Daily subcutaneous gonadotropin therapy (rFSH / hMG) to stimulate synchronous growth of multiple ovarian follicles for egg maturation.',
      key_actions: [
        'Daily hormone injections administered at a consistent evening time',
        'Serial folliculometry ultrasound checks every 2-3 days',
        'Frequent serum estradiol (E2) monitoring'
      ],
      patient_tips:
        'Store gonadotropins at appropriate temperatures. Avoid high-impact exercise to protect growing ovaries from torsion.'
    },
    {
      id: 'stage_3',
      name: 'Ovulation Trigger & Pre-Retrieval Prep',
      short_name: 'Follicle Trigger',
      phase_num: 3,
      duration: 'Precisely 34-36 Hours',
      description:
        'Precision timing injection of hCG or GnRH agonist trigger shot to initiate final oocyte meiosis maturation prior to collection.',
      key_actions: [
        'Exact timing trigger injection (precision within minutes is critical)',
        'Strict midnight fasting instructions (NPO) before retrieval',
        'Pre-anesthesia evaluation and instructions'
      ],
      patient_tips:
        'Set multiple alarms for trigger time. Confirm collection center arrival time and escort driver for discharge.'
    },
    {
      id: 'stage_4',
      name: 'Oocyte Retrieval & Semen Collection',
      short_name: 'Egg Retrieval (OPU)',
      phase_num: 4,
      duration: 'Day 0',
      description:
        'Minor outpatient procedure using ultrasound-guided follicular aspiration under mild sedation, alongside partner semen preparation.',
      key_actions: [
        'Transvaginal aspiration procedure (approx. 15-25 minutes)',
        'Immediate embryologist identification & counting of mature oocytes',
        'Sperm washing, concentration, and density gradient preparation'
      ],
      patient_tips:
        'Wear loose, comfortable clothing. Plan for full rest with an electrolyte drink and light meal post-procedure.'
    },
    {
      id: 'stage_5',
      name: 'Fertilization & Embryo Culture',
      short_name: 'Fertilization & Culture',
      phase_num: 5,
      duration: 'Days 1 - 6',
      description:
        'Insemination via ICSI or conventional IVF, followed by state-of-the-art incubation to monitor cleavage and Day 5/6 blastocyst progression.',
      key_actions: [
        'Day 1 fertilization assessment (normal two pronuclei - 2PN)',
        'Day 3 cleavage progression evaluation',
        'Day 5/6 blastocyst grading and optional PGT-A biopsy/freezing'
      ],
      patient_tips:
        'Your clinical embryology team will provide structured telephone or portal updates on embryo cell division.'
    },
    {
      id: 'stage_6',
      name: 'Embryo Transfer',
      short_name: 'Embryo Transfer',
      phase_num: 6,
      duration: 'Day 3 or Day 5',
      description:
        'Gentle catheter-guided placement of selected high-grade blastocyst into the receptive endometrial cavity under ultrasound guidance.',
      key_actions: [
        'Mild full-bladder preparation for acoustic window during ultrasound',
        'Aseptic catheter placement through cervix into middle uterine cavity',
        'Confirmation by embryologist that catheter is completely clear'
      ],
      patient_tips:
        'Drink 16-20 oz of water 45 minutes prior. The transfer is painless and resembles a routine pap smear.'
    },
    {
      id: 'stage_7',
      name: 'Luteal Phase Support & Pregnancy Confirmation',
      short_name: 'Luteal Support & Test',
      phase_num: 7,
      duration: '10 - 14 Days Post-Transfer',
      description:
        'Progesterone and estrogen supplementation to support implantation, concluding with definitive serum Beta-hCG blood test.',
      key_actions: [
        'Consistent daily progesterone (vaginal suppository or intramuscular)',
        'Gentle daily routine; avoiding hot baths, saunas, and strenuous exercise',
        'Serum Quantitative Beta-hCG blood draw at clinic'
      ],
      patient_tips:
        'Do not take early urine pregnancy tests as residual trigger medication can cause false positives. Trust the official blood draw.'
    }
  ];

  const fetchJourneyData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch timeline & journey from API
      let journeyData = null;
      try {
        const timeRes = await apiClient.get('/patients/me/timeline');
        journeyData = timeRes.data;
      } catch {
        // Fallback to /dashboard/patient
        const dashRes = await apiClient.get('/dashboard/patient');
        const pat = dashRes.data.patient || {};
        journeyData = {
          patient: pat,
          current_stage: pat.treatment_stage,
          stages: defaultStages,
          events: [
            ...(dashRes.data.recent_records || []).map((r) => ({
              id: r.record_id || r._id,
              event_type: 'clinical_record',
              subtype: r.record_type,
              title: r.title,
              timestamp: r.date || r.created_at,
              summary: r.notes || r.clinical_summary,
              doctor_name: r.doctor_name
            })),
            ...(dashRes.data.upcoming_appointments || []).map((a) => ({
              id: a.appointment_id || a._id,
              event_type: 'appointment',
              subtype: a.appointment_type,
              title: a.title,
              timestamp: a.start_time,
              summary: `Scheduled appointment at ${a.location || 'Clinic'}`,
              status: a.status
            })),
            ...(dashRes.data.approved_documents || []).map((d) => ({
              id: d.document_id || d._id,
              event_type: 'document',
              subtype: d.document_type || 'PDF Upload',
              title: d.title,
              timestamp: d.created_at,
              summary: `Approved file: ${d.original_filename}`,
              approved: true
            })),
            ...(dashRes.data.pending_followups || []).map((f) => ({
              id: f.followup_id || f._id,
              event_type: 'followup',
              subtype: f.category,
              title: f.title,
              timestamp: f.due_date,
              summary: f.description,
              status: f.status
            }))
          ]
        };
      }

      const activeStages = journeyData.stages && journeyData.stages.length > 0 ? journeyData.stages : defaultStages;
      setStages(activeStages);
      setPatient(journeyData.patient || {});
      const cStage = journeyData.current_stage || journeyData.patient?.treatment_stage || defaultStages[1].name;
      setCurrentStageName(cStage);

      // Match current stage index
      const matchedIdx = activeStages.findIndex(
        (s) =>
          s.name.toLowerCase().includes(cStage.toLowerCase()) ||
          cStage.toLowerCase().includes(s.name.toLowerCase()) ||
          s.short_name.toLowerCase().includes(cStage.toLowerCase())
      );
      setSelectedStageIdx(matchedIdx !== -1 ? matchedIdx : 1);

      const evs = journeyData.events || [];
      // Sort newest first
      evs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setEvents(evs);

      // Default expand top 2 events
      const topIds = new Set(evs.slice(0, 2).map((e) => e.id));
      setExpandedEventIds(topIds);
    } catch (err) {
      setError(err.normalizedMessage || 'Unable to load your treatment journey.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJourneyData();
  }, []);

  const toggleExpand = (id) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Determine which stage is active in roadmap
  const activeStageIdx = stages.findIndex(
    (s) =>
      s.name.toLowerCase().includes(currentStageName.toLowerCase()) ||
      currentStageName.toLowerCase().includes(s.name.toLowerCase()) ||
      s.short_name.toLowerCase().includes(currentStageName.toLowerCase())
  );
  const currentIdx = activeStageIdx !== -1 ? activeStageIdx : 1;
  const inspectedStage = stages[selectedStageIdx ?? currentIdx] || stages[currentIdx] || defaultStages[0];

  // Calculate overall progress percentage
  const progressPercent = Math.round(((currentIdx + 0.6) / stages.length) * 100);

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    const matchesFilter = filterType === 'all' || ev.event_type === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ev.title?.toLowerCase().includes(q) ||
      ev.summary?.toLowerCase().includes(q) ||
      ev.subtype?.toLowerCase().includes(q) ||
      ev.doctor_name?.toLowerCase().includes(q) ||
      ev.findings?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const getEventIcon = (type) => {
    switch (type) {
      case 'clinical_record':
        return <Stethoscope className="w-4 h-4 text-emerald-600" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'followup':
        return <CheckSquare className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-sky-600" />;
    }
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'clinical_record':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Medical Record</span>;
      case 'appointment':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">Appointment</span>;
      case 'document':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">Lab &amp; Scan</span>;
      case 'followup':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Care Instruction</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">Timeline Event</span>;
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Active Stage';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Mapping your personalized clinical journey...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-14 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-700 text-white p-7 sm:p-9 shadow-lg shadow-blue-900/15">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/25">
                ART Treatment Roadmap
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active Clinical Cycle
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              My Fertility &amp; Treatment Journey
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Track each milestone of your IVF / ART protocol, from diagnostic workup through stimulation, trigger, egg pickup, and embryo transfer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-left lg:text-right min-w-[200px]">
              <span className="text-[11px] uppercase tracking-wider text-blue-200 font-bold block">
                Current Active Phase
              </span>
              <span className="text-base font-extrabold text-white block mt-0.5">
                {currentStageName}
              </span>
              <span className="text-xs text-blue-100/90 mt-1 block">
                Specialist: {patient?.assigned_doctor_name || 'Dr. Arjun Mehta, MD'}
              </span>
            </div>
            <button
              onClick={() => fetchJourneyData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Roadmap
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
          <button onClick={() => fetchJourneyData()} className="underline font-medium hover:text-rose-800">
            Retry
          </button>
        </div>
      )}

      {/* Cycle Progress & Interactive Roadmap Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Protocol Progression</span>
              <span className="text-xs font-semibold text-slate-400">• Phase {currentIdx + 1} of {stages.length}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              IVF / ART Milestone Sequence
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Estimated Completion</span>
              <div className="text-base font-extrabold text-blue-700">{progressPercent}%</div>
            </div>
            <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stepper Horizontal Scroll */}
        <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin">
          <div className="flex items-start justify-between min-w-[760px] gap-2">
            {stages.map((stg, idx) => {
              const isCompleted = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isUpcoming = idx > currentIdx;
              const isSelected = selectedStageIdx === idx;

              return (
                <button
                  key={stg.id || idx}
                  onClick={() => setSelectedStageIdx(idx)}
                  className={`flex-1 flex flex-col items-center text-center p-3 rounded-2xl transition-all relative group ${
                    isSelected
                      ? 'bg-blue-50/80 border-2 border-blue-500 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {/* Step Connector Line */}
                  {idx < stages.length - 1 && (
                    <div
                      className={`absolute top-6 left-1/2 w-full h-0.5 pointer-events-none -z-0 ${
                        idx < currentIdx ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                      style={{ transform: 'translateX(50%)' }}
                    />
                  )}

                  {/* Icon Indicator */}
                  <div
                    className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-blue-500/30'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}

                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                    )}
                  </div>

                  {/* Stage Label */}
                  <div className="mt-2.5 space-y-0.5">
                    <span
                      className={`text-[11px] font-bold block leading-tight ${
                        isCurrent
                          ? 'text-blue-700'
                          : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {stg.short_name || stg.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {stg.duration}
                    </span>
                  </div>

                  {/* Status Tag */}
                  <span
                    className={`mt-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-blue-100 text-blue-800'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCurrent ? 'Current' : isCompleted ? 'Completed' : 'Upcoming'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Deep Dive Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-white border border-blue-100/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  Phase {selectedStageIdx !== null ? selectedStageIdx + 1 : currentIdx + 1} Details
                </span>
                {selectedStageIdx === currentIdx && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Currently In Progress
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{inspectedStage.name}</h3>
              <p className="text-xs text-slate-500">Typical duration: <span className="font-semibold text-slate-700">{inspectedStage.duration}</span></p>
            </div>

            <Link
              to={ROUTES.PATIENT.ASSISTANT}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI Assistant About This Phase
            </Link>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-4 rounded-xl border border-blue-50">
            {inspectedStage.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Clinical Actions */}
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                Key Clinical Milestones in this Phase
              </span>
              <ul className="space-y-2">
                {(inspectedStage.key_actions || []).map((action, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practical Patient Advice & Instructions */}
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                Patient Self-Care &amp; Guidance
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {inspectedStage.patient_tips ||
                  'Follow your individualized medication calendar rigorously. In case of unexpected spotting or discomfort, reach out to your clinical nursing team.'}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Care hotline: <strong className="text-slate-800">+1 (800) 412-FERT</strong></span>
                <Link to={ROUTES.PATIENT.APPOINTMENTS} className="text-blue-600 font-semibold hover:underline">
                  View Visits &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Care Milestones & Chronological Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Chronological Care Timeline</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every consultation, lab scan, ultrasound report, and medication checkpoint in your journey
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notes, doctors, or tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Activities', count: events.length },
            { id: 'clinical_record', label: 'Consultations & Notes', count: events.filter((e) => e.event_type === 'clinical_record').length },
            { id: 'appointment', label: 'Appointments', count: events.filter((e) => e.event_type === 'appointment').length },
            { id: 'document', label: 'Scans & Reports', count: events.filter((e) => e.event_type === 'document').length },
            { id: 'followup', label: 'Care Instructions', count: events.filter((e) => e.event_type === 'followup').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterType === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Timeline Event Feed */}
        <div className="relative pt-2">
          {filteredEvents.length > 0 ? (
            <div className="space-y-6 before:absolute before:inset-0 before:left-5 before:h-full before:w-0.5 before:bg-slate-200/80">
              {filteredEvents.map((ev, index) => {
                const isExpanded = expandedEventIds.has(ev.id);
                return (
                  <div key={ev.id || index} className="relative flex items-start gap-4 group">
                    {/* Event Icon Marker */}
                    <div className="relative z-10 w-10 h-10 rounded-2xl bg-white border-2 border-slate-200 group-hover:border-blue-500 flex items-center justify-center shadow-sm flex-shrink-0 transition-colors">
                      {getEventIcon(ev.event_type)}
                    </div>

                    {/* Event Content Card */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getEventBadge(ev.event_type)}
                          <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                          {ev.status && <StatusBadge status={ev.status} size="xs" />}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {formatDate(ev.timestamp)}
                        </span>
                      </div>

                      {/* Summary Text */}
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ev.summary || 'Clinical record noted in patient timeline.'}
                      </p>

                      {/* Doctor / Clinician attribution */}
                      {ev.doctor_name && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                          <span>Logged by: <strong className="text-slate-700">{ev.doctor_name}</strong></span>
                        </div>
                      )}

                      {/* Collapsible Findings & Clinical Plan */}
                      {(ev.findings || ev.plan || ev.notes) && (
                        <div>
                          <button
                            onClick={() => toggleExpand(ev.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1"
                          >
                            <span>{isExpanded ? 'Hide clinical notes' : 'View physician notes & plan'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs text-slate-700 space-y-2">
                              {ev.findings && (
                                <div>
                                  <strong className="text-slate-900 block font-semibold">Clinical Findings:</strong>
                                  <p className="mt-0.5 text-slate-600">{ev.findings}</p>
                                </div>
                              )}
                              {ev.plan && (
                                <div>
                                  <strong className="text-slate-900 block font-semibold">Care Plan:</strong>
                                  <p className="mt-0.5 text-slate-600">{ev.plan}</p>
                                </div>
                              )}
                              {ev.notes && (
                                <div>
                                  <strong className="text-slate-900 block font-semibold">Physician Notes:</strong>
                                  <p className="mt-0.5 text-slate-600">{ev.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Document Action Button */}
                      {ev.event_type === 'document' && (
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            onClick={() => fileService.viewFile(ev.id, ev.title || 'report.pdf')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Attached Document
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Clock className="w-10 h-10 mx-auto text-slate-300" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700">No Events Matching Current Filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try switching the category tab above or clearing your search term to see more history.
                </p>
              </div>
              {filterType !== 'all' && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
