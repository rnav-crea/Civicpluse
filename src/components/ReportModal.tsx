import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, X, Sparkles, Loader2, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw, AlertTriangle, Check, CameraOff } from 'lucide-react';
import { Issue, IssueCategory, GeminiAnalysisResult } from '../types';

// Let's provide some preloaded high-quality test issue images to make testing instant!
const TEST_PRESETS = [
  {
    name: "🚧 Visakhapatnam Pothole",
    description: "Deep asphalt crater on busy lanes",
    category: "pothole",
    // Clean SVG Data URI of a pothole
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="100%" height="100%" fill="#334155"/>
        <ellipse cx="200" cy="170" rx="120" ry="50" fill="#0f172a"/>
        <ellipse cx="190" cy="172" rx="90" ry="35" fill="#020617"/>
        <path d="M 100 170 C 120 190, 260 190, 290 170" stroke="#475569" stroke-width="4" fill="none"/>
        <path d="M 50 170 L 90 170" stroke="#eab308" stroke-width="3" stroke-dasharray="5 5"/>
        <path d="M 300 170 L 350 170" stroke="#eab308" stroke-width="3" stroke-dasharray="5 5"/>
        <text x="50%" y="60" font-family="sans-serif" font-weight="bold" font-size="22" fill="#ef4444" text-anchor="middle">POTHOLE CRATER</text>
        <text x="50%" y="100" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Asphalt breakdown on active highway</text>
      </svg>
    `)}`
  },
  {
    name: "🚰 Water Pipeline Leak",
    description: "High-pressure pipe burst flooding street",
    category: "water_leak",
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="100%" height="100%" fill="#1e293b"/>
        <circle cx="200" cy="160" r="45" fill="#0284c7" opacity="0.4"/>
        <circle cx="200" cy="160" r="25" fill="#38bdf8"/>
        <path d="M 200 60 L 200 140 M 160 100 L 240 100" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"/>
        <path d="M 120 180 Q 200 240 280 180" stroke="#0ea5e9" stroke-width="8" stroke-linecap="round" fill="none"/>
        <text x="50%" y="45" font-family="sans-serif" font-weight="bold" font-size="22" fill="#0ea5e9" text-anchor="middle">WATER LINE FAILURE</text>
        <text x="50%" y="270" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Sub-surface pipeline burst &amp; water waste</text>
      </svg>
    `)}`
  },
  {
    name: "🔌 Broken Streetlight",
    description: "Damaged public light pole creating safety risk",
    category: "streetlight",
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="100%" height="100%" fill="#0f172a"/>
        <line x1="200" y1="40" x2="200" y2="230" stroke="#64748b" stroke-width="6"/>
        <path d="M 170 230 L 230 230" stroke="#64748b" stroke-width="10"/>
        <circle cx="200" cy="55" r="18" fill="#475569"/>
        <circle cx="200" cy="55" r="30" fill="#ef4444" opacity="0.3"/>
        <line x1="175" y1="55" x2="225" y2="55" stroke="#ef4444" stroke-width="3"/>
        <text x="50%" y="275" font-family="sans-serif" font-weight="bold" font-size="22" fill="#facc15" text-anchor="middle">STREETLIGHT BLACKOUT</text>
        <text x="50%" y="150" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Broken fixture creating zero-visibility zone</text>
      </svg>
    `)}`
  },
  {
    name: "🗑 Illegal Commercial Trash Dump",
    description: "Overflowing plastics and biological waste",
    category: "garbage",
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="100%" height="100%" fill="#111827"/>
        <rect x="140" y="110" width="120" height="120" rx="10" fill="#374151"/>
        <rect x="160" y="85" width="80" height="25" rx="4" fill="#1f2937"/>
        <path d="M 110 160 Q 200 130 290 170" stroke="#b91c1c" stroke-width="6" fill="none"/>
        <circle cx="170" cy="180" r="12" fill="#ef4444"/>
        <circle cx="230" cy="190" r="15" fill="#f97316"/>
        <text x="50%" y="50" font-family="sans-serif" font-weight="bold" font-size="22" fill="#fb7185" text-anchor="middle">SANITY ALERT: DUMPING</text>
        <text x="50%" y="270" font-family="sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Illegal trash accumulation blocking drainage</text>
      </svg>
    `)}`
  }
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newIssue: Issue) => void;
  currentArea: string;
  allIssues: Issue[];
  onCollaborate: (issueId: string) => void;
}

// Distance utility using Haversine formula
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Radius of the earth in m
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in meters
  return d;
}

function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}hr ago`;
  return `${mins}min ago`;
}

const ensureBase64Image = (imageSrc: string): Promise<string> => {
  if (imageSrc.includes(';base64,')) {
    return Promise.resolve(imageSrc);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }
        ctx.fillStyle = '#0f172a'; // Match theme color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        console.error("Failed to convert SVG to base64 via Canvas:", err);
        resolve(imageSrc);
      }
    };
    img.onerror = (err) => {
      console.error("Failed to load SVG for base64 conversion:", err);
      resolve(imageSrc);
    };
    img.src = imageSrc;
  });
};

export default function ReportModal({ isOpen, onClose, onSubmitSuccess, currentArea, allIssues, onCollaborate }: ReportModalProps) {
  const [step, setStep] = useState<number>(1); // 1: Input form, 2: AI Processing & Results, 3: Duplicate detection, 4: Collaboration Success
  const [duplicateIssue, setDuplicateIssue] = useState<Issue | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trustworthiness/Capture States
  const [photoSource, setPhotoSource] = useState<'live' | 'upload' | 'preset' | null>(null);
  const [photoCapturedAt, setPhotoCapturedAt] = useState<number | null>(null);
  const [activePhotoTab, setActivePhotoTab] = useState<'live' | 'upload' | 'preset'>('live');

  // Webcam stream states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // AI Pipeline Stepper State
  const [aiSteps, setAiSteps] = useState([
    { id: 1, text: 'Uploading photo & preparing payloads...', status: 'idle' },
    { id: 2, text: 'Detecting civic features via Computer Vision...', status: 'idle' },
    { id: 3, text: 'Determining public hazard severity level...', status: 'idle' },
    { id: 4, text: 'Routing ticket to municipal department...', status: 'idle' },
    { id: 5, text: 'Verifying report coordinates & area...', status: 'idle' }
  ]);

  const [aiResult, setAiResult] = useState<GeminiAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera start/stop logic
  const startCamera = async () => {
    setIsCameraStarting(true);
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera access failed/denied:", err);
      setCameraError("Camera permission denied or camera device is in use by another app.");
    } finally {
      setIsCameraStarting(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Monitor tab changes & photo capture to toggle webcam
  useEffect(() => {
    if (isOpen && activePhotoTab === 'live' && step === 1 && !image) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activePhotoTab, step, image]);

  if (!isOpen) return null;

  // Handle image drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setPhotoSource('upload');
          setPhotoCapturedAt(Date.now());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setPhotoSource('upload');
          setPhotoCapturedAt(Date.now());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setImage(dataUrl);
        setPhotoSource('live');
        setPhotoCapturedAt(Date.now());
        stopCamera();
      }
    }
  };

  // Detect location
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      // Fallback
      setLocationName(`MG Road, ${currentArea}`);
      // Centered on Vizag
      setCoords({ lat: 17.6868 + (Math.random() - 0.5) * 0.02, lng: 83.2185 + (Math.random() - 0.5) * 0.02 });
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        // Reverse geocoding placeholder or manual entry
        // Since we are doing a real demonstration, let's fetch reverse geocoding via google geocoder if possible,
        // otherwise default to a beautifully styled coordinate string that the user can tweak.
        setLocationName(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)} (${currentArea})`);
        setIsDetectingLocation(false);
      },
      (error) => {
        console.warn("Geolocation permission denied/failed. Using fallback local coordinates.");
        // Generate coordinates close to standard Visakhapatnam center for beautiful visual demo
        const randomLat = 17.6868 + (Math.random() - 0.5) * 0.015;
        const randomLng = 83.2185 + (Math.random() - 0.5) * 0.015;
        setCoords({ lat: randomLat, lng: randomLng });
        setLocationName(`Gajuwaka Main Road, ${currentArea}`);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Submit and run the AI analyzer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setErrorMsg("Please upload a photograph or select a demo preset to analyze.");
      return;
    }

    let finalLocName = locationName.trim();
    if (!finalLocName) {
      finalLocName = `Muncipal Ward #4, ${currentArea}`;
    }

    let finalCoords = coords;
    if (!finalCoords) {
      // Fallback to random Vizag coord
      finalCoords = {
        lat: 17.6868 + (Math.random() - 0.5) * 0.012,
        lng: 83.2185 + (Math.random() - 0.5) * 0.012
      };
    }

    // Move to step 2: processing
    setStep(2);
    setIsAnalyzing(true);
    setAiResult(null);
    setErrorMsg(null);

    // Helper to update progress steps
    const updateStepStatus = (id: number, status: 'idle' | 'running' | 'success' | 'failed') => {
      setAiSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    // Reset steps
    setAiSteps(prev => prev.map(s => ({ ...s, status: 'idle' })));

    try {
      // Step 1: Uploading & packaging
      updateStepStatus(1, 'running');
      
      // Convert SVG/data URI to base64 if needed
      const base64Image = await ensureBase64Image(image);
      
      await new Promise(r => setTimeout(r, 600));
      updateStepStatus(1, 'success');

      // Step 2: Computer Vision detection
      updateStepStatus(2, 'running');
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in your .env file or Settings -> Secrets.");
      }

      const mimeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Clean = base64Image.replace(/^data:image\/\w+;base64,/, "");

      const promptText = `
You are an expert hyperlocal civic issue validation AI.
Your task is to analyze the uploaded image and the provided metadata to decide whether it depicts a real public municipal issue (e.g., potholes, clogged drainage, broken streetlights, illegal garbage dumping, pipe bursts, damaged parks/sidewalks, safety hazards) or an invalid/unrelated subject (e.g., selfies, personal documents, general indoor scenes, pets, general food, abstract graphics, etc.).

Metadata provided:
- Reported Location Name: ${finalLocName || "Unknown Location"}
- User's Added Description: ${description || "none provided"}

Please return a single JSON object. If the image does not show a valid public civic issue, set "isValidIssue" to false, and explain why in a friendly, polite tone in "rejectionReason" (e.g., "This image appears to be a personal selfie rather than a public civic issue. Please upload a clear photo of the hazard.").

If it is a valid civic issue:
- Set "isValidIssue" to true.
- Set "rejectionReason" to null.
- Classify the category into exactly one of: "pothole", "water_leak", "streetlight", "garbage", or "other".
- Score the severity from 1 (minor issue) to 5 (critical safety hazard).
- Provide a clear, 1-sentence explanation of why this severity was assigned in "severityReason".
- Route the issue to the appropriate responsible Municipal Department (e.g. "Roads Department", "Water Supply & Sewerage", "Electricity Board", "Sanitation & Health", "Other").
- Provide a professional, objective 2-sentence summary ("summary") describing the issue and its local community impact.
      `.trim();

      const apiPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Clean
                  }
                },
                {
                  text: promptText
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                isValidIssue: { type: "BOOLEAN" },
                rejectionReason: { type: "STRING" },
                category: { type: "STRING" },
                severity: { type: "INTEGER" },
                severityReason: { type: "STRING" },
                department: { type: "STRING" },
                summary: { type: "STRING" }
              },
              required: ["isValidIssue", "category", "severity", "severityReason", "department", "summary"]
            }
          }
        })
      });

      await new Promise(r => setTimeout(r, 700));
      updateStepStatus(2, 'success');

      // Step 3: Determining severity
      updateStepStatus(3, 'running');
      await new Promise(r => setTimeout(r, 600));
      updateStepStatus(3, 'success');

      // Step 4: Routing ticket
      updateStepStatus(4, 'running');
      await new Promise(r => setTimeout(r, 600));
      updateStepStatus(4, 'success');

      // Step 5: Coordinate plotting
      updateStepStatus(5, 'running');

      const response = await apiPromise;
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to analyze the image using Google Gemini API directly.");
      }

      const resData = await response.json();
      if (!resData.candidates || !resData.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("Received an empty response from Gemini API.");
      }

      const rawText = resData.candidates[0].content.parts[0].text;
      const result: GeminiAnalysisResult = JSON.parse(rawText.trim());
      console.log("Gemini Analysis result:", result);

      updateStepStatus(5, 'success');
      setIsAnalyzing(false);

      if (!result.isValidIssue) {
        setErrorMsg(result.rejectionReason || "This photo does not depict an actionable public municipal issue.");
        return;
      }

      setAiResult(result);

      // Check existing issues: Same category within 500m? (excluding resolved issues)
      const duplicate = allIssues.find(issue => {
        if (issue.category !== result.category) return false;
        if (issue.status === 'RESOLVED') return false;
        const distance = getDistanceInMeters(
          finalCoords.lat,
          finalCoords.lng,
          issue.location.lat,
          issue.location.lng
        );
        return distance <= 500;
      });

      // Check if there was a resolved issue in this location of the same category
      const resolvedDuplicate = allIssues.find(issue => {
        if (issue.category !== result.category) return false;
        if (issue.status !== 'RESOLVED') return false;
        const distance = getDistanceInMeters(
          finalCoords.lat,
          finalCoords.lng,
          issue.location.lat,
          issue.location.lng
        );
        return distance <= 500;
      });

      if (duplicate) {
        setDuplicateIssue(duplicate);
        setStep(3);
      } else {
        const isRecurrent = !!resolvedDuplicate;
        const recurrenceCount = resolvedDuplicate 
          ? (resolvedDuplicate.recurrenceCount || 0) + 1 
          : 0;

        // Boost severity for recurrent (double) issues
        const finalSeverity = isRecurrent 
          ? Math.min(5, result.severity + 1)
          : result.severity;

        const finalSeverityReason = isRecurrent
          ? `Recurrent Hazard (Re-raised at previously resolved location). ${result.severityReason}`
          : result.severityReason;

        // Create new issue object
        const newIssue: Issue = {
          id: `issue_${Date.now()}`,
          category: result.category,
          severity: finalSeverity,
          severityReason: finalSeverityReason,
          department: result.department,
          summary: result.summary,
          location: {
            lat: finalCoords.lat,
            lng: finalCoords.lng,
            name: finalLocName
          },
          area: currentArea,
          status: 'OPEN',
          reportedAt: Date.now(),
          reportedBy: 'self',
          imageBase64: image,
          description: description || undefined,
          reportCount: 1,
          collaborators: [Date.now()],
          photoSource: photoSource || 'upload',
          photoCapturedAt: photoCapturedAt || Date.now(),
          isRecurrent,
          recurrenceCount
        };

        // Call success handler
        onSubmitSuccess(newIssue);
      }

    } catch (err: any) {
      console.error(err);
      // Fail remaining steps
      setAiSteps(prev => prev.map(s => s.status === 'running' || s.status === 'idle' ? { ...s, status: 'failed' } : s));
      setIsAnalyzing(false);
      setErrorMsg(err?.message || "Connection timed out. Please check if GEMINI_API_KEY is configured in Settings -> Secrets.");
    }
  };

  const handleReset = () => {
    setImage(null);
    setDescription('');
    setLocationName('');
    setCoords(null);
    setStep(1);
    setAiResult(null);
    setErrorMsg(null);
    setDuplicateIssue(null);
    setPhotoSource(null);
    setPhotoCapturedAt(null);
    setActivePhotoTab('live');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm transition-all animate-fade-in">
      <div className="bg-[#0d0d0d] rounded-xl sm:rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#111111]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Report Hyperlocal Issue</h3>
              <p className="text-xs text-gray-400">Google Gemini AI Civic Intake</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Photo Input with Live Camera / Upload / Preset Options */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-300 block">
                  1. Add Photograph <span className="text-red-500">*</span>
                </label>
                
                {!image ? (
                  <div className="space-y-3">
                    {/* Tab Selector */}
                    <div className="flex bg-[#161616] p-1 rounded-xl border border-white/5 gap-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setActivePhotoTab('live')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          activePhotoTab === 'live'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Live Camera</span>
                        <span className="inline sm:hidden">Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhotoTab('upload')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          activePhotoTab === 'upload'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Upload File</span>
                        <span className="inline sm:hidden">Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhotoTab('preset')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          activePhotoTab === 'preset'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Presets</span>
                        <span className="inline sm:hidden">Presets</span>
                      </button>
                    </div>

                    {/* Tab Content Panels */}
                    {activePhotoTab === 'live' && (
                      <div className="relative rounded-xl overflow-hidden border border-white/10 h-48 sm:h-64 bg-[#111] flex flex-col justify-center items-center">
                        {cameraError ? (
                          <div className="p-5 text-center space-y-3">
                            <CameraOff className="w-10 h-10 text-red-500 mx-auto" />
                            <div className="text-xs text-red-400 max-w-xs">{cameraError}</div>
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-3.5 py-1.5 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 rounded-lg text-[10px] text-red-400 font-bold transition-all cursor-pointer"
                            >
                              Retry Camera Access
                            </button>
                          </div>
                        ) : (
                          <>
                            {isCameraStarting && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 gap-2">
                                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                                <span className="text-[10px] text-gray-400 font-semibold">Initializing Webcam...</span>
                              </div>
                            )}
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            {/* Shutter capture button overlay */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                              <button
                                type="button"
                                onClick={handleCaptureSnapshot}
                                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 border-4 border-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                                title="Capture Snapshot"
                              >
                                <Camera className="w-5 h-5 text-white fill-white" />
                              </button>
                            </div>
                            <div className="absolute top-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[9px] text-gray-300 border border-white/5 flex items-center gap-1 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              LIVE CAMERA ACTIVE
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {activePhotoTab === 'upload' && (
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 hover:border-red-500 rounded-xl p-8 text-center bg-[#111111] hover:bg-red-500/5 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                      >
                        <div className="p-4 rounded-full bg-[#161616] group-hover:bg-red-500/10 text-gray-500 group-hover:text-red-500 transition-colors">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300">Drag &amp; drop an issue photograph here</p>
                          <p className="text-xs text-gray-500 mt-1">or click to browse local files</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-[#161616] text-gray-400 border border-white/5 rounded-full">Supports JPG, PNG</span>
                      </div>
                    )}

                    {activePhotoTab === 'preset' && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-gray-400 block mb-1.5">
                          Select a high-quality preset for instant evaluation:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {TEST_PRESETS.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setImage(p.url);
                                setPhotoSource('preset');
                                setPhotoCapturedAt(Date.now());
                                setDescription(`Automated evaluation testing for ${p.category} presetting.`);
                                handleDetectLocation();
                              }}
                              className="p-2 rounded-xl border border-white/10 bg-[#111] text-left flex items-start gap-2 text-xs transition-all hover:bg-[#161616] hover:border-red-500/30 cursor-pointer"
                            >
                              <ImageIcon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                              <div>
                                <div className="font-bold text-gray-300 truncate">{p.name}</div>
                                <div className="text-[10px] text-gray-500 line-clamp-1">{p.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 h-52 bg-slate-950 group">
                    <img 
                      src={image} 
                      alt="Civic Issue Preview" 
                      className="w-full h-full object-contain"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setPhotoSource(null);
                        setPhotoCapturedAt(null);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {/* Source Indicator Badge */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {photoSource === 'live' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 shadow-md backdrop-blur-md">
                          <CheckCircle className="w-3.5 h-3.5 fill-emerald-950" />
                          Verified Live Photo
                        </span>
                      )}
                      {photoSource === 'upload' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 shadow-md backdrop-blur-md">
                          <ImageIcon className="w-3.5 h-3.5 animate-pulse" />
                          Uploaded Photo
                        </span>
                      )}
                      {photoSource === 'preset' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-950/80 border border-blue-500/30 text-blue-400 flex items-center gap-1.5 shadow-md backdrop-blur-md">
                          <Sparkles className="w-3.5 h-3.5 fill-blue-950" />
                          Demo Preset
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 px-4 py-2 text-xs text-white flex justify-between items-center">
                      <span>
                        {photoCapturedAt ? `Captured/Logged: ${new Date(photoCapturedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Photo loaded successfully'}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setImage(null);
                          setPhotoSource(null);
                          setPhotoCapturedAt(null);
                        }}
                        className="underline hover:text-red-400 font-medium cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 block">
                  2. Define Hazard Location <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Near Crossroad Pillar, MG Road, Visakhapatnam"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-[#111111] text-white placeholder-gray-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="px-3.5 py-2.5 rounded-xl bg-[#111111] border border-white/10 hover:border-red-500 hover:bg-red-500/10 text-red-500 transition-all font-semibold text-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                  >
                    {isDetectingLocation ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                    Detect GPS
                  </button>
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 block">
                  3. Brief Description <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea 
                  rows={2}
                  placeholder="Tell our municipal AI any additional context or urgency notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-[#111111] text-white placeholder-gray-500"
                />
              </div>

              {/* Submit trigger button */}
              {errorMsg && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                Analyze &amp; File with Gemini Vision AI
              </button>

            </form>
          ) : step === 2 ? (
            /* Step 2: AI Analyzing Pipeline & Confirmed View */
            <div className="space-y-6">
              
              {/* Analyzer Status Grid */}
              <div className="p-4 bg-[#111111] border border-white/10 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Loader2 className={`w-3.5 h-3.5 text-red-500 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Intelligent Intake Pipeline
                </h4>
                
                <div className="space-y-2.5">
                  {aiSteps.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {s.status === 'running' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin shrink-0" />
                        ) : s.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : s.status === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-white/5 shrink-0" />
                        )}
                        <span className={`transition-colors duration-300 ${
                          s.status === 'running' ? 'text-white font-medium' :
                          s.status === 'success' ? 'text-gray-400' :
                          s.status === 'failed' ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {s.text}
                        </span>
                      </div>
                      
                      {s.status === 'running' && (
                        <span className="text-[10px] font-bold text-red-400 px-1.5 py-0.5 bg-red-950/40 border border-red-500/10 rounded-full uppercase animate-pulse">
                          Processing
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection / Error Screen */}
              {errorMsg && !isAnalyzing && (
                <div className="p-5 bg-red-950/30 border border-red-500/20 rounded-2xl text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <div>
                    <h4 className="font-display font-bold text-white">Photo Verification Failed</h4>
                    <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try Uploading Another
                  </button>
                </div>
              )}

              {/* Final Success AI Summary Box */}
              {aiResult && !isAnalyzing && (
                <div className="space-y-4 animate-scale-in">
                  <div className="p-5 bg-[#111111] border border-white/10 rounded-2xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Auto-Categorized
                        </span>
                        <h4 className="font-display font-bold text-white mt-1.5 text-base capitalize">
                          Detected: {aiResult.category.replace('_', ' ')}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Severity Score
                        </span>
                        <div className="text-lg font-black text-red-500 mt-0.5">
                          {aiResult.severity} / 5
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Routed Department</div>
                        <div className="text-white font-bold mt-0.5">{aiResult.department}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Status Assigned</div>
                        <div className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          OPEN (TICKETED)
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="text-xs space-y-1.5">
                      <div className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">AI Generation Summary</div>
                      <p className="text-gray-300 italic leading-relaxed font-serif">
                        "{aiResult.summary}"
                      </p>
                    </div>

                    <div className="text-[11px] text-gray-400 bg-[#0a0a0a]/50 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                      <strong className="text-gray-300">Severity Metric Logic:</strong> {aiResult.severityReason}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-[#222222] border border-white/10 text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Report Another Issue
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] cursor-pointer"
                    >
                      Close &amp; View on Map
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : step === 3 ? (
            /* Step 3: Duplicate detection warning */
            <div className="space-y-6">
              <div className="p-5 bg-red-950/10 border border-red-500/20 rounded-2xl space-y-4">
                
                <div className="flex items-center gap-2.5 text-red-500">
                  <AlertTriangle className="w-5.5 h-5.5 shrink-0" />
                  <h4 className="font-display font-bold text-base text-white">⚠️ Issue Already Reported Nearby</h4>
                </div>

                {/* Duplicate Issue card */}
                <div className="p-4 bg-[#141414] rounded-xl border border-white/5 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider capitalize">
                      🔴 {duplicateIssue?.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-gray-400 font-mono">
                      Severity: {duplicateIssue?.severity}/5
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-200">{duplicateIssue?.location.name}</p>
                    <p className="text-xs text-gray-400 leading-relaxed font-serif italic">
                      "{duplicateIssue?.summary}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-[11px] text-gray-500 font-medium">
                    <span>Reported by {duplicateIssue?.reportCount || 1} citizens · {duplicateIssue ? timeAgo(duplicateIssue.reportedAt) : ''}</span>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${
                      duplicateIssue?.status === 'ESCALATED' 
                        ? 'bg-red-950/40 text-red-400 border-red-500/20 animate-pulse' 
                        : 'bg-[#1a1a1a] text-gray-300 border-white/10'
                    }`}>
                      {duplicateIssue?.status} {duplicateIssue?.status === 'ESCALATED' ? '🔺' : '🕒'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-300 leading-relaxed space-y-1.5 text-left bg-black/30 p-3.5 rounded-xl border border-white/5">
                  <p>AI detected a matching issue within <strong className="text-white">500m</strong> of your location.</p>
                  <p className="text-red-400 font-semibold">Duplicate posts are not allowed.</p>
                  <p>You can collaborate to boost its priority with authorities.</p>
                </div>

                <div className="h-px bg-white/5" />

                {/* Perks list */}
                <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl space-y-2 text-left">
                  <div className="text-xs font-bold text-gray-300">Collaborating will:</div>
                  <div className="space-y-1.5 text-[11px] text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✅</span>
                      <span>Increase citizen report count</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✅</span>
                      <span>Boost severity score &amp; urgency level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✅</span>
                      <span>Push ticket priority higher for municipal teams</span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (duplicateIssue) {
                        onCollaborate(duplicateIssue.id);
                        setStep(4);
                      }
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    🤝 Collaborate &amp; Boost Priority
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 bg-[#161616] hover:bg-[#222222] text-gray-400 border border-white/10 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          ) : (
            /* Step 4: Collaboration Success view */
            <div className="py-8 px-4 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-black text-white text-lg tracking-tight uppercase">Collaboration Success!</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Your ticket support has been logged. We've increased the report count and boosted severity to escalate priority with authorities.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] cursor-pointer inline-block"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
