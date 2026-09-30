/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SatellitePass } from '../../types';

export interface SatelliteQueryOptions {
  bbox: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  timeRangeHours?: number;
  product?: string;
  minQualityFlag?: number;
}

export interface SatelliteDataProvider {
  readonly providerName: string;
  readonly isLiveIntegration: boolean;
  queryPasses(options: SatelliteQueryOptions): Promise<SatellitePass[]>;
}
