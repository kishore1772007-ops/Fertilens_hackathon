import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Activity, FileText, ChevronRight, User, Sparkles, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ROUTES } from '../../constants/routes';

export default function PatientSearchPage() {
  const [query, setQuery] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [minAmh, setMinAmh] = useState('');
  const [maxAmh, setMaxAmh] = useState('');
  const [stage, setStage] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (diagnosis.trim()) params.diagnosis = diagnosis.trim();
      if (minAmh) params.min_amh = parseFloat(minAmh);
      if (maxAmh) params.max_amh = parseFloat(maxAmh);
      if (stage) params.stage = stage;

      const res = await apiClient.get('/patients/search/advanced', { params });
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCondition = (condName) => {
    setDiagnosis(condName);
    setLoading(true);
    setSearched(true);
    apiClient.get('/patients/search/advanced', { params: { diagnosis: condName } })
      .then((res) => setResults(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Advanced Clinical Patient Search</h1>
        <p className="text-sm text-slate-500 mt-1">
          Multi-parameter cohort discovery across demographic, biomarker, and diagnosis criteria
        </p>
      </div>

      {/* Search Criteria Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Patient Identifier or Name</label>
              <div className="relative mt-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma, P1001, MRN-1001..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Clinical Diagnosis Query</label>
              <input
                type="text"
                placeholder="e.g. PCOS, Diminished Ovarian Reserve, Oligospermia..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Min AMH Level (ng/mL)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 1.0"
                value={minAmh}
                onChange={(e) => setMinAmh(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Max AMH Level (ng/mL)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 5.0"
                value={maxAmh}
                onChange={(e) => setMaxAmh(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Treatment Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
              >
                <option value="">Any Stage</option>
                <option value="Initial Consultation">Initial Consultation</option>
                <option value="Ovulation Induction">Ovulation Induction</option>
                <option value="Controlled Ovarian Stimulation">Controlled Ovarian Stimulation</option>
                <option value="Egg Retrieval">Egg Retrieval</option>
                <option value="Embryo Transfer Prep">Embryo Transfer Prep</option>
              </select>
            </div>
          </div>

          {/* Quick Condition Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Quick Filter:
            </span>
            {['PCOS', 'Diminished Ovarian Reserve', 'Male Factor', 'Endometriosis', 'Tubal Factor'].map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => handleQuickCondition(cond)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-full transition-colors"
              >
                {cond}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setDiagnosis('');
                setMinAmh('');
                setMaxAmh('');
                setStage('');
                setResults([]);
                setSearched(false);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Execute Search
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {searched ? `Found ${results.length} Matching Patient(s)` : 'Search Results'}
          </h2>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((patient) => {
              const pId = patient.patient_id;
              return (
                <div
                  key={pId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                        {(patient.first_name?.[0] || 'P')}
                        {(patient.last_name?.[0] || '')}
                      </div>
                      <div>
                        <Link
                          to={ROUTES.HOSPITAL.patientDetails(pId)}
                          className="font-bold text-slate-900 hover:text-teal-600 text-sm"
                        >
                          {patient.first_name} {patient.last_name}
                        </Link>
                        <p className="text-xs text-slate-500 font-mono">
                          {patient.patient_id} • MRN: {patient.mrn} • {patient.gender}, {patient.age || 32}y
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={patient.status || 'active'} size="xs" />
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Diagnosis:</span>{' '}
                      <span className="text-slate-900">{patient.primary_diagnosis || 'Infertility Evaluation'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Stage:</span>{' '}
                      <span className="text-slate-600">{patient.treatment_stage || 'Active'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-teal-700 font-semibold pt-0.5">
                      <span>AMH: {patient.amh_level ?? '—'} ng/mL</span>
                      <span>FSH: {patient.fsh_level ?? '—'} mIU/mL</span>
                      <span>AFC: {patient.antral_follicle_count ?? '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <Link
                      to={ROUTES.HOSPITAL.patientTimeline(pId)}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Timeline"
                    >
                      <Activity className="w-4 h-4" />
                    </Link>
                    <Link
                      to={ROUTES.HOSPITAL.patientRecords(pId)}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Records"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                    <Link
                      to={ROUTES.HOSPITAL.patientDetails(pId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors"
                    >
                      View 360° Profile
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          searched && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No patients matching the specified criteria.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
