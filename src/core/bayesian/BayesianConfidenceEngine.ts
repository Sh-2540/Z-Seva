/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VayuTrace Bayesian Confidence Engine
 * Implements rigorous multi-source Bayesian evidence fusion using log-odds updates.
 * NO arbitrary "+20 points" additive formulas.
 */

import { EvidenceItem } from '../../types';
import { ConfidenceEngine, ConfidenceEvaluation } from '../interfaces/ConfidenceEngine';

export class BayesianConfidenceEngine implements ConfidenceEngine {
  readonly name = 'Bayesian Evidence Fusion Engine (Log-Odds Form)';

  /**
   * Evaluates posterior probability of a real environmental pollution event given prior belief
   * and an array of heterogeneous evidence items.
   * 
   * Mathematically:
   * logit(P(Event | Evidence)) = logit(P(Event)) + Sum[ w_i * ln(LR_i) ]
   * where:
   *   LR_i = P(Data_i | Event) / P(Data_i | Not Event) [Likelihood Ratio]
   *   w_i = SourceReliability_i * SpatialDecay_i * TemporalDecay_i
   */
  evaluateConfidence(
    priorProbability: number,
    evidenceItems: EvidenceItem[]
  ): ConfidenceEvaluation {
    // Clamp prior between 0.01 and 0.99 to avoid infinite logit
    const clampedPrior = Math.max(0.01, Math.min(0.99, priorProbability));
    const priorLogOdds = Math.log(clampedPrior / (1 - clampedPrior));

    let accumulatedLogOdds = priorLogOdds;
    const contributions: ConfidenceEvaluation['evidenceContributions'] = [];
    let totalEffectiveWeight = 0;

    for (const item of evidenceItems) {
      // Disregard rejected or anomalous sensor drift items
      if (item.validationStatus === 'rejected_drift') {
        continue;
      }

      // 1. Likelihood Ratio LR_i
      // If LR > 1.0, data supports event; if LR < 1.0, data refutes event.
      const lr = Math.max(0.05, Math.min(20.0, item.likelihoodRatio || 1.0));
      const logLR = Math.log(lr);

      // 2. Dynamic Evidence Weight: Source Reliability * Temporal Decay * Spatial Consistency
      const reliability = Math.max(0.05, Math.min(0.99, item.sourceReliability ?? 0.7));
      const temporalDecay = Math.max(0.1, Math.min(1.0, item.temporalDecayFactor ?? 1.0));
      const spatialDecay = Math.max(0.1, Math.min(1.0, item.spatialConsistencyScore ?? 1.0));

      const effectiveWeight = reliability * temporalDecay * spatialDecay;
      totalEffectiveWeight += effectiveWeight;

      // 3. Log-likelihood contribution weighted by credibility
      const weightedLog = effectiveWeight * logLR;
      accumulatedLogOdds += weightedLog;

      contributions.push({
        evidenceId: item.id,
        sourceType: item.sourceType,
        rawLikelihoodRatio: Number(lr.toFixed(3)),
        weightedLogLikelihood: Number(weightedLog.toFixed(4)),
        effectiveWeight: Number(effectiveWeight.toFixed(3)),
      });
    }

    // Convert accumulated log-odds back to posterior probability via standard sigmoid
    const posterior = 1 / (1 + Math.exp(-accumulatedLogOdds));
    const roundedPosterior = Number(posterior.toFixed(4));

    // Calculate Bayesian uncertainty:
    // When evidence is scarce or conflicting (posterior near 0.5 with low total weight),
    // uncertainty is high, mathematically signaling that "ASK" (Sky Tasking) is required.
    const variance = (posterior * (1 - posterior));
    const sampleSufficiency = Math.min(1.0, totalEffectiveWeight / 4.0);
    // Uncertainty: 0.0 (near certain true/false with high weight) to 1.0 (maximal doubt)
    const uncertainty = Math.min(1.0, Math.max(0.05, (4 * variance) * (1 - (sampleSufficiency * 0.75))));

    const explanation = `Prior belief P(E)=${(clampedPrior * 100).toFixed(1)}% updated through ${contributions.length} verified evidence streams. Effective information weight: ${totalEffectiveWeight.toFixed(2)}. Posterior probability is ${(roundedPosterior * 100).toFixed(1)}% with an uncertainty index of ${(uncertainty * 100).toFixed(1)}%.`;

    return {
      priorProbability: clampedPrior,
      posteriorProbability: roundedPosterior,
      logOdds: Number(accumulatedLogOdds.toFixed(4)),
      uncertaintyScore: Number(uncertainty.toFixed(3)),
      evidenceContributions: contributions,
      explanation,
    };
  }
}
