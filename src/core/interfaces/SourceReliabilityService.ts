/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ContributorProfile {
  id: string;
  handle: string;
  isAnonymous: boolean;
  alphaSuccess: number; // Beta distribution parameter
  betaFailure: number;  // Beta distribution parameter
  totalSubmissions: number;
  verifiedCount: number;
  rejectedCount: number;
  calculatedReliability: number; // E[R] = alpha / (alpha + beta)
  confidenceInterval: [number, number];
  joinedDate: string;
}

export interface SensorReliabilityProfile {
  sensorId: string;
  stationName: string;
  hardwareClass: 'reference_grade_caaqms' | 'municipal_regulatory' | 'low_cost_iot' | 'satellite_pixel';
  calibrationAgeDays: number;
  driftVariance: number;
  missingDataRatePct: number;
  maintenanceStatus: 'optimal' | 'due_calibration' | 'unreliable';
  peerCorrelationScore: number; // 0.0 to 1.0 (agreement with 3 nearest reference stations)
  overallReliability: number;
}

export interface SourceReliabilityService {
  getContributorReliability(contributorId: string): number;
  getSensorReliability(sensorId: string): number;
  recordVerificationOutcome(
    contributorId: string,
    isConfirmedEvent: boolean,
    peerConsensusStrength: number
  ): void;
  recordSensorTelemetryHealth(
    sensorId: string,
    telemetry: {
      calibrationAgeDays: number;
      isDrifting: boolean;
      peerCorrelationScore: number;
    }
  ): void;
}
