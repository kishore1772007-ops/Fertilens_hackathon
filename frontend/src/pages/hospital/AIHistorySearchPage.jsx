import React from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, FileSearch, ShieldCheck } from 'lucide-react';
import { InlineChatCard } from '../../components/chat/InlineChatCard';

export default function AIHistorySearchPage() {
  const { patientId } = useParams();
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinical History Search &bull; {patientId}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Query complete historical stimulation records, ultrasounds, and embryology telemetry for patient {patientId}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Encrypted Health Dossier
        </span>
      </div>

      <InlineChatCard isPatient={false} defaultPatientId={patientId} />
    </div>
  );
}
