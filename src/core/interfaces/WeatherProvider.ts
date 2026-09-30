/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherObservation } from '../../types';

export interface WeatherProvider {
  readonly providerName: string;
  readonly isLiveIntegration: boolean;
  getWeatherObservation(lat: number, lng: number): Promise<WeatherObservation>;
}
