import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video, VideoOff, Camera, Play, Pause, RotateCcw, AlertTriangle,
  CheckCircle, Clock, MapPin, Download, Trash2, Loader2, Wifi, WifiOff,
  ZapOff, Zap, Eye, Shield, ChevronDown, ChevronRight
} from 'lucide-react';
import type { VideoAnalysisResult, VideoAnalysisSession } from '../types';
import {
  calculateRiskCategory, HAZARD_CATEGORIES, RISK_CATEGORY_LABELS,
  getRiskTextColor, getRiskBorderColor
} from '../types';
import { analyzeVideoFrame } from '../services/aiAnalysis';

interface Props {
  onSaveAssessment?: (result: VideoAnalysisResult) => void;
}

type CameraFacing = 'environment' | 'user';

const AUTO_ANALYSIS_INTERVALS = [
  { label: '5 წამი', value: 5000 },
  { label: '10 წამი', value: 10000 },
  { label: '30 წამი', value: 30000 },
  { label: '1 წუთი', value: 60000 },
];

export function VideoRiskAnalysis({ onSaveAssessment }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoAnalysisRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('environment');
  const [location, setLocation] = useState('');
  const [session, setSession] = useState<VideoAnalysisSession | null>(null);
  const [selectedResult, setSelectedResult] = useState<VideoAnalysisResult | null>(null);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(false);
  const [autoIntervalMs, setAutoIntervalMs] = useState(10000);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastFrameCapture, setLastFrameCapture] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (autoAnalysisRef.current) {
      clearInterval(autoAnalysisRef.current);
      autoAnalysisRef.current = null;
    }
    setIsCameraOn(false);
    setAutoAnalysisEnabled(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);

      if (!session) {
        setSession({
          id: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
          location: location || 'სამუშაო ადგილი',
          results: [],
          status: 'recording',
        });
      }
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setCameraError('კამერაზე წვდომა აკრძალულია. გთხოვთ, დაუშვათ კამერის გამოყენება ბრაუზერის პარამეტრებში.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('კამერა ვერ მოიძებნა. შეამოწმეთ, რომ მოწყობილობას კამერა აქვს.');
      } else if (error.name === 'NotReadableError') {
        setCameraError('კამერა სხვა პროგრამამ გამოიყენა. დახურეთ სხვა პროგრამები.');
      } else {
        setCameraError(`კამერის გახსნის შეცდომა: ${error.message}`);
      }
    }
  }, [cameraFacing, session, location]);

  const toggleCamera = useCallback(() => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraOn, startCamera, stopCamera]);

  const switchCamera = useCallback(async () => {
    const newFacing: CameraFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    if (isCameraOn) {
      stopCamera();
      setTimeout(() => startCamera(), 300);
    }
  }, [cameraFacing, isCameraOn, stopCamera, startCamera]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!isCameraOn || isAnalyzing) return;

    const frameData = captureFrame();
    if (!frameData) return;

    setLastFrameCapture(frameData);
    setIsAnalyzing(true);

    try {
      const aiResult = await analyzeVideoFrame(frameData);

      const rating = aiResult.probability * aiResult.severity;
      const riskCategory = calculateRiskCategory(rating);

      const result: VideoAnalysisResult = {
        id: crypto.randomUUID(),
        frameTimestamp: Date.now(),
        capturedAt: new Date().toISOString(),
        imageData: frameData,
        hazardName: aiResult.hazardName,
        description: aiResult.description,
        category: aiResult.category,
        location: session?.location || location || 'სამუშაო ადგილი',
        affectedPersons: aiResult.affectedPersons,
        damageType: aiResult.damageType,
        probability: aiResult.probability,
        severity: aiResult.severity,
        riskRating: rating,
        riskCategory,
        controlMeasures: aiResult.controlMeasures,
        recommendations: aiResult.recommendations,
        confidence: aiResult.confidence,
      };

      setSession(prev => {
        if (!prev) return prev;
        return { ...prev, results: [result, ...prev.results] };
      });
      setSelectedResult(result);
    } catch (err) {
      console.error('Video analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isCameraOn, isAnalyzing, captureFrame, session, location]);

  const toggleAutoAnalysis = useCallback(() => {
    if (autoAnalysisEnabled) {
      if (autoAnalysisRef.current) {
        clearInterval(autoAnalysisRef.current);
        autoAnalysisRef.current = null;
      }
      setAutoAnalysisEnabled(false);
      setSession(prev => prev ? { ...prev, status: 'paused' } : prev);
    } else {
      if (!isCameraOn) return;
      setAutoAnalysisEnabled(true);
      setSession(prev => prev ? { ...prev, status: 'recording' } : prev);
      autoAnalysisRef.current = setInterval(() => {
        runAnalysis();
      }, autoIntervalMs);
    }
  }, [autoAnalysisEnabled, isCameraOn, autoIntervalMs, runAnalysis]);

  // Restart auto-analysis when interval changes
  useEffect(() => {
    if (autoAnalysisEnabled && autoAnalysisRef.current) {
      clearInterval(autoAnalysisRef.current);
      autoAnalysisRef.current = setInterval(() => {
        runAnalysis();
      }, autoIntervalMs);
    }
  }, [autoIntervalMs, autoAnalysisEnabled, runAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const clearSession = useCallback(() => {
    stopCamera();
    setSession(null);
    setSelectedResult(null);
    setLastFrameCapture(null);
  }, [stopCamera]);

  const exportResults = useCallback(() => {
    if (!session || session.results.length === 0) return;
    const exportData = {
      session: {
        id: session.id,
        startedAt: session.startedAt,
        location: session.location,
        totalFindings: session.results.length,
      },
      findings: session.results.map(r => ({
        hazardName: r.hazardName,
        category: HAZARD_CATEGORIES[r.category],
        riskLevel: RISK_CATEGORY_LABELS[r.riskCategory],
        riskRating: r.riskRating,
        probability: r.probability,
        severity: r.severity,
        description: r.description,
        affectedPersons: r.affectedPersons,
        damageType: r.damageType,
        recommendations: r.recommendations,
        capturedAt: r.capturedAt,
        confidence: `${r.confidence}%`,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-risk-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [session]);

  const toggleResultExpand = (id: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getRiskBadgeClass = (category: VideoAnalysisResult['riskCategory']) => {
    switch (category) {
      case 'critical': return 'bg-red-500/20 text-red-400 border border-red-500/40';
      case 'high': return 'bg-orange-500/20 text-orange-400 border border-orange-500/40';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40';
      case 'low': return 'bg-green-500/20 text-green-400 border border-green-500/40';
    }
  };

  const criticalCount = session?.results.filter(r => r.riskCategory === 'critical').length ?? 0;
  const highCount = session?.results.filter(r => r.riskCategory === 'high').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Video className="w-6 h-6 text-white" />
            </div>
            ვიდეო რისკ-ანალიზი
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            კამერის მიერ გადაღებული ვიდეოს რეალურ დროში AI ანალიზი
          </p>
        </div>
        {session && session.results.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              ექსპორტი
            </button>
            <button
              onClick={clearSession}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              გასუფთავება
            </button>
          </div>
        )}
      </div>

      {/* Session Stats */}
      {session && session.results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold text-white">{session.results.length}</div>
            <div className="text-slate-400 text-sm">სულ აღმოჩენილი</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-slate-400 text-sm">კრიტიკული</div>
          </div>
          <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400">{highCount}</div>
            <div className="text-slate-400 text-sm">მაღალი</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold text-violet-400">
              {session.results.length > 0
                ? Math.round(session.results.reduce((s, r) => s + r.confidence, 0) / session.results.length)
                : 0}%
            </div>
            <div className="text-slate-400 text-sm">საშ. სიზუსტე</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Panel */}
        <div className="space-y-4">
          {/* Camera Controls */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Camera className="w-5 h-5 text-violet-400" />
                კამერის მართვა
              </h3>
              <div className="flex items-center gap-2">
                {isCameraOn ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ჩართულია
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    გამორთულია
                  </span>
                )}
              </div>
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                ადგილმდებარეობა
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="მაგ: სამრეწველო საამქრო, სამშენებლო უბანი..."
                className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Camera Buttons */}
            <div className="flex gap-2">
              <button
                onClick={toggleCamera}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                  isCameraOn
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700'
                }`}
              >
                {isCameraOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                {isCameraOn ? 'კამერის გამორთვა' : 'კამერის ჩართვა'}
              </button>
              {isCameraOn && (
                <button
                  onClick={switchCamera}
                  className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  title="კამერის გადართვა"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {cameraError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <WifiOff className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{cameraError}</p>
              </div>
            )}
          </div>

          {/* Video Feed */}
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
                <VideoOff className="w-16 h-16 opacity-30" />
                <p className="text-sm">კამერა გამორთულია</p>
                <p className="text-xs opacity-60">დააჭირეთ "კამერის ჩართვა"</p>
              </div>
            )}

            {isCameraOn && isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                <p className="text-white font-medium">ანალიზი მიმდინარეობს...</p>
              </div>
            )}

            {/* Live indicator */}
            {isCameraOn && !isAnalyzing && (
              <div className="absolute top-3 left-3">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded-full text-xs text-red-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              </div>
            )}

            {/* Auto-analysis indicator */}
            {autoAnalysisEnabled && (
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/80 rounded-full text-xs text-white font-medium">
                  <Zap className="w-3 h-3" />
                  AUTO
                </span>
              </div>
            )}
          </div>

          {/* Analysis Controls */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-violet-400" />
              ანალიზის პარამეტრები
            </h3>

            {/* Manual capture */}
            <button
              onClick={runAnalysis}
              disabled={!isCameraOn || isAnalyzing}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                isCameraOn && !isAnalyzing
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              {isAnalyzing ? 'ანალიზი მიმდინარეობს...' : 'კადრის გადაღება და ანალიზი'}
            </button>

            {/* Auto analysis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">ავტო-ანალიზი</span>
                <select
                  value={autoIntervalMs}
                  onChange={e => setAutoIntervalMs(Number(e.target.value))}
                  disabled={autoAnalysisEnabled}
                  className="bg-slate-700 border border-slate-600 text-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
                >
                  {AUTO_ANALYSIS_INTERVALS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={toggleAutoAnalysis}
                disabled={!isCameraOn}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all text-sm ${
                  autoAnalysisEnabled
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40 hover:bg-violet-500/30'
                    : isCameraOn
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                      : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {autoAnalysisEnabled ? (
                  <><Pause className="w-4 h-4" /> ავტო-ანალიზის გაჩერება</>
                ) : (
                  <><Play className="w-4 h-4" /> ავტო-ანალიზის დაწყება</>
                )}
              </button>
            </div>

            {/* Android tip */}
            <div className="flex items-start gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <Wifi className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-violet-300 text-xs">
                ანდროიდზე: Chrome ბრაუზერში გახსენით ეს გვერდი. კამერაზე წვდომისთვის დაუშვით ნებართვა.
                უკანა კამერა (environment) ავტომატურად ირჩევა.
              </p>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* Last captured frame */}
          {lastFrameCapture && selectedResult && (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-4 border-b border-slate-700/50">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-400" />
                  ბოლო ანალიზი
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-0">
                <div className="relative">
                  <img
                    src={selectedResult.imageData}
                    alt="Captured frame"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-slate-300">
                    {new Date(selectedResult.capturedAt).toLocaleTimeString('ka-GE')}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeClass(selectedResult.riskCategory)}`}>
                    {RISK_CATEGORY_LABELS[selectedResult.riskCategory]} ({selectedResult.riskRating})
                  </div>
                  <p className="text-white text-sm font-medium line-clamp-2">{selectedResult.hazardName}</p>
                  <p className="text-slate-400 text-xs line-clamp-3">{selectedResult.description}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Shield className="w-3 h-3" />
                    <span>სიზუსტე: {selectedResult.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Control measures summary */}
              <div className="p-4 border-t border-slate-700/50 space-y-2">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">რეკომენდებული ზომები</p>
                <div className="space-y-1.5">
                  {selectedResult.controlMeasures.elimination && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded shrink-0">აღმოფხვრა</span>
                      <span className="text-xs text-slate-300">{selectedResult.controlMeasures.elimination}</span>
                    </div>
                  )}
                  {selectedResult.controlMeasures.engineering && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded shrink-0">ინჟინერია</span>
                      <span className="text-xs text-slate-300">{selectedResult.controlMeasures.engineering}</span>
                    </div>
                  )}
                  {selectedResult.controlMeasures.ppe && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded shrink-0">ინდ. დაცვა</span>
                      <span className="text-xs text-slate-300">{selectedResult.controlMeasures.ppe}</span>
                    </div>
                  )}
                </div>
              </div>

              {onSaveAssessment && (
                <div className="p-4 border-t border-slate-700/50">
                  <button
                    onClick={() => onSaveAssessment(selectedResult)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    შეფასებად შენახვა
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results list */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                აღმოჩენილი საფრთხეები
                {session?.results.length ? (
                  <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-300">
                    {session.results.length}
                  </span>
                ) : null}
              </h3>
            </div>

            <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
              {!session || session.results.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">ჯერ არ არის ანალიზი</p>
                  <p className="text-xs mt-1 opacity-70">
                    ჩართეთ კამერა და გააკეთეთ ანალიზი
                  </p>
                </div>
              ) : (
                session.results.map(result => (
                  <div key={result.id} className="p-4">
                    <button
                      onClick={() => {
                        setSelectedResult(result);
                        toggleResultExpand(result.id);
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskBadgeClass(result.riskCategory)}`}>
                              {RISK_CATEGORY_LABELS[result.riskCategory]}
                            </span>
                            <span className="text-xs text-slate-500">
                              {HAZARD_CATEGORIES[result.category]}
                            </span>
                          </div>
                          <p className={`text-sm font-medium mt-1 ${getRiskTextColor(result.riskCategory)}`}>
                            {result.hazardName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {new Date(result.capturedAt).toLocaleTimeString('ka-GE')}
                            </span>
                            <span className="text-xs text-slate-500">
                              სიზუსტე: {result.confidence}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${getRiskBorderColor(result.riskCategory)} ${getRiskTextColor(result.riskCategory)}`}>
                            {result.riskRating}
                          </div>
                          {expandedResults.has(result.id)
                            ? <ChevronDown className="w-4 h-4 text-slate-400" />
                            : <ChevronRight className="w-4 h-4 text-slate-400" />
                          }
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {expandedResults.has(result.id) && (
                      <div className="mt-3 space-y-3 pt-3 border-t border-slate-700/50">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900/50 rounded-lg p-2">
                            <p className="text-xs text-slate-500">ალბათობა</p>
                            <p className="text-sm font-medium text-white">{result.probability}/5</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-2">
                            <p className="text-xs text-slate-500">სიმძიმე</p>
                            <p className="text-sm font-medium text-white">{result.severity}/5</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{result.description}</p>
                        {result.recommendations && (
                          <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 font-medium mb-1">რეკომენდაციები:</p>
                            <p className="text-xs text-slate-300">{result.recommendations}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {onSaveAssessment && (
                            <button
                              onClick={() => onSaveAssessment(result)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg transition-colors text-xs font-medium"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              შეფასებად შენახვა
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Android Instructions Card */}
          <div className="bg-slate-800/50 rounded-2xl border border-violet-500/20 p-4 space-y-3">
            <h3 className="text-violet-300 font-semibold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              ანდროიდზე გამოყენება
            </h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs shrink-0 font-bold">1</span>
                <span>გახსენით Chrome ბრაუზერი ანდროიდ მოწყობილობაზე</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs shrink-0 font-bold">2</span>
                <span>გადადით ამ აპლიკაციის URL-ზე და გახსენით "ვიდეო ანალიზი" ჩანართი</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs shrink-0 font-bold">3</span>
                <span>დააჭირეთ "კამერის ჩართვა" — Chrome-ი ითხოვს კამერაზე ნებართვას</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs shrink-0 font-bold">4</span>
                <span>მიმართეთ კამერა სამუშაო ადგილს და დააჭირეთ "ანალიზი" ან ჩართეთ ავტო-ანალიზი</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs shrink-0 font-bold">5</span>
                <span>AI ანალიზი ავტომატურად განსაზღვრავს საფრთხეებს და მოგცემთ კონტროლის ზომებს</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRiskBadgeClass(category: VideoAnalysisResult['riskCategory']) {
  switch (category) {
    case 'critical': return 'bg-red-500/20 text-red-400 border border-red-500/40';
    case 'high': return 'bg-orange-500/20 text-orange-400 border border-orange-500/40';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40';
    case 'low': return 'bg-green-500/20 text-green-400 border border-green-500/40';
  }
}
