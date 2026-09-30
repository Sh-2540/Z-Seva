/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VayuTrace OpenWeather REST Adapter
 * Production adapter for live meteorological queries with fallback to local simulation
 * when API key is unconfigured.
 */

import { PasquillStabilityClass, WeatherObservation } from '../../types';
import { WeatherProvider } from '../interfaces/WeatherProvider';
import { RealisticWeatherProvider } from './RealisticWeatherProvider';

export class OpenWeatherAdapter implements WeatherProvider {
  readonly providerName = 'OpenWeather Air & Meteorology API Adapter';
  readonly isLiveIntegration = true;
  private apiKey?: string;
  private fallbackProvider = new RealisticWeatherProvider();

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getWeatherObservation(lat: number, lng: number): Promise<WeatherObservation> {
    if (!this.apiKey) {
      // Graceful fallback to physics-constrained realistic simulator
      const simulated = await this.fallbackProvider.getWeatherObservation(lat, lng);
      return {
        ...simulated,
        dataSource: 'OpenWeather Adapter (Live API key not supplied; using calibrated simulation)',
        isSimulated: true,
      };
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${this.apiKey}`
      );
      if (!response.ok) {
        throw new Error(`OpenWeather HTTP ${response.status}`);
      }
      const data = await response.json();
      const windSpeed = data.wind?.speed ?? 2.0;
      const windDeg = data.wind?.deg ?? 0;

      // Approximate Pasquill stability class from cloud cover & wind speed
      let stability: PasquillStabilityClass = 'D';
      const clouds = data.clouds?.all ?? 50;
      if (windSpeed < 2 && clouds < 20) stability = 'A';
      else if (windSpeed < 3 && clouds < 50) stability = 'B';
      else if (windSpeed >= 5) stability = 'D';

      const compassDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const compassIdx = Math.round(windDeg / 22.5) % 16;

      return {
        timestamp: new Date().toISOString(),
        windSpeedMs: windSpeed,
        windDirectionDeg: windDeg,
        windDirectionCompass: compassDirections[compassIdx],
        temperatureC: data.main?.temp ?? 25,
        humidityPct: data.main?.humidity ?? 60,
        pressureHpa: data.main?.pressure ?? 1013,
        pasquillStabilityClass: stability,
        boundaryLayerHeightMeters: 750,
        dataSource: 'OpenWeatherMap One Call / Standard API (Live Feed)',
        isSimulated: false,
      };
    } catch {
      return this.fallbackProvider.getWeatherObservation(lat, lng);
    }
  }
}
