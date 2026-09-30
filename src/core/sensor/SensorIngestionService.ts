/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VayuTrace Scalable Sensor Ingestion Service
 * Strict validation pipeline:
 * - Coordinates inside valid boundaries
 * - Physical measurement sanity limits (e.g. PM2.5 between 0 and 1500 ug/m3)
 * - Rate-of-change spike filtering (impossible physical transitions flagged)
 * - Duplicate timestamp rejection
 * - Sensor status and calibration sanity check
 */

import { GroundSensorStation, PollutantType } from '../../types';

export interface RawSensorPayload {
  stationCode: string;
  network: 'CPCB_CAAQMS' | 'DPCC_DELHI' | 'BMC_MUMBAI' | 'PPCB_PUNJAB' | 'COMMUNITY_IOT';
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  readings: Partial<Record<PollutantType, number>>;
  sensorStatus?: 'OK' | 'ERR_OPTICAL' | 'CAL_DUE';
  firmwareVersion?: string;
}

export interface IngestionValidationResult {
  accepted: boolean;
  stationCode: string;
  errors: string[];
  warnings: string[];
  sanitizedReading?: {
    pm25: number;
    pm10: number;
    no2?: number;
    so2?: number;
  };
  qaFlag: 'valid' | 'suspect_spike' | 'calibration_due';
}

export class SensorIngestionService {
  private knownStations: Map<string, GroundSensorStation> = new Map();
  private lastReadings: Map<string, { timestamp: number; pm25: number }> = new Map();

  constructor() {
    this.seedReferenceStations();
  }

  private seedReferenceStations() {
    // Delhi NCR Stations
    this.registerStation({
      id: 'stat-del-01',
      code: 'DL_ANAND_VIHAR',
      name: 'Anand Vihar (DPCC/CPCB)',
      network: 'DPCC_DELHI',
      coordinates: { lat: 28.6476, lng: 77.3160 },
      pollutants: { 'PM2.5': 382, 'PM10': 540, 'NO2': 88, 'SO2': 24, 'CO': 3.2, 'O3': 38 },
      status: 'online',
      reliabilityAlpha: 28,
      reliabilityBeta: 2,
      calibrationAgeDays: 45,
      lastIngestTime: new Date().toISOString(),
    });

    this.registerStation({
      id: 'stat-del-02',
      code: 'DL_ITO',
      name: 'ITO Central Intersection (CPCB)',
      network: 'CPCB_CAAQMS',
      coordinates: { lat: 28.6315, lng: 77.2492 },
      pollutants: { 'PM2.5': 275, 'PM10': 390, 'NO2': 72, 'SO2': 18, 'CO': 2.4, 'O3': 42 },
      status: 'online',
      reliabilityAlpha: 30,
      reliabilityBeta: 1,
      calibrationAgeDays: 30,
      lastIngestTime: new Date().toISOString(),
    });

    this.registerStation({
      id: 'stat-del-03',
      code: 'UP_VASUNDHARA',
      name: 'Vasundhara Sector 16 (UPPCB)',
      network: 'CPCB_CAAQMS',
      coordinates: { lat: 28.6601, lng: 77.3573 },
      pollutants: { 'PM2.5': 345, 'PM10': 480, 'NO2': 64, 'SO2': 31, 'CO': 2.8, 'O3': 35 },
      status: 'online',
      reliabilityAlpha: 25,
      reliabilityBeta: 3,
      calibrationAgeDays: 80,
      lastIngestTime: new Date().toISOString(),
    });

    this.registerStation({
      id: 'stat-del-04',
      code: 'DL_PUSA_BACKGROUND',
      name: 'Pusa Agricultural Institute (Upwind Control)',
      network: 'CPCB_CAAQMS',
      coordinates: { lat: 28.6360, lng: 77.1610 },
      pollutants: { 'PM2.5': 118, 'PM10': 185, 'NO2': 36, 'SO2': 10, 'CO': 1.1, 'O3': 55 },
      status: 'online',
      reliabilityAlpha: 32,
      reliabilityBeta: 1,
      calibrationAgeDays: 20,
      lastIngestTime: new Date().toISOString(),
    });

    // Mumbai Industrial & Port Corridor
    this.registerStation({
      id: 'stat-mum-01',
      code: 'MH_MAHUL_CHEMBUR',
      name: 'Mahul Chembur Industrial Zone (MPCB)',
      network: 'BMC_MUMBAI',
      coordinates: { lat: 19.0144, lng: 72.8988 },
      pollutants: { 'PM2.5': 195, 'PM10': 310, 'NO2': 94, 'SO2': 78, 'CO': 2.9, 'O3': 28 },
      status: 'online',
      reliabilityAlpha: 26,
      reliabilityBeta: 2,
      calibrationAgeDays: 60,
      lastIngestTime: new Date().toISOString(),
    });

    this.registerStation({
      id: 'stat-mum-02',
      code: 'MH_COLABA_COAST',
      name: 'Colaba Coastal Background (Upwind Clean Air Station)',
      network: 'BMC_MUMBAI',
      coordinates: { lat: 18.9067, lng: 72.8147 },
      pollutants: { 'PM2.5': 48, 'PM10': 85, 'NO2': 22, 'SO2': 8, 'CO': 0.8, 'O3': 46 },
      status: 'online',
      reliabilityAlpha: 34,
      reliabilityBeta: 1,
      calibrationAgeDays: 15,
      lastIngestTime: new Date().toISOString(),
    });
  }

  registerStation(station: GroundSensorStation) {
    this.knownStations.set(station.code, station);
  }

  getAllStations(): GroundSensorStation[] {
    return Array.from(this.knownStations.values());
  }

  getStation(code: string): GroundSensorStation | undefined {
    return this.knownStations.get(code);
  }

  /**
   * Validates and ingests a single sensor observation.
   * Rejects bad data with descriptive audit errors.
   */
  ingestObservation(payload: RawSensorPayload): IngestionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Mandatory station code check
    if (!payload.stationCode || payload.stationCode.trim().length === 0) {
      return { accepted: false, stationCode: 'UNKNOWN', errors: ['Missing stationCode in payload'], warnings, qaFlag: 'suspect_spike' };
    }

    // 2. Timestamp validation (within last 48 hours and not in future)
    const readingTime = new Date(payload.timestamp).getTime();
    const now = Date.now();
    if (isNaN(readingTime)) {
      errors.push(`Malformed ISO timestamp: "${payload.timestamp}"`);
    } else if (readingTime > now + 5 * 60 * 1000) {
      errors.push(`Timestamp is in future (+${Math.round((readingTime - now) / 60000)} min)`);
    } else if (readingTime < now - 48 * 3600 * 1000) {
      errors.push('Timestamp is older than 48-hour operational window');
    }

    // Check duplicate timestamp
    const last = this.lastReadings.get(payload.stationCode);
    if (last && last.timestamp === readingTime) {
      errors.push('Duplicate observation timestamp rejected for this station');
    }

    // 3. Coordinate boundary validation (India geographical bounds: Lat [6.5, 37.5], Lng [68.0, 97.5])
    const { lat, lng } = payload.coordinates || {};
    if (lat === undefined || lng === undefined) {
      errors.push('Missing GPS coordinates');
    } else if (lat < 6.5 || lat > 37.5 || lng < 68.0 || lng > 97.5) {
      errors.push(`Coordinates (${lat}, ${lng}) outside Indian terrestrial bounding box`);
    }

    // 4. Physical bounds validation
    const pm25 = payload.readings?.['PM2.5'];
    const pm10 = payload.readings?.['PM10'];

    if (pm25 === undefined && pm10 === undefined) {
      errors.push('Payload contains neither PM2.5 nor PM10 readings');
    }

    let qaFlag: 'valid' | 'suspect_spike' | 'calibration_due' = 'valid';

    if (pm25 !== undefined) {
      if (pm25 < 0) {
        errors.push(`Negative PM2.5 value (${pm25} µg/m³) physically impossible`);
      } else if (pm25 > 1500) {
        errors.push(`Extreme PM2.5 value (${pm25} µg/m³) exceeds sensor optical saturation threshold (1500 µg/m³)`);
      }

      // Rate-of-change spike check: Jump of > 250 ug/m3 in under 5 minutes without prior trend
      if (last && readingTime > last.timestamp) {
        const deltaMinutes = (readingTime - last.timestamp) / (60 * 1000);
        if (deltaMinutes <= 5 && Math.abs(pm25 - last.pm25) > 250) {
          warnings.push(`Extreme instantaneous jump: +${Math.round(pm25 - last.pm25)} µg/m³ in ${deltaMinutes.toFixed(1)}m. Flagged for peer validation.`);
          qaFlag = 'suspect_spike';
        }
      }
    }

    if (pm10 !== undefined && pm25 !== undefined && pm25 > pm10 * 1.05) {
      // In physics, PM2.5 is a fraction of PM10; PM2.5 should not exceed PM10 except for slight measurement noise
      warnings.push(`PM2.5 (${pm25}) exceeds PM10 (${pm10}); sensor optical sizing ratio inverted`);
      qaFlag = 'calibration_due';
    }

    if (payload.sensorStatus === 'CAL_DUE') {
      warnings.push('Sensor hardware telemetry reports calibration due date exceeded');
      qaFlag = 'calibration_due';
    }

    if (errors.length > 0) {
      return {
        accepted: false,
        stationCode: payload.stationCode,
        errors,
        warnings,
        qaFlag: 'suspect_spike',
      };
    }

    // Update state
    if (pm25 !== undefined) {
      this.lastReadings.set(payload.stationCode, { timestamp: readingTime, pm25 });
    }

    // Update station record if known
    const station = this.knownStations.get(payload.stationCode);
    if (station && pm25 !== undefined) {
      station.pollutants['PM2.5'] = pm25;
      if (pm10 !== undefined) station.pollutants['PM10'] = pm10;
      station.lastIngestTime = new Date(readingTime).toISOString();
    }

    return {
      accepted: true,
      stationCode: payload.stationCode,
      errors: [],
      warnings,
      sanitizedReading: {
        pm25: pm25 ?? 0,
        pm10: pm10 ?? 0,
        no2: payload.readings?.['NO2'],
        so2: payload.readings?.['SO2'],
      },
      qaFlag,
    };
  }

  /**
   * Batch ingestion helper
   */
  ingestBatch(payloads: RawSensorPayload[]): IngestionValidationResult[] {
    return payloads.map(p => this.ingestObservation(p));
  }
}
