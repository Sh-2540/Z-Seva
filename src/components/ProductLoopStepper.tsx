/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Radio, 
  Binary, 
  Send, 
  Route, 
  Building2, 
  ShieldAlert, 
  RotateCw, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { PollutionEvent } from '../types';

export type ProductLoopStep = 
  | 'detect' 
  | 'confidence' 
  | 'ask' 
  | 'trace' 
  | 'exposure' 
  | 'act' 
  | 'ask_again' 
  | 'prove';

interface ProductLoopStepperProps {
  currentStep: ProductLoopStep;
  onSelectStep: (step: ProductLoopStep) => void;
  event: PollutionEvent | undefined;
}

export const ProductLoopStepper: React.FC<ProductLoopStepperProps> = ({
  currentStep,
  onSelectStep,
  event,
}) => {
  const steps: {
    id: ProductLoopStep;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    isCompleted: boolean;
    isHighlighted: boolean;
  }[] = [
    {
      id: 'detect',
      label: '1. DETECT',
      sublabel: event ? `${event.primaryPollutant}: ${event.observedPeakConcentration} µg/m³` : 'Anomaly Alert',
      icon: Radio,
      isCompleted: Boolean(event),
      isHighlighted: currentStep === 'detect',
    },
    {
      id: 'confidence',
      label: '2. CONFIDENCE',
      sublabel: event ? `P(E)=${Math.round(event.posteriorProbability * 100)}%` : 'Bayesian Fusion',
      icon: Binary,
      isCompleted: (event?.posteriorProbability ?? 0) > 0.7,
      isHighlighted: currentStep === 'confidence',
    },
    {
      id: 'ask',
      label: '3. ASK',
      sublabel: `${event?.skyTasks.length || 0} Sky Tasks`,
      icon: Send,
      isCompleted: (event?.skyTasks.length ?? 0) > 0,
      isHighlighted: currentStep === 'ask',
    },
    {
      id: 'trace',
      label: '4. TRACE',
      sublabel: 'Forward & Back Plume',
      icon: Route,
      isCompleted: Boolean(event?.forwardDispersionPlume),
      isHighlighted: currentStep === 'trace',
    },
    {
      id: 'exposure',
      label: '5. EXPOSURE',
      sublabel: `${event?.sensitiveReceptors.length || 0} Receptors at Risk`,
      icon: Building2,
      isCompleted: (event?.sensitiveReceptors.length ?? 0) > 0,
      isHighlighted: currentStep === 'exposure',
    },
    {
      id: 'act',
      label: '6. ACT',
      sublabel: event?.intervention ? 'Dispatched' : 'Municipal SOP',
      icon: ShieldAlert,
      isCompleted: Boolean(event?.intervention),
      isHighlighted: currentStep === 'act',
    },
    {
      id: 'ask_again',
      label: '7. ASK AGAIN',
      sublabel: 'Post-Action Task',
      icon: RotateCw,
      isCompleted: Boolean(event?.skyTasks.some(t => t.taskType === 'post_intervention_check')),
      isHighlighted: currentStep === 'ask_again',
    },
    {
      id: 'prove',
      label: '8. PROVE',
      sublabel: event?.causalProof ? `-${event.causalProof.netPollutantReductionUgM3} µg/m³ (DiD)` : 'Causal Verification',
      icon: CheckCircle2,
      isCompleted: Boolean(event?.causalProof),
      isHighlighted: currentStep === 'prove',
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[720px] gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.isHighlighted;
          const isDone = step.isCompleted;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-left transition cursor-pointer text-xs font-semibold ${
                  isActive
                    ? 'bg-blue-50 text-blue-950 border border-blue-300 font-bold shadow-2xs'
                    : isDone
                    ? 'text-blue-900 hover:bg-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                title={step.sublabel}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] ${
                    isActive
                      ? 'bg-blue-900 text-white'
                      : isDone
                      ? 'bg-blue-100 text-blue-900 font-bold'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                </div>
                <span className="whitespace-nowrap">{step.label}</span>
              </button>

              {idx < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
