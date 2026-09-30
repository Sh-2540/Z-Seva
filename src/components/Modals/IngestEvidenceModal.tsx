/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Satellite, 
  Wind, 
  CheckCircle, 
  AlertTriangle, 
  PlusCircle, 
  Hash,
  Activity
} from 'lucide-react';
import { store } from '../../core/store/VayuTraceStore';
import { EvidenceSourceType, PollutantType } from '../../types';

interface IngestEvidenceModalProps {
  eventId: string;
  onClose: () => void;
  onIngested: () => void;
}

export const IngestEvidenceModal: React.FC<IngestEvidenceModalProps> = ({
  eventId,
  onClose,
  onIngested,
}) => {
  const [sourceType, setSourceType] = useState<EvidenceSourceType>('ground_sensor');
  const [stationName, setStationName] = useState('Vasundhara Sector 16 CAAQMS');
  const [pollutant, setPollutant] = useState<PollutantType>('PM2.5');
  const [observedValue, setObservedValue] = useState(360);
  const [likelihoodRatio, setLikelihoodRatio] = useState(4.2);
  const [notes, setNotes] = useState('Optical particulate counter spike recorded downwind.');
  const [validationError, setValidationError] = useState<string | null>(null);

  const stationOptions = [
    { name: 'Vasundhara Sector 16 CAAQMS (UPPCB)', pollutant: 'PM2.5', defaultVal: 360, lr: 4.2 },
    { name: 'ITO Central Intersection (CPCB)', pollutant: 'PM2.5', defaultVal: 280, lr: 3.5 },
    { name: 'Sentinel-5P OFFL Tropospheric NO2 Column', pollutant: 'NO2', defaultVal: 235, lr: 3.8 },
    { name: 'NASA FIRMS / VIIRS 375m Thermal FRP Anomaly', pollutant: 'PM2.5', defaultVal: 82, lr: 5.1 },
  ];

  const handlePresetSelect = (opt: typeof stationOptions[0]) => {
    setStationName(opt.name);
    setPollutant(opt.pollutant as PollutantType);
    setObservedValue(opt.defaultVal);
    setLikelihoodRatio(opt.lr);
    if (opt.name.includes('Sentinel') || opt.name.includes('VIIRS')) {
      setSourceType('satellite');
    } else {
      setSourceType('ground_sensor');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (sourceType === 'ground_sensor') {
      const validation = store.sensorService.ingestObservation({
        stationCode: 'MANUAL_INGEST_STATION',
        network: 'CPCB_CAAQMS',
        coordinates: { lat: 28.65, lng: 77.32 },
        timestamp: new Date().toISOString(),
        readings: { [pollutant]: observedValue },
      });

      if (!validation.accepted) {
        setValidationError(validation.errors.join('; '));
        return;
      }
    }

    const event = store.getSelectedEvent();
    const reliability = sourceType === 'ground_sensor' ? 0.91 : 0.88;

    store.addEvidence(eventId, {
      sourceType,
      timestamp: new Date().toISOString(),
      location: {
        lat: event?.centerLocation.lat ?? 28.65,
        lng: event?.centerLocation.lng ?? 77.32,
        locationName: stationName,
      },
      pollutant,
      observedValue,
      unit: pollutant === 'NO2' ? 'µmol/m²' : pollutant === 'PM2.5' ? 'µg/m³' : 'µg/m³',
      baselineValue: 100,
      likelihoodRatio,
      sourceReliability: reliability,
      spatialConsistencyScore: 0.94,
      temporalDecayFactor: 1.0,
      posteriorWeight: reliability * Math.log(likelihoodRatio),
      validationStatus: 'verified',
      provenance: {
        sourceId: `SRC-${Date.now().toString(36)}`,
        dataProvider: stationName,
        hashSignature: `sha256-ingest-${Date.now().toString(16)}`,
        ingestTimestamp: new Date().toISOString(),
        ingestProtocol: sourceType === 'satellite' ? 'SATELLITE_INGEST_PIPELINE' : 'REST_API',
      },
      notes,
    });

    onIngested();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center border border-sky-200">
              <PlusCircle className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Ingest Verified Evidence Stream
              </h3>
              <p className="text-[11px] text-sky-700 font-mono">
                Updates Bayesian Log-Odds and Epistemic Uncertainty
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Preset Buttons */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5 text-[11px] uppercase">
              Quick Stream Presets:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {stationOptions.map(opt => (
                <button
                  type="button"
                  key={opt.name}
                  onClick={() => handlePresetSelect(opt)}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 text-left text-slate-800 hover:bg-sky-50/50 transition shadow-xs cursor-pointer"
                >
                  <div className="font-bold text-[11px] truncate text-slate-900">{opt.name}</div>
                  <div className="text-[10px] text-sky-600 font-mono font-semibold mt-0.5">
                    {opt.pollutant}: {opt.defaultVal} (LR={opt.lr}x)
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Source Type & Station Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Source Stream Type:</label>
              <select
                value={sourceType}
                onChange={e => setSourceType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="ground_sensor">Ground Sensor Station</option>
                <option value="satellite">Satellite Pass (S5P / VIIRS)</option>
                <option value="meteorological">Meteorological Sensor</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Pollutant / Metric:</label>
              <select
                value={pollutant}
                onChange={e => setPollutant(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="PM2.5">PM2.5 (Fine Particulates)</option>
                <option value="PM10">PM10 (Coarse Dust)</option>
                <option value="NO2">NO2 (Tropospheric Column)</option>
                <option value="SO2">SO2 (Industrial Sulfur)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Station / Provider Name:</label>
            <input
              type="text"
              value={stationName}
              onChange={e => setStationName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          {/* Numerical Values */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Observed Measurement Value:
              </label>
              <input
                type="number"
                value={observedValue}
                onChange={e => setObservedValue(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Likelihood Ratio P(D|E)/P(D|&not;E):
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="20"
                value={likelihoodRatio}
                onChange={e => setLikelihoodRatio(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-teal-800 font-bold focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Calibration & Ingestion Notes:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition cursor-pointer"
            >
              Validate & Ingest Stream
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
