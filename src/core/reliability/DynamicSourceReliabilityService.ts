/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VayuTrace Dynamic Source Reliability Service
 * Dynamically updates reliability beliefs using Beta(alpha, beta) conjugate priors
 * for contributors and physical sensor drift models for environmental stations.
 */

import {
  ContributorProfile,
  SensorReliabilityProfile,
  SourceReliabilityService,
} from '../interfaces/SourceReliabilityService';

export class DynamicSourceReliabilityService implements SourceReliabilityService {
  private contributors: Map<string, ContributorProfile> = new Map();
  private sensors: Map<string, SensorReliabilityProfile> = new Map();

  constructor() {
    this.seedDefaultProfiles();
  }

  private seedDefaultProfiles() {
    // Seed verified citizen field observers with prior experience
    this.contributors.set('contrib-delhi-88', {
      id: 'contrib-delhi-88',
      handle: 'AnandVihar_Citizen_Watch',
      isAnonymous: false,
      alphaSuccess: 14,
      betaFailure: 2,
      totalSubmissions: 16,
      verifiedCount: 14,
      rejectedCount: 2,
      calculatedReliability: 14 / (14 + 2), // 0.875
      confidenceInterval: [0.71, 0.95],
      joinedDate: '2025-11-12',
    });

    this.contributors.set('contrib-novice-12', {
      id: 'contrib-novice-12',
      handle: 'Rohini_Resident_9',
      isAnonymous: true,
      alphaSuccess: 2,
      betaFailure: 2,
      totalSubmissions: 2,
      verifiedCount: 1,
      rejectedCount: 1,
      calculatedReliability: 2 / (2 + 2), // 0.50 (uninformative prior)
      confidenceInterval: [0.25, 0.75],
      joinedDate: '2026-09-15',
    });

    // Seed reference and IoT sensors
    this.sensors.set('sensor-cpcb-anand-vihar', {
      sensorId: 'sensor-cpcb-anand-vihar',
      stationName: 'Anand Vihar CAAQMS (CPCB/DPCC)',
      hardwareClass: 'reference_grade_caaqms',
      calibrationAgeDays: 42,
      driftVariance: 0.04,
      missingDataRatePct: 1.2,
      maintenanceStatus: 'optimal',
      peerCorrelationScore: 0.94,
      overallReliability: 0.93,
    });

    this.sensors.set('sensor-cpcb-ghaziabad-vasundhara', {
      sensorId: 'sensor-cpcb-ghaziabad-vasundhara',
      stationName: 'Vasundhara Station (UPPCB)',
      hardwareClass: 'reference_grade_caaqms',
      calibrationAgeDays: 85,
      driftVariance: 0.06,
      missingDataRatePct: 3.5,
      maintenanceStatus: 'optimal',
      peerCorrelationScore: 0.91,
      overallReliability: 0.89,
    });

    this.sensors.set('sensor-iot-industrial-gate3', {
      sensorId: 'sensor-iot-industrial-gate3',
      stationName: 'Sahibabad Gate 3 IoT Node',
      hardwareClass: 'low_cost_iot',
      calibrationAgeDays: 210, // aging optical sensor
      driftVariance: 0.22,
      missingDataRatePct: 8.0,
      maintenanceStatus: 'due_calibration',
      peerCorrelationScore: 0.74,
      overallReliability: 0.65,
    });
  }

  getContributorReliability(contributorId: string): number {
    const profile = this.contributors.get(contributorId);
    if (!profile) {
      // New contributor default prior Beta(2, 2) => 0.50
      return 0.5;
    }
    return Number((profile.alphaSuccess / (profile.alphaSuccess + profile.betaFailure)).toFixed(3));
  }

  getContributorProfile(contributorId: string): ContributorProfile | undefined {
    return this.contributors.get(contributorId);
  }

  getAllContributors(): ContributorProfile[] {
    return Array.from(this.contributors.values());
  }

  getSensorReliability(sensorId: string): number {
    const profile = this.sensors.get(sensorId);
    if (!profile) {
      return 0.7; // default moderate reliability
    }
    return profile.overallReliability;
  }

  getSensorProfile(sensorId: string): SensorReliabilityProfile | undefined {
    return this.sensors.get(sensorId);
  }

  getAllSensors(): SensorReliabilityProfile[] {
    return Array.from(this.sensors.values());
  }

  /**
   * Bayesian update when an observation is ground-truthed by field verification
   */
  recordVerificationOutcome(
    contributorId: string,
    isConfirmedEvent: boolean,
    peerConsensusStrength: number = 1.0
  ): void {
    let profile = this.contributors.get(contributorId);
    if (!profile) {
      profile = {
        id: contributorId,
        handle: `Contributor_${contributorId.slice(-4)}`,
        isAnonymous: false,
        alphaSuccess: 2,
        betaFailure: 2,
        totalSubmissions: 0,
        verifiedCount: 0,
        rejectedCount: 0,
        calculatedReliability: 0.5,
        confidenceInterval: [0.25, 0.75],
        joinedDate: new Date().toISOString().split('T')[0],
      };
      this.contributors.set(contributorId, profile);
    }

    profile.totalSubmissions += 1;
    if (isConfirmedEvent) {
      profile.verifiedCount += 1;
      profile.alphaSuccess += 1.0 * peerConsensusStrength;
    } else {
      profile.rejectedCount += 1;
      profile.betaFailure += 1.0 * peerConsensusStrength;
    }

    const alpha = profile.alphaSuccess;
    const beta = profile.betaFailure;
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
    const stdDev = Math.sqrt(variance);

    profile.calculatedReliability = Number(mean.toFixed(3));
    profile.confidenceInterval = [
      Math.max(0.05, Number((mean - 1.96 * stdDev).toFixed(2))),
      Math.min(0.99, Number((mean + 1.96 * stdDev).toFixed(2))),
    ];
  }

  /**
   * Recalculates physical sensor reliability based on calibration age, drift, and peer consensus
   */
  recordSensorTelemetryHealth(
    sensorId: string,
    telemetry: {
      calibrationAgeDays: number;
      isDrifting: boolean;
      peerCorrelationScore: number;
    }
  ): void {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return;

    sensor.calibrationAgeDays = telemetry.calibrationAgeDays;
    sensor.peerCorrelationScore = telemetry.peerCorrelationScore;

    // Physical degradation factor (1 year = ~25% loss in trust without zero-calibration)
    const calibFactor = Math.max(0.6, 1 - (telemetry.calibrationAgeDays / 365) * 0.35);
    const driftPenalty = telemetry.isDrifting ? 0.3 : 1.0;
    const peerFactor = 0.5 + 0.5 * telemetry.peerCorrelationScore;

    const baseReliability = sensor.hardwareClass === 'reference_grade_caaqms' ? 0.95 : 0.75;
    sensor.overallReliability = Number((baseReliability * calibFactor * driftPenalty * peerFactor).toFixed(3));
    
    if (sensor.calibrationAgeDays > 180 || telemetry.isDrifting) {
      sensor.maintenanceStatus = 'due_calibration';
    } else {
      sensor.maintenanceStatus = 'optimal';
    }
  }
}
