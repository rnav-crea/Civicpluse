import React, { useState, useRef, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Issue, IssueCategory, UserProfile } from '../types';
import { MapPin, Flame, AlertCircle, Info, Sparkles, CheckCircle, HelpCircle, Layers, ZoomIn, ZoomOut, Compass, X, Navigation } from 'lucide-react';
import SafeRoutePanel from './SafeRoutePanel';

interface MapTabProps {
  allIssues: Issue[];
  profile: UserProfile | null;
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  onOpenReportModal: () => void;
}

export default function MapTab({ allIssues, profile, selectedIssueId, onSelectIssue, onOpenReportModal }: MapTabProps) {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [showSafeRoute, setShowSafeRoute] = useState(false);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  const handleRouteComputed = useCallback((result: google.maps.DirectionsResult | null) => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections(result);
    }
  }, []);

  // Initialize Directions refs when Google Maps is ready (called from inside APIProvider context)
  const initDirections = useCallback((map: google.maps.Map) => {
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 5,
          strokeOpacity: 0.85
        }
      });
      directionsRendererRef.current.setMap(map);
    }
  }, []);
  
  // Read Google Maps API key dynamically
  const [inputKey, setInputKey] = useState('');
  const [apiKey, setApiKey] = useState(() => {
    const rawEnv = process.env.GOOGLE_MAPS_PLATFORM_KEY ||
      (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
      (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
      '';
    const rawLs = localStorage.getItem('GOOGLE_MAPS_PLATFORM_KEY') || '';
    return (rawLs || rawEnv).trim().replace(/^["']|["']$/g, '').trim();
  });

  // A key is valid if it exists and is not a placeholder string
  const hasValidKey = Boolean(apiKey) && 
                      apiKey !== 'YOUR_API_KEY' && 
                      apiKey !== 'MY_GOOGLE_MAPS_PLATFORM_KEY' && 
                      apiKey.length > 10;

  const handleSaveKey = (keyToSave: string) => {
    const cleaned = keyToSave.trim().replace(/^["']|["']$/g, '').trim();
    if (cleaned.length > 10) {
      localStorage.setItem('GOOGLE_MAPS_PLATFORM_KEY', cleaned);
      setApiKey(cleaned);
    }
  };
  
  // Local states for custom fallback grid-map panning/zooming simulation
  const [fallbackZoom, setFallbackZoom] = useState(14);
  const [fallbackOffset, setFallbackOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter issues for "Near Me" (matching profile area) by default on the map,
  // but if some are elsewhere, we can display them all too so they can see all mock locations!
  // Let's display all issues on the map, color-coded.
  const activeIssues = allIssues;

  // Pin Color Mapping based on Severity
  const getPinColor = (severity: number) => {
    if (severity === 5) return '#f43f5e'; // Red
    if (severity === 4) return '#f97316'; // Orange
    if (severity === 3) return '#fbbf24'; // Yellow
    return '#10b981'; // Green
  };

  const getCategoryEmoji = (category: IssueCategory) => {
    if (category === 'pothole') return '🚧';
    if (category === 'water_leak') return '🚰';
    if (category === 'streetlight') return '💡';
    if (category === 'garbage') return '🗑️';
    return '⚠️';
  };

  // Fallback Grid-Map Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (hasValidKey) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - fallbackOffset.x, y: e.clientY - fallbackOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || hasValidKey) return;
    setFallbackOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Plot coordinates from GPS space into localFallback canvas space (percentage layout centered on Vizag)
  const getFallbackCoordinates = (lat: number, lng: number) => {
    // Vizag center: 17.6868, 83.2185
    const centerLat = 17.6868;
    const centerLng = 83.2185;
    
    // Scaling factors to spread out coords nicely on screen
    const scaleX = 4000 * (fallbackZoom / 14);
    const scaleY = -4000 * (fallbackZoom / 14); // Invert lat since map Y goes down

    const dLng = lng - centerLng;
    const dLat = lat - centerLat;

    // Centered at 50% width & height + offset panned
    const posX = 50 + (dLng * scaleX) + (fallbackOffset.x / 8);
    const posY = 50 + (dLat * scaleY) + (fallbackOffset.y / 8);

    return { x: `${posX}%`, y: `${posY}%` };
  };

  return (
    <div className="relative w-full h-full flex-1 min-h-0 bg-[#0a0a0a] overflow-hidden flex flex-col">
      
      {/* Top Warning banner if Google Maps API key is not yet configured */}
      {!hasValidKey && !isWarningDismissed && (
        <div className="bg-[#111111] border-b border-white/10 text-gray-300 px-4 py-3 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs z-10 shadow-lg relative pr-10">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            <div className="p-1.5 rounded bg-red-500/10 text-red-500 shrink-0">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="text-center sm:text-left">
              <span className="font-bold text-white block sm:inline">Virtual City Grid Active:</span> Add <code className="bg-[#161616] border border-white/10 px-1 py-0.5 rounded text-red-400">GOOGLE_MAPS_PLATFORM_KEY</code>, or paste it here to load Google Maps:
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-center lg:justify-end">
            <input 
              type="password"
              placeholder="Paste Maps API Key..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 w-36 sm:w-44 md:w-48"
            />
            <button
              onClick={() => handleSaveKey(inputKey)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded transition-all cursor-pointer text-[10px]"
            >
              Apply
            </button>
            <a
              href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] cursor-pointer text-[10px] whitespace-nowrap"
            >
              Get Free Key
            </a>
          </div>

          {/* Close Banner button */}
          <button
            onClick={() => setIsWarningDismissed(true)}
            className="absolute top-3.5 right-3 p-1 rounded-lg text-gray-500 hover:text-white transition-colors cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Map Container */}
      <div className="relative flex-1 min-h-0 w-full">
        {hasValidKey ? (
          /* ====================================
             1. REAL GOOGLE MAPS IMPLEMENTATION
             ==================================== */
          <APIProvider apiKey={apiKey} version="weekly" onLoad={() => {}}>
            <Map
              defaultCenter={{ lat: 17.6868, lng: 83.2185 }} // Vizag focus center
              defaultZoom={13}
              mapTypeId={mapType}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="cooperative"
              onIdle={(e) => {
                if (e.map) initDirections(e.map);
              }}
            >
              {activeIssues.map((issue) => (
                <AdvancedMarker
                  key={issue.id}
                  position={{ lat: issue.location.lat, lng: issue.location.lng }}
                  title={issue.location.name}
                  onClick={() => onSelectIssue(issue.id)}
                >
                  <div className="relative group cursor-pointer">
                    {/* Ripple animated background for critical alerts */}
                    {issue.severity >= 4 && issue.status !== 'RESOLVED' && (
                      <span className="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-ping" />
                    )}
                    {/* Pin element */}
                    <Pin
                      background={issue.status === 'RESOLVED' ? '#71717a' : getPinColor(issue.severity)}
                      glyphColor="#ffffff"
                      borderColor="#ffffff"
                    >
                      <span className="text-xs font-bold leading-none">{getCategoryEmoji(issue.category)}</span>
                    </Pin>
                  </div>
                </AdvancedMarker>
              ))}
            </Map>

            {/* Map Type Controller overlay (Real Map only) */}
            <div className="absolute top-4 left-4 bg-[#111111]/95 backdrop-blur border border-white/10 p-1.5 rounded-xl shadow-xl flex items-center gap-1 text-[11px] font-bold text-gray-400 z-10">
              <button 
                onClick={() => setMapType('roadmap')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${mapType === 'roadmap' ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.3)] font-bold' : 'hover:bg-white/5 hover:text-white'}`}
              >
                Map
              </button>
              <button 
                onClick={() => setMapType('satellite')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${mapType === 'satellite' ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.3)] font-bold' : 'hover:bg-white/5 hover:text-white'}`}
              >
                Satellite
              </button>
              <button 
                onClick={() => setMapType('hybrid')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${mapType === 'hybrid' ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.3)] font-bold' : 'hover:bg-white/5 hover:text-white'}`}
              >
                Hybrid
              </button>
            </div>
          </APIProvider>
        ) : (
          /* ====================================
             2. FALLBACK STYLISH VECTOR MAP
             ==================================== */
          <div 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full relative select-none bg-black flex items-center justify-center cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          >
            {/* Ambient grid system lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#220c0c_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40" />
            
            {/* Compass overlay */}
            <div className="absolute top-4 left-4 p-2 bg-[#111111]/90 backdrop-blur rounded-xl border border-white/10 text-gray-400 flex items-center gap-2 text-[10px] font-bold">
              <Compass className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="tracking-wide">JURISDICTIONAL RADAR: VISAKHAPATNAM</span>
            </div>

            {/* Fallback Map City Vectors Layout */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div className="w-96 h-96 rounded-full border border-red-500/10 flex items-center justify-center animate-spin-slow">
                <div className="w-64 h-64 rounded-full border border-dashed border-red-500/10 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border border-red-500/10" />
                </div>
              </div>
            </div>

            {/* Zoom / Navigation helper info overlay */}
            <div className="absolute bottom-4 left-4 space-y-2 max-w-[200px] sm:max-w-xs p-3 bg-[#111111]/90 backdrop-blur-md rounded-xl border border-white/10 text-[10px] text-gray-400 leading-normal shadow-lg z-10">
              <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-500" />
                Fallback Simulator
              </div>
              <p className="text-gray-500">Drag background to pan. Click markers to review tickets. Add a Map Key for live geographic overlays.</p>
              
              <div className="flex items-center gap-2 pt-1.5 border-t border-white/5">
                <button 
                  onClick={() => setFallbackZoom(z => Math.max(11, z - 1))}
                  className="p-1 rounded bg-[#161616] hover:bg-[#222222] border border-white/5 text-white transition-all cursor-pointer"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="font-mono text-white text-[9px]">SCALE: {fallbackZoom}00m</span>
                <button 
                  onClick={() => setFallbackZoom(z => Math.min(18, z + 1))}
                  className="p-1 rounded bg-[#161616] hover:bg-[#222222] border border-white/5 text-white transition-all cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* FALLBACK MARKERS */}
            {activeIssues.map((issue) => {
              const pos = getFallbackCoordinates(issue.location.lat, issue.location.lng);
              const isSelected = selectedIssueId === issue.id;

              return (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue.id)}
                  style={{ left: pos.x, top: pos.y }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-all duration-300"
                >
                  <div className={`relative group p-1 rounded-full border-2 bg-[#111111] flex items-center justify-center shadow-xl transition-all ${
                    isSelected 
                      ? 'border-white ring-4 ring-red-500/50 scale-125 z-20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                      : issue.isRecurrent
                        ? 'border-red-500 hover:border-red-400 hover:scale-110 animate-pulse'
                        : 'border-white/10 hover:border-white/30 hover:scale-110'
                  }`}
                  style={{ width: '40px', height: '40px' }} // CSS Sizing CF3
                  >
                    {/* Ping ripple for critical */}
                    {issue.severity >= 4 && issue.status !== 'RESOLVED' && (
                      <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping -z-10" />
                    )}

                    {/* Status accent point */}
                    <span 
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border border-[#0a0a0a] flex items-center justify-center text-[7px]"
                      style={{ backgroundColor: issue.status === 'RESOLVED' ? '#71717a' : getPinColor(issue.severity) }}
                    />

                    {/* Display Emoji inside marker */}
                    <span className="text-sm select-none">{getCategoryEmoji(issue.category)}</span>

                    {/* Hover Card Toolkit */}
                    <div className="absolute bottom-11 scale-0 group-hover:scale-100 left-1/2 -translate-x-1/2 bg-[#111111] border border-white/10 px-3 py-2 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl pointer-events-none transition-all z-30">
                      <div className="font-bold flex items-center gap-1">
                        <span className="capitalize">{issue.category.replace('_', ' ')}</span>
                        <span className="text-[8px] px-1 bg-[#161616] border border-white/5 rounded">S{issue.severity}</span>
                      </div>
                      <div className="text-gray-400 mt-0.5 max-w-[120px] truncate">{issue.location.name}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Report Button (Bottom Right Overlay) */}
        <button
          onClick={onOpenReportModal}
          className="absolute bottom-6 right-6 px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-[0_4px_20px_rgba(220,38,38,0.4)] flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer z-15 group border border-red-500/20"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">📷</span>
          <span>+ Report Issue</span>
        </button>

        {/* Safe Route Planner Button */}
        <button
          onClick={() => setShowSafeRoute(prev => !prev)}
          className={`absolute bottom-6 left-6 px-4 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer z-15 border ${
            showSafeRoute
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500/30 shadow-[0_4px_20px_rgba(37,99,235,0.4)]'
              : 'bg-[#111111]/90 hover:bg-[#1a1a1a] text-blue-400 border-blue-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span className="text-xs">Safe Route Planner</span>
        </button>

        {/* Safe Route Panel Slide-over */}
        {showSafeRoute && (
          <SafeRoutePanel
            allIssues={allIssues}
            onSelectIssue={(id) => {
              onSelectIssue(id);
            }}
            onClose={() => {
              setShowSafeRoute(false);
              handleRouteComputed(null);
            }}
            directionsService={directionsServiceRef.current}
            onRouteComputed={handleRouteComputed}
            hasGoogleMaps={hasValidKey}
          />
        )}
      </div>

    </div>
  );
}
