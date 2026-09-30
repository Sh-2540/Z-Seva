/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Compass, 
  MapPin, 
  Sparkles, 
  Clock,
  Layers
} from 'lucide-react';
import { store } from '../../core/store/VayuTraceStore';
import { PollutionEvent, SkyTask } from '../../types';

interface CreateSkyTaskModalProps {
  event: PollutionEvent;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateSkyTaskModal: React.FC<CreateSkyTaskModalProps> = ({
  event,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('Ground Horizon Smoke Density Verification');
  const [azimuthDeg, setAzimuthDeg] = useState(
    Math.round(((event.forwardDispersionPlume.windDirectionDeg || 315) + 180) % 360)
  );
  const [azimuthLabel, setAzimuthLabel] = useState('Downwind Dispersion Vector');
  const [taskType, setTaskType] = useState<SkyTask['taskType']>('sky_photo');
  const [radiusMeters, setRadiusMeters] = useState(1200);
  const [rationale, setRationale] = useState(
    'Discrepancies in boundary layer optical depth require photographic validation along the downwind trajectory axis.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.createSkyTask(event.id, {
      title,
      azimuthDeg,
      azimuthLabel: `${azimuthLabel} (${azimuthDeg}°)`,
      rationale,
      taskType,
      targetCenter: [event.centerLocation.lat, event.centerLocation.lng],
      radiusMeters,
    });
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Issue Active Sensing Sky Task (ASK)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Mobilizes verified citizen observers and IoT nodes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Task Title / Mission:</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Task Type:</label>
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="sky_photo">Sky Photograph Capture</option>
                <option value="local_sensor_reading">Local Sensor Cross-Check</option>
                <option value="cross_validation_photo">Cross-Wind Boundary Photo</option>
                <option value="post_intervention_check">Post-Intervention Efficacy Check</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Radius (m):</label>
              <input
                type="number"
                value={radiusMeters}
                onChange={e => setRadiusMeters(Number(e.target.value))}
                min={200}
                max={5000}
                step={100}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>
          </div>

          {/* Compass Heading */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-600" />
                Target Azimuth Compass Heading:
              </span>
              <span className="font-mono text-sky-600 font-black text-sm">{azimuthDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={azimuthDeg}
              onChange={e => setAzimuthDeg(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <input
              type="text"
              placeholder="e.g. North-Northwest Vector"
              value={azimuthLabel}
              onChange={e => setAzimuthLabel(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-[11px] font-medium"
            />
          </div>

          {/* Scientific Rationale */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Information Entropy Rationale (Why this task reduces uncertainty):
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition cursor-pointer"
            >
              Dispatch Sky Task to Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
