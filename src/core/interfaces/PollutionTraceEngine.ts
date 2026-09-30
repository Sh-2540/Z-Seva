/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BackwardTrajectorySegment,
  PlumeGeometry,
  ProbableSourceArea,
  WeatherObservation,
} from '../../types';

export interface TraceInput {
  originLat: number;
  originLng: number;
  pollutantConcentration: number;
  baselineConcentration: number;
  weather: WeatherObservation;
  historicalPriors?: {
    dominantSector?: string;
  };
}

export interface TraceResult {
  forwardPlume: PlumeGeometry;
  backwardTrajectory: BackwardTrajectorySegment[];
  probableSourceRegions: ProbableSourceArea[];
  methodologyDescription: string;
}

export interface PollutionTraceEngine {
  readonly name: string;
  computeTrace(input: TraceInput): TraceResult;
}
