/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Binary, 
  Satellite, 
  Cpu, 
  Camera, 
  Wind, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  FileCode, 
  Sparkles, 
  Sliders, 
  Hash, 
  Clock 
} from 'lucide-react';
import { EvidenceItem, EvidenceSourceType, PollutionEvent } from '../types';

interface EvidenceConfidenceTabProps {
  event: PollutionEvent;
  evidence: EvidenceItem[];
  onTriggerSkyTask: () => void;
  onOpenIngestModal: () => void;
}

export const EvidenceConfidenceTab: React.FC<EvidenceConfidenceTabProps> = ({
  event,
  evidence,
  onTriggerSkyTask,
  onOpenIngestModal,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  const filteredEvidence = filterType === 'all'
    ? evidence
    : evidence.filter(e => e.sourceType === filterType);

  const getSourceIcon = (type: EvidenceSourceType) => {
    switch (type) {
      case 'satellite': return <Satellite className="w-4 h-4 text-purple-600" />;
      case 'ground_sensor': return <Cpu className="w-4 h-4 text-emerald-600" />;
      case 'citizen_photo': return <Camera className="w-4 h-4 text-teal-600" />;
      case 'meteorological': return <Wind className="w-4 h-4 text-blue-600" />;
      default: return <Binary className="w-4 h-4 text-amber-600" />;
    }
  };

  const posteriorPct = Math.round(event.posteriorProbability * 100);
  const priorPct = Math.round(event.priorProbability * 100);
  const uncertaintyPct = Math.round(event.uncertaintyScore * 100);

  return (
    <div className="space-y-6">
      
      {/* Top Bayesian Intelligence Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Posterior Confidence Gauge Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-700">
              <Binary className="w-4 h-4 text-blue-900" />
              Bayesian Posterior P(E|D)
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 font-mono text-[11px] font-bold border border-blue-200">
              Log-Odds: {event.bayesianLogOdds > 0 ? `+${event.bayesianLogOdds}` : event.bayesianLogOdds}
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-3">
            <span className="text-4xl font-black tracking-tight text-slate-900 font-mono tabular-nums">
              {posteriorPct}%
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              posteriorPct >= 80 
                ? 'bg-blue-50 text-blue-900 border border-blue-200' 
                : 'bg-slate-100 text-slate-700'
            }`}>
              {posteriorPct >= 80 ? 'Verified High Confidence' : 'Moderate Uncertainty'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden border border-slate-200">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-blue-900"
              style={{ width: `${posteriorPct}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Prior P(E): <strong className="text-slate-800 tabular-nums font-bold">{priorPct}%</strong></span>
            <span>Evidence Streams: <strong className="text-blue-900 tabular-nums font-bold">{event.evidenceCount} Verified</strong></span>
          </div>
        </div>

        {/* Bayesian Uncertainty & "ASK" Trigger */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-700">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                Epistemic Uncertainty Index
              </span>
              <span className="font-mono text-slate-700 font-bold text-sm tabular-nums">{uncertaintyPct}%</span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              {event.uncertaintyScore > 0.20 ? (
                <span>
                  Uncertainty exceeds operational threshold (&gt;22%). Discrepancies between ground telemetry and peripheral dispersion necessitate active ground verification.
                </span>
              ) : (
                <span>
                  Confidence sufficient for regulatory dispatch. Uncertainty is strictly within safe bounds.
                </span>
              )}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Active Tasking Trigger:</span>
            <button
              onClick={onTriggerSkyTask}
              className="px-3.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Issue Sky Task (ASK)</span>
            </button>
          </div>
        </div>

        {/* Evidence Fusion Rigor Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
            <Sliders className="w-4 h-4 text-blue-900" />
            Bayesian Formulation
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Computes authentic log-odds across heterogeneous sensor networks:
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-900 font-bold">
            logit(P) = logit(Prior) + &sum; [ w_i &times; ln(LR_i) ]
          </div>
          <div className="text-[10px] text-slate-500">
            Where <code className="text-slate-800 font-semibold">w_i = Reliability &times; Decay</code> and <code className="text-slate-800 font-semibold">LR_i = P(D|E)/P(D|&not;E)</code>.
          </div>
        </div>
      </div>

      {/* Evidence Ledger Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Ledger Header & Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-900" />
              Heterogeneous Evidence Ledger ({filteredEvidence.length} streams)
            </h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Verified provenance & dynamic source reliability
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
              {['all', 'satellite', 'ground_sensor', 'citizen_photo'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg transition capitalize font-bold cursor-pointer ${
                    filterType === t 
                      ? 'bg-blue-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={onOpenIngestModal}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              + Ingest Stream
            </button>
          </div>
        </div>

        {/* Evidence List Table/Cards */}
        <div className="divide-y divide-slate-100">
          {filteredEvidence.map(item => {
            const isExpanded = expandedEvidenceId === item.id;
            const lrValue = item.likelihoodRatio;
            const reliability = Math.round(item.sourceReliability * 100);

            return (
              <div 
                key={item.id}
                className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                onClick={() => setExpandedEvidenceId(isExpanded ? null : item.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  
                  {/* Source & Description */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                      {getSourceIcon(item.sourceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {item.provenance.dataProvider}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {item.sourceType.toUpperCase()}
                        </span>
                        <span className="text-xs text-emerald-700 flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 font-medium">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{item.location.locationName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Metrics */}
                  <div className="flex items-center gap-6 text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Observed Value</div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {item.observedValue} <span className="text-xs text-slate-500 font-normal">{item.unit}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Likelihood Ratio (LR)</div>
                      <div className={`text-sm font-extrabold ${lrValue > 1 ? 'text-teal-700' : 'text-amber-700'}`}>
                        {lrValue.toFixed(2)}x
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Source Reliability</div>
                      <div className="text-sm font-extrabold text-blue-700">
                        {reliability}%
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Log Contribution</div>
                      <div className="text-sm font-extrabold text-indigo-700">
                        +{item.posteriorWeight.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Provenance Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-teal-600" />
                        Audit Provenance & Cryptographic Signature
                      </div>
                      <div className="font-mono text-[11px] text-slate-600 break-all">
                        Signature: <span className="text-teal-700 font-bold">{item.provenance.hashSignature}</span>
                      </div>
                      <div className="text-slate-600">
                        Source ID: <code className="text-slate-800 font-bold">{item.provenance.sourceId}</code>
                      </div>
                      <div className="text-slate-600">
                        Ingest Protocol: <span className="text-slate-800 font-semibold">{item.provenance.ingestProtocol}</span>
                      </div>
                      {item.notes && (
                        <div className="text-slate-700 italic pt-1 border-t border-slate-200 mt-1">
                          "{item.notes}"
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        Bayesian Weight Breakdown
                      </div>
                      <div className="text-slate-600">
                        Temporal Decay: <strong className="text-slate-800">{item.temporalDecayFactor}</strong> (exponential decay based on time lag)
                      </div>
                      <div className="text-slate-600">
                        Spatial Consistency: <strong className="text-slate-800">{item.spatialConsistencyScore}</strong> (Gaussian distance kernel)
                      </div>
                      {item.cvAnalysis && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 mt-2 shadow-xs">
                          <div className="text-teal-800 font-bold">CV Classification: {item.cvAnalysis.detectedCategory}</div>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            {item.cvAnalysis.explanation} ({Math.round(item.cvAnalysis.confidence * 100)}% conf)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
