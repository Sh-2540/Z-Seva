/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Wind, 
  Binary, 
  Send, 
  RotateCw, 
  Activity
} from 'lucide-react';

interface ArchitectureInfoModalProps {
  onClose: () => void;
}

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200 shadow-xs">
              <Wind className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                VayuTrace Architecture & Scientific Methodology
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                “VayuTrace asks for evidence, traces the plume, guides action, and proves it worked.”
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700 max-h-[80vh] overflow-y-auto scrollbar-thin">
          
          {/* Section 1: The 10 Essential Questions */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              1. The 10 Questions Answered by VayuTrace
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              Traditional AQI apps only state <em>“What is the AQI?”</em>. VayuTrace operationalizes climate intelligence:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                1. Where is the event happening?
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                2. How confident are we it is real? (Bayesian P)
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                3. What evidence supports it? (Ledger)
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                4. What is the probable source region?
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                5. Where will the plume move? (Forward)
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                6. Which sensitive receptors are exposed?
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                7. What evidence should we collect? (ASK)
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                8. What action should an authority take?
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                9. Did the action change the outcome?
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold">
                10. What evidence proves or disproves it?
              </div>
            </div>
          </div>

          {/* Section 2: Bayesian Log-Odds Fusion (Anti-Arbitrary Rule) */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="font-extrabold text-sm text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-cyan-600" />
              2. Rigorous Bayesian Evidence Fusion (No Arbitrary Formula)
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              VayuTrace strictly forbids arbitrary point additions (+20 satellite, +25 sensor). Evidence fusion follows authentic Bayes' Theorem in log-odds formulation:
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-teal-900 text-xs font-bold">
              logit(P(Event | D)) = logit(P(Event)) + &sum; [ Reliability_i &times; Decay_i &times; ln(LR_i) ]
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Where <code className="text-slate-800 font-bold">LR_i = P(D_i | Event) / P(D_i | &not;Event)</code> is the evidence likelihood ratio, and <code className="text-slate-800 font-bold">Reliability_i</code> is dynamically computed from continuous Beta distributions.
            </p>
          </div>

          {/* Section 3: The "ASK" Capability & Active Sensing */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="font-extrabold text-sm text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-4 h-4 text-amber-600" />
              3. The "ASK" Capability (Sky Tasking)
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              Rather than passively suffering sensor voids or high uncertainty, VayuTrace formulates targeted Sky Tasks (e.g. <em>“Capture a north-facing sky photo along 335° azimuth between 16:00–17:00”</em>). Observations are classified by Computer Vision, EXIF-stripped, and location-fuzzed for privacy.
            </p>
          </div>

          {/* Section 4: Difference-in-Differences Causal Proof */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="font-extrabold text-sm text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCw className="w-4 h-4 text-emerald-600" />
              4. Econometric Causal Proof (ACT &rarr; ASK AGAIN &rarr; PROVE)
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              To verify whether municipal interventions (mist cannons, industrial shutdown, construction halt) actually worked, VayuTrace constructs a counterfactual timeline using Difference-in-Differences (DiD) against un-treated upwind control stations, generating Welch p-values and cryptographic compliance hashes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-700/15 cursor-pointer transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
