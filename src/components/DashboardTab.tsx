import React, { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, Eye, Flame, AlertCircle, Sparkles, ShieldCheck, Info, Check, Filter } from 'lucide-react';
import { Issue, IssueCategory, UserProfile } from '../types';

interface DashboardTabProps {
  allIssues: Issue[];
  profile: UserProfile | null;
  onSelectIssue: (id: string) => void;
  dashboardToggle: boolean; // false = Near Me, true = All Areas
  setDashboardToggle: (val: boolean) => void;
}

export default function DashboardTab({ allIssues, profile, onSelectIssue, dashboardToggle, setDashboardToggle }: DashboardTabProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [officialQueueOnly, setOfficialQueueOnly] = useState(profile?.isOfficial || false);

  // Sync state if profile loads/changes
  React.useEffect(() => {
    if (profile?.isOfficial) {
      setOfficialQueueOnly(true);
    } else {
      setOfficialQueueOnly(false);
    }
  }, [profile]);

  // Filter issues based on Area toggle, Category, and Search term
  const filteredIssues = allIssues.filter((issue) => {
    // 0. Official department filter
    if (profile?.isOfficial && officialQueueOnly) {
      if (issue.department.toLowerCase() !== profile.officialDepartment?.toLowerCase()) {
        return false;
      }
    }

    // 1. Area filtering
    if (!dashboardToggle) {
      // Near Me (matching profile area)
      if (issue.area.toLowerCase() !== (profile?.area || 'Visakhapatnam').toLowerCase()) {
        return false;
      }
    }

    // 2. Category filtering
    if (activeCategory !== 'all' && issue.category !== activeCategory) {
      return false;
    }

    // 3. Status filtering
    if (activeStatus !== 'all' && issue.status !== activeStatus) {
      return false;
    }

    // 4. Search filtering
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchLoc = issue.location.name.toLowerCase().includes(term);
      const matchSum = issue.summary.toLowerCase().includes(term);
      const matchDept = issue.department.toLowerCase().includes(term);
      const matchCat = issue.category.toLowerCase().includes(term);
      return matchLoc || matchSum || matchDept || matchCat;
    }

    return true;
  });

  // Calculate metrics for current filtered view
  const issuesInView = filteredIssues;
  const activeCount = issuesInView.filter(i => i.status !== 'RESOLVED').length;
  const escalatedCount = issuesInView.filter(i => i.status === 'ESCALATED').length;
  const resolvedCount = issuesInView.filter(i => i.status === 'RESOLVED').length;

  // Compute a safety score: (Total - Critical/Active) / Total ratio
  const totalCount = issuesInView.length;
  const criticalCount = issuesInView.filter(i => i.severity >= 4 && i.status !== 'RESOLVED').length;
  const safetyIndex = totalCount > 0 
    ? Math.round(((totalCount - (criticalCount * 1.5 + (activeCount - escalatedCount) * 0.5)) / totalCount) * 100)
    : 100;
  const boundedSafetyIndex = Math.max(0, Math.min(100, safetyIndex));

  const getSeverityBadge = (level: number) => {
    if (level === 5) return 'bg-rose-500 text-white';
    if (level === 4) return 'bg-orange-500 text-white';
    if (level === 3) return 'bg-amber-500 text-slate-900';
    return 'bg-emerald-500 text-white';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'RESOLVED') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'ESCALATED') return 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const categories = [
    { value: 'all', label: 'All Issues' },
    { value: 'pothole', label: 'Potholes' },
    { value: 'water_leak', label: 'Water Leaks' },
    { value: 'streetlight', label: 'Streetlights' },
    { value: 'garbage', label: 'Garbage' },
    { value: 'other', label: 'Other Hazards' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 w-full min-w-0">
      
      {/* Official Workspace Banner */}
      {profile?.isOfficial && (
        <div className="bg-gradient-to-r from-blue-950/40 to-slate-900/40 border border-blue-500/30 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 font-black text-6xl font-display pointer-events-none uppercase text-white select-none">
            GOV
          </div>
          <div className="flex items-center gap-3 z-10 min-w-0">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
              <ShieldCheck className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">🏛️ Municipal Workspace Active</div>
              <h4 className="font-display font-extrabold text-sm text-white truncate">
                Logged in as <span className="text-blue-300 font-extrabold">{profile.name}</span>
              </h4>
              <p className="text-[11px] text-gray-400 leading-normal">
                Viewing priority queue for <strong className="text-blue-200">{profile.officialDepartment}</strong> of {profile.area}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-between sm:justify-start bg-[#0a0a0a] p-1 rounded-xl border border-white/10 text-xs shrink-0 z-10">
            <button
              onClick={() => setOfficialQueueOnly(true)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                officialQueueOnly ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'text-gray-400 hover:text-white'
              }`}
            >
              My Department Queue
            </button>
            <button
              onClick={() => setOfficialQueueOnly(false)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                !officialQueueOnly ? 'bg-zinc-800 text-white border border-white/5' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Departments
            </button>
          </div>
        </div>
      )}

      {/* Upper Area Overview banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#111111] text-white p-4 sm:p-6 rounded-2xl shadow-xl relative overflow-hidden border border-white/10 w-full min-w-0">
        <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-8xl font-display pointer-events-none uppercase text-white">
          {dashboardToggle ? "GLOBAL" : (profile?.area || 'Visakhapatnam').slice(0, 4)}
        </div>
        <div className="space-y-1.5 z-10 min-w-0">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Intelligent Dashboard</span>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight truncate sm:whitespace-normal">
            {dashboardToggle ? "All Jurisdictions Hub" : `Hyperlocal Status: ${profile?.area || 'Visakhapatnam'}`}
          </h2>
          <p className="text-xs text-gray-400">
            {dashboardToggle 
              ? "Monitoring civic health across every active municipality."
              : `Real-time validation, routing, and ticket lifecycles for citizens of ${profile?.area || 'Visakhapatnam'}.`
            }
          </p>
        </div>

        {/* Toggler Toggle Right */}
        <div className="bg-[#0a0a0a] p-1 rounded-xl flex items-center border border-white/10 text-[11px] sm:text-xs shrink-0 self-start sm:self-center z-10 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setDashboardToggle(false)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-1 sm:flex-initial justify-center ${
              !dashboardToggle ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Near Me</span>
            <span className="hidden sm:inline">({profile?.area || 'Visakhapatnam'})</span>
          </button>
          <button
            onClick={() => setDashboardToggle(true)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
              dashboardToggle ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            All Areas
          </button>
        </div>
      </div>

      {/* Gamified Core Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
        
        {/* Safety index card */}
        <div className="bg-[#111111] p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg space-y-2 flex flex-col justify-between w-full min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Safety Index</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-white">{boundedSafetyIndex}%</div>
            <div className="h-1.5 w-full bg-[#161616] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  boundedSafetyIndex > 80 ? 'bg-emerald-500' : boundedSafetyIndex > 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${boundedSafetyIndex}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-500">Based on critical road &amp; utility blocks.</p>
        </div>

        {/* Active issues count */}
        <div className="bg-[#111111] p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg space-y-2 flex flex-col justify-between w-full min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Active Issues</span>
            <AlertCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeCount}</div>
          <p className="text-[10px] text-gray-500">Unresolved tickets in local queue.</p>
        </div>

        {/* Escalated tickets count */}
        <div className="bg-[#111111] p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg space-y-2 flex flex-col justify-between w-full min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Escalations</span>
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-500">{escalatedCount}</div>
          <p className="text-[10px] text-gray-500">Overdue tickets requiring rapid action.</p>
        </div>

        {/* Resolved reports count */}
        <div className="bg-[#111111] p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg space-y-2 flex flex-col justify-between w-full min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Resolved</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500">{resolvedCount}</div>
          <p className="text-[10px] text-gray-500">Cleaned &amp; finalized by teams.</p>
        </div>

      </div>

      {/* Interactive Controls Panel (Search + Categorical + Status filters) */}
      <div className="bg-[#111111] p-4 rounded-xl border border-white/10 shadow-lg space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets (e.g. pothole, MG Road)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm bg-[#0a0a0a] text-white placeholder-gray-500"
          />
        </div>

        {/* Filters bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between pt-1">
          {/* Categories select pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full min-w-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.value
                    ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.3)]'
                    : 'bg-[#0a0a0a] hover:bg-[#161616] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status select block */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            <select
              value={activeStatus}
              onChange={(e) => setActiveStatus(e.target.value)}
              className="bg-[#0a0a0a] hover:bg-[#161616] text-gray-300 border border-white/10 rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none"
            >
              <option value="all">All States</option>
              <option value="OPEN">Open Only</option>
              <option value="ESCALATED">Escalated Only</option>
              <option value="RESOLVED">Resolved Only</option>
            </select>
          </div>
        </div>

      </div>

      {/* Feed Cards Section */}
      <div className="space-y-4">
        <h3 className="font-display font-extrabold text-white text-lg flex items-center justify-between">
          <span>Report Feed ({filteredIssues.length})</span>
          {search && <span className="text-xs font-medium text-gray-500">Filtered search active</span>}
        </h3>

        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center bg-[#111111] border border-white/10 rounded-2xl space-y-3">
            <div className="text-gray-600 font-display text-4xl">📭</div>
            <h4 className="font-display font-bold text-gray-300">No reports matched your query</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {dashboardToggle 
                ? "Try adjusting your search criteria, category pill selection, or status filter."
                : `There are currently no matching reports located inside Visakhapatnam. Try toggling 'All Areas' to inspect global reports.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
            {filteredIssues.map((issue) => (
              <div 
                key={issue.id}
                onClick={() => onSelectIssue(issue.id)}
                className="bg-[#111111] rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-[#141414] hover:shadow-[0_4px_20px_rgba(239,68,68,0.05)] transition-all p-3 sm:p-4 flex gap-3 sm:gap-4 cursor-pointer group text-left w-full min-w-0"
              >
                {/* Photo Thumbnail */}
                {issue.imageBase64 && (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                    <img 
                      src={issue.imageBase64} 
                      alt={issue.category} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Info Text */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    
                    {/* Header line: category & area */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <span className="capitalize truncate max-w-[120px] sm:max-w-none flex items-center gap-1">
                        {issue.category.replace('_', ' ')} · {issue.area}
                        {issue.reporterIsOfficial && (
                          <span className="text-blue-400 select-none text-[8px]" title={`Verified Representative: ${issue.reporterDepartment}`}>🔹 Official</span>
                        )}
                      </span>
                      <span className="font-mono shrink-0">
                        {new Date(issue.reportedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Location Title */}
                    <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-red-500 transition-colors">
                      {issue.location.name}
                    </h4>
                    
                    {/* Summary */}
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {issue.summary}
                    </p>

                  </div>

                  {/* Footing detail: badges & department */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1.5 text-[10px]">
                    <span className="text-gray-500 truncate max-w-[100px] sm:max-w-none">
                      Dept: {issue.department}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {issue.isRecurrent && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/30 text-red-400 select-none flex items-center gap-0.5" title={`Recurrent issue reported #${issue.recurrenceCount || 1} times`}>
                          ⚠️ Double Issue
                        </span>
                      )}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getSeverityBadge(issue.severity)}`}>
                        S{issue.severity}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${getStatusStyle(issue.status)}`}>
                        {issue.status}
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
