/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvidenceItem } from '../../types';

export interface ConfidenceEvaluation {
  priorProbability: number;
  posteriorProbability: number;
  logOdds: number;
  uncertaintyScore: number; // 0.0 to 1.0 (higher = more uncertain, triggers sky tasking)
  evidenceContributions: {
    evidenceId: string;
    sourceType: string;
    rawLikelihoodRatio: number;
    weightedLogLikelihood: number;
    effectiveWeight: number;
  }[];
  explanation: string;
}

export interface ConfidenceEngine {
  readonly name: string;
  evaluateConfidence(
    priorProbability: number,
    evidenceItems: EvidenceItem[]
  ): ConfidenceEvaluation;
}
