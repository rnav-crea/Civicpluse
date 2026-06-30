import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2, Image as ImageIcon, CheckCircle, CameraOff, AlertTriangle } from 'lucide-react';

interface ResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolveSubmit: (id: string, resolutionImage: string, resolutionNotes: string) => void;
  issueId: string | null;
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
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        console.error("Failed to convert image to base64 via Canvas:", err);
        resolve(imageSrc);
      }
    };
    img.onerror = (err) => {
      console.error("Failed to load image for base64 conversion:", err);
      resolve(imageSrc);
    };
    img.src = imageSrc;
  });
};

export default function ResolveModal({ isOpen, onClose, onResolveSubmit, issueId }: ResolveModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [activePhotoTab, setActivePhotoTab] = useState<'live' | 'upload'>('live');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Webcam stream states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.warn("Camera access failed/denied for ResolveModal:", err);
      setCameraError("Camera access denied. Please upload a verification photo instead.");
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

  useEffect(() => {
    if (isOpen && activePhotoTab === 'live' && !image) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activePhotoTab, image]);

  if (!isOpen || !issueId) return null;

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
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setErrorMsg("Please capture or upload a photo of the resolved site as verification proof.");
      return;
    }
    if (!notes.trim() || notes.trim().length < 5) {
      setErrorMsg("Please provide at least a short note (min 5 characters) explaining how the issue was resolved.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const finalImage = await ensureBase64Image(image);
      onResolveSubmit(issueId, finalImage, notes.trim());
      handleReset();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to process resolution proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setNotes('');
    setActivePhotoTab('live');
    setErrorMsg(null);
    stopCamera();
  };

  const handleCloseAndReset = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm transition-all animate-fade-in">
      <div className="bg-[#0d0d0d] rounded-xl sm:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#111111]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-white">File Proof of Resolution</h3>
              <p className="text-xs text-gray-400">Provide photographic validation of the fix</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleCloseAndReset}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-left">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Add Proof Photo */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300 uppercase block tracking-wider">
              1. Photograph Proof of Fixed Site <span className="text-red-500">*</span>
            </label>

            {!image ? (
              <div className="space-y-3">
                {/* Tabs */}
                <div className="flex bg-[#161616] p-1 rounded-xl border border-white/5 gap-1">
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('live')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activePhotoTab === 'live'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Live Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('upload')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activePhotoTab === 'upload'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                </div>

                {/* Tab content panels */}
                {activePhotoTab === 'live' && (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 h-44 sm:h-56 bg-[#111] flex flex-col justify-center items-center">
                    {cameraError ? (
                      <div className="p-4 text-center space-y-2">
                        <CameraOff className="w-8 h-8 text-red-500 mx-auto" />
                        <div className="text-[11px] text-red-400 max-w-xs">{cameraError}</div>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-300 font-bold transition-all cursor-pointer"
                        >
                          Retry Camera
                        </button>
                      </div>
                    ) : (
                      <>
                        {isCameraStarting && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 gap-2">
                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                            <span className="text-[10px] text-gray-400 font-semibold">Starting camera stream...</span>
                          </div>
                        )}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                          <button
                            type="button"
                            onClick={handleCaptureSnapshot}
                            className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 border-2 border-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Camera className="w-4 h-4 text-white fill-white" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activePhotoTab === 'upload' && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-emerald-500 rounded-xl p-6 text-center bg-[#111111] hover:bg-emerald-500/5 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="p-3 rounded-full bg-[#161616] group-hover:bg-emerald-500/10 text-gray-500 group-hover:text-emerald-500 transition-colors">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-300">Drag &amp; drop resolution photo</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">or click to browse local storage</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-white/10 h-44 bg-slate-950">
                <img 
                  src={image} 
                  alt="Resolution Proof Preview" 
                  className="w-full h-full object-contain"
                />
                <button 
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-2.5 right-2.5 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/80 px-3 py-1.5 text-[10px] text-white flex justify-between items-center">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Proof Loaded
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setImage(null)}
                    className="underline hover:text-red-400 cursor-pointer"
                  >
                    Replace Photo
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

          {/* 2. Resolution Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase block tracking-wider">
              2. Resolution Notes &amp; Repair Details <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain how the issue was fixed (e.g. 'Roads team patched the asphalt with cold mix', 'Main street utility crew replaced the LED bulb and verified connection')..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#111] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm text-white placeholder-gray-600 leading-relaxed resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2.5">
            <button
              type="button"
              onClick={handleCloseAndReset}
              className="flex-1 py-2.5 rounded-xl bg-zinc-950 border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Filing resolution...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Submit Proof of Fix</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
