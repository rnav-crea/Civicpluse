import React, { useState, useEffect } from 'react';
import { User, Shield, MapPin, Award, CheckCircle, RefreshCw, Heart, Info, BookOpen, Star, LogOut, Lock, Key, Building } from 'lucide-react';
import { Issue, UserProfile } from '../types';

interface ProfileTabProps {
  profile: UserProfile | null;
  onSaveProfile: (newProfile: UserProfile) => void;
  myReports: Issue[];
  allIssues: Issue[];
  onTriggerAuth: () => void;
  onLogout: () => void;
}

export default function ProfileTab({ profile, onSaveProfile, myReports, allIssues, onTriggerAuth, onLogout }: ProfileTabProps) {
  const [name, setName] = useState(profile?.name || '');
  const [area, setArea] = useState(profile?.area || 'Visakhapatnam');
  const [isSaved, setIsSaved] = useState(false);

  // Official verification inside profile tab
  const [isOfficialCheck, setIsOfficialCheck] = useState(profile?.isOfficial || false);
  const [department, setDepartment] = useState(profile?.officialDepartment || 'Roads Department');
  const [passcode, setPasscode] = useState('');
  const [officialError, setOfficialError] = useState<string | null>(null);

  // Sync state when profile is initialized/updated from AuthModal
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setArea(profile.area);
      setIsOfficialCheck(profile.isOfficial || false);
      setDepartment(profile.officialDepartment || 'Roads Department');
    }
  }, [profile]);

  // Guest Mode Splash Screen
  if (!profile || !profile.phone) {
    return (
      <div className="space-y-6 max-w-md mx-auto px-4 py-12 text-center">
        <div className="p-6 bg-[#111111] rounded-2xl border border-white/10 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-black text-xl text-white tracking-tight uppercase">Citizen Profile Locked</h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
              You are currently browsing as a <strong className="text-gray-200">Guest</strong>. Unlock a verified community profile to file tickets, support neighbor complaints, and track your local community impact.
            </p>
          </div>

          <div className="h-px bg-white/5" />

          <button
            onClick={onTriggerAuth}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <User className="w-4 h-4 fill-white" />
            <span>Verify Mobile &amp; Register</span>
          </button>
        </div>

        <div className="p-5 bg-red-950/5 border border-red-500/10 rounded-2xl text-left space-y-2">
          <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-red-500" />
            Why authenticate?
          </h4>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            By registering your mobile number, we maintain accountability, verify neighborhood presence, and block duplicate spam, keeping your community safe and reports actionable.
          </p>
        </div>
      </div>
    );
  }

  // Profile-specific stats calculated dynamically from state
  const reportsCount = myReports.length;
  // If myReports is empty, we can show mock or standard totals to make the profile feel alive,
  // but let's stick to true statistics and add some gamified milestone unlocks!
  const resolvedCount = myReports.filter(r => r.status === 'RESOLVED').length;
  const activeCount = myReports.filter(r => r.status !== 'RESOLVED').length;

  // Let's compute a citizen reputation level based on activity
  const totalPoints = (reportsCount * 10) + (resolvedCount * 25);
  const citizenLevel = Math.floor(totalPoints / 50) + 1;
  const nextLevelPoints = citizenLevel * 50;
  const progressPercent = Math.min(100, Math.round((totalPoints / nextLevelPoints) * 100));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficialError(null);
    if (!name.trim() || !area.trim()) return;

    let verifiedOfficial = profile?.isVerifiedOfficial || false;

    if (isOfficialCheck) {
      if (!verifiedOfficial) {
        if (passcode.trim() !== 'VIZAG-GOV-2026') {
          setOfficialError('Invalid representative passcode. Verification failed.');
          return;
        }
        verifiedOfficial = true;
      }
    } else {
      verifiedOfficial = false;
    }

    onSaveProfile({
      ...profile,
      name: name.trim(),
      area: area.trim(),
      isOfficial: isOfficialCheck,
      officialDepartment: isOfficialCheck ? department : undefined,
      isVerifiedOfficial: verifiedOfficial
    });

    setPasscode('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 sm:p-6 pb-20">
      
      {/* Reputation Card */}
      <div className="bg-[#111111] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden border border-white/10 text-left">
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* User Icon Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-red-600 flex items-center justify-center font-display text-3xl font-black text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] ring-4 ring-red-950/50 select-none">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 bg-red-500 text-white p-1.5 rounded-lg shadow-sm border-2 border-[#111111]">
            <Award className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>

        {/* Reputation Level stats */}
        <div className="flex-1 space-y-2 text-center md:text-left w-full">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
              <h3 className="text-xl font-display font-black tracking-tight">{name}</h3>
              {profile?.isVerifiedOfficial && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/60 border border-blue-500/30 text-blue-400 select-none shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Verified Official
                </span>
              )}
            </div>
            {profile?.isVerifiedOfficial && profile?.officialDepartment && (
              <p className="text-xs text-blue-400 font-bold mt-0.5">{profile.officialDepartment}</p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-1 text-xs text-gray-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Registered Area: {area}</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-red-400 mb-1">
              <span>Citizen Responder - Level {citizenLevel}</span>
              <span>{totalPoints} / {nextLevelPoints} XP</span>
            </div>
            
            {/* XP progress bar */}
            <div className="h-2 w-full bg-[#0a0a0a] rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full rounded-full bg-red-600 transition-all duration-500 shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Info Edit & Impact stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Profile edit form - takes 3 columns */}
        <div className="bg-[#111111] p-5 rounded-xl border border-white/10 shadow-lg md:col-span-3 space-y-4">
          <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 text-left">
            <User className="w-4 h-4 text-red-500" />
            Citizen Registrar Details
          </h4>

          <form onSubmit={handleSave} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Your Profile Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-white font-medium placeholder-gray-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Your Local Municipality Area</label>
              <input
                type="text"
                placeholder="Municipality (e.g. Visakhapatnam, Mumbai, Delhi)"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-white font-medium placeholder-gray-600"
              />
              <p className="text-[10px] text-gray-500 leading-normal">
                This area acts as your default focus. Dashboard feed cards will auto-filter reports to match this location when searching 'Near Me'.
              </p>
            </div>

            <div className="h-px bg-white/5 my-2" />

            {/* Official Verification Inside Form */}
            <div className="p-3 bg-[#0a0a0a] rounded-xl border border-white/10 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isOfficialCheck}
                  onChange={(e) => {
                    setIsOfficialCheck(e.target.checked);
                    setOfficialError(null);
                  }}
                  className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-[#111]"
                />
                <span className="text-xs font-bold text-gray-300">Register as Official Representative</span>
              </label>

              {isOfficialCheck && !profile?.isVerifiedOfficial && (
                <div className="space-y-3 animate-scale-in text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Building className="w-3 h-3 text-red-500" /> Municipal Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white"
                    >
                      <option value="Roads Department">Roads Department</option>
                      <option value="Water Supply & Sewerage">Water Supply & Sewerage</option>
                      <option value="Electricity Board">Electricity Board</option>
                      <option value="Sanitation & Health">Sanitation & Health</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Key className="w-3 h-3 text-red-500" /> Verification Passcode
                    </label>
                    <input
                      type="password"
                      placeholder="Enter official passcode..."
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <span className="text-[9px] text-gray-500 block leading-normal">
                      Official Passcode: <strong className="text-red-400 font-mono">VIZAG-GOV-2026</strong>
                    </span>
                  </div>
                </div>
              )}

              {isOfficialCheck && profile?.isVerifiedOfficial && (
                <div className="p-2.5 bg-blue-950/20 border border-blue-500/20 rounded-lg text-blue-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Verified for <strong>{department}</strong></span>
                </div>
              )}

              {officialError && (
                <div className="text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-500/10 p-2 rounded-lg">
                  {officialError}
                </div>
              )}
            </div>

            {isSaved && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                ✓ Registrar profile updated! Refreshing dashboard context...
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] cursor-pointer"
              >
                Update Registration Info
              </button>
              
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 hover:bg-red-600/10 hover:border-red-500/30 text-gray-400 hover:text-red-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold"
                title="Clear Profile / Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </form>
        </div>

        {/* Impact stats - takes 2 columns */}
        <div className="bg-[#111111] p-5 rounded-xl border border-white/10 shadow-lg md:col-span-2 space-y-4">
          <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-4 h-4 text-red-500 fill-current" />
            Your Impact Stats
          </h4>

          <div className="space-y-3.5 pt-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">Tickets Filed</span>
              <span className="font-bold text-gray-300 px-2 py-0.5 bg-[#161616] rounded-lg border border-white/5 text-xs">{reportsCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">Issues Resolved</span>
              <span className="font-bold text-emerald-400 px-2 py-0.5 bg-emerald-950/20 rounded-lg border border-emerald-500/10 text-xs">{resolvedCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">Active Watch</span>
              <span className="font-bold text-amber-400 px-2 py-0.5 bg-amber-950/20 rounded-lg border border-amber-500/10 text-xs">{activeCount}</span>
            </div>

            <div className="h-px bg-white/5 my-1" />

            <div className="text-[10px] leading-relaxed text-gray-500 bg-[#0a0a0a]/50 p-3 rounded-lg border border-white/5 flex items-start gap-1.5">
              <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <span>
                Earn 10 XP for each new hyperlocal report submitted, and 25 XP when tickets transition to resolved. Unlock active community titles as you clean up your streets!
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Platforms Description Banner */}
      <div className="p-5 bg-red-950/5 border border-red-500/10 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-red-500" />
          CIVIC INTELLIGENCE CHARTER
        </h4>
        <p className="text-xs text-gray-400 leading-relaxed font-serif">
          Civicpluse is built to empower local residents to maintain urban environments using state-of-the-art vision and thinking models. Each submitted issue is parsed, analyzed, severity-rated, routed, and monitored autonomously.
        </p>
        <p className="text-[10px] text-gray-500 leading-normal">
          Developed for Vibe2Ship Hackathon 2026 — Coding Ninjas &times; Google for Developers. Powered by Google Gemini-3.1-pro-preview with High Thinking reasoning.
        </p>
      </div>

    </div>
  );
}
