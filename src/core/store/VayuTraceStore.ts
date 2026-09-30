/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VayuTrace Master State & Store
 * Manages active events, evidence ledgers, sky tasks, action interventions,
 * and integrates the Bayesian Confidence Engine, Pollution Trace Engine,
 * Source Reliability Service, and Causal Proof Engine.
 */

import {
  ActionIntervention,
  AuditLedgerEntry,
  CausalProofResult,
  CitizenObservation,
  EvidenceItem,
  GroundSensorStation,
  PollutionEvent,
  SatellitePass,
  SkyTask,
  WeatherObservation,
} from '../../types';
import { AuditLedgerService } from '../audit/AuditLedgerService';
import { BayesianConfidenceEngine } from '../bayesian/BayesianConfidenceEngine';
import { MockConfidenceEngine } from '../bayesian/MockConfidenceEngine';
import { ConfidenceEngine } from '../interfaces/ConfidenceEngine';
import { CausalInterventionEngine } from '../proof/CausalInterventionEngine';
import { DynamicSourceReliabilityService } from '../reliability/DynamicSourceReliabilityService';
import { SensorIngestionService } from '../sensor/SensorIngestionService';
import { GaussianPlumeTraceEngine } from '../trace/GaussianPlumeTraceEngine';
import { PhotoAnalysisPipeline } from '../vision/PhotoAnalysisPipeline';
import { RealisticWeatherProvider } from '../weather/RealisticWeatherProvider';

export class VayuTraceStore {
  // Engines & Services
  bayesianEngine = new BayesianConfidenceEngine();
  mockEngine = new MockConfidenceEngine();
  activeEngine: ConfidenceEngine = this.bayesianEngine;
  
  traceEngine = new GaussianPlumeTraceEngine();
  reliabilityService = new DynamicSourceReliabilityService();
  weatherProvider = new RealisticWeatherProvider();
  sensorService = new SensorIngestionService();
  visionPipeline = new PhotoAnalysisPipeline();
  causalEngine = new CausalInterventionEngine();
  auditLedger = new AuditLedgerService();

  // State
  events: PollutionEvent[] = [];
  selectedEventId: string = '';
  evidenceLedger: Map<string, EvidenceItem[]> = new Map(); // eventId -> EvidenceItem[]
  currentWeather: WeatherObservation | null = null;
  satellitePasses: SatellitePass[] = [];
  
  // Settings & Thresholds
  uncertaintyThresholdForSkyTask: number = 0.22; // When uncertainty > 0.22, system triggers Sky Tasking
  criticalPollutantThreshold: number = 250; // µg/m³
  useBayesianEngine: boolean = true;
  userRole: 'municipal_officer' | 'cpcb_inspector' | 'citizen_contributor' | 'environmental_researcher' = 'municipal_officer';

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeDefaultScenarios();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private async initializeDefaultScenarios() {
    // Fetch initial weather for Delhi
    this.currentWeather = await this.weatherProvider.getWeatherObservation(28.6476, 77.3160);

    // Event 1: Delhi-NCR Ghazipur & Anand Vihar High-Particulate Event
    const event1Id = 'EVT-DEL-2026-104';
    const weather1 = this.currentWeather;

    const trace1 = this.traceEngine.computeTrace({
      originLat: 28.6476,
      originLng: 77.3160,
      pollutantConcentration: 382,
      baselineConcentration: 118,
      weather: weather1,
    });

    const event1: PollutionEvent = {
      id: event1Id,
      title: 'Anand Vihar - Ghazipur Trans-Boundary Plume Event',
      region: 'Delhi-NCR (East District / Ghaziabad Border)',
      centerLocation: {
        lat: 28.6476,
        lng: 77.3160,
        locationName: 'Anand Vihar ISBT & Industrial Area',
        district: 'East Delhi',
        state: 'NCT of Delhi',
      },
      detectedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'evidence_gathering',
      primaryPollutant: 'PM2.5',
      observedPeakConcentration: 382,
      regionalBaselineConcentration: 118,
      priorProbability: 0.35, // climatological prior for winter early morning
      posteriorProbability: 0.74,
      bayesianLogOdds: 1.05,
      uncertaintyScore: 0.28, // High uncertainty, triggers Sky Task!
      evidenceCount: 3,
      forwardDispersionPlume: trace1.forwardPlume,
      backwardTrajectory: trace1.backwardTrajectory,
      probableSourceRegions: trace1.probableSourceRegions,
      sensitiveReceptors: [
        {
          id: 'rec-01',
          name: 'Dr. Hedgewar Arogya Sansthan Hospital',
          category: 'hospital',
          location: { lat: 28.6534, lng: 77.3012 },
          estimatedArrivalTimeMinutes: 18,
          predictedPeakConcentration: 310,
          vulnerabilityWeight: 4.8,
          status: 'advisory_sent',
          populationAtRisk: 1250,
        },
        {
          id: 'rec-02',
          name: 'DAV Public School & Senior Daycare',
          category: 'school',
          location: { lat: 28.6410, lng: 77.3245 },
          estimatedArrivalTimeMinutes: 26,
          predictedPeakConcentration: 280,
          vulnerabilityWeight: 4.5,
          status: 'monitoring',
          populationAtRisk: 2100,
        },
        {
          id: 'rec-03',
          name: 'Preet Vihar Residential Sector 4',
          category: 'residential_high_density',
          location: { lat: 28.6380, lng: 77.2950 },
          estimatedArrivalTimeMinutes: 42,
          predictedPeakConcentration: 230,
          vulnerabilityWeight: 3.2,
          status: 'monitoring',
          populationAtRisk: 18500,
        },
      ],
      skyTasks: [
        {
          id: 'ST-1042',
          eventId: event1Id,
          title: 'Sky Task #ST-1042: North-Northwest Azimuth Smoke Boundary Verification',
          targetZonePolygon: [
            [28.652, 77.310],
            [28.665, 77.315],
            [28.662, 77.330],
            [28.648, 77.325],
            [28.652, 77.310],
          ],
          targetCenter: [28.656, 77.320],
          targetAzimuthDeg: 335,
          targetAzimuthLabel: 'North-Northwest (335°)',
          timeWindow: {
            start: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          },
          taskType: 'sky_photo',
          rationale:
            'Bayesian uncertainty (28.0%) exceeds 22% threshold. Discrepancy between CPCB ground station and peripheral IoT nodes requires optical confirmation of plume opacity along the 335° upwind azimuth.',
          targetUncertaintyReductionPct: 40,
          status: 'open',
          minContributorReliability: 0.65,
          requiredRadiusMeters: 1200,
          submittedObservations: [
            {
              id: 'obs-cit-101',
              taskId: 'ST-1042',
              contributorId: 'contrib-delhi-88',
              contributorHandle: 'AnandVihar_Citizen_Watch',
              timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              location: {
                lat: 28.654,
                lng: 77.318,
                locationName: 'Sahibabad Border Overpass',
                isObfuscated: true,
                fuzzingRadiusKm: 0.8,
              },
              compassHeadingDeg: 335,
              cvResult: {
                detectedCategory: 'industrial_emission',
                confidence: 0.89,
                estimatedOpacityPct: 78,
                horizonDetected: true,
                explanation: 'Confirmed high-opacity dark particulate plume rising along the 335° azimuth; matches predicted boundary layer inversion.',
                modelIdentifier: 'gemini-2.5-flash:multimodal-vision-v1',
              },
              verificationStatus: 'verified',
              reputationDelta: { alphaIncrement: 1, betaIncrement: 0 },
            },
          ],
        },
      ],
      intervention: null,
      causalProof: null,
    };

    // Initial Evidence Items for Event 1
    const initialEvidence: EvidenceItem[] = [
      {
        id: 'EVD-SAT-01',
        eventId: event1Id,
        sourceType: 'satellite',
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
        location: { lat: 28.655, lng: 77.322, locationName: 'East Delhi Industrial Corridor' },
        pollutant: 'NO2',
        observedValue: 248.5,
        unit: 'µmol/m²',
        baselineValue: 75.0,
        likelihoodRatio: 3.42, // strongly supports event
        sourceReliability: 0.88,
        spatialConsistencyScore: 0.92,
        temporalDecayFactor: 0.85,
        posteriorWeight: 0.88 * 0.85 * 0.92 * Math.log(3.42),
        validationStatus: 'verified',
        provenance: {
          sourceId: 'SAT-S5P-TROPOMI-2026-09-30-01',
          dataProvider: 'ESA Copernicus Sentinel-5P OFFL L2 Tropospheric Column',
          hashSignature: 'sha256-s5p-tropos-9821034',
          ingestTimestamp: new Date(Date.now() - 2.4 * 3600 * 1000).toISOString(),
          ingestProtocol: 'SATELLITE_INGEST_PIPELINE',
        },
        notes: 'Tropospheric NO2 column peak coincident with dense particulate optical depth.',
      },
      {
        id: 'EVD-SEN-02',
        eventId: event1Id,
        sourceType: 'ground_sensor',
        timestamp: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
        location: { lat: 28.6476, lng: 77.3160, locationName: 'Anand Vihar CAAQMS' },
        pollutant: 'PM2.5',
        observedValue: 382,
        unit: 'µg/m³',
        baselineValue: 118,
        likelihoodRatio: 4.85,
        sourceReliability: 0.93,
        spatialConsistencyScore: 0.98,
        temporalDecayFactor: 0.92,
        posteriorWeight: 0.93 * 0.92 * 0.98 * Math.log(4.85),
        validationStatus: 'verified',
        provenance: {
          sourceId: 'sensor-cpcb-anand-vihar',
          dataProvider: 'CPCB / DPCC Regulatory Reference Station',
          sensorModel: 'BAM-1020 Beta Attenuation Monitor',
          calibrationAgeDays: 45,
          hashSignature: 'sha256-cpcb-dl-av-872391',
          ingestTimestamp: new Date(Date.now() - 1.7 * 3600 * 1000).toISOString(),
          ingestProtocol: 'REST_API',
        },
        notes: 'Continuous beta attenuation absorption verified. Secondary optical counter cross-checked.',
      },
      {
        id: 'EVD-PHOTO-03',
        eventId: event1Id,
        sourceType: 'citizen_photo',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        location: {
          lat: 28.654,
          lng: 77.318,
          locationName: 'Sahibabad Border Overpass',
          isObfuscated: true,
          fuzzingRadiusKm: 0.8,
        },
        observedValue: 78,
        unit: '% Opacity',
        baselineValue: 15,
        likelihoodRatio: 3.10,
        sourceReliability: 0.875, // from contributor dynamic Beta prior
        spatialConsistencyScore: 0.89,
        temporalDecayFactor: 0.98,
        posteriorWeight: 0.875 * 0.98 * 0.89 * Math.log(3.10),
        validationStatus: 'verified',
        provenance: {
          sourceId: 'contrib-delhi-88',
          dataProvider: 'Sky Task #ST-1042 Verified Response',
          hashSignature: 'sha256-cit-obs-998124',
          ingestTimestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
          ingestProtocol: 'CITIZEN_UPLOAD',
        },
        notes: 'Sky photo captured facing 335° NNW. Computer vision classified as industrial emission plume.',
        cvAnalysis: {
          detectedCategory: 'industrial_emission',
          confidence: 0.89,
          estimatedOpacityPct: 78,
          horizonDetected: true,
          explanation: 'Dense plume with thermal boundary layer obscuring horizon.',
          modelIdentifier: 'gemini-2.5-flash:multimodal-vision-v1',
        },
      },
    ];

    this.events = [event1];
    this.selectedEventId = event1Id;
    this.evidenceLedger.set(event1Id, initialEvidence);

    // Compute initial Bayesian confidence for Event 1
    this.recomputeConfidence(event1Id);

    // Record initial audit ledger entries
    this.auditLedger.recordEntry(
      'EVENT_DETECTED',
      event1Id,
      'CPCB Telemetry Ingest Daemon',
      'Event EVT-DEL-2026-104 registered from Anand Vihar BAM-1020 PM2.5 spike (382 µg/m³)'
    );
    this.auditLedger.recordEntry(
      'SKY_TASK_ISSUED',
      'ST-1042',
      'Bayesian Uncertainty Orchestrator',
      'Sky Task #ST-1042 created to resolve 335° azimuth plume boundary uncertainty'
    );

    this.notify();
  }

  getSelectedEvent(): PollutionEvent | undefined {
    return this.events.find(e => e.id === this.selectedEventId);
  }

  setSelectedEvent(id: string) {
    this.selectedEventId = id;
    this.notify();
  }

  getEvidenceForEvent(eventId: string): EvidenceItem[] {
    return this.evidenceLedger.get(eventId) || [];
  }

  /**
   * Recalculates event confidence using the selected engine (Bayesian vs Mock)
   */
  recomputeConfidence(eventId: string) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    const evidence = this.getEvidenceForEvent(eventId);
    const evaluation = this.activeEngine.evaluateConfidence(event.priorProbability, evidence);

    event.posteriorProbability = evaluation.posteriorProbability;
    event.bayesianLogOdds = evaluation.logOdds;
    event.uncertaintyScore = evaluation.uncertaintyScore;
    event.evidenceCount = evidence.length;

    // Update status based on posterior confidence
    if (event.posteriorProbability >= 0.85 && event.uncertaintyScore <= 0.18) {
      if (event.status === 'evidence_gathering') {
        event.status = 'high_confidence';
      }
    }

    this.notify();
  }

  /**
   * Toggle between Bayesian Confidence Engine and Mock Engine
   */
  setEngineMode(useBayesian: boolean) {
    this.useBayesianEngine = useBayesian;
    this.activeEngine = useBayesian ? this.bayesianEngine : this.mockEngine;
    if (this.selectedEventId) {
      this.recomputeConfidence(this.selectedEventId);
    }
  }

  /**
   * Ingests a new piece of evidence into an active event
   */
  addEvidence(eventId: string, item: Omit<EvidenceItem, 'id' | 'eventId'>): EvidenceItem {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);

    const id = `EVD-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
    const fullItem: EvidenceItem = {
      ...item,
      id,
      eventId,
    };

    const currentList = this.evidenceLedger.get(eventId) || [];
    currentList.push(fullItem);
    this.evidenceLedger.set(eventId, currentList);

    // Audit log
    this.auditLedger.recordEntry(
      'EVIDENCE_INGESTED',
      id,
      fullItem.provenance.dataProvider,
      `Ingested ${fullItem.sourceType} evidence: observed ${fullItem.observedValue} ${fullItem.unit} (LR=${fullItem.likelihoodRatio})`
    );

    this.recomputeConfidence(eventId);
    return fullItem;
  }

  /**
   * Create an Active Sensing Sky Task (THE "ASK" CAPABILITY)
   */
  createSkyTask(
    eventId: string,
    params: {
      title: string;
      azimuthDeg: number;
      azimuthLabel: string;
      rationale: string;
      taskType: SkyTask['taskType'];
      targetCenter: [number, number];
      radiusMeters?: number;
    }
  ): SkyTask {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);

    const [cLat, cLng] = params.targetCenter;
    const offset = 0.01;
    const polygon: [number, number][] = [
      [cLat + offset, cLng - offset],
      [cLat + offset, cLng + offset],
      [cLat - offset, cLng + offset],
      [cLat - offset, cLng - offset],
      [cLat + offset, cLng - offset],
    ];

    const taskNumber = 1000 + event.skyTasks.length + 1;
    const task: SkyTask = {
      id: `ST-${taskNumber}`,
      eventId,
      title: params.title,
      targetZonePolygon: polygon,
      targetCenter: params.targetCenter,
      targetAzimuthDeg: params.azimuthDeg,
      targetAzimuthLabel: params.azimuthLabel,
      timeWindow: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      },
      taskType: params.taskType,
      rationale: params.rationale,
      targetUncertaintyReductionPct: 35,
      status: 'open',
      minContributorReliability: 0.55,
      requiredRadiusMeters: params.radiusMeters || 1000,
      submittedObservations: [],
    };

    event.skyTasks.unshift(task);

    this.auditLedger.recordEntry(
      'SKY_TASK_ISSUED',
      task.id,
      'Active Sensing Coordinator',
      `Issued Sky Task ${task.id}: "${params.title}" (Azimuth ${params.azimuthDeg}°)`
    );

    this.notify();
    return task;
  }

  /**
   * Submit citizen observation to a Sky Task
   */
  async submitCitizenObservation(
    taskId: string,
    observation: Omit<CitizenObservation, 'id' | 'taskId' | 'timestamp' | 'verificationStatus'>
  ): Promise<CitizenObservation> {
    const event = this.events.find(e => e.skyTasks.some(t => t.id === taskId));
    if (!event) throw new Error(`Task ${taskId} not found in active events`);

    const task = event.skyTasks.find(t => t.id === taskId)!;
    const obsId = `OBS-${Date.now().toString(36)}`;

    // Strip EXIF / Obfuscate location for privacy
    const fuzzed = this.visionPipeline.anonymizeLocation(
      observation.location.lat,
      observation.location.lng,
      1.0
    );

    // Compute CV analysis if photo is included
    let cvResult = observation.cvResult;
    if (observation.photoUrl && !cvResult) {
      cvResult = await this.visionPipeline.analyzeSkyPhoto(observation.photoUrl, {
        promptHint: task.title,
        azimuth: observation.compassHeadingDeg,
      });
    }

    const fullObs: CitizenObservation = {
      ...observation,
      id: obsId,
      taskId,
      timestamp: new Date().toISOString(),
      location: {
        ...observation.location,
        lat: fuzzed.lat,
        lng: fuzzed.lng,
        isObfuscated: true,
        fuzzingRadiusKm: 1.0,
      },
      cvResult,
      verificationStatus: 'verified',
      reputationDelta: { alphaIncrement: 1, betaIncrement: 0 },
    };

    task.submittedObservations.unshift(fullObs);
    task.status = 'submitted';

    // Update dynamic contributor reliability
    this.reliabilityService.recordVerificationOutcome(observation.contributorId, true, 1.0);

    // Automatically convert verified photo into an EvidenceItem in the Bayesian ledger
    const contributorReliability = this.reliabilityService.getContributorReliability(observation.contributorId);
    
    // Likelihood ratio based on CV detection:
    let lr = 2.8;
    if (cvResult?.detectedCategory === 'industrial_emission' || cvResult?.detectedCategory === 'smoke_plume') {
      lr = 3.8;
    } else if (cvResult?.detectedCategory === 'crop_burning') {
      lr = 4.2;
    } else if (cvResult?.detectedCategory === 'clear_sky') {
      lr = 0.25; // refutes event
    }

    this.addEvidence(event.id, {
      sourceType: 'citizen_photo',
      timestamp: fullObs.timestamp,
      location: fullObs.location,
      observedValue: cvResult?.estimatedOpacityPct ?? 70,
      unit: '% Opacity',
      baselineValue: 15,
      likelihoodRatio: lr,
      sourceReliability: contributorReliability,
      spatialConsistencyScore: 0.91,
      temporalDecayFactor: 1.0,
      posteriorWeight: contributorReliability * Math.log(lr),
      validationStatus: 'verified',
      provenance: {
        sourceId: observation.contributorId,
        dataProvider: `Citizen Contributor (${observation.contributorHandle}) via Sky Task ${taskId}`,
        hashSignature: `sha256-obs-${obsId}`,
        ingestTimestamp: new Date().toISOString(),
        ingestProtocol: 'CITIZEN_UPLOAD',
      },
      notes: `Citizen sky photo facing ${observation.compassHeadingDeg ?? 335}°. CV: ${cvResult?.detectedCategory} (${Math.round((cvResult?.confidence ?? 0.8) * 100)}% conf).`,
      mediaUrl: observation.photoUrl,
      cvAnalysis: cvResult,
    });

    this.auditLedger.recordEntry(
      'OBSERVATION_SUBMITTED',
      obsId,
      observation.contributorHandle,
      `Submitted sky observation for ${taskId} (Category: ${cvResult?.detectedCategory})`
    );

    this.notify();
    return fullObs;
  }

  /**
   * Dispatch an official regulatory / municipal action (THE "ACT" CAPABILITY)
   */
  dispatchActionIntervention(
    eventId: string,
    params: {
      authority: ActionIntervention['authority'];
      actionType: ActionIntervention['actionType'];
      title: string;
      targetSector: string;
      assignedUnits: string[];
      expectedImpactDescription: string;
    }
  ): ActionIntervention {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);

    const orderNumber = `VT-ACT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const action: ActionIntervention = {
      id: `ACT-${Date.now().toString(36)}`,
      orderNumber,
      eventId,
      authority: params.authority,
      actionType: params.actionType,
      title: params.title,
      targetSector: params.targetSector,
      dispatchedAt: new Date().toISOString(),
      status: 'active_on_site',
      assignedUnits: params.assignedUnits,
      expectedImpactDescription: params.expectedImpactDescription,
      targetPollutant: event.primaryPollutant,
    };

    event.intervention = action;
    event.status = 'action_dispatched';

    // Create a Post-Intervention Sky Task to verify dissolution ("ASK AGAIN" LOOP)
    this.createSkyTask(eventId, {
      title: `Post-Intervention Verification: Mist Cannon & Emission Suppression in ${params.targetSector}`,
      azimuthDeg: (event.forwardDispersionPlume.windDirectionDeg + 180) % 360,
      azimuthLabel: 'Downwind Dispersion Axis',
      rationale:
        'To establish causal proof of intervention efficacy, post-action sky photos and IoT telemetry must verify accelerated particulate settling.',
      taskType: 'post_intervention_check',
      targetCenter: [event.centerLocation.lat, event.centerLocation.lng],
      radiusMeters: 1500,
    });

    this.auditLedger.recordEntry(
      'INTERVENTION_ORDERED',
      action.id,
      params.authority,
      `Official intervention order ${orderNumber} dispatched: "${params.title}" to ${params.targetSector}`
    );

    this.notify();
    return action;
  }

  /**
   * Run Causal Proof Analysis (THE "PROVE" CAPABILITY)
   * Answers Question 9 & 10: "Did the intervention actually change the outcome?"
   */
  evaluateCausalProof(eventId: string): CausalProofResult | null {
    const event = this.events.find(e => e.id === eventId);
    if (!event || !event.intervention) return null;

    const controlStations = this.sensorService.getAllStations().filter(s => s.code.includes('PUSA') || s.code.includes('COLABA') || s.code.includes('ITO'));
    const proof = this.causalEngine.evaluateInterventionImpact(
      event.intervention,
      event.observedPeakConcentration,
      controlStations
    );

    event.causalProof = proof;
    event.status = 'causally_verified';

    this.auditLedger.recordEntry(
      'CAUSAL_PROOF_GENERATED',
      proof.actionId,
      'Econometric Causal Engine',
      `Verified DiD counterfactual proof: Net reduction -${proof.netPollutantReductionUgM3} µg/m³ (${proof.percentageReduction}%, p=${proof.pValue})`
    );

    this.notify();
    return proof;
  }

  /**
   * Switch between realistic Indian geographical scenarios
   */
  async switchScenario(scenarioKey: 'delhi' | 'mumbai' | 'punjab') {
    if (scenarioKey === 'delhi') {
      await this.initializeDefaultScenarios();
      return;
    }

    if (scenarioKey === 'mumbai') {
      const eventId = 'EVT-MUM-2026-042';
      const weather = await this.weatherProvider.getWeatherObservation(19.0144, 72.8988);
      const trace = this.traceEngine.computeTrace({
        originLat: 19.0144,
        originLng: 72.8988,
        pollutantConcentration: 195,
        baselineConcentration: 48,
        weather,
      });

      const event: PollutionEvent = {
        id: eventId,
        title: 'Mahul Chembur Petrochemical & Transport Corridor Plume',
        region: 'Mumbai Metropolitan Region (M-West / Port Zone)',
        centerLocation: {
          lat: 19.0144,
          lng: 72.8988,
          locationName: 'Mahul Refinery Corridor',
          district: 'Mumbai Suburban',
          state: 'Maharashtra',
        },
        detectedAt: new Date(Date.now() - 3.2 * 3600 * 1000).toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'evidence_gathering',
        primaryPollutant: 'SO2',
        observedPeakConcentration: 195,
        regionalBaselineConcentration: 48,
        priorProbability: 0.28,
        posteriorProbability: 0.81,
        bayesianLogOdds: 1.45,
        uncertaintyScore: 0.24,
        evidenceCount: 2,
        forwardDispersionPlume: trace.forwardPlume,
        backwardTrajectory: trace.backwardTrajectory,
        probableSourceRegions: trace.probableSourceRegions,
        sensitiveReceptors: [
          {
            id: 'rec-mum-01',
            name: 'Tata Memorial Advanced Centre for Treatment',
            category: 'hospital',
            location: { lat: 19.0280, lng: 72.9050 },
            estimatedArrivalTimeMinutes: 22,
            predictedPeakConcentration: 160,
            vulnerabilityWeight: 5.0,
            status: 'advisory_sent',
            populationAtRisk: 800,
          },
          {
            id: 'rec-mum-02',
            name: 'Chembur East Residential Dense Cluster',
            category: 'residential_high_density',
            location: { lat: 19.0550, lng: 72.9020 },
            estimatedArrivalTimeMinutes: 38,
            predictedPeakConcentration: 135,
            vulnerabilityWeight: 3.5,
            status: 'monitoring',
            populationAtRisk: 24000,
          },
        ],
        skyTasks: [
          {
            id: 'ST-2018',
            eventId,
            title: 'Sky Task #ST-2018: Eastern Freeway Cross-Wind Haze Inspection',
            targetZonePolygon: [
              [19.020, 72.890],
              [19.035, 72.895],
              [19.030, 72.915],
              [19.015, 72.910],
              [19.020, 72.890],
            ],
            targetCenter: [19.025, 72.902],
            targetAzimuthDeg: 240,
            targetAzimuthLabel: 'West-Southwest (240°)',
            timeWindow: {
              start: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
            taskType: 'sky_photo',
            rationale:
              'Sea-breeze circulation boundary shift creates plume displacement ambiguity. Optical opacity check needed across the 240° coastal vector.',
            targetUncertaintyReductionPct: 35,
            status: 'open',
            minContributorReliability: 0.6,
            requiredRadiusMeters: 1400,
            submittedObservations: [],
          },
        ],
        intervention: null,
        causalProof: null,
      };

      this.currentWeather = weather;
      this.events = [event];
      this.selectedEventId = eventId;
      this.evidenceLedger.set(eventId, [
        {
          id: 'EVD-MUM-SEN-01',
          eventId,
          sourceType: 'ground_sensor',
          timestamp: new Date(Date.now() - 2.8 * 3600 * 1000).toISOString(),
          location: { lat: 19.0144, lng: 72.8988, locationName: 'Mahul Chembur CAAQMS' },
          pollutant: 'SO2',
          observedValue: 98,
          unit: 'µg/m³',
          baselineValue: 18,
          likelihoodRatio: 4.1,
          sourceReliability: 0.89,
          spatialConsistencyScore: 0.95,
          temporalDecayFactor: 0.9,
          posteriorWeight: 0.89 * 0.9 * 0.95 * Math.log(4.1),
          validationStatus: 'verified',
          provenance: {
            sourceId: 'MH_MAHUL_CHEMBUR',
            dataProvider: 'MPCB Reference Monitor',
            hashSignature: 'sha256-mum-so2-18239',
            ingestTimestamp: new Date().toISOString(),
            ingestProtocol: 'REST_API',
          },
        },
      ]);

      this.recomputeConfidence(eventId);
      this.notify();
      return;
    }

    if (scenarioKey === 'punjab') {
      const eventId = 'EVT-PUN-2026-081';
      const weather = await this.weatherProvider.getWeatherObservation(30.2450, 75.8420);
      const trace = this.traceEngine.computeTrace({
        originLat: 30.2450,
        originLng: 75.8420,
        pollutantConcentration: 420,
        baselineConcentration: 90,
        weather,
      });

      const event: PollutionEvent = {
        id: eventId,
        title: 'Sangrur-Patiala Agricultural Stubble Combustion Plume',
        region: 'Malwa Agricultural Belt (Sangrur District)',
        centerLocation: {
          lat: 30.2450,
          lng: 75.8420,
          locationName: 'Dhuri-Sangrur Farmland Cluster',
          district: 'Sangrur',
          state: 'Punjab',
        },
        detectedAt: new Date(Date.now() - 4.1 * 3600 * 1000).toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'evidence_gathering',
        primaryPollutant: 'PM2.5',
        observedPeakConcentration: 420,
        regionalBaselineConcentration: 90,
        priorProbability: 0.45,
        posteriorProbability: 0.89,
        bayesianLogOdds: 2.1,
        uncertaintyScore: 0.20,
        evidenceCount: 2,
        forwardDispersionPlume: trace.forwardPlume,
        backwardTrajectory: trace.backwardTrajectory,
        probableSourceRegions: trace.probableSourceRegions,
        sensitiveReceptors: [
          {
            id: 'rec-pun-01',
            name: 'Sangrur Civil Hospital & Medical College',
            category: 'hospital',
            location: { lat: 30.2520, lng: 75.8580 },
            estimatedArrivalTimeMinutes: 14,
            predictedPeakConcentration: 380,
            vulnerabilityWeight: 4.9,
            status: 'advisory_sent',
            populationAtRisk: 1400,
          },
        ],
        skyTasks: [
          {
            id: 'ST-3091',
            eventId,
            title: 'Sky Task #ST-3091: Farm Perimeter Thermal Plume Horizon Photography',
            targetZonePolygon: [
              [30.235, 75.830],
              [30.255, 75.835],
              [30.250, 75.855],
              [30.230, 75.850],
              [30.235, 75.830],
            ],
            targetCenter: [30.242, 75.842],
            targetAzimuthDeg: 310,
            targetAzimuthLabel: 'Northwest (310°)',
            timeWindow: {
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
            taskType: 'sky_photo',
            rationale:
              'VIIRS satellite detected 78 MW thermal anomaly. Need ground visual proof to differentiate controlled boundary dousing from active stubble burning.',
            targetUncertaintyReductionPct: 45,
            status: 'open',
            minContributorReliability: 0.6,
            requiredRadiusMeters: 2000,
            submittedObservations: [],
          },
        ],
        intervention: null,
        causalProof: null,
      };

      this.currentWeather = weather;
      this.events = [event];
      this.selectedEventId = eventId;
      this.evidenceLedger.set(eventId, [
        {
          id: 'EVD-PUN-SAT-01',
          eventId,
          sourceType: 'satellite',
          timestamp: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
          location: { lat: 30.245, lng: 75.842, locationName: 'Sangrur Rural' },
          pollutant: 'PM2.5',
          observedValue: 78,
          unit: 'MW Fire Radiative Power',
          baselineValue: 0,
          likelihoodRatio: 5.6,
          sourceReliability: 0.94,
          spatialConsistencyScore: 0.96,
          temporalDecayFactor: 0.88,
          posteriorWeight: 0.94 * 0.88 * 0.96 * Math.log(5.6),
          validationStatus: 'verified',
          provenance: {
            sourceId: 'VIIRS-NPP-3091',
            dataProvider: 'NASA FIRMS / VIIRS 375m Active Fire Product',
            hashSignature: 'sha256-viirs-punjab-0938',
            ingestTimestamp: new Date().toISOString(),
            ingestProtocol: 'SATELLITE_INGEST_PIPELINE',
          },
        },
      ]);

      this.recomputeConfidence(eventId);
      this.notify();
    }
  }
}

// Singleton global store instance
export const store = new VayuTraceStore();
