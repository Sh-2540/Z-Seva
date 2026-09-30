/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  User, 
  Hash, 
  Clock, 
  Sliders, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Layers
} from 'lucide-react';
import { store } from '../core/store/VayuTraceStore';

export const ReliabilityAuditTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'contributors' | 'sensors' | 'audit_ledger'>('contributors');
  const [_, setTick] = useState(0);

  const contributors = store.reliabilityService.getAllContributors();
  const sensors = store.reliabilityService.getAllSensors();
  const auditEntries = store.auditLedger.getEntries().slice().reverse();

  const handleSimulateVerification = (contributorId: string, outcome: boolean) => {
    store.reliabilityService.recordVerificationOutcome(contributorId, outcome, 1.0);
    store.auditLedger.recordEntry(
      'OBSERVATION_SUBMITTED',
      contributorId,
      'Field Patrol Validator',
      `Manual ground verification: Contributor ${contributorId} ${outcome ? 'confirmed (+alpha)' : 'refuted (+beta)'}`
    );
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Reliability Philosophy Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Dynamic Statistical Reliability & Cryptographic Provenance
        </div>
        <h2 className="text-base font-extrabold text-slate-900">
          Bayesian Beta Conjugate Models (No Fake Reputation Points)
        </h2>
        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
          Source reliability in VayuTrace is not an arbitrary video-game score. It is modeled using continuous Beta distributions <strong className="text-slate-900 font-bold">Beta(&alpha;, &beta;)</strong> that update dynamically as contributor observations match ground-truth outcomes, and physical sensor profiles that account for optical drift, calibration age, and peer cross-correlation.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('contributors')}
          className={`pb-2.5 px-3.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'contributors'
              ? 'border-blue-900 text-blue-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4 text-blue-900" />
          <span>Citizen Contributor Reliability ({contributors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sensors')}
          className={`pb-2.5 px-3.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'sensors'
              ? 'border-blue-900 text-blue-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-blue-900" />
          <span>Physical Sensor Drift & Health ({sensors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_ledger')}
          className={`pb-2.5 px-3.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'audit_ledger'
              ? 'border-blue-900 text-blue-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Hash className="w-4 h-4 text-blue-900" />
          <span>Immutable Cryptographic Audit Ledger ({auditEntries.length})</span>
        </button>
      </div>

      {/* Tab 1: Contributors */}
      {activeSubTab === 'contributors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contributors.map(c => {
              const reliabilityPct = Math.round(c.calculatedReliability * 100);

              return (
                <div 
                  key={c.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 font-extrabold font-mono flex items-center justify-center text-sm border border-teal-200">
                        {c.handle.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">{c.handle}</div>
                        <div className="text-[11px] text-slate-400 font-mono">ID: {c.id}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-teal-700">
                        {reliabilityPct}%
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">E[Reliability]</div>
                    </div>
                  </div>

                  {/* Mathematical Beta Distribution Parameters */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans font-bold">&alpha; (Successes)</span>
                      <strong className="text-emerald-700 font-bold">{c.alphaSuccess.toFixed(1)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans font-bold">&beta; (Discrepancies)</span>
                      <strong className="text-amber-700 font-bold">{c.betaFailure.toFixed(1)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans font-bold">95% CI</span>
                      <span className="text-slate-700 text-[11px] font-bold">
                        [{c.confidenceInterval[0]}, {c.confidenceInterval[1]}]
                      </span>
                    </div>
                  </div>

                  {/* Submissions breakdown */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-medium">
                    <span>Submissions: <strong className="text-slate-800">{c.totalSubmissions}</strong></span>
                    <span>Verified: <strong className="text-emerald-700 font-bold">{c.verifiedCount}</strong></span>
                    <span>Rejected: <strong className="text-amber-700 font-bold">{c.rejectedCount}</strong></span>
                  </div>

                  {/* Simulate Ground Truth Verification Action */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px] font-medium">Ground Patrol Feedback:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSimulateVerification(c.id, true)}
                        className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition text-[11px] cursor-pointer"
                      >
                        + Confirm (+&alpha;)
                      </button>
                      <button
                        onClick={() => handleSimulateVerification(c.id, false)}
                        className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 font-bold border border-red-200 transition text-[11px] cursor-pointer"
                      >
                        - Refute (+&beta;)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Sensors */}
      {activeSubTab === 'sensors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensors.map(s => {
              const relPct = Math.round(s.overallReliability * 100);

              return (
                <div 
                  key={s.sensorId}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {s.hardwareClass.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      s.maintenanceStatus === 'optimal'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {s.maintenanceStatus.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{s.stationName}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{s.sensorId}</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans font-medium">Calibration Age:</span>
                      <strong className={s.calibrationAgeDays > 120 ? 'text-amber-700' : 'text-slate-900'}>
                        {s.calibrationAgeDays} days
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans font-medium">Peer Agreement:</span>
                      <strong className="text-cyan-800">
                        {Math.round(s.peerCorrelationScore * 100)}%
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans font-medium">Drift Variance:</span>
                      <strong className="text-slate-800">
                        {s.driftVariance.toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                      <span className="text-slate-700 font-bold font-sans">Overall Reliability:</span>
                      <strong className="text-teal-700 text-sm font-extrabold">{relPct}%</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Cryptographic Audit Ledger */}
      {activeSubTab === 'audit_ledger' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Hash className="w-4 h-4 text-teal-600" />
                Immutable Cryptographic Ledger of Custody
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every event, evidence ingest, sky-task dispatch, and intervention is linked via SHA-256 hashes to prevent post-hoc tampering.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase bg-slate-50/80">
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3.5">Action Type</th>
                  <th className="py-3 px-3.5">Entity ID</th>
                  <th className="py-3 px-3.5">Actor / Authority</th>
                  <th className="py-3 px-3.5">Payload Summary</th>
                  <th className="py-3 px-3.5 font-mono">Current Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {auditEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-3.5 font-mono">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap font-medium">
                      {entry.entityId}
                    </td>
                    <td className="py-3 px-3.5 text-slate-900 font-bold">
                      {entry.actor}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 max-w-xs truncate" title={entry.payloadSummary}>
                      {entry.payloadSummary}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {entry.currentHash.slice(0, 18)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
