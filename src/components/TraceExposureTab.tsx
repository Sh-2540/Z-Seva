/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Route, 
  Wind, 
  Building2, 
  Compass, 
  Layers, 
  Clock, 
  ShieldAlert,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { PollutionEvent } from '../types';

interface TraceExposureTabProps {
  event: PollutionEvent;
  onSendAdvisory: (receptorId: string) => void;
  initialSubTab?: 'forward' | 'backward' | 'receptors';
}

export const TraceExposureTab: React.FC<TraceExposureTabProps> = ({
  event,
  onSendAdvisory,
  initialSubTab = 'forward',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'forward' | 'backward' | 'receptors'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const plume = event.forwardDispersionPlume;
  const backTraj = event.backwardTrajectory;
  const sources = event.probableSourceRegions;

  return (
    <div className="space-y-6">
      
      {/* Evidentiary Protocol Notice Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3.5 text-xs text-slate-900 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-blue-950 uppercase tracking-wide text-[11px]">
            Evidentiary Attribution Protocol & Non-Accusatory Standard
          </div>
          <p className="text-slate-600 leading-relaxed font-sans">
            In compliance with environmental jurisprudence and meteorological standards, VayuTrace formulates rigorous <strong className="text-slate-900 font-bold">“probable source regions”</strong> and <strong className="text-slate-900 font-bold">“evidence-supported hypotheses”</strong>. Trajectory advection estimates atmospheric transport without alleging unverified individual liability.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('forward')}
          className={`pb-2.5 px-3.5 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'forward'
              ? 'border-blue-900 text-blue-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Route className="w-4 h-4 text-blue-900" />
          <span>Forward Dispersion Trajectory</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backward')}
          className={`pb-2.5 px-3.5 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'backward'
              ? 'border-blue-900 text-blue-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-blue-900" />
          <span>Backward Trajectory & Sources</span>
        </button>

        <button
          onClick={() => setActiveSubTab('receptors')}
          className={`pb-2.5 px-3.5 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'receptors'
              ? 'border-blue-900 text-blue-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-900" />
          <span>Sensitive Receptors & Exposure ({event.sensitiveReceptors.length})</span>
        </button>
      </div>

      {/* SubTab 1: Forward Dispersion Plume */}
      {activeSubTab === 'forward' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Route className="w-4 h-4 text-teal-600" />
                Gaussian Atmospheric Plume Parameters
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Pasquill Stability</span>
                  <strong className="text-purple-700 text-base font-extrabold">Class {plume?.stabilityClass || 'F'}</strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Stable Nocturnal Inversion</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Advection Velocity</span>
                  <strong className="text-cyan-800 text-base font-extrabold">{plume?.windSpeedMs || 2.1} m/s</strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Ground surface layer</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Dispersion Axis</span>
                  <strong className="text-teal-800 text-base font-extrabold">
                    {((plume?.windDirectionDeg ?? 315) + 180) % 360}°
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Downwind heading</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Impact Horizon</span>
                  <strong className="text-amber-800 text-base font-extrabold">{plume?.projectedRangeKm || 12} km</strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Estimated reach</span>
                </div>
              </div>

              {/* Isopleths Breakdown */}
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold text-slate-800">
                  Calculated Downwind Isopleths (Ground-Level Concentrations):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plume?.isopleths.map(iso => (
                    <div 
                      key={iso.level}
                      className={`p-3.5 rounded-xl border text-xs ${
                        iso.level === 'extreme'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : iso.level === 'severe'
                          ? 'bg-orange-50 border-orange-200 text-orange-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="font-extrabold uppercase tracking-wider text-[10px]">
                        {iso.level} Zone
                      </div>
                      <div className="text-lg font-black font-mono mt-1">
                        &ge; {iso.concentrationUgM3} µg/m³
                      </div>
                      <div className="text-[10px] opacity-85 mt-1 font-medium">
                        Immediate air purification & N95 advisory mandated.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Explanation card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-xs space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-600" />
              Atmospheric Physics Model
            </h4>
            <p className="text-slate-600 leading-relaxed">
              VayuTrace models plume lateral and vertical spread via Pasquill-Gifford dispersion equations:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-teal-800 text-[11px] leading-relaxed font-bold">
              C(x,y,0) = (Q / &pi;&middot;u&middot;&sigma;_y&middot;&sigma;_z) &times; exp(-y&sup2; / 2&sigma;_y&sup2;)
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              During winter nocturnal inversions (Class F), vertical mixing &sigma;_z is severely suppressed beneath the boundary layer (320m), trapping particulates near ground level.
            </p>
          </div>
        </div>
      )}

      {/* SubTab 2: Backward Trajectory & Source Attribution */}
      {activeSubTab === 'backward' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Probable Source Area Hypotheses */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-600" />
                Probable Source Region Hypotheses
              </h3>

              {sources.map((src, idx) => (
                <div 
                  key={src.name}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      idx === 0 
                        ? 'bg-pink-100 text-pink-800 border border-pink-200' 
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {src.hypothesisLabel}
                    </span>
                    <span className="font-mono text-xs text-slate-600 font-bold">
                      Hypothesis Prior: {Math.round(src.confidenceHypothesis * 100)}%
                    </span>
                  </div>

                  <div className="text-sm font-extrabold text-slate-900">
                    {src.name}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {src.evidenceSummary}
                  </p>
                </div>
              ))}
            </div>

            {/* Backstep Isochrone Log */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Kinematic Backward Advection Steps
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Stepwise inverted wind field trajectory calculating air parcel historical displacement over the preceding 6 hours:
              </p>

              <div className="divide-y divide-slate-100 font-mono text-xs">
                {backTraj.map(step => (
                  <div key={step.hourOffset} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 text-purple-800 flex items-center justify-center font-bold text-xs">
                        T{step.hourOffset}h
                      </span>
                      <div>
                        <div className="font-sans font-bold text-slate-900">
                          {step.probableSourceCluster}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Coords: ({step.lat.toFixed(4)}, {step.lng.toFixed(4)})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-slate-800 font-bold">{step.estimatedHeightMeters}m AGL</div>
                      <div className="text-[10px] text-slate-400">Boundary Layer</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Sensitive Receptors & Population Exposure */}
      {activeSubTab === 'receptors' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Downwind Sensitive Receptors Under Imminent Threat
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated plume collision detection identifying vulnerable hospitals, schools, and high-density wards with estimated arrival times (ETA).
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-xl bg-red-50 text-red-800 border border-red-200 font-bold">
                  Total Population at Risk: {event.sensitiveReceptors.reduce((a, b) => a + b.populationAtRisk, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase bg-slate-50/70">
                    <th className="py-3 px-3.5">Receptor Facility</th>
                    <th className="py-3 px-3.5">Category</th>
                    <th className="py-3 px-3.5">Plume ETA</th>
                    <th className="py-3 px-3.5">Predicted Peak</th>
                    <th className="py-3 px-3.5">Population</th>
                    <th className="py-3 px-3.5">Advisory Status</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {event.sensitiveReceptors.map(rec => {
                    const isAdvisoryActive = rec.status === 'advisory_sent';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-3.5 font-bold text-slate-900">
                          {rec.name}
                        </td>
                        <td className="py-3.5 px-3.5">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {rec.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 font-mono font-extrabold text-red-700">
                          ~{rec.estimatedArrivalTimeMinutes} minutes
                        </td>
                        <td className="py-3.5 px-3.5 font-mono text-slate-800 font-semibold">
                          {rec.predictedPeakConcentration} µg/m³
                        </td>
                        <td className="py-3.5 px-3.5 font-mono text-slate-600">
                          {rec.populationAtRisk.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isAdvisoryActive
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isAdvisoryActive ? 'Emergency Advisory Dispatched' : 'Active Monitoring'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 text-right">
                          <button
                            onClick={() => onSendAdvisory(rec.id)}
                            disabled={isAdvisoryActive}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              isAdvisoryActive
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer'
                            }`}
                          >
                            {isAdvisoryActive ? 'Advisory Active' : 'Issue Alert'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
