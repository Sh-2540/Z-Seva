/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  MapPin, 
  Navigation2, 
  Compass, 
  AlertTriangle,
  Building,
  Camera,
  Globe2,
  Map as MapIcon,
  Mountain
} from 'lucide-react';
import { GroundSensorStation, PollutionEvent, SkyTask } from '../types';
import { store } from '../core/store/VayuTraceStore';

interface VayuTraceMapProps {
  event: PollutionEvent | undefined;
  onSelectSkyTask?: (taskId: string) => void;
  onSelectReceptor?: (receptorId: string) => void;
}

type BasemapType = 'satellite' | 'light' | 'terrain';

export const VayuTraceMap: React.FC<VayuTraceMapProps> = ({
  event,
  onSelectSkyTask,
  onSelectReceptor,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const basemapLayersRef = useRef<{
    satellite: L.TileLayer;
    satelliteLabels: L.TileLayer;
    light: L.TileLayer;
    terrain: L.TileLayer;
  } | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('satellite');

  const layerGroupsRef = useRef<{
    plumes: L.LayerGroup;
    backwardTrajectory: L.LayerGroup;
    sourceRegions: L.LayerGroup;
    sensors: L.LayerGroup;
    receptors: L.LayerGroup;
    skyTasks: L.LayerGroup;
    epicenter: L.LayerGroup;
  }>({
    plumes: L.layerGroup(),
    backwardTrajectory: L.layerGroup(),
    sourceRegions: L.layerGroup(),
    sensors: L.layerGroup(),
    receptors: L.layerGroup(),
    skyTasks: L.layerGroup(),
    epicenter: L.layerGroup(),
  });

  // Layer visibility toggles
  const [showPlumes, setShowPlumes] = useState(true);
  const [showBackTraj, setShowBackTraj] = useState(true);
  const [showSourceRegions, setShowSourceRegions] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showReceptors, setShowReceptors] = useState(true);
  const [showSkyTasks, setShowSkyTasks] = useState(true);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);

  // Initialize Map & Basemaps
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = event?.centerLocation.lat ?? 28.6476;
    const initialLng = event?.centerLocation.lng ?? 77.3160;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    // 1. High-Resolution Real Satellite Imagery (Esri World Imagery)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        maxZoom: 19,
      }
    );

    // Satellite Road & Label Reference Overlay
    const satelliteLabelsLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '',
        maxZoom: 19,
        opacity: 0.85,
      }
    );

    // 2. Premium Light Cartography (CartoDB Voyager / Positron)
    const lightLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    );

    // 3. Topographic / Shaded Relief Map
    const terrainLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
        maxZoom: 19,
      }
    );

    basemapLayersRef.current = {
      satellite: satelliteLayer,
      satelliteLabels: satelliteLabelsLayer,
      light: lightLayer,
      terrain: terrainLayer,
    };

    // Default to Satellite mode as requested
    satelliteLayer.addTo(map);
    satelliteLabelsLayer.addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add all layer groups to map
    Object.values(layerGroupsRef.current).forEach(group => group.addTo(map));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switch
  const handleBasemapChange = (mode: BasemapType) => {
    const map = mapInstanceRef.current;
    const basemaps = basemapLayersRef.current;
    if (!map || !basemaps) return;

    setActiveBasemap(mode);

    // Remove all basemap layers
    map.removeLayer(basemaps.satellite);
    map.removeLayer(basemaps.satelliteLabels);
    map.removeLayer(basemaps.light);
    map.removeLayer(basemaps.terrain);

    if (mode === 'satellite') {
      basemaps.satellite.addTo(map);
      basemaps.satelliteLabels.addTo(map);
    } else if (mode === 'light') {
      basemaps.light.addTo(map);
    } else if (mode === 'terrain') {
      basemaps.terrain.addTo(map);
    }
  };

  // Auto fly-to when event changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !event) return;
    map.flyTo([event.centerLocation.lat, event.centerLocation.lng], 12, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [event?.id]);

  // Update Map Layers when Event or Toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !event) return;

    const layers = layerGroupsRef.current;
    
    // Clear existing layers
    Object.values(layers).forEach(group => group.clearLayers());

    // 1. Epicenter Marker
    const [eLat, eLng] = [event.centerLocation.lat, event.centerLocation.lng];
    const epicenterHtml = `
      <div style="position: relative; width: 32px; height: 32px;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `;
    const epicenterIcon = L.divIcon({
      html: epicenterHtml,
      className: 'epicenter-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const epicenterMarker = L.marker([eLat, eLng], { icon: epicenterIcon });
    epicenterMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; padding: 2px;">
        <div style="font-weight: 800; color: #dc2626; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; margin-bottom: 2px;">Emission Anomaly Epicenter</div>
        <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${event.title}</div>
        <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${event.centerLocation.locationName}</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 8px; border-radius: 6px; font-family: monospace; font-size: 11px;">
          Peak: <strong style="color: #dc2626; font-size: 13px;">${event.observedPeakConcentration} µg/m³</strong> ${event.primaryPollutant}<br/>
          Posterior Probability: <strong>${Math.round(event.posteriorProbability * 100)}%</strong>
        </div>
      </div>
    `);
    layers.epicenter.addLayer(epicenterMarker);

    // 2. Forward Gaussian Plume Isopleths
    if (showPlumes && event.forwardDispersionPlume) {
      const colors: Record<string, { fill: string; stroke: string; opacity: number }> = {
        extreme: { fill: '#dc2626', stroke: '#b91c1c', opacity: 0.45 },
        severe: { fill: '#ea580c', stroke: '#c2410c', opacity: 0.35 },
        unhealthy: { fill: '#d97706', stroke: '#b45309', opacity: 0.25 },
        moderate: { fill: '#ca8a04', stroke: '#a16207', opacity: 0.18 },
      };

      event.forwardDispersionPlume.isopleths.forEach(iso => {
        const style = colors[iso.level] || colors.moderate;
        const poly = L.polygon(iso.polygon, {
          color: style.stroke,
          weight: 2,
          fillColor: style.fill,
          fillOpacity: style.opacity,
          dashArray: iso.level === 'unhealthy' ? '5, 5' : undefined,
        });

        poly.bindPopup(`
          <div style="font-size: 12px; padding: 2px;">
            <div style="font-weight: 800; color: ${style.stroke}; text-transform: uppercase; font-size: 10px;">
              Forward Plume Isopleth (${iso.level})
            </div>
            <div style="font-weight: 600; color: #0f172a; margin-top: 2px;">Expected ${event.primaryPollutant}: &ge; <strong>${iso.concentrationUgM3} µg/m³</strong></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 4px;">
              Pasquill Class ${event.forwardDispersionPlume.stabilityClass} | Wind: ${event.forwardDispersionPlume.windSpeedMs} m/s
            </div>
          </div>
        `);
        layers.plumes.addLayer(poly);
      });

      // Plume Centerline Vector
      if (event.forwardDispersionPlume.centerline.length > 1) {
        const centerlinePolyline = L.polyline(event.forwardDispersionPlume.centerline, {
          color: '#0284c7',
          weight: 3,
          opacity: 0.9,
          dashArray: '6, 6',
        });
        centerlinePolyline.bindPopup(`
          <div style="font-size: 12px; padding: 2px;">
            <strong style="color: #0369a1;">Downwind Plume Advection Axis</strong><br/>
            Projected Dispersion Range: ${event.forwardDispersionPlume.projectedRangeKm} km
          </div>
        `);
        layers.plumes.addLayer(centerlinePolyline);
      }
    }

    // 3. Backward Trajectory (Kinematic Source Attribution)
    if (showBackTraj && event.backwardTrajectory && event.backwardTrajectory.length > 0) {
      const trajectoryPoints: [number, number][] = [
        [eLat, eLng],
        ...event.backwardTrajectory.map(b => [b.lat, b.lng] as [number, number]),
      ];

      const backPolyline = L.polyline(trajectoryPoints, {
        color: '#9333ea',
        weight: 3,
        opacity: 0.9,
        dashArray: '4, 6',
      });
      layers.backwardTrajectory.addLayer(backPolyline);

      // Markers at each hour backstep
      event.backwardTrajectory.forEach(seg => {
        const marker = L.circleMarker([seg.lat, seg.lng], {
          radius: 7,
          color: '#ffffff',
          weight: 2,
          fillColor: '#9333ea',
          fillOpacity: 1.0,
        });

        marker.bindPopup(`
          <div style="font-size: 12px; padding: 2px;">
            <div style="font-weight: 800; color: #7e22ce; font-size: 10px; text-transform: uppercase;">Backward Trajectory Step: T${seg.hourOffset}h</div>
            <div style="font-weight: 600; color: #0f172a; margin-top: 2px;">${seg.probableSourceCluster}</div>
            <div style="color: #64748b; font-size: 11px;">Est. Plume Height: ${seg.estimatedHeightMeters}m AGL</div>
          </div>
        `);
        layers.backwardTrajectory.addLayer(marker);
      });
    }

    // 4. Probable Source Regions (Hypotheses)
    if (showSourceRegions && event.probableSourceRegions) {
      event.probableSourceRegions.forEach((area, i) => {
        const isPrimary = i === 0;
        const poly = L.polygon(area.polygon, {
          color: isPrimary ? '#db2777' : '#7c3aed',
          weight: 2.5,
          fillColor: isPrimary ? '#db2777' : '#7c3aed',
          fillOpacity: isPrimary ? 0.3 : 0.18,
          dashArray: isPrimary ? undefined : '5, 5',
        });

        poly.bindPopup(`
          <div style="font-size: 12px; max-width: 250px; padding: 2px;">
            <div style="font-weight: 800; color: ${isPrimary ? '#be185d' : '#6d28d9'}; font-size: 10px; text-transform: uppercase;">
              ${area.hypothesisLabel}
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 2px 0;">${area.name}</div>
            <div style="color: #475569; font-size: 11px; line-height: 1.4; margin-bottom: 6px;">
              ${area.evidenceSummary}
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
              Bayesian Hypothesis Prior: <strong style="color: #0f172a;">${Math.round(area.confidenceHypothesis * 100)}%</strong>
            </div>
          </div>
        `);
        layers.sourceRegions.addLayer(poly);
      });
    }

    // 5. Sensitive Receptors
    if (showReceptors && event.sensitiveReceptors) {
      event.sensitiveReceptors.forEach(rec => {
        const color = rec.category === 'hospital' ? '#dc2626' : rec.category === 'school' ? '#d97706' : '#0284c7';
        const iconHtml = `
          <div style="background: #ffffff; border: 2.5px solid ${color}; color: ${color}; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
            ${rec.category === 'hospital' ? 'H' : rec.category === 'school' ? 'S' : 'R'}
          </div>
        `;
        const marker = L.marker([rec.location.lat, rec.location.lng], {
          icon: L.divIcon({ html: iconHtml, className: 'receptor-icon', iconSize: [26, 26] }),
        });

        marker.bindPopup(`
          <div style="font-size: 12px; padding: 2px;">
            <div style="font-weight: 800; color: ${color}; text-transform: uppercase; font-size: 10px;">
              Sensitive Receptor (${rec.category})
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${rec.name}</div>
            <div style="margin-top: 4px; font-family: monospace; font-size: 11px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px;">
              Plume ETA: <strong style="color: #dc2626;">~${rec.estimatedArrivalTimeMinutes} min</strong><br/>
              Predicted Peak: <strong>${rec.predictedPeakConcentration} µg/m³</strong><br/>
              Population at Risk: <strong>${rec.populationAtRisk.toLocaleString()}</strong>
            </div>
            <div style="margin-top: 6px;">
              <span style="font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: ${rec.status === 'advisory_sent' ? '#fee2e2' : '#f1f5f9'}; color: ${rec.status === 'advisory_sent' ? '#991b1b' : '#475569'}; border: 1px solid ${rec.status === 'advisory_sent' ? '#fecaca' : '#cbd5e1'};">
                ${rec.status === 'advisory_sent' ? 'Emergency Advisory Active' : 'Under Active Monitoring'}
              </span>
            </div>
          </div>
        `);
        layers.receptors.addLayer(marker);
      });
    }

    // 6. Ground Sensor Stations
    if (showSensors) {
      const allStations = store.sensorService.getAllStations();
      allStations.forEach(st => {
        const pm25 = st.pollutants['PM2.5'] ?? 50;
        const color = pm25 > 250 ? '#dc2626' : pm25 > 120 ? '#ea580c' : pm25 > 60 ? '#ca8a04' : '#16a34a';
        
        const sensorMarker = L.circleMarker([st.coordinates.lat, st.coordinates.lng], {
          radius: 8,
          color: '#ffffff',
          weight: 2,
          fillColor: color,
          fillOpacity: 1.0,
        });

        sensorMarker.bindPopup(`
          <div style="font-size: 12px; padding: 2px;">
            <div style="font-weight: 800; color: #0284c7; font-size: 10px; text-transform: uppercase;">${st.network}</div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${st.name}</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px; margin-top: 4px; font-family: monospace; font-size: 11px;">
              PM2.5: <strong style="color: ${color}; font-size: 14px;">${pm25} µg/m³</strong><br/>
              Reliability: <strong>${Math.round((st.reliabilityAlpha / (st.reliabilityAlpha + st.reliabilityBeta)) * 100)}%</strong> (Beta Prior)<br/>
              Calibration Age: ${st.calibrationAgeDays} days
            </div>
          </div>
        `);
        layers.sensors.addLayer(sensorMarker);
      });
    }

    // 7. Active Sky Tasks (Geofenced Zones)
    if (showSkyTasks && event.skyTasks) {
      event.skyTasks.forEach(task => {
        const taskPoly = L.polygon(task.targetZonePolygon, {
          color: '#0d9488',
          weight: 2.5,
          fillColor: '#0d9488',
          fillOpacity: 0.25,
          dashArray: '6, 6',
        });

        taskPoly.bindPopup(`
          <div style="font-size: 12px; max-width: 260px; padding: 2px;">
            <div style="font-weight: 800; color: #0f766e; font-size: 10px; text-transform: uppercase;">
              Active Sky Task #${task.id}
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 2px 0;">${task.title}</div>
            <div style="color: #475569; font-size: 11px; line-height: 1.3; margin: 4px 0;">
              Azimuth: <strong>${task.targetAzimuthLabel}</strong><br/>
              Radius: ${task.requiredRadiusMeters}m | Status: <span style="color: #0d9488; font-weight: 600;">${task.status}</span>
            </div>
            <div style="background: #f0fdfa; color: #115e59; border: 1px solid #ccfbf1; padding: 5px 7px; border-radius: 6px; font-size: 11px; margin-top: 4px;">
              Rationale: ${task.rationale.slice(0, 110)}...
            </div>
          </div>
        `);
        layers.skyTasks.addLayer(taskPoly);

        // Center camera pin for the Sky Task
        const cameraIconHtml = `
          <div style="background: #0d9488; color: #ffffff; border: 2.5px solid #ffffff; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.6); cursor: pointer;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
        `;
        const taskPin = L.marker(task.targetCenter, {
          icon: L.divIcon({ html: cameraIconHtml, className: 'skytask-pin', iconSize: [30, 30] }),
        });
        taskPin.on('click', () => {
          onSelectSkyTask?.(task.id);
        });
        layers.skyTasks.addLayer(taskPin);
      });
    }

    // Pan map to epicenter if needed
    map.panTo([eLat, eLng]);
  }, [event, showPlumes, showBackTraj, showSourceRegions, showSensors, showReceptors, showSkyTasks]);

  const handleCenterMap = () => {
    if (!mapInstanceRef.current || !event) return;
    mapInstanceRef.current.setView([event.centerLocation.lat, event.centerLocation.lng], 12);
  };

  return (
    <div className="relative w-full h-[520px] lg:h-[580px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-100">
      {/* Leaflet map DOM element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left: Basemap Switcher (Clean & Simple) */}
      <div className="absolute top-3 left-3 z-[1000] bg-white border border-slate-200 rounded-xl p-1 shadow-md flex items-center gap-1 text-xs">
        <button
          onClick={() => handleBasemapChange('satellite')}
          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
            activeBasemap === 'satellite'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Satellite Imagery"
        >
          🛰️ Satellite
        </button>

        <button
          onClick={() => handleBasemapChange('light')}
          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
            activeBasemap === 'light'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Light Map"
        >
          🗺️ Light
        </button>

        <button
          onClick={() => handleBasemapChange('terrain')}
          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
            activeBasemap === 'terrain'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Topographic Terrain"
        >
          🏔️ Topo
        </button>
      </div>

      {/* Top Right: Compact Layer Toggle & Recenter */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5">
        <button
          onClick={handleCenterMap}
          title="Recenter Map"
          className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-900 hover:bg-slate-50 shadow-md transition cursor-pointer"
        >
          <Compass className="w-4 h-4 text-blue-900" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowLayersDropdown(!showLayersDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-md transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-900" />
            <span>Layers</span>
          </button>

          {showLayersDropdown && (
            <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs space-y-2 w-48 animate-in fade-in zoom-in-95">
              <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  Forward Plume
                </span>
                <input
                  type="checkbox"
                  checked={showPlumes}
                  onChange={e => setShowPlumes(e.target.checked)}
                  className="rounded text-blue-900"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  Back Trajectory
                </span>
                <input
                  type="checkbox"
                  checked={showBackTraj}
                  onChange={e => setShowBackTraj(e.target.checked)}
                  className="rounded text-blue-900"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-600"></span>
                  Probable Sources
                </span>
                <input
                  type="checkbox"
                  checked={showSourceRegions}
                  onChange={e => setShowSourceRegions(e.target.checked)}
                  className="rounded text-blue-900"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Sky Tasks
                </span>
                <input
                  type="checkbox"
                  checked={showSkyTasks}
                  onChange={e => setShowSkyTasks(e.target.checked)}
                  className="rounded text-blue-900"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Receptors
                </span>
                <input
                  type="checkbox"
                  checked={showReceptors}
                  onChange={e => setShowReceptors(e.target.checked)}
                  className="rounded text-blue-900"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                  Sensors
                </span>
                <input
                  type="checkbox"
                  checked={showSensors}
                  onChange={e => setShowSensors(e.target.checked)}
                  className="rounded text-blue-900"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left: Map Legend Overlay (Clean & Minimal) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-xs border border-slate-200/90 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 shadow-sm flex items-center gap-3">
        <span className="flex items-center gap-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          <span>&gt;250 (Extreme)</span>
        </span>
        <span className="flex items-center gap-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>&gt;150 (Severe)</span>
        </span>
        <span className="flex items-center gap-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>&gt;90 (Moderate)</span>
        </span>
      </div>
    </div>
  );
};
