import React, { useState, useCallback } from 'react';
import { X, Navigation, Shield, AlertTriangle, CheckCircle, ChevronRight, Loader2, MapPin, Zap, Route } from 'lucide-react';
import { Issue } from '../types';
import {
  findHazardsOnRoute,
  computeSafetyScore,
  generateStraightLineRoute,
  DEMO_LOCATIONS,
  HazardOnRoute,
  RoutePoint
} from '../utils/routeUtils';

interface SafeRoutePanelProps {
  allIssues: Issue[];
  onSelectIssue: (id: string) => void;
  onClose: () => void;
  /** Pass the google.maps.DirectionsService instance when Maps API is active */
  directionsService?: google.maps.DirectionsService | null;
  /** Callback to render the route on the parent Google Map */
  onRouteComputed?: (result: google.maps.DirectionsResult | null) => void;
  hasGoogleMaps: boolean;
}

const CATEGORY_EMOJI: Record<string, string> = {
  pothole: '🚧',
  water_leak: '🚰',
  streetlight: '💡',
  garbage: '🗑️',
  other: '⚠️'
};

function SafetyScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30'
    : score >= 50 ? 'text-amber-400 border-amber-500/30 bg-amber-950/30'
    : 'text-red-400 border-red-500/30 bg-red-950/30';
  const label = score >= 80 ? 'Safe' : score >= 50 ? 'Moderate Risk' : 'High Risk';
  const icon = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴';
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${color} justify-between`}>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Route Safety Score</div>
        <div className="text-2xl font-black mt-0.5">{score}<span className="text-sm font-bold opacity-50">/100</span></div>
        <div className="text-[10px] font-semibold mt-0.5">{icon} {label}</div>
      </div>
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <Shield className="w-5 h-5 absolute inset-0 m-auto" />
      </div>
    </div>
  );
}

export default function SafeRoutePanel({
  allIssues,
  onSelectIssue,
  onClose,
  directionsService,
  onRouteComputed,
  hasGoogleMaps
}: SafeRoutePanelProps) {
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [startCoord, setStartCoord] = useState<RoutePoint | null>(null);
  const [endCoord, setEndCoord] = useState<RoutePoint | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hazards, setHazards] = useState<HazardOnRoute[] | null>(null);
  const [safetyScore, setSafetyScore] = useState<number | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState<'start' | 'end' | null>(null);

  const demoLocationNames = Object.keys(DEMO_LOCATIONS);

  const handleSelectDemoLocation = (name: string, field: 'start' | 'end') => {
    const coord = DEMO_LOCATIONS[name];
    if (field === 'start') {
      setStartInput(name);
      setStartCoord(coord);
    } else {
      setEndInput(name);
      setEndCoord(coord);
    }
    setShowLocationPicker(null);
    setHazards(null);
  };

  const handleCalculate = useCallback(async () => {
    setError(null);
    setHazards(null);
    setSafetyScore(null);

    if (!startCoord || !endCoord) {
      setError('Please select both a start and destination from the quick-pick list.');
      return;
    }

    setIsCalculating(true);

    try {
      let routePoints: RoutePoint[] = [];

      if (hasGoogleMaps && directionsService) {
        // Use real Google Directions API
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin: { lat: startCoord.lat, lng: startCoord.lng },
              destination: { lat: endCoord.lat, lng: endCoord.lng },
              travelMode: google.maps.TravelMode.DRIVING
            },
            (res, status) => {
              if (status === 'OK' && res) resolve(res);
              else reject(new Error(`Directions API error: ${status}`));
            }
          );
        });

        onRouteComputed?.(result);

        // Extract polyline points
        const leg = result.routes[0].legs[0];
        setRouteDistanceKm(leg.distance?.text || '');
        const path = result.routes[0].overview_path;
        routePoints = path.map(pt => ({ lat: pt.lat(), lng: pt.lng() }));
      } else {
        // Fallback: straight-line route approximation
        routePoints = generateStraightLineRoute(
          startCoord.lat, startCoord.lng,
          endCoord.lat, endCoord.lng,
          80
        );
        const { haversineMeters } = await import('../utils/routeUtils');
        const distM = haversineMeters(startCoord.lat, startCoord.lng, endCoord.lat, endCoord.lng);
        setRouteDistanceKm(`~${(distM / 1000).toFixed(1)} km (straight-line)`);
        onRouteComputed?.(null);
      }

      // Find hazards within 400m corridor of the route
      const detected = findHazardsOnRoute(routePoints, allIssues, 400);
      const score = computeSafetyScore(detected);
      setHazards(detected);
      setSafetyScore(score);
    } catch (e: any) {
      setError(e.message || 'Failed to calculate route. Please try again.');
      onRouteComputed?.(null);
    } finally {
      setIsCalculating(false);
    }
  }, [startCoord, endCoord, hasGoogleMaps, directionsService, allIssues, onRouteComputed]);

  const handleClear = () => {
    setStartInput('');
    setEndInput('');
    setStartCoord(null);
    setEndCoord(null);
    setHazards(null);
    setSafetyScore(null);
    setError(null);
    setRouteDistanceKm('');
    onRouteComputed?.(null);
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-[340px] bg-[#0d0d0d]/95 backdrop-blur-md border-l border-white/10 shadow-2xl z-20 flex flex-col animate-slide-in-right overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#111111] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Navigation className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Safe Travel Planner</div>
            <h3 className="font-display font-extrabold text-white text-sm leading-tight">Route Hazard Scan</h3>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* API Mode Indicator */}
        <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
          hasGoogleMaps
            ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400'
            : 'bg-amber-950/40 border border-amber-500/20 text-amber-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${hasGoogleMaps ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          {hasGoogleMaps ? 'Google Maps Routing Active' : 'Straight-Line Approximation Mode (Add Maps Key for real routes)'}
        </div>

        {/* Start Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-500" /> Start Location
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={startInput}
              placeholder="Select a start location..."
              onClick={() => setShowLocationPicker(showLocationPicker === 'start' ? null : 'start')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
            {startInput && (
              <button onClick={() => { setStartInput(''); setStartCoord(null); setHazards(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {showLocationPicker === 'start' && (
            <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {demoLocationNames.map(name => (
                <button key={name} onClick={() => handleSelectDemoLocation(name, 'start')}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                  <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />{name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* End Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-red-500" /> Destination
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={endInput}
              placeholder="Select a destination..."
              onClick={() => setShowLocationPicker(showLocationPicker === 'end' ? null : 'end')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            />
            {endInput && (
              <button onClick={() => { setEndInput(''); setEndCoord(null); setHazards(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {showLocationPicker === 'end' && (
            <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {demoLocationNames.map(name => (
                <button key={name} onClick={() => handleSelectDemoLocation(name, 'end')}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />{name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCalculate}
            disabled={isCalculating || !startCoord || !endCoord}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(37,99,235,0.3)] cursor-pointer"
          >
            {isCalculating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Route...</>
            ) : (
              <><Route className="w-4 h-4" /> Scan for Hazards</>
            )}
          </button>
          {hazards !== null && (
            <button onClick={handleClear}
              className="px-3 py-2.5 rounded-xl bg-[#111111] border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-xs font-bold">
              Clear
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {hazards !== null && safetyScore !== null && (
          <div className="space-y-4 animate-fade-in">
            {/* Route info */}
            {routeDistanceKm && (
              <div className="text-[10px] text-gray-500 flex items-center gap-1.5 font-medium">
                <Route className="w-3 h-3" /> Route distance: <strong className="text-gray-300">{routeDistanceKm}</strong>
              </div>
            )}

            {/* Safety Score */}
            <SafetyScoreBadge score={safetyScore} />

            <div className="h-px bg-white/5" />

            {/* Hazard List */}
            {hazards.length === 0 ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-300 text-sm">Route Clear! 🎉</div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    No active civic issues detected within 400m of your route. Safe travels!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    {hazards.length} Hazard{hazards.length > 1 ? 's' : ''} Detected
                  </h4>
                  <span className="text-[10px] text-gray-500">Sorted by route position</span>
                </div>

                {hazards.map((h, idx) => {
                  const severityColor =
                    h.issue.severity === 5 ? 'border-red-500/30 bg-red-950/20'
                    : h.issue.severity === 4 ? 'border-orange-500/30 bg-orange-950/20'
                    : h.issue.severity === 3 ? 'border-amber-500/30 bg-amber-950/20'
                    : 'border-blue-500/30 bg-blue-950/20';

                  const severityText =
                    h.issue.severity === 5 ? 'text-red-400'
                    : h.issue.severity === 4 ? 'text-orange-400'
                    : h.issue.severity === 3 ? 'text-amber-400'
                    : 'text-blue-400';

                  return (
                    <button
                      key={h.issue.id}
                      onClick={() => onSelectIssue(h.issue.id)}
                      className={`w-full text-left p-3 rounded-xl border ${severityColor} hover:brightness-110 transition-all cursor-pointer group`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-lg shrink-0 mt-0.5">{CATEGORY_EMOJI[h.issue.category] || '⚠️'}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${severityText}`}>
                                Level {h.issue.severity} · {h.issue.status}
                              </span>
                              <span className="text-[9px] text-gray-500">#{idx + 1}</span>
                            </div>
                            <div className="text-xs font-bold text-white mt-0.5 capitalize">
                              {h.issue.category.replace('_', ' ')}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 truncate leading-relaxed">
                              {h.issue.location.name}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-3">
                              <span>📍 {h.distanceFromRouteMeters}m from route</span>
                              <span>🚗 ~{h.distanceAlongRouteKm}km from start</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white shrink-0 mt-1 transition-colors" />
                      </div>
                    </button>
                  );
                })}

                {/* Safety Tips */}
                <div className="p-3 bg-[#111111] border border-white/5 rounded-xl text-[10px] text-gray-400 leading-relaxed space-y-1">
                  <div className="font-bold text-gray-300 flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3 h-3 text-amber-500" /> Safety Tips for This Route
                  </div>
                  {hazards.some(h => h.issue.category === 'pothole') && (
                    <div>🚧 Potholes detected — reduce speed and avoid sudden braking.</div>
                  )}
                  {hazards.some(h => h.issue.category === 'water_leak') && (
                    <div>🚰 Water pooling on road — watch for slippery surfaces.</div>
                  )}
                  {hazards.some(h => h.issue.category === 'streetlight') && (
                    <div>💡 Poor lighting areas — use headlights and stay alert.</div>
                  )}
                  {hazards.some(h => h.issue.category === 'garbage') && (
                    <div>🗑️ Garbage obstruction — watch for stray animals and debris.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
