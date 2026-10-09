import React from 'react';
import { useParams } from 'react-router-dom';

export default function ConsultationBriefPage() {
  const { patientId } = useParams();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Consultation Brief: {patientId}</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
        Consultation Brief Generator (Phase D)
      </div>
    </div>
  );
}
