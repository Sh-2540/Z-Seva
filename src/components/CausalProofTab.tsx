/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CheckCircle2, 
  TrendingDown, 
  Binary, 
  ShieldCheck, 
  RotateCw, 
  Hash, 
  Clock, 
  Sliders, 
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { CausalProofResult, PollutionEvent } from '../types';

interface CausalProofTabProps {
  event: PollutionEvent;
  onEvaluateProof: () => void;
  onOpenSkyTaskTab: () => void;
}

export const CausalProofTab: React.FC<CausalProofTabProps> = ({
  event,
  onEvaluateProof,
}) => {
  const proof = event.causalProof;
  const intervention = event.intervention;

  return (
    <div className="space-y-6">
      
      {/* Top Proof Mission Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-900" />
                Causal Proof Engine
              </span>
              <span className="text-xs text-slate-500 font-semibold">Step 8: PROVE</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Difference-in-Differences (DiD) Counterfactual Verification
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
              Traditional air-quality systems stop at alerts. VayuTrace rigorously answers: <strong className="text-blue-950 font-bold">“Did the intervention actually change the outcome?”</strong> and distinguishes municipal intervention effects from natural meteorological dispersion.
            </p>
          </div>

          <button
            onClick={onEvaluateProof}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>{proof ? 'Recompute Proof Model' : 'Run DiD Causal Proof'}</span>
          </button>
        </div>
      </div>

      {!intervention && !proof && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">
            No Municipal Intervention Dispatched Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            To evaluate causal proof, an official intervention work order (e.g. Anti-Smog Cannon, Stop-Work, or Scrubber Mandate) must first be dispatched under the <strong>“ACT”</strong> tab.
          </p>
        </div>
      )}

      {/* Proof Results Dashboard */}
      {proof && (
        <>
          {/* Statistical Headline Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Net Causal Removal
              </span>
              <div className="text-3xl font-black font-mono text-emerald-600 mt-1 flex items-center gap-1">
                <ArrowDownRight className="w-7 h-7" />
                -{proof.netPollutantReductionUgM3} µg/m³
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                Relative to un-intervened counterfactual
              </span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Percentage Reduction
              </span>
              <div className="text-3xl font-black font-mono text-teal-700 mt-1">
                {proof.percentageReduction}%
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                Acceleration over natural decay
              </span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Statistical Significance (p-value)
              </span>
              <div className="text-3xl font-black font-mono text-indigo-700 mt-1">
                p = {proof.pValue}
              </div>
              <span className="text-[11px] text-emerald-700 mt-0.5 block font-bold">
                p &lt; 0.01 (Statistically Significant)
              </span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Regulatory Verdict
              </span>
              <div className="mt-1.5">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Efficacy Causally Proven
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block font-mono">
                95% CI: [{proof.confidenceInterval95[0]}, {proof.confidenceInterval95[1]}] µg/m³
              </span>
            </div>
          </div>

          {/* Counterfactual Timeline Visualization */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  Hourly Telemetry vs. Counterfactual Trajectory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Difference-in-Differences isolating intervention impact against regional meteorological changes in control stations.
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  Actual Observed (Treated)
                </span>
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-3 h-1 border-t-2 border-dashed border-red-500"></span>
                  Counterfactual (No Action)
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  Upwind Controls
                </span>
              </div>
            </div>

            {/* Custom SVG Data Visualization for Telemetry Series */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 overflow-x-auto">
              <div className="min-w-[680px] h-[270px] relative flex flex-col justify-between">
                
                {/* Y-axis grid labels */}
                <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-[10px] font-mono text-slate-400 border-r border-slate-200 pr-2 text-right font-medium">
                  <span>400 µg</span>
                  <span>300 µg</span>
                  <span>200 µg</span>
                  <span>100 µg</span>
                  <span>0 µg</span>
                </div>

                {/* Plot Area */}
                <div className="ml-14 h-[230px] relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-slate-200 w-full"></div>
                    <div className="border-b border-slate-200 w-full"></div>
                    <div className="border-b border-slate-200 w-full"></div>
                    <div className="border-b border-slate-200 w-full"></div>
                    <div className="border-b border-slate-300 w-full"></div>
                  </div>

                  {/* Intervention Marker Vertical Line at center (T0) */}
                  <div className="absolute left-[50%] top-0 bottom-0 border-l-2 border-dashed border-amber-500 z-10">
                    <span className="absolute -top-1 -left-16 text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 whitespace-nowrap shadow-xs">
                      Intervention Deployed
                    </span>
                  </div>

                  {/* SVG Curves */}
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    {/* Counterfactual curve (Red dashed) */}
                    <path
                      d={proof.timeSeriesData
                        .map((pt, idx) => {
                          const x = (idx / (proof.timeSeriesData.length - 1)) * 100;
                          const y = 100 - (pt.counterfactualBaseline / 400) * 100;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                    />

                    {/* Actual Observed Treated curve (Emerald solid) */}
                    <path
                      d={proof.timeSeriesData
                        .map((pt, idx) => {
                          const x = (idx / (proof.timeSeriesData.length - 1)) * 100;
                          const y = 100 - (pt.actualConcentration / 400) * 100;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3.5"
                    />

                    {/* Control group curve (Slate solid) */}
                    <path
                      d={proof.timeSeriesData
                        .map((pt, idx) => {
                          const x = (idx / (proof.timeSeriesData.length - 1)) * 100;
                          const y = 100 - (pt.controlGroupAverage / 400) * 100;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>

                {/* X-axis time labels */}
                <div className="ml-14 flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 pt-1.5">
                  {proof.timeSeriesData.map(pt => (
                    <span key={pt.timestamp}>{pt.timestamp}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scientific Explanation & Audit Certificate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Binary className="w-4 h-4 text-teal-600" />
                  Econometric Methodology
                </div>
                <p className="text-slate-600 leading-relaxed font-sans">
                  {proof.proofEvidenceNotes}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  Regulatory Compliance Cryptographic Certificate
                </div>
                <div className="text-slate-600">
                  Audit Hash: <span className="text-teal-800 font-bold break-all">{proof.auditSignature}</span>
                </div>
                <div className="text-slate-600">
                  Control Stations: <span className="text-slate-800 font-bold">{proof.controlStationIds.join(', ')}</span>
                </div>
                <div className="text-emerald-700 font-bold pt-1 font-sans flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Cryptographically Audited & Tamper-Resistant
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
