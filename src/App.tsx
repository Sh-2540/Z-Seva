/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VAYUTRACE - Active Pollution Intelligence Platform
 * “VayuTrace asks for evidence, traces the plume, guides action, and proves it worked.”
 */

import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  Binary, 
  Send, 
  Route, 
  Building2, 
  ShieldAlert, 
  RotateCw, 
  CheckCircle2, 
  Sliders, 
  MapPin, 
  PlusCircle, 
  HelpCircle,
  Hash,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { store } from './core/store/VayuTraceStore';
import { Header } from './components/Header';
import { ProductLoopStep, ProductLoopStepper } from './components/ProductLoopStepper';
import { VayuTraceMap } from './components/VayuTraceMap';
import { EvidenceConfidenceTab } from './components/EvidenceConfidenceTab';
import { SkyTaskingTab } from './components/SkyTaskingTab';
import { TraceExposureTab } from './components/TraceExposureTab';
import { ActionInterventionTab } from './components/ActionInterventionTab';
import { CausalProofTab } from './components/CausalProofTab';
import { ReliabilityAuditTab } from './components/ReliabilityAuditTab';
import { SubmitObservationModal } from './components/Modals/SubmitObservationModal';
import { IngestEvidenceModal } from './components/Modals/IngestEvidenceModal';
import { CreateSkyTaskModal } from './components/Modals/CreateSkyTaskModal';
import { ArchitectureInfoModal } from './components/Modals/ArchitectureInfoModal';
import { ActionIntervention, SkyTask } from './types';

export type ActiveTab = 
  | 'detect' 
  | 'confidence' 
  | 'ask' 
  | 'trace' 
  | 'exposure' 
  | 'act' 
  | 'ask_again' 
  | 'prove' 
  | 'audit';

export default function App() {
  // Global Store Subscription
  const [_, setTick] = useState(0);
  useEffect(() => {
    const unsubscribe = store.subscribe(() => setTick(t => t + 1));
    return () => {
      unsubscribe();
    };
  }, []);

  const event = store.getSelectedEvent();
  const evidence = event ? store.getEvidenceForEvent(event.id) : [];
  const weather = store.currentWeather;

  // Active Navigation Step & Tabs
  const [currentStep, setCurrentStep] = useState<ProductLoopStep>('detect');
  const [activeMainTab, setActiveMainTab] = useState<ActiveTab>('detect');
  const [activeScenario, setActiveScenario] = useState<'delhi' | 'mumbai' | 'punjab'>('delhi');

  // Modal States
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [activeSkyTaskIdForSubmit, setActiveSkyTaskIdForSubmit] = useState<string | null>(null);

  // Notification Banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 5000);
  };

  // Sync Stepper click with Main Tab
  const handleSelectStep = (step: ProductLoopStep) => {
    setCurrentStep(step);
    setActiveMainTab(step as ActiveTab);
  };

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveMainTab(tab);
    if (tab !== 'audit') {
      setCurrentStep(tab as ProductLoopStep);
    }
  };

  // Switch Scenario
  const handleScenarioChange = async (scenario: 'delhi' | 'mumbai' | 'punjab') => {
    setActiveScenario(scenario);
    await store.switchScenario(scenario);
    setCurrentStep('detect');
    setActiveMainTab('detect');
    showBanner(`Switched deployment to ${scenario === 'delhi' ? 'Delhi-NCR' : scenario === 'mumbai' ? 'Mumbai Coastal' : 'Punjab Agricultural'} Scenario`);
  };

  // Send Emergency Shelter Advisory to Receptor
  const handleSendAdvisory = (receptorId: string) => {
    if (!event) return;
    const rec = event.sensitiveReceptors.find(r => r.id === receptorId);
    if (rec) {
      rec.status = 'advisory_sent';
      store.auditLedger.recordEntry(
        'EVENT_DETECTED',
        rec.id,
        'Municipal Health Directorate',
        `Dispatched emergency air filtration & sheltering advisory to ${rec.name} (${rec.populationAtRisk} at risk)`
      );
      showBanner(`Emergency advisory dispatched to ${rec.name}`);
    }
  };

  // Dispatch Action
  const handleDispatchAction = (params: {
    authority: ActionIntervention['authority'];
    actionType: ActionIntervention['actionType'];
    title: string;
    targetSector: string;
    assignedUnits: string[];
    expectedImpactDescription: string;
  }) => {
    if (!event) return;
    store.dispatchActionIntervention(event.id, params);
    setCurrentStep('ask_again');
    setActiveMainTab('ask_again');
    showBanner(`Official work order dispatched: "${params.title}". Post-intervention Sky Task created.`);
  };

  // Evaluate Proof
  const handleEvaluateProof = () => {
    if (!event) return;
    store.evaluateCausalProof(event.id);
    setCurrentStep('prove');
    setActiveMainTab('prove');
    showBanner('Causal Difference-in-Differences proof generated successfully.');
  };

  const taskForSubmit = event?.skyTasks.find(t => t.id === activeSkyTaskIdForSubmit);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Global Header */}
      <Header
        weather={weather}
        onOpenIngestModal={() => setShowIngestModal(true)}
        onOpenInfoModal={() => setShowInfoModal(true)}
        activeScenario={activeScenario}
        onScenarioChange={handleScenarioChange}
      />

      {/* 8-Stage Product Loop Stepper */}
      <ProductLoopStepper
        currentStep={currentStep}
        onSelectStep={handleSelectStep}
        event={event}
      />

      {/* Floating Notification Toast */}
      {bannerMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="font-bold">{bannerMessage}</span>
          <button onClick={() => setBannerMessage(null)} className="ml-2 text-slate-400 hover:text-white text-base cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Main Operational Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        
        {/* Active Pollution Event Dossier Header */}
        {event ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 text-xs">
                  <span className="font-bold text-rose-600 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    Active Anomaly
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-700 font-semibold">{event.region}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400 font-mono text-[11px]">{event.id}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {event.title}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-900 flex-shrink-0" />
                  <span>{event.centerLocation.locationName}</span>
                </p>
              </div>

              {/* Clean Key Metrics */}
              <div className="flex items-center gap-2.5">
                <div className="bg-rose-50/80 border border-rose-200/80 px-3 py-1.5 rounded-xl text-center min-w-[85px]">
                  <span className="text-[10px] text-rose-700 uppercase font-bold block">Peak</span>
                  <span className="text-lg font-black text-rose-600 font-mono tabular-nums">{event.observedPeakConcentration}</span>
                  <span className="text-[9px] text-rose-700 block">µg/m³</span>
                </div>
                <div className="bg-blue-50/80 border border-blue-200/80 px-3 py-1.5 rounded-xl text-center min-w-[85px]">
                  <span className="text-[10px] text-blue-900 uppercase font-bold block">Confidence</span>
                  <span className="text-lg font-black text-blue-900 font-mono tabular-nums">{Math.round(event.posteriorProbability * 100)}%</span>
                  <span className="text-[9px] text-blue-800 block">Bayesian</span>
                </div>
                <div className="bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-xl text-center min-w-[85px]">
                  <span className="text-[10px] text-slate-600 uppercase font-bold block">Action</span>
                  <span className="text-xs font-black text-slate-900 block mt-1">{event.intervention ? 'Dispatched' : 'Active'}</span>
                  <span className="text-[9px] text-slate-500 block">Municipal</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Geospatial Intelligence Leaflet Map */}
        <section aria-label="Geospatial Intelligence Map">
          <VayuTraceMap
            event={event}
            onSelectSkyTask={taskId => {
              setActiveSkyTaskIdForSubmit(taskId);
              handleSelectTab('ask');
            }}
            onSelectReceptor={_ => {
              handleSelectTab('exposure');
            }}
          />
        </section>

        {/* All Listed Functions Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto scrollbar-none bg-white px-2 rounded-t-xl border-t border-x shadow-2xs">
          <button
            onClick={() => handleSelectTab('detect')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'detect'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-900" />
            <span>1. Detect</span>
          </button>

          <button
            onClick={() => handleSelectTab('confidence')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'confidence'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Binary className="w-3.5 h-3.5 text-blue-900" />
            <span>2. Confidence</span>
          </button>

          <button
            onClick={() => handleSelectTab('ask')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'ask'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-blue-900" />
            <span>3. Sky Tasks</span>
          </button>

          <button
            onClick={() => handleSelectTab('trace')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'trace'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Route className="w-3.5 h-3.5 text-blue-900" />
            <span>4. Plume Trace</span>
          </button>

          <button
            onClick={() => handleSelectTab('exposure')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'exposure'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-900" />
            <span>5. Exposure</span>
          </button>

          <button
            onClick={() => handleSelectTab('act')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'act'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-900" />
            <span>6. Intervene</span>
          </button>

          <button
            onClick={() => handleSelectTab('ask_again')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'ask_again'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-900" />
            <span>7. Ask Again</span>
          </button>

          <button
            onClick={() => handleSelectTab('prove')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'prove'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-900" />
            <span>8. Causal Proof</span>
          </button>

          <button
            onClick={() => handleSelectTab('audit')}
            className={`py-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'audit'
                ? 'border-blue-900 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-blue-900" />
            <span>9. Audit Ledger</span>
          </button>
        </div>

        {/* Tab Panels */}
        <section className="min-h-[400px]">
          {/* 1. DETECT TAB */}
          {event && activeMainTab === 'detect' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 text-xs">
                      <span className="font-bold text-red-700 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                        Active Anomaly Triggered
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600 font-mono text-[11px] font-bold">Event ID: {event.id}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Step 1: Multi-Sensor Anomaly Ingest & Alert Verification
                    </h2>
                    <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
                      Continuous real-time ingestion flagged an extreme concentration of {event.primaryPollutant} ({event.observedPeakConcentration} µg/m³) at {event.centerLocation.locationName}, exceeding regional baseline by {((event.observedPeakConcentration / event.regionalBaselineConcentration)).toFixed(1)}&times;.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowIngestModal(true)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-blue-900" />
                      <span>Ingest Sensor Telemetry</span>
                    </button>
                    <button
                      onClick={() => handleSelectTab('confidence')}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <span>Proceed to Confidence</span>
                      <Binary className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Anomaly Telemetry Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Primary Pollutant</span>
                  <div className="text-2xl font-black font-mono text-red-600 mt-1">
                    {event.observedPeakConcentration} <span className="text-xs font-normal text-slate-500 font-sans">µg/m³</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {event.primaryPollutant} · {((event.observedPeakConcentration / event.regionalBaselineConcentration)).toFixed(1)}&times; above baseline ({event.regionalBaselineConcentration})
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Bayesian Prior P(E)</span>
                  <div className="text-2xl font-black font-mono text-blue-900 mt-1">
                    {Math.round(event.priorProbability * 100)}%
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Climatological baseline probability
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Atmospheric Stability</span>
                  <div className="text-2xl font-black font-mono text-blue-950 mt-1">
                    Class {weather?.pasquillStabilityClass || 'F'}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Wind: {weather?.windSpeedMs || 2.1} m/s {weather?.windDirectionCompass || 'NW'}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Receptors in Hazard Path</span>
                  <div className="text-2xl font-black font-mono text-amber-700 mt-1">
                    {event.sensitiveReceptors.length} Facilities
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {event.sensitiveReceptors.reduce((a, b) => a + b.populationAtRisk, 0).toLocaleString()} people at risk
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. CONFIDENCE TAB */}
          {event && activeMainTab === 'confidence' && (
            <EvidenceConfidenceTab
              event={event}
              evidence={evidence}
              onTriggerSkyTask={() => {
                handleSelectTab('ask');
                setShowCreateTaskModal(true);
              }}
              onOpenIngestModal={() => setShowIngestModal(true)}
            />
          )}

          {/* 3. SKY TASKS TAB */}
          {event && activeMainTab === 'ask' && (
            <SkyTaskingTab
              event={event}
              onOpenSubmitModal={taskId => setActiveSkyTaskIdForSubmit(taskId)}
              onOpenCreateTaskModal={() => setShowCreateTaskModal(true)}
            />
          )}

          {/* 4. PLUME TRACE TAB */}
          {event && activeMainTab === 'trace' && (
            <TraceExposureTab
              event={event}
              onSendAdvisory={handleSendAdvisory}
              initialSubTab="forward"
            />
          )}

          {/* 5. EXPOSURE TAB */}
          {event && activeMainTab === 'exposure' && (
            <TraceExposureTab
              event={event}
              onSendAdvisory={handleSendAdvisory}
              initialSubTab="receptors"
            />
          )}

          {/* 6. INTERVENE (ACT) TAB */}
          {event && activeMainTab === 'act' && (
            <ActionInterventionTab
              event={event}
              onDispatchAction={handleDispatchAction}
              onProceedToProve={() => {
                store.evaluateCausalProof(event.id);
                handleSelectTab('prove');
              }}
            />
          )}

          {/* 7. ASK AGAIN TAB */}
          {event && activeMainTab === 'ask_again' && (
            <SkyTaskingTab
              event={event}
              onOpenSubmitModal={taskId => setActiveSkyTaskIdForSubmit(taskId)}
              onOpenCreateTaskModal={() => setShowCreateTaskModal(true)}
              filterTaskType="post_intervention_check"
            />
          )}

          {/* 8. CAUSAL PROOF TAB */}
          {event && activeMainTab === 'prove' && (
            <CausalProofTab
              event={event}
              onEvaluateProof={handleEvaluateProof}
              onOpenSkyTaskTab={() => handleSelectTab('ask')}
            />
          )}

          {/* 9. AUDIT LEDGER TAB */}
          {activeMainTab === 'audit' && (
            <ReliabilityAuditTab />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 font-sans">VAYUTRACE</span>
            <span>•</span>
            <span className="font-sans font-medium">Evidence-Driven Climate Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
            <span>Bayesian Fusion v2.4</span>
            <span>Pasquill-Gifford Dispersion</span>
            <span>DiD Econometric Engine</span>
            <span>SHA-256 Custody</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showIngestModal && event && (
        <IngestEvidenceModal
          eventId={event.id}
          onClose={() => setShowIngestModal(false)}
          onIngested={() => {
            setShowIngestModal(false);
            showBanner('New evidence ingested and fused into Bayesian ledger.');
          }}
        />
      )}

      {showCreateTaskModal && event && (
        <CreateSkyTaskModal
          event={event}
          onClose={() => setShowCreateTaskModal(false)}
          onCreated={() => {
            setShowCreateTaskModal(false);
            showBanner('New Active Sensing Sky Task dispatched to field network.');
          }}
        />
      )}

      {activeSkyTaskIdForSubmit && taskForSubmit && (
        <SubmitObservationModal
          task={taskForSubmit}
          onClose={() => setActiveSkyTaskIdForSubmit(null)}
          onSubmitted={() => {
            setActiveSkyTaskIdForSubmit(null);
            showBanner('Citizen observation submitted, classified via Computer Vision, and logged into Bayesian ledger.');
          }}
        />
      )}

      {showInfoModal && (
        <ArchitectureInfoModal onClose={() => setShowInfoModal(false)} />
      )}
    </div>
  );
}
