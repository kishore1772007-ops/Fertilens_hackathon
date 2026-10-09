import React from 'react';
import { useParams } from 'react-router-dom';

export default function AIHistorySearchPage() {
  const { patientId } = useParams();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI History Search: {patientId}</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
        Ollama RAG AI Search (Phase D)
      </div>
    </div>
  );
}
