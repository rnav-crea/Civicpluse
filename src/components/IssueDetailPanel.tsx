import React from 'react';
import { X, Calendar, MapPin, Building, ShieldAlert, CheckCircle, Flame, Clock, Sparkles, Check, Trash2, Camera, Image as ImageIcon, User } from 'lucide-react';
import { Issue, IssueCategory, UserProfile } from '../types';

interface IssueDetailPanelProps {
  issue: Issue | null;
  onClose: () => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  profile: UserProfile | null;
}

export default function IssueDetailPanel({ issue, onClose, onResolve, onDelete, profile }: IssueDetailPanelProps) {
  if (!issue) return null;

  const canResolve = !!(
    profile?.isOfficial &&
    profile.officialDepartment?.trim().toLowerCase() === issue.department.trim().toLowerCase()
  );

  // Formatting date/time relative
  const getRelativeTime = (timestamp: number) => {
    const elapsedMs = Date.now() - timestamp;
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    if (hours < 1) {
      const minutes = Math.floor(elapsedMs / (1000 * 60));
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Calculate duration between report and resolve
  const getDuration = (start: number, end: number) => {
    const diffMs = end - start;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (days > 0) {
      const remainingHrs = hrs % 24;
      return `${days}d ${remainingHrs}h`;
    }
    if (hrs > 0) {
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  // Severity configurations
  const getSeverityBadge = (level: number) => {
    const colors = [
      { text: 'text-green-400 bg-green-950/40 border border-green-500/20', label: 'Low' },
      { text: 'text-teal-400 bg-teal-950/40 border border-teal-500/20', label: 'Minor' },
      { text: 'text-yellow-400 bg-yellow-950/40 border border-yellow-500/20', label: 'Medium' },
      { text: 'text-orange-400 bg-orange-950/40 border border-orange-500/20', label: 'High' },
      { text: 'text-red-400 bg-red-950/40 border border-red-500/20', label: 'Critical' }
    ];
    const cfg = colors[Math.min(4, Math.max(0, level - 1))];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.text} flex items-center gap-1 shrink-0`}>
        <Flame className="w-3.5 h-3.5 fill-current" />
        Level {level} ({cfg.label})
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'RESOLVED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          RESOLVED
        </span>
      );
    }
    if (status === 'ESCALATED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white flex items-center gap-1 shrink-0 animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.4)]">
          <ShieldAlert className="w-3.5 h-3.5" />
          ESCALATED 🔺
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 border border-white/10 text-zinc-300 flex items-center gap-1 shrink-0">
        <Clock className="w-3.5 h-3.5" />
        OPEN
      </span>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#0d0d0d] shadow-2xl border-l border-white/10 flex flex-col h-full transform transition-transform duration-300 animate-slide-in-right">
      
      {/* Title Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#111111]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CIVIC COMPLAINT LOCK</span>
          <h3 className="font-display font-bold text-white text-lg leading-snug">Ticket #{issue.id.slice(-6).toUpperCase()}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Details Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Issue Image */}
        {issue.imageBase64 && (
          <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-900 h-48 relative shadow-sm">
            <img 
              src={issue.imageBase64} 
              alt={issue.category} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              {getStatusBadge(issue.status)}
            </div>
            <div className="absolute top-3 right-3">
              {getSeverityBadge(issue.severity)}
            </div>
            {/* Verification Overlay Badge */}
            <div className="absolute bottom-3 left-3">
              {issue.photoSource === 'live' && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Verified
                </span>
              )}
              {issue.photoSource === 'preset' && (
                <span className="px-2 py-0.5 rounded bg-blue-950/90 border border-blue-500/30 text-blue-400 font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1 shadow">
                  Preset Demo
                </span>
              )}
              {(issue.photoSource === 'upload' || !issue.photoSource) && (
                <span className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1 shadow">
                  Uploaded
                </span>
              )}
            </div>
          </div>
        )}

        {/* Categories / Badges (Non-image backup layout) */}
        {!issue.imageBase64 && (
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(issue.status)}
            {getSeverityBadge(issue.severity)}
          </div>
        )}

        {/* Recurrent Issue warning banner */}
        {issue.isRecurrent && (
          <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-xs shadow-[0_0_12px_rgba(220,38,38,0.1)]">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div>
              <div className="font-extrabold uppercase tracking-wider text-[9px] text-red-500">⚠️ Recurrent Hazard Detected (Double Issue)</div>
              <div className="mt-0.5 text-gray-300 leading-normal">
                This issue has returned! It was previously resolved at this location. Severity escalated (+1) to Level {issue.severity}. (Recurrence Count: #{issue.recurrenceCount || 1})
              </div>
            </div>
          </div>
        )}

        {/* Category Description block */}
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Issue Classification</span>
          <h4 className="font-display font-bold text-xl text-white capitalize mt-1">
            {issue.category.replace('_', ' ')}
          </h4>
        </div>

        <div className="h-px bg-white/5" />

        {/* Attributes List */}
        <div className="space-y-4 text-sm">
          
          <div className="flex items-start gap-3">
            <Building className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Routed Department</div>
              <div className="text-white font-bold mt-0.5">{issue.department}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Exact Location</div>
              <div className="text-white font-medium mt-0.5 leading-relaxed">{issue.location.name}</div>
              <div className="text-[10px] text-gray-500 font-mono mt-1">GPS: {issue.location.lat.toFixed(5)}, {issue.location.lng.toFixed(5)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <Calendar className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider">Filing Timeline</div>
              <div className="text-gray-300 mt-0.5 space-y-1">
                <div>
                  <strong className="text-gray-400">Published:</strong> {new Date(issue.reportedAt).toLocaleDateString()} at {new Date(issue.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="text-gray-500 ml-1 font-mono">({getRelativeTime(issue.reportedAt)})</span>
                </div>
                {issue.status === 'RESOLVED' && issue.resolvedAt && (
                  <>
                    <div>
                      <strong className="text-gray-400">Solved:</strong> {new Date(issue.resolvedAt).toLocaleDateString()} at {new Date(issue.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-emerald-400 font-bold font-mono text-[10px] pt-0.5 flex items-center gap-1">
                      <span>⏱ Solve Duration:</span>
                      <span className="bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                        {getDuration(issue.reportedAt, issue.resolvedAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Reporter Identity</div>
              <div className="mt-0.5 flex flex-col gap-0.5 text-left">
                {issue.reporterName ? (
                  <div className="flex items-center gap-1.5 justify-start">
                    <span className="text-white font-bold text-xs">{issue.reporterName}</span>
                    {issue.reporterIsOfficial && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-blue-950/60 border border-blue-500/30 text-blue-400 select-none shadow">
                        🔹 Official
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 font-semibold text-xs">Community Seed Reporter</span>
                )}
                <span className="text-[10px] text-gray-500 block">
                  {issue.reporterIsOfficial && issue.reporterDepartment ? issue.reporterDepartment : 'Public Resident'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            {issue.photoSource === 'live' ? (
              <Camera className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : issue.photoSource === 'preset' ? (
              <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            ) : (
              <ImageIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Photo Capture Trust</div>
              <div className="mt-0.5 flex flex-col gap-0.5">
                {issue.photoSource === 'live' && (
                  <>
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Verified Live Camera
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Captured in-app on {issue.photoCapturedAt ? new Date(issue.photoCapturedAt).toLocaleString() : new Date(issue.reportedAt).toLocaleString()}
                    </span>
                  </>
                )}
                {issue.photoSource === 'preset' && (
                  <>
                    <span className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                      Demo Preset Photo
                    </span>
                    <span className="text-[10px] text-gray-500">
                      System seed testing image
                    </span>
                  </>
                )}
                {(issue.photoSource === 'upload' || !issue.photoSource) && (
                  <>
                    <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                      Uploaded Gallery Image
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Uploaded on {issue.photoCapturedAt ? new Date(issue.photoCapturedAt).toLocaleString() : new Date(issue.reportedAt).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="h-px bg-white/5" />

        {/* AI Analysis Summary block */}
        <div className="p-4 bg-[#111111] rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
            <Sparkles className="w-4 h-4 text-red-500 fill-red-500" />
            <span>AI INTEL SUMMARY</span>
          </div>
          <p className="text-gray-300 italic text-xs leading-relaxed font-serif">
            "{issue.summary}"
          </p>
          <div className="h-px bg-white/5 my-2" />
          <div className="text-[10px] text-gray-400 leading-normal">
            <strong className="text-gray-300">AI Hazard Assessment:</strong> {issue.severityReason}
          </div>
        </div>

        {/* User context description if entered */}
        {issue.description && (
          <div className="space-y-1.5 text-xs">
            <div className="font-semibold text-gray-500 uppercase tracking-wider">User Remarks</div>
            <p className="text-gray-300 leading-relaxed bg-[#111111] p-3 rounded-xl border border-white/10">
              {issue.description}
            </p>
          </div>
        )}

        {/* Verified Resolution Proof Card */}
        {issue.status === 'RESOLVED' && (
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-950" />
              <span>VERIFIED RESOLUTION PROOF</span>
            </div>
            
            {issue.resolutionImage && (
              <div className="rounded-lg overflow-hidden border border-emerald-500/10 h-32 bg-slate-900">
                <img 
                  src={issue.resolutionImage} 
                  alt="Resolution Proof" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Repair Actions Taken</div>
              <p className="text-gray-300 italic text-xs leading-relaxed">
                "{issue.resolutionNotes || 'Patched successfully.'}"
              </p>
            </div>

            <div className="h-px bg-emerald-500/10" />

            <div className="flex flex-col gap-1 text-[10px] text-gray-400 font-medium">
              <div>Verified By: <strong className="text-gray-300">{issue.resolvedBy || 'Municipal Agent'}</strong></div>
              {issue.resolvedAt && (
                <div>Verified On: <strong className="text-gray-300 font-mono">{new Date(issue.resolvedAt).toLocaleString()}</strong></div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Admin Action Bar (Demos Escalation/Resolution) */}
      <div className="p-4 border-t border-white/10 bg-[#111111] flex flex-col gap-3">
        {issue.status !== 'RESOLVED' && !canResolve && (
          <div className="text-[10px] text-gray-400 text-left bg-black/40 border border-white/5 p-2.5 rounded-lg leading-relaxed flex gap-2">
            <span className="text-amber-500 text-sm">🔒</span>
            <div>
              <span className="font-bold text-gray-300 block mb-0.5">Official Verification Required</span>
              Only verified representatives of the <strong className="text-red-400">{issue.department}</strong> can resolve this ticket. Use passcode <code className="text-blue-400 font-mono">VIZAG-GOV-2026</code> to verify official status.
            </div>
          </div>
        )}

        <div className="flex gap-2 w-full">
          {issue.status !== 'RESOLVED' ? (
            <button
              onClick={() => {
                if (canResolve) {
                  onResolve(issue.id);
                }
              }}
              disabled={!canResolve}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                canResolve
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] border-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed opacity-50'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {canResolve ? 'Resolve & Upload Proof' : 'Department Lock'}
            </button>
          ) : (
            <div className="flex-1 text-center py-2.5 text-emerald-400 font-bold text-xs bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4 fill-emerald-950/40" />
              Resolved &amp; Closed
            </div>
          )}
          
          <button
            onClick={() => onDelete(issue.id)}
            title="Delete Ticket"
            className="p-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
