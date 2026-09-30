/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Send, 
  Camera, 
  Compass, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Sparkles, 
  PlusCircle, 
  Image as ImageIcon
} from 'lucide-react';
import { CitizenObservation, PollutionEvent, SkyTask } from '../types';

interface SkyTaskingTabProps {
  event: PollutionEvent;
  onOpenSubmitModal: (taskId: string) => void;
  onOpenCreateTaskModal: () => void;
  filterTaskType?: string;
}

export const SkyTaskingTab: React.FC<SkyTaskingTabProps> = ({
  event,
  onOpenSubmitModal,
  onOpenCreateTaskModal,
  filterTaskType,
}) => {
  const visibleTasks = filterTaskType
    ? event.skyTasks.filter(t => t.taskType === filterTaskType)
    : event.skyTasks;

  const [selectedTaskId, setSelectedTaskId] = useState<string>(visibleTasks[0]?.id || event.skyTasks[0]?.id || '');

  React.useEffect(() => {
    if (visibleTasks.length > 0 && !visibleTasks.some(t => t.id === selectedTaskId)) {
      setSelectedTaskId(visibleTasks[0].id);
    }
  }, [filterTaskType, visibleTasks, selectedTaskId]);

  const activeTask = visibleTasks.find(t => t.id === selectedTaskId) || visibleTasks[0] || event.skyTasks[0];

  return (
    <div className="space-y-6">
      
      {/* Active Sensing Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-900" />
                {filterTaskType === 'post_intervention_check' ? 'Step 7: ASK AGAIN' : 'Step 3: ASK'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {filterTaskType === 'post_intervention_check' ? 'Post-Intervention Verification' : 'Active Sensing Crowdsourcing'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {filterTaskType === 'post_intervention_check'
                ? 'Post-Action Dissipation Verification Sensing'
                : 'Sky Tasking & Dynamic Ground Verification'}
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
              {filterTaskType === 'post_intervention_check'
                ? 'Follow-up citizen photo tasks and optical sensors deployed downwind to capture empirical evidence of particulate settling after municipal action.'
                : 'When Bayesian uncertainty is elevated, VayuTrace automatically tasks field observers to verify ground conditions along specific azimuth vectors.'}
            </p>
          </div>

          <button
            onClick={onOpenCreateTaskModal}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New Sky Task</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tasks Selector & Task Inspection Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sky Tasks List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>ACTIVE TASKS ({visibleTasks.length})</span>
            <span>STATUS</span>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              No tasks currently match this category.
            </div>
          ) : (
            visibleTasks.map(task => {
              const isSelected = activeTask?.id === task.id;
              const obsCount = task.submittedObservations.length;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-900 shadow-xs ring-2 ring-blue-900/10'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-black text-blue-950">
                      {task.id}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                      task.status === 'verified'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200'
                        : task.status === 'submitted'
                        ? 'bg-slate-100 text-slate-800 border border-slate-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {task.title}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3 font-mono font-medium">
                    <span className="flex items-center gap-1 text-blue-900 font-semibold">
                      <Compass className="w-3.5 h-3.5 text-blue-900" />
                      {task.targetAzimuthLabel}
                    </span>
                    <span>•</span>
                    <span>{obsCount} observation{obsCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Sky Task Dossier */}
        {activeTask ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              
              {/* Task Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      Task ID: {activeTask.id}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      Target Uncertainty Reduction: <strong className="text-blue-900">-{activeTask.targetUncertaintyReductionPct}%</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {activeTask.title}
                  </h3>
                </div>

                {/* Submit Observation Button */}
                <button
                  onClick={() => onOpenSubmitModal(activeTask.id)}
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Submit Sky Observation</span>
                </button>
              </div>

              {/* Task Telemetry & Guidelines */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-sans font-bold">Required Heading</div>
                  <div className="text-sm font-extrabold text-blue-950 mt-0.5 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-900" />
                    {activeTask.targetAzimuthLabel}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-sans font-bold">Geofence Radius</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {activeTask.requiredRadiusMeters} meters
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-sans font-bold">Min Contributor Trust</div>
                  <div className="text-sm font-extrabold text-blue-950 mt-0.5">
                    &ge; {Math.round(activeTask.minContributorReliability * 100)}% (Beta Prior)
                  </div>
                </div>
              </div>

              {/* Scientific Rationale */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs">
                <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Mathematical Information Rationale:
                </div>
                <p className="text-amber-950/80 leading-relaxed font-sans">
                  {activeTask.rationale}
                </p>
              </div>

              {/* Submitted Citizen Observations Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    Submitted Citizen Observations ({activeTask.submittedObservations.length})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    EXIF Stripped • Geofuzzing &plusmn;1km Active
                  </span>
                </div>

                {activeTask.submittedObservations.length === 0 ? (
                  <div className="text-center py-9 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-xs space-y-2">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-medium text-slate-700">No observations submitted for this task yet.</p>
                    <p className="text-slate-500">
                      Nearby citizen observers can photograph the sky towards {activeTask.targetAzimuthLabel} to reduce uncertainty.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTask.submittedObservations.map(obs => (
                      <div 
                        key={obs.id}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold font-mono text-xs border border-teal-200">
                              {obs.contributorHandle.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {obs.contributorHandle}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                                <span>{new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-sans font-semibold">
                                  Privacy Preserved: {obs.location.locationName}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold">
                              Heading: {obs.compassHeadingDeg ?? activeTask.targetAzimuthDeg}°
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                              Verified Observation
                            </span>
                          </div>
                        </div>

                        {/* Computer Vision & Photo Analysis Result */}
                        {obs.cvResult && (
                          <div className="bg-white p-3.5 rounded-xl border border-teal-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                            <div>
                              <div className="font-bold text-teal-900 uppercase text-[11px] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                Computer Vision Classification: {obs.cvResult.detectedCategory}
                              </div>
                              <div className="text-slate-700 text-[11px] mt-1">
                                {obs.cvResult.explanation}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 font-mono text-xs">
                              <div>
                                <span className="text-slate-400 text-[10px] block font-sans font-bold">Model Conf:</span>
                                <strong className="text-slate-900">{Math.round(obs.cvResult.confidence * 100)}%</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block font-sans font-bold">Opacity:</span>
                                <strong className="text-amber-700">{obs.cvResult.estimatedOpacityPct}%</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block font-sans font-bold">Reliability Delta:</span>
                                <strong className="text-emerald-700">&Delta;&alpha;=+1.0</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
