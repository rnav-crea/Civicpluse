import React, { useState, useEffect } from 'react';
import { Map, BarChart3, User, Camera, Sparkles, Check, AlertTriangle, ShieldAlert, Clock, RefreshCw, Layers } from 'lucide-react';
import { Issue, UserProfile, IssueStatus } from './types';
import { seedIssues } from './data';
import MapTab from './components/MapTab';
import DashboardTab from './components/DashboardTab';
import ProfileTab from './components/ProfileTab';
import ReportModal from './components/ReportModal';
import IssueDetailPanel from './components/IssueDetailPanel';
import AuthModal from './components/AuthModal';
import ResolveModal from './components/ResolveModal';

export default function App() {
  // --- App State ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [myReports, setMyReports] = useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'profile'>('map');
  const [dashboardToggle, setDashboardToggle] = useState<boolean>(false); // false = Near Me, true = All Areas
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [deferredAction, setDeferredAction] = useState<(() => void) | null>(null);
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [hasServerConnection, setHasServerConnection] = useState<boolean | null>(null);

  // --- 1. Load data from localStorage on Mount ---
  useEffect(() => {
    const hasKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
    setHasServerConnection(hasKey);

    const savedProfile = localStorage.getItem('ch_profile');
    const savedIssues = localStorage.getItem('ch_issues');
    const savedMyReports = localStorage.getItem('ch_myreports');

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    if (savedIssues) {
      setAllIssues(JSON.parse(savedIssues));
    } else {
      setAllIssues(seedIssues);
      localStorage.setItem('ch_issues', JSON.stringify(seedIssues));
    }

    if (savedMyReports) {
      setMyReports(JSON.parse(savedMyReports));
    }
  }, []);

  // --- 2. Simulative Status Escalation Logic ---
  // Section 14: Runs periodically. If ticket is OPEN and threshold exceeded, transition status.
  useEffect(() => {
    const runEscalationCheck = () => {
      let isChanged = false;
      const updatedIssues = allIssues.map((issue) => {
        if (issue.status !== 'OPEN') return issue;

        const ageHours = (Date.now() - issue.reportedAt) / (1000 * 60 * 60);
        // Severity 4-5 escalates after 2hr, Severity 2-3 after 6hr
        const threshold = issue.severity >= 4 ? 2 : 6;

        if (ageHours >= threshold) {
          isChanged = true;
          return { ...issue, status: 'ESCALATED' as IssueStatus };
        }
        return issue;
      });

      if (isChanged) {
        setAllIssues(updatedIssues);
        localStorage.setItem('ch_issues', JSON.stringify(updatedIssues));

        // Sync myReports
        const updatedMyReports = myReports.map(mr => {
          const match = updatedIssues.find(i => i.id === mr.id);
          return match ? (match as Issue) : mr;
        });
        setMyReports(updatedMyReports);
        localStorage.setItem('ch_myreports', JSON.stringify(updatedMyReports));
      }
    };

    // Check on mount and then every 30 seconds
    runEscalationCheck();
    const interval = setInterval(runEscalationCheck, 30000);
    return () => clearInterval(interval);
  }, [allIssues, myReports]);

  // --- 3. Auth Interceptors & Save Handlers ---
  const ensureAuthenticated = (callback: () => void) => {
    if (profile && profile.phone) {
      callback();
    } else {
      setDeferredAction(() => callback);
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('ch_profile', JSON.stringify(newProfile));
    setIsAuthModalOpen(false);
    if (deferredAction) {
      deferredAction();
      setDeferredAction(null);
    }
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('ch_profile', JSON.stringify(newProfile));
  };

  const handleAddIssue = (newIssue: Issue) => {
    if (profile) {
      newIssue.reporterName = profile.name;
      newIssue.reporterIsOfficial = profile.isVerifiedOfficial;
      newIssue.reporterDepartment = profile.officialDepartment;
    }
    const updatedIssues = [newIssue, ...allIssues];
    const updatedMyReports = [newIssue, ...myReports];

    setAllIssues(updatedIssues);
    setMyReports(updatedMyReports);

    localStorage.setItem('ch_issues', JSON.stringify(updatedIssues));
    localStorage.setItem('ch_myreports', JSON.stringify(updatedMyReports));

    // Post-submit flow: Close modal, switch to map tab, and focus on the newly submitted pin!
    setIsReportModalOpen(false);
    setActiveTab('map');
    setSelectedIssueId(newIssue.id);
  };

  const handleOpenReportModal = () => {
    ensureAuthenticated(() => {
      setIsReportModalOpen(true);
    });
  };

  const handleCollaborate = (issueId: string) => {
    ensureAuthenticated(() => {
      const updatedIssues = allIssues.map(issue => {
        if (issue.id === issueId) {
          const count = (issue.reportCount || 1) + 1;
          const collaborators = [...(issue.collaborators || []), Date.now()];
          let severity = issue.severity;
          let status = issue.status;

          if (count === 3) {
            severity = Math.min(5, severity + 1);
          }
          if (count >= 5) {
            severity = 5;
            status = 'ESCALATED' as IssueStatus;
          }

          return {
            ...issue,
            reportCount: count,
            collaborators,
            severity,
            status
          };
        }
        return issue;
      });

      const existingInMyReports = myReports.find(mr => mr.id === issueId);
      let updatedMyReports = [];
      if (existingInMyReports) {
        updatedMyReports = myReports.map(mr => {
          if (mr.id === issueId) {
            const count = (mr.reportCount || 1) + 1;
            const collaborators = [...(mr.collaborators || []), Date.now()];
            let severity = mr.severity;
            let status = mr.status;

            if (count === 3) {
              severity = Math.min(5, severity + 1);
            }
            if (count >= 5) {
              severity = 5;
              status = 'ESCALATED' as IssueStatus;
            }

            return {
              ...mr,
              reportCount: count,
              collaborators,
              severity,
              status
            };
          }
          return mr;
        });
      } else {
        const updatedIssue = updatedIssues.find(i => i.id === issueId);
        if (updatedIssue) {
          updatedMyReports = [updatedIssue, ...myReports];
        } else {
          updatedMyReports = [...myReports];
        }
      }

      setAllIssues(updatedIssues);
      setMyReports(updatedMyReports);

      localStorage.setItem('ch_issues', JSON.stringify(updatedIssues));
      localStorage.setItem('ch_myreports', JSON.stringify(updatedMyReports));

      setIsReportModalOpen(false);
      setActiveTab('map');
      setSelectedIssueId(issueId);
    });
  };

  const handleResolveIssue = (id: string) => {
    ensureAuthenticated(() => {
      setResolvingIssueId(id);
    });
  };

  const handleResolveSubmit = (id: string, resolutionImage: string, resolutionNotes: string) => {
    const updatedIssues = allIssues.map(issue => 
      issue.id === id 
        ? { 
            ...issue, 
            status: 'RESOLVED' as IssueStatus,
            resolvedAt: Date.now(),
            resolvedBy: profile?.name || 'Verified Resident',
            resolutionImage,
            resolutionNotes
          } 
        : issue
    );
    const updatedMyReports = myReports.map(mr => 
      mr.id === id 
        ? { 
            ...mr, 
            status: 'RESOLVED' as IssueStatus,
            resolvedAt: Date.now(),
            resolvedBy: profile?.name || 'Verified Resident',
            resolutionImage,
            resolutionNotes
          } 
        : mr
    );

    setAllIssues(updatedIssues);
    setMyReports(updatedMyReports);

    localStorage.setItem('ch_issues', JSON.stringify(updatedIssues));
    localStorage.setItem('ch_myreports', JSON.stringify(updatedMyReports));
    setResolvingIssueId(null);
  };

  const handleDeleteIssue = (id: string) => {
    const updatedIssues = allIssues.filter(i => i.id !== id);
    const updatedMyReports = myReports.filter(mr => mr.id !== id);

    setAllIssues(updatedIssues);
    setMyReports(updatedMyReports);

    localStorage.setItem('ch_issues', JSON.stringify(updatedIssues));
    localStorage.setItem('ch_myreports', JSON.stringify(updatedMyReports));

    setSelectedIssueId(null);
  };

  // --- 4. Sub-render elements ---
  const selectedIssue = allIssues.find(i => i.id === selectedIssueId) || null;

  // Render "Your Reports" container below the fold on map page
  const renderBelowFoldReports = () => {
    const myReportsCount = myReports.length;

    return (
      <div className="bg-[#0c0c0c] border-t border-white/10 p-5 sm:p-6 space-y-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-white text-base">📋 Your Submitted Tickets</h3>
              <p className="text-xs text-gray-500 mt-0.5">Filing history and escalation stages</p>
            </div>
            <span className="text-xs font-semibold bg-[#161616] border border-white/10 text-gray-300 px-3 py-1 rounded-lg">
              Total Filed: {myReportsCount}
            </span>
          </div>

          {myReportsCount === 0 ? (
            <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center bg-[#111111]/50 space-y-3.5">
              <div className="text-gray-600 font-display text-3xl">📭</div>
              <div>
                <h4 className="font-display font-bold text-gray-300 text-sm">No reports filed yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  You haven't reported any public issues yet. See a pothole or pipe leak? Photograph it to alert municipal teams!
                </p>
              </div>
              <button
                onClick={handleOpenReportModal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] cursor-pointer"
              >
                + Report Your First Issue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myReports.map((mr) => {
                const getStatusStyle = (status: string) => {
                  if (status === 'RESOLVED') return 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20';
                  if (status === 'ESCALATED') return 'bg-red-950/40 text-red-400 border border-red-500/20 animate-pulse';
                  return 'bg-[#1a1a1a] text-gray-300 border border-white/10';
                };

                return (
                  <div
                    key={mr.id}
                    onClick={() => {
                      setSelectedIssueId(mr.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                      selectedIssueId === mr.id 
                        ? 'border-red-500 bg-red-950/10 ring-1 ring-red-500 shadow-lg' 
                        : 'border-white/5 bg-[#141414] hover:border-white/20 hover:bg-[#181818]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span className="capitalize">{mr.category.replace('_', ' ')}</span>
                        <span>Level {mr.severity}</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-100 line-clamp-1">{mr.location.name}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic">"{mr.summary}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusStyle(mr.status)}`}>
                        {mr.status}
                      </span>
                      <span className="text-gray-500 font-medium font-mono">
                        {new Date(mr.reportedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans flex flex-col overflow-x-hidden">
      
      {/* 4. Navigation Header Navbar */}
      <header className="sticky top-0 z-30 bg-[#111111]/90 backdrop-blur-md border-b border-white/10 shadow-lg h-16 shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600 text-white font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center justify-center text-base sm:text-lg">
              🏘️
            </div>
            <div>
              <h1 className="font-display font-black text-white text-xs sm:text-base tracking-tight leading-none uppercase">Civicpluse</h1>
              <span className="text-[9px] sm:text-[10px] text-red-500 font-bold tracking-wider uppercase block mt-0.5">Civicpluse AI Intake</span>
            </div>
          </div>

          {/* Desktop Navigation Tab Menu */}
          <nav className="hidden sm:flex items-center bg-[#161616] p-1 rounded-xl text-xs font-semibold text-gray-400 border border-white/5">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'map' 
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)] font-bold' 
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🗺️</span>
              <span>Interactive Map</span>
            </button>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)] font-bold' 
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              <span>📊</span>
              <span>Dashboard Feed</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)] font-bold' 
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              <span>👤</span>
              <span>Profile Impact</span>
            </button>
          </nav>

          {/* Mobile Quick Action button */}
          <button
            onClick={handleOpenReportModal}
            className="flex sm:hidden items-center justify-center w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)] transition-all cursor-pointer animate-pulse"
            title="File Report"
          >
            +
          </button>

        </div>
      </header>

      {/* Main Screen layout depending on Active Tab */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] pb-16 sm:pb-0 w-full max-w-full overflow-x-hidden">
        
        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Map Canvas - Height adjusted */}
            <div className="h-[55vh] min-h-[350px] relative">
              <MapTab
                allIssues={allIssues}
                profile={profile}
                selectedIssueId={selectedIssueId}
                onSelectIssue={setSelectedIssueId}
                onOpenReportModal={handleOpenReportModal}
              />
            </div>
            
            {/* Below fold: Your Reports container */}
            <div className="flex-1 bg-[#0a0a0a] min-h-0 overflow-y-auto">
              {renderBelowFoldReports()}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            allIssues={allIssues}
            profile={profile}
            onSelectIssue={(id) => {
              setSelectedIssueId(id);
              // Auto-switch to map to show it on map!
              setActiveTab('map');
            }}
            dashboardToggle={dashboardToggle}
            setDashboardToggle={setDashboardToggle}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            onSaveProfile={handleSaveProfile}
            myReports={myReports}
            allIssues={allIssues}
            onTriggerAuth={() => setIsAuthModalOpen(true)}
            onLogout={() => {
              setProfile(null);
              localStorage.removeItem('ch_profile');
            }}
          />
        )}

      </main>

      {/* Slide-over Side panel for Selected Issue */}
      <IssueDetailPanel
        issue={selectedIssue}
        onClose={() => setSelectedIssueId(null)}
        onResolve={handleResolveIssue}
        onDelete={handleDeleteIssue}
        profile={profile}
      />

      {/* Automated intake flow report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitSuccess={handleAddIssue}
        currentArea={profile?.area || 'Visakhapatnam'}
        allIssues={allIssues}
        onCollaborate={handleCollaborate}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Resolve Proof Modal */}
      <ResolveModal
        isOpen={resolvingIssueId !== null}
        onClose={() => setResolvingIssueId(null)}
        onResolveSubmit={handleResolveSubmit}
        issueId={resolvingIssueId}
      />

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="flex sm:hidden fixed bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-md border-t border-white/10 py-2.5 px-6 z-30 justify-around text-[10px] font-bold text-gray-500 shadow-2xl">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'map' ? 'text-red-500 font-extrabold' : 'hover:text-white text-gray-400'
          }`}
        >
          <span className="text-lg">🗺️</span>
          <span>Map</span>
        </button>
        
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-red-500 font-extrabold' : 'hover:text-white text-gray-400'
          }`}
        >
          <span className="text-lg">📊</span>
          <span>Feed</span>
        </button>
        
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-red-500 font-extrabold' : 'hover:text-white text-gray-400'
          }`}
        >
          <span className="text-lg">👤</span>
          <span>Profile</span>
        </button>
      </nav>

      {/* Elegant Footer Status Bar */}
      <footer className="h-9 bg-black border-t border-white/10 px-4 sm:px-6 flex items-center justify-between text-[10px] text-gray-500 font-medium shrink-0 mb-16 sm:mb-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="tracking-wide">GEMINI AI ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="tracking-wide">MAPS SYNCED</span>
          </div>
        </div>
        <div className="uppercase tracking-widest font-mono text-[9px] text-gray-600 hidden sm:block">
          VIBE2SHIP 2026 · {(profile?.area || 'Visakhapatnam').toUpperCase()} JURISDICTIONAL HUB
        </div>
      </footer>

    </div>
  );
}
