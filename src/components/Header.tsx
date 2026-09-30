/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Wind, 
  Compass, 
  Thermometer, 
  Droplets, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  MapPin, 
  Activity,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { store } from '../core/store/VayuTraceStore';
import { WeatherObservation } from '../types';
import { useTheme } from '../core/theme/ThemeContext';

interface HeaderProps {
  weather: WeatherObservation | null;
  onOpenIngestModal: () => void;
  onOpenInfoModal: () => void;
  activeScenario: 'delhi' | 'mumbai' | 'punjab';
  onScenarioChange: (scenario: 'delhi' | 'mumbai' | 'punjab') => void;
}

export const Header: React.FC<HeaderProps> = ({
  weather,
  onOpenIngestModal,
  onOpenInfoModal,
  activeScenario,
  onScenarioChange,
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [role, setRole] = React.useState(store.userRole);
  const [isBayesian, setIsBayesian] = React.useState(store.useBayesianEngine);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as any;
    setRole(newRole);
    store.userRole = newRole;
  };

  const handleToggleEngine = () => {
    const next = !isBayesian;
    setIsBayesian(next);
    store.setEngineMode(next);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-sm">
      {/* Top Branding & Main Controls */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center shadow-sm text-white">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight text-blue-950">
              VayuTrace
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[11px] font-bold text-blue-900 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Live Anomaly
            </span>
          </div>
        </div>

        {/* Essential Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Region Selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => onScenarioChange('delhi')}
              className={`px-3 py-1 rounded-lg transition font-bold cursor-pointer ${
                activeScenario === 'delhi'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delhi
            </button>
            <button
              onClick={() => onScenarioChange('mumbai')}
              className={`px-3 py-1 rounded-lg transition font-bold cursor-pointer ${
                activeScenario === 'mumbai'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mumbai
            </button>
            <button
              onClick={() => onScenarioChange('punjab')}
              className={`px-3 py-1 rounded-lg transition font-bold cursor-pointer ${
                activeScenario === 'punjab'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Punjab
            </button>
          </div>

          {/* User Role Selector */}
          <div className="flex items-center text-xs">
            <select
              value={role}
              onChange={handleRoleChange}
              className="bg-slate-100 border border-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none cursor-pointer"
              title="Operational Role"
            >
              <option value="municipal_officer">Role: Municipal Officer</option>
              <option value="cpcb_inspector">Role: CPCB Inspector</option>
              <option value="citizen_contributor">Role: Citizen Contributor</option>
              <option value="environmental_researcher">Role: Environmental Researcher</option>
            </select>
          </div>

          {/* Bayesian Engine Toggle */}
          <button
            onClick={handleToggleEngine}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isBayesian
                ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle between Bayesian Fusion Engine and Heuristic Baseline"
          >
            <Activity className="w-3 h-3 text-blue-200" />
            <span>{isBayesian ? 'Bayesian Engine' : 'Heuristic Mode'}</span>
          </button>

          {/* Simple Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Switch Theme"
          >
            {theme === 'navy' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-blue-900" />
                <span className="hidden sm:inline">Navy-White</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Dark Navy</span>
              </>
            )}
          </button>

          {/* Ingest Action Button */}
          <button
            onClick={onOpenIngestModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ingest</span>
          </button>

          {/* Architecture Info */}
          <button
            onClick={onOpenInfoModal}
            className="p-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition bg-white shadow-2xs"
            title="Architecture & Methodology"
          >
            <HelpCircle className="w-4 h-4 text-blue-900" />
          </button>
        </div>
      </div>

      {/* Atmospheric Strip (Clean & Compact) */}
      {weather && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-1.5 text-xs text-slate-600">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 font-mono text-[11px] overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="flex items-center gap-1 text-slate-800">
                <Wind className="w-3 h-3 text-blue-900" />
                Wind: <strong>{weather.windSpeedMs} m/s {weather.windDirectionCompass}</strong>
              </span>
              <span className="flex items-center gap-1 text-slate-800">
                <Thermometer className="w-3 h-3 text-slate-600" />
                Temp: <strong>{weather.temperatureC}°C</strong>
              </span>
              <span className="flex items-center gap-1 text-slate-800">
                <Droplets className="w-3 h-3 text-blue-800" />
                Humidity: <strong>{weather.humidityPct}%</strong>
              </span>
              <span className="text-slate-600">
                Dispersion: <strong className="text-blue-900 font-bold">Class {weather.pasquillStabilityClass}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-blue-900 font-sans text-[10px] font-semibold flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>Bayesian Engine Active</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
