/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VAYUTRACE - Active Pollution Intelligence Platform
 * Core Domain Types & Data Contracts
 */

export type PollutantType = 'PM2.5' | 'PM10' | 'NO2' | 'SO2' | 'CO' | 'O3';

export type EventStatus = 
  | 'detecting'
  | 'evidence_gathering'
  | 'high_confidence'
  | 'action_dispatched'
  | 'post_monitoring'
  | 'causally_verified'
  | 'dismissed_false_alarm';

export type EvidenceSourceType = 
  | 'satellite'
  | 'ground_sensor'
  | 'citizen_photo'
  | 'citizen_sensor'
  | 'meteorological'
  | 'mobile_patrol';

export type ValidationStatus = 
  | 'verified'
  | 'pending_review'
  | 'anomalous_flagged'
  | 'rejected_drift';

export type PasquillStabilityClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface GeoLocation {
  lat: number;
  lng: number;
  altitudeMeters?: number;
  locationName: string;
  district?: string;
  state?: string;
  isObfuscated?: boolean;
  fuzzingRadiusKm?: number;
}

export interface ProvenanceMetadata {
  sourceId: string;
  dataProvider: string;
  sensorModel?: string;
  calibrationAgeDays?: number;
  firmwareVersion?: string;
  hashSignature: string;
  ingestTimestamp: string;
  ingestProtocol: 'REST_API' | 'MQTT_BROKER' | 'SATELLITE_INGEST_PIPELINE' | 'CITIZEN_UPLOAD';
}

export interface EvidenceItem {
  id: string;
  eventId: string;
  sourceType: EvidenceSourceType;
  timestamp: string;
  location: GeoLocation;
  pollutant?: PollutantType;
  observedValue: number;
  unit: string;
  baselineValue: number;
  // Bayesian terms
  likelihoodRatio: number; // P(Data | Event) / P(Data | ~Event)
  sourceReliability: number; // derived dynamically from Beta(alpha, beta)
  spatialConsistencyScore: number; // 0.0 - 1.0 based on spatial decay kernel
  temporalDecayFactor: number; // 0.0 - 1.0 based on time distance
  posteriorWeight: number; // net contribution to Bayesian log-odds
  validationStatus: ValidationStatus;
  provenance: ProvenanceMetadata;
  notes?: string;
  mediaUrl?: string;
  cvAnalysis?: PhotoAnalysisResult;
}

export interface PhotoAnalysisResult {
  detectedCategory: 
    | 'smoke_plume'
    | 'dust_plume'
    | 'visible_haze'
    | 'crop_burning'
    | 'industrial_emission'
    | 'fire_indicators'
    | 'clear_sky';
  confidence: number; // 0.0 - 1.0
  estimatedOpacityPct: number;
  horizonDetected: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  explanation: string;
  modelIdentifier: string;
}

export interface SkyTask {
  id: string; // e.g. ST-1042
  eventId: string;
  title: string;
  targetZonePolygon: [number, number][]; // [lat, lng] array
  targetCenter: [number, number];
  targetAzimuthDeg: number; // e.g. 340°
  targetAzimuthLabel: string; // e.g. "North-Northwest (340°)"
  timeWindow: {
    start: string;
    end: string;
  };
  taskType: 'sky_photo' | 'local_sensor_reading' | 'cross_validation_photo' | 'post_intervention_check';
  rationale: string; // Why this task reduces uncertainty mathematically
  targetUncertaintyReductionPct: number;
  status: 'open' | 'claimed' | 'submitted' | 'verified' | 'expired';
  minContributorReliability: number;
  requiredRadiusMeters: number;
  submittedObservations: CitizenObservation[];
}

export interface CitizenObservation {
  id: string;
  taskId?: string;
  contributorId: string;
  contributorHandle: string;
  timestamp: string;
  location: GeoLocation;
  photoUrl?: string;
  sensorReading?: {
    pollutant: PollutantType;
    value: number;
    unit: string;
  };
  compassHeadingDeg?: number;
  cvResult?: PhotoAnalysisResult;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  reputationDelta?: {
    alphaIncrement: number;
    betaIncrement: number;
  };
}

export interface SensitiveReceptor {
  id: string;
  name: string;
  category: 'hospital' | 'school' | 'elderly_care' | 'residential_high_density' | 'transit_hub';
  location: { lat: number; lng: number };
  estimatedArrivalTimeMinutes: number;
  predictedPeakConcentration: number;
  vulnerabilityWeight: number; // 1.0 - 5.0
  status: 'monitoring' | 'advisory_sent' | 'emergency_mitigation_active';
  populationAtRisk: number;
}

export interface PlumeDispersionPoint {
  lat: number;
  lng: number;
  concentration: number;
  distanceKm: number;
  plumeWidthMeters: number;
}

export interface PlumeGeometry {
  isopleths: {
    level: 'extreme' | 'severe' | 'unhealthy' | 'moderate';
    concentrationUgM3: number;
    polygon: [number, number][];
  }[];
  centerline: [number, number][];
  projectedRangeKm: number;
  windSpeedMs: number;
  windDirectionDeg: number;
  stabilityClass: PasquillStabilityClass;
}

export interface BackwardTrajectorySegment {
  hourOffset: number; // -1, -2, -3, -4, -6
  lat: number;
  lng: number;
  estimatedHeightMeters: number;
  probableSourceCluster: string;
}

export interface ProbableSourceArea {
  name: string;
  hypothesisLabel: string; // e.g. "Probable Source Region A - Industrial Belt"
  confidenceHypothesis: number;
  evidenceSummary: string;
  polygon: [number, number][];
}

export interface ActionIntervention {
  id: string;
  orderNumber: string; // e.g. "VT-ACT-2026-089"
  eventId: string;
  authority: 'Municipal Corporation (MCD/BMC)' | 'State Pollution Control Board' | 'District Air Quality Task Force';
  actionType: 
    | 'anti_smog_cannon_deployment'
    | 'construction_ban_enforcement'
    | 'industrial_scrubber_emergency_run'
    | 'crop_stubble_fire_dousing'
    | 'traffic_corridor_diversion';
  title: string;
  targetSector: string;
  dispatchedAt: string;
  deployedAt?: string;
  status: 'dispatched' | 'active_on_site' | 'completed';
  assignedUnits: string[];
  expectedImpactDescription: string;
  targetPollutant: PollutantType;
}

export interface CausalProofResult {
  eventId: string;
  actionId: string;
  methodology: 'Difference-in-Differences (DiD) with Upwind/Crosswind Synthetic Controls';
  preInterventionWindowHours: number;
  postInterventionWindowHours: number;
  downwindObservedMean: number;
  counterfactualEstimatedMean: number; // what would have been without intervention
  netPollutantReductionUgM3: number;
  percentageReduction: number;
  controlStationIds: string[];
  pValue: number;
  confidenceInterval95: [number, number];
  verdict: 'statistically_significant_reduction' | 'marginal_inconclusive' | 'no_detectable_effect';
  proofEvidenceNotes: string;
  auditSignature: string;
  timeSeriesData: {
    timestamp: string;
    actualConcentration: number;
    counterfactualBaseline: number;
    controlGroupAverage: number;
  }[];
}

export interface PollutionEvent {
  id: string;
  title: string;
  region: string;
  centerLocation: GeoLocation;
  detectedAt: string;
  lastUpdated: string;
  status: EventStatus;
  primaryPollutant: PollutantType;
  observedPeakConcentration: number;
  regionalBaselineConcentration: number;
  
  // Bayesian Fusion Metrics
  priorProbability: number;
  posteriorProbability: number;
  bayesianLogOdds: number;
  uncertaintyScore: number; // Higher means need for Sky Task
  evidenceCount: number;
  
  // Trajectory & Geospatial
  forwardDispersionPlume: PlumeGeometry;
  backwardTrajectory: BackwardTrajectorySegment[];
  probableSourceRegions: ProbableSourceArea[];
  sensitiveReceptors: SensitiveReceptor[];
  
  // Active Sensing & Verification
  skyTasks: SkyTask[];
  intervention: ActionIntervention | null;
  causalProof: CausalProofResult | null;
}

export interface WeatherObservation {
  timestamp: string;
  windSpeedMs: number;
  windDirectionDeg: number;
  windDirectionCompass: string;
  temperatureC: number;
  humidityPct: number;
  pressureHpa: number;
  pasquillStabilityClass: PasquillStabilityClass;
  boundaryLayerHeightMeters: number;
  dataSource: string;
  isSimulated: boolean;
}

export interface SatellitePass {
  id: string;
  satelliteName: 'Sentinel-5P TROPOMI' | 'VIIRS Suomi-NPP' | 'MODIS Terra/Aqua' | 'INSAT-3DR';
  acquisitionTime: string;
  product: 'NO2_Tropospheric_Column' | 'Aerosol_Optical_Depth' | 'Fire_Radiative_Power_FRP' | 'Sulfur_Dioxide';
  footprintPolygon: [number, number][];
  anomalyPeakValue: number;
  unit: string;
  qualityFlag: number; // 0.0 - 1.0 (QA band)
  isSimulated: boolean;
}

export interface GroundSensorStation {
  id: string;
  code: string;
  name: string;
  network: 'CPCB_CAAQMS' | 'DPCC_DELHI' | 'BMC_MUMBAI' | 'PPCB_PUNJAB' | 'COMMUNITY_IOT';
  coordinates: { lat: number; lng: number };
  pollutants: Record<PollutantType, number>;
  status: 'online' | 'maintenance' | 'drift_detected';
  reliabilityAlpha: number;
  reliabilityBeta: number;
  calibrationAgeDays: number;
  lastIngestTime: string;
}

export interface AuditLedgerEntry {
  id: string;
  timestamp: string;
  action: 'EVENT_DETECTED' | 'EVIDENCE_INGESTED' | 'SKY_TASK_ISSUED' | 'OBSERVATION_SUBMITTED' | 'INTERVENTION_ORDERED' | 'CAUSAL_PROOF_GENERATED';
  entityId: string;
  actor: string;
  previousHash: string;
  currentHash: string;
  payloadSummary: string;
}
