/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  Compass, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  CheckCircle,
  EyeOff
} from 'lucide-react';
import { store } from '../../core/store/VayuTraceStore';
import { PhotoAnalysisResult, SkyTask } from '../../types';

interface SubmitObservationModalProps {
  task: SkyTask;
  onClose: () => void;
  onSubmitted: () => void;
}

export const SubmitObservationModal: React.FC<SubmitObservationModalProps> = ({
  task,
  onClose,
  onSubmitted,
}) => {
  const [contributorHandle, setContributorHandle] = useState('AnandVihar_Citizen_Watch');
  const [azimuthDeg, setAzimuthDeg] = useState(task.targetAzimuthDeg);
  const [preservePrivacy, setPreservePrivacy] = useState(true);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [cvResult, setCvResult] = useState<PhotoAnalysisResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('industrial_smoke');
  const [customPhotoBase64, setCustomPhotoBase64] = useState<string | null>(null);

  const presets = [
    {
      id: 'industrial_smoke',
      label: 'Dense Industrial Smoke Plume',
      description: 'Conical high-opacity plume rising from point-source stacks facing 335° NNW.',
    },
    {
      id: 'stubble_burning',
      label: 'Agricultural Stubble Smoke Veil',
      description: 'Low-altitude diffuse brown-gray haze hugging the nocturnal inversion layer.',
    },
    {
      id: 'fugitive_dust',
      label: 'Fugitive Construction Dust Plume',
      description: 'Surface level coarse particulate suspension around arterial roadwork.',
    },
    {
      id: 'clear_sky',
      label: 'Clear Blue Sky (Dissipation Verified)',
      description: 'Clean optical Rayleigh scattering; no active smoke or plume detected.',
    },
  ];

  const handleRunAnalysis = async () => {
    setAnalyzingPhoto(true);
    try {
      const result = await store.visionPipeline.analyzeSkyPhoto(
        customPhotoBase64 || `preset_${selectedPreset}`,
        {
          promptHint: selectedPreset,
          azimuth: azimuthDeg,
        }
      );
      setCvResult(result);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCustomPhotoBase64(base64);
        setSelectedPreset('custom_upload');
        setCvResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalCv = cvResult;
    if (!finalCv) {
      finalCv = await store.visionPipeline.analyzeSkyPhoto(
        customPhotoBase64 || `preset_${selectedPreset}`,
        {
          promptHint: selectedPreset,
          azimuth: azimuthDeg,
        }
      );
    }

    await store.submitCitizenObservation(task.id, {
      contributorId: 'contrib-delhi-88',
      contributorHandle: contributorHandle || 'Anonymous_Observer',
      location: {
        lat: task.targetCenter[0] + (Math.random() - 0.5) * 0.005,
        lng: task.targetCenter[1] + (Math.random() - 0.5) * 0.005,
        locationName: `Observer Sector near ${task.title.slice(10, 30)}`,
        isObfuscated: preservePrivacy,
        fuzzingRadiusKm: 1.0,
      },
      compassHeadingDeg: azimuthDeg,
      photoUrl: customPhotoBase64 || `preset_${selectedPreset}`,
      cvResult: finalCv,
    });

    onSubmitted();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Submit Sky Task Observation
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Task #{task.id} • Target Azimuth: {task.targetAzimuthLabel}
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
          
          {/* Contributor Handle */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Contributor Verified Handle / Alias:
            </label>
            <input
              type="text"
              value={contributorHandle}
              onChange={e => setContributorHandle(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          {/* Compass Heading */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-600" />
                Azimuth Camera Heading:
              </span>
              <span className="font-mono text-teal-800 font-black text-sm">{azimuthDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={azimuthDeg}
              onChange={e => setAzimuthDeg(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium">
              <span>0° N</span>
              <span>90° E</span>
              <span>180° S</span>
              <span>270° W</span>
              <span>360° N</span>
            </div>
          </div>

          {/* Sky Photo Selection / Presets */}
          <div className="space-y-2">
            <label className="block text-slate-700 font-bold">
              Select Sky Observation Image (Preset or Upload):
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              {presets.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setSelectedPreset(p.id);
                    setCustomPhotoBase64(null);
                    setCvResult(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedPreset === p.id && !customPhotoBase64
                      ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-[11px] text-slate-900">{p.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{p.description}</div>
                </button>
              ))}
            </div>

            {/* Custom file upload */}
            <div className="pt-1">
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 cursor-pointer text-slate-600 hover:text-slate-900 transition">
                <Upload className="w-4 h-4 text-teal-600" />
                <span className="text-[11px] font-medium">Or upload device camera photo (JPEG/PNG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Run Instant Computer Vision Classifier Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={analyzingPhoto}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{analyzingPhoto ? 'Analyzing via Computer Vision...' : 'Run Vision Classifier'}</span>
            </button>
          </div>

          {/* Computer Vision Analysis Preview Card */}
          {cvResult && (
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 space-y-2">
              <div className="flex items-center justify-between text-teal-900 font-bold uppercase text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  CV Result: {cvResult.detectedCategory}
                </span>
                <span className="font-mono text-teal-950 font-extrabold">
                  Confidence: {Math.round(cvResult.confidence * 100)}%
                </span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                {cvResult.explanation}
              </p>
              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 pt-1 border-t border-teal-100">
                <span>Estimated Opacity: <strong className="text-amber-800">{cvResult.estimatedOpacityPct}%</strong></span>
                <span>Horizon Detected: <strong className="text-slate-800">{cvResult.horizonDetected ? 'Yes' : 'No'}</strong></span>
              </div>
            </div>
          )}

          {/* Privacy Preservation Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
            <EyeOff className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-900 font-bold">
                <input
                  type="checkbox"
                  checked={preservePrivacy}
                  onChange={e => setPreservePrivacy(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-0 cursor-pointer"
                />
                Preserve Citizen Privacy (Strip EXIF & Fuzz Coordinates)
              </label>
              <p className="text-[10px] text-slate-500">
                Removes sensitive camera serial numbers and rounds coordinates to ~1 km grid. Exact residential addresses are never stored.
              </p>
            </div>
          </div>

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
              Submit Observation & Update Bayesian Prior
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
