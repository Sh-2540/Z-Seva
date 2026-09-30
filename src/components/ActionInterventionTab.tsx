/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Flame, 
  Factory, 
  AlertOctagon, 
  RotateCw,
  FileCheck
} from 'lucide-react';
import { ActionIntervention, PollutionEvent } from '../types';

interface ActionInterventionTabProps {
  event: PollutionEvent;
  onDispatchAction: (params: {
    authority: ActionIntervention['authority'];
    actionType: ActionIntervention['actionType'];
    title: string;
    targetSector: string;
    assignedUnits: string[];
    expectedImpactDescription: string;
  }) => void;
  onProceedToProve: () => void;
}

export const ActionInterventionTab: React.FC<ActionInterventionTabProps> = ({
  event,
  onDispatchAction,
  onProceedToProve,
}) => {
  const currentAction = event.intervention;

  const standardProcedures: {
    type: ActionIntervention['actionType'];
    title: string;
    authority: ActionIntervention['authority'];
    icon: React.ElementType;
    description: string;
    targetSector: string;
    expectedImpact: string;
    units: string[];
  }[] = [
    {
      type: 'anti_smog_cannon_deployment',
      title: 'Anti-Smog Mist Cannon Rapid Deployment (Zone A & B)',
      authority: 'Municipal Corporation (MCD/BMC)',
      icon: Truck,
      description: 'Dispatch 6 mobile vehicle-mounted high-pressure atomizing mist cannons (50–100m throw) along downwind arterial corridors to induce particulate coalescence and dry gravitational settling.',
      targetSector: 'Sahibabad & Anand Vihar Arterial Transit Corridor',
      expectedImpact: 'Estimated -60 to -90 µg/m³ PM2.5 within a 2.5 km downwind radius within 90 minutes.',
      units: ['MCD Smog Unit #4', 'MCD Smog Unit #7', 'Ghaziabad Nagar Nigam Mist Vehicle #2'],
    },
    {
      type: 'construction_ban_enforcement',
      title: 'GRAP Stage IV Construction & Demolition Immediate Stop-Work',
      authority: 'State Pollution Control Board',
      icon: AlertOctagon,
      description: 'Issue binding cease-and-desist orders to all major infrastructure and commercial construction sites within a 4 km radius. Enforce mandatory wet dust suppression.',
      targetSector: 'East Delhi & UP-NCR Border Industrial Belt',
      expectedImpact: 'Suppression of 40–50% coarse fugitive PM10 dust within 2 hours.',
      units: ['DPCC Flying Squad Unit 3', 'District SDM Enforcement Team'],
    },
    {
      type: 'industrial_scrubber_emergency_run',
      title: 'Industrial Wet-Scrubber Mandate & Boiler Fuel Audit',
      authority: 'State Pollution Control Board',
      icon: Factory,
      description: 'Mandate continuous wet venturi scrubber operation and emergency fuel switch for all secondary smelting, chemical, and brick kiln operations in the sector.',
      targetSector: 'Sahibabad Industrial Area Phase IV',
      expectedImpact: 'Immediate curtailment of point-source NO2 and secondary aerosol precursors.',
      units: ['UPPCB Industrial Inspection Team', 'State Energy Compliance Cell'],
    },
    {
      type: 'crop_stubble_fire_dousing',
      title: 'Rapid Stubble Fire Dousing & Fire Tender Dispatch',
      authority: 'District Air Quality Task Force',
      icon: Flame,
      description: 'Dispatch localized fire tenders with wetting agents to satellite-identified agricultural thermal clusters. Mobilize field revenue officials.',
      targetSector: 'Dhuri-Sangrur Agricultural Cluster',
      expectedImpact: 'Rapid extinguishing of open biomass combustion within 45 minutes.',
      units: ['District Fire Service Tender #12', 'Block Agriculture Officer Patrol'],
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Active Intervention Status Banner if dispatched */}
      {currentAction ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                    ORDER #{currentAction.orderNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Dispatched by {currentAction.authority}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {currentAction.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onProceedToProve}
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Proceed to Causal Proof (PROVE)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Target Sector:</span>
              <strong className="text-slate-900 font-bold">{currentAction.targetSector}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Units Active on Ground:</span>
              <strong className="text-blue-950 font-bold">{currentAction.assignedUnits.join(', ')}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Operational Status:</span>
              <span className="text-blue-900 font-extrabold uppercase">{currentAction.status.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Connected Loop: "ASK AGAIN" Loop Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-slate-800">
              <RotateCw className="w-4 h-4 text-blue-900 animate-spin" />
              <span>
                <strong>Active “ASK AGAIN” Loop Triggered:</strong> A post-intervention Sky Task has been issued to citizen observers and IoT nodes to capture counterfactual settling evidence.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4" />
            Authority Action Dispatch Console
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            Select Targeted Municipal or Regulatory Intervention
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Interventions are bound to legal standards and generate an automated evidentiary audit trail. Once dispatched, VayuTrace initiates continuous difference-in-differences monitoring to verify whether the intervention is causally effective.
          </p>
        </div>
      )}

      {/* Available Interventions SOP Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standardProcedures.map(sop => {
          const Icon = sop.icon;

          return (
            <div 
              key={sop.type}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-teal-700 shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {sop.authority}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                  {sop.title}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {sop.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="text-[11px] text-teal-800 font-mono font-bold">
                  &bull; Expected Impact: {sop.expectedImpact}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  &bull; Sector: {sop.targetSector}
                </div>

                <button
                  onClick={() => onDispatchAction({
                    authority: sop.authority,
                    actionType: sop.type,
                    title: sop.title,
                    targetSector: sop.targetSector,
                    assignedUnits: sop.units,
                    expectedImpactDescription: sop.expectedImpact,
                  })}
                  className="w-full mt-2 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Official Work Order</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
