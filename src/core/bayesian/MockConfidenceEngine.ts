/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvidenceItem } from '../../types';
import { ConfidenceEngine, ConfidenceEvaluation } from '../interfaces/ConfidenceEngine';

export class MockConfidenceEngine implements ConfidenceEngine {
  readonly name = 'Mock Deterministic Linear Baseline Engine';

  evaluateConfidence(
    priorProbability: number,
    evidenceItems: EvidenceItem[]
  ): ConfidenceEvaluation {
    const validItems = evidenceItems.filter(e => e.validationStatus !== 'rejected_drift');
    const baseWeight = priorProbability;
    const increment = validItems.length * 0.12;
    const posterior = Math.min(0.95, Math.max(0.1, baseWeight + increment));

    return {
      priorProbability,
      posteriorProbability: Number(posterior.toFixed(3)),
      logOdds: 1.2,
      uncertaintyScore: Math.max(0.1, 1 - posterior),
      evidenceContributions: validItems.map(item => ({
        evidenceId: item.id,
        sourceType: item.sourceType,
        rawLikelihoodRatio: 1.5,
        weightedLogLikelihood: 0.2,
        effectiveWeight: 0.5,
      })),
      explanation: 'Deterministic mock baseline evaluation for test suites.',
    };
  }
}
