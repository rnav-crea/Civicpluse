import React, { useState, useEffect } from 'react';
import { X, Shield, Phone, Mail, User, MapPin, Check, Key, Loader2, Sparkles, Building, Info } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Visakhapatnam');
  
  // Official Verification States
  const [isOfficial, setIsOfficial] = useState(false);
  const [department, setDepartment] = useState('Roads Department');
  const [passcode, setPasscode] = useState('');
  
  // OTP States
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(59);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger timer when OTP screen is shown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  if (!isOpen) return null;

  // Helper to generate a random 4-digit number as a string
  const generateRandomOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validations
    if (!name.trim()) return setErrorMsg('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setErrorMsg('Please enter a valid email address.');
    if (!phone.trim() || phone.length < 10) return setErrorMsg('Please enter a valid 10-digit phone number.');

    // If official is selected, validate passcode immediately
    if (isOfficial) {
      if (passcode.trim() !== 'VIZAG-GOV-2026') {
        return setErrorMsg('Invalid official representative verification passcode. Please check credentials.');
      }
    }

    // Generate random code and advance to OTP screen
    generateRandomOtp();
    setStep('otp');
    setOtpTimer(59);
    setOtpCode('');
  };

  const handleResendOtp = () => {
    generateRandomOtp();
    setOtpTimer(59);
    setErrorMsg(null);
    setOtpCode('');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpCode.length !== 4) {
      return setErrorMsg('Please enter the 4-digit code sent to your mobile.');
    }

    if (otpCode !== generatedOtp) {
      return setErrorMsg('Invalid verification code. Please check the simulated SMS code and try again.');
    }

    setIsVerifying(true);

    // Simulate database lookup/SMS verification delay
    setTimeout(() => {
      setIsVerifying(false);

      const userProfile: UserProfile = {
        name: name.trim(),
        area: area.trim(),
        email: email.trim(),
        phone: phone.trim(),
        isOfficial: isOfficial,
        officialDepartment: isOfficial ? department : undefined,
        isVerifiedOfficial: isOfficial && passcode.trim() === 'VIZAG-GOV-2026',
      };

      onAuthSuccess(userProfile);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-all animate-fade-in">
      <div className="bg-[#0d0d0d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#111111]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Citizen Authentication</h3>
              <p className="text-xs text-gray-400">Unlock Community Grievance Privileges</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-left">
          {errorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-xl text-xs mb-4 flex items-start gap-2 animate-shake">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleSubmitDetails} className="space-y-4 text-left">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-red-500" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ravi Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#111111] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-white placeholder-gray-600"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-red-500" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#111111] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-white placeholder-gray-600"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-red-500" /> Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs select-none">+91</span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-4 py-2 bg-[#111111] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-white placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Local Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Your Area
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#111111] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-white"
                >
                  <option value="Visakhapatnam">Visakhapatnam</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5 my-2" />

              {/* Official Toggle Box */}
              <div className="p-3 bg-[#141414] rounded-xl border border-white/5 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isOfficial}
                    onChange={(e) => setIsOfficial(e.target.checked)}
                    className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-[#0a0a0a]"
                  />
                  <span className="text-xs font-bold text-gray-300">Verify as Official Representative</span>
                </label>

                {isOfficial && (
                  <div className="space-y-3 animate-scale-in text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                        <Building className="w-3 h-3 text-red-500" /> Responsible Department
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white"
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
                        required
                        placeholder="Enter official passcode..."
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <span className="text-[9px] text-gray-500 block leading-normal">
                        To test official verification, use passcode: <strong className="text-red-400 font-mono">VIZAG-GOV-2026</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Details Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <span>Request Verification Code</span>
              </button>

            </form>
          ) : (
            /* OTP Screen Step */
            <form onSubmit={handleVerifyOtp} className="space-y-5 text-center">
              
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-2 animate-bounce">
                <Phone className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Enter SMS Code</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  A verification code has been dispatched to <strong className="text-gray-300 font-mono">+91 {phone.slice(0,3)}***{phone.slice(-3)}</strong>.
                </p>
              </div>

              {/* Simulated SMS Notification Alert */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs flex items-start gap-2.5 text-left max-w-xs mx-auto animate-pulse">
                <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                <div>
                  <span className="font-bold block text-blue-300">Simulated SMS Received</span>
                  <span>Use code <strong className="font-mono text-white bg-blue-500/20 px-1.5 py-0.5 rounded font-bold">{generatedOtp}</strong> to complete verification. This code is strictly validated.</span>
                </div>
              </div>

              {/* 4-digit input */}
              <div className="max-w-[200px] mx-auto">
                <input
                  type="text"
                  required
                  maxLength={4}
                  pattern="[0-9]{4}"
                  placeholder="----"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full tracking-[1.5em] text-center text-xl font-bold font-mono px-4 py-3 bg-[#111] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-700"
                />
              </div>

              {/* Timer/Resend */}
              <div className="text-xs text-gray-500">
                {otpTimer > 0 ? (
                  <span>Resend code in <strong className="text-white font-mono">{otpTimer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-red-500 hover:underline font-bold cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <div className="h-px bg-white/5" />

              {/* Submit Verification OTP */}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Verify &amp; Authenticate</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStep('details');
                  setErrorMsg(null);
                }}
                className="w-full text-center py-2 mt-1 block text-xs text-gray-500 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/5 rounded-lg font-medium"
              >
                Back to Edit Details
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
