import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Cpu,
  Radio,
  Minimize2,
  Maximize2,
  Settings2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { AiEngineMode, OllamaStatus } from '../types/dexter';

interface DexterOrbProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  voiceMuted: boolean;
  onToggleListen: () => void;
  onToggleMute: () => void;
  onExecuteCommand: (command: string) => void;
  engineMode: AiEngineMode;
  onSelectEngineMode: (mode: AiEngineMode) => void;
  ollamaStatus: OllamaStatus;
  onRefreshOllama: () => void;
  transcript?: string;
  lastSpokenText?: string;
  isFloatingDocked?: boolean;
  onToggleFloatingDock?: () => void;
}

const CORE_VIDEO_SRC = '/assets/aistudio/gemini_generated_video_70505dfb_05a2ea84.mp4';

export const DexterOrb: React.FC<DexterOrbProps> = ({
  isListening,
  isProcessing,
  isSpeaking,
  voiceMuted,
  onToggleListen,
  onToggleMute,
  onExecuteCommand,
  engineMode,
  onSelectEngineMode,
  ollamaStatus,
  onRefreshOllama,
  transcript = '',
  lastSpokenText = '',
  isFloatingDocked = false,
  onToggleFloatingDock,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [simulatedLevel, setSimulatedLevel] = useState(0.2);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const dockVideoRef = useRef<HTMLVideoElement | null>(null);

  // Audio-reactive visualizer simulation
  useEffect(() => {
    if (!isListening && !isSpeaking && !isProcessing) {
      setSimulatedLevel(0.18);
      return;
    }

    const interval = setInterval(() => {
      if (isSpeaking) {
        setSimulatedLevel(0.55 + Math.random() * 0.45);
      } else if (isListening) {
        setSimulatedLevel(0.4 + Math.random() * 0.4);
      } else if (isProcessing) {
        setSimulatedLevel(0.75);
      }
    }, 110);

    return () => clearInterval(interval);
  }, [isListening, isSpeaking, isProcessing]);

  // Dynamically control video playback speed based on state
  useEffect(() => {
    const rate = isSpeaking ? 1.35 : isListening ? 1.15 : isProcessing ? 1.25 : 0.9;
    if (heroVideoRef.current) {
      heroVideoRef.current.playbackRate = rate;
    }
    if (dockVideoRef.current) {
      dockVideoRef.current.playbackRate = rate;
    }
  }, [isSpeaking, isListening, isProcessing]);

  // Determine current intelligence state label
  const stateLabel = isSpeaking
    ? 'Speaking'
    : isProcessing
    ? 'Analyzing Intent'
    : isListening
    ? 'Listening'
    : 'Standby';

  const stateSubtext = isSpeaking
    ? 'Transmitting audio directive, sir.'
    : isProcessing
    ? 'Calculating execution parameters...'
    : isListening
    ? 'Awaiting your command, sir...'
    : 'Click core or say "Dexter" / "Hey Dexter"';

  // Floating Mini Dock (Floating Holographic Core Orb)
  if (isFloatingDocked) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 select-none">
        {/* Expanded Transcript / State Bubble */}
        {(isListening || isSpeaking || isProcessing || transcript) && (
          <div className="max-w-xs bg-[#120406]/95 border border-red-700/50 backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl shadow-red-950/80 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-red-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {stateLabel}
              </span>
              <span className="text-[10px] text-red-300/80 font-mono">
                {engineMode === 'qwen_ollama' ? 'Qwen Offline' : 'J.A.R.V.I.S.'}
              </span>
            </div>
            <p className="text-red-100 line-clamp-2">
              {transcript || lastSpokenText || stateSubtext}
            </p>
          </div>
        )}

        {/* Floating Holographic Core Orb Button */}
        <div className="relative group">
          {/* Outward ripple ring when speaking/listening */}
          {(isListening || isSpeaking) && (
            <div className="absolute -inset-2 rounded-full border border-red-500/60 animate-jarvis-ripple pointer-events-none" />
          )}

          <button
            onClick={onToggleListen}
            title={isListening ? 'Stop listening' : 'Click core to speak (or say "Hey Dexter")'}
            className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-red-700 via-rose-600 to-red-950 shadow-[0_0_35px_rgba(220,38,38,0.65)] hover:shadow-[0_0_50px_rgba(239,68,68,0.9)] transition-all cursor-pointer overflow-hidden border border-red-500/70 active:scale-95"
          >
            {/* Embedded Holographic Core Video */}
            <video
              ref={dockVideoRef}
              src={CORE_VIDEO_SRC}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-full filter contrast-125 brightness-110"
            />

            {/* Interactive Center State Icon Overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/60 via-transparent to-black/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#150508]/80 border border-red-400/60 shadow-[0_0_12px_rgba(239,68,68,0.8)] flex items-center justify-center">
                {isListening ? (
                  <Mic className="w-4 h-4 text-red-300 animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="w-4 h-4 text-red-300 animate-pulse" />
                ) : isProcessing ? (
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                ) : (
                  <Radio className="w-4 h-4 text-red-400 group-hover:text-red-200 transition-colors" />
                )}
              </div>
            </div>

            {/* Rotating coordinate ring */}
            <div className="absolute inset-0 rounded-full border border-red-400/40 border-dashed animate-jarvis-reticle pointer-events-none" />
          </button>

          {/* Undock / Expand Button */}
          {onToggleFloatingDock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFloatingDock();
              }}
              title="Expand back to Hero Console"
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-900 border border-red-500 text-red-200 hover:bg-red-800 flex items-center justify-center text-xs shadow-lg cursor-pointer transition-transform hover:scale-110"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Hero Mode: Full Stark-Tech Holographic Core Console
  return (
    <div className="relative bg-gradient-to-b from-[#140507] via-[#0d0304] to-[#0a0203] border border-red-950/90 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-red-950/70 overflow-hidden backdrop-blur">
      {/* Background Holographic Ambient Radiance */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Core Telemetry HUD */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-red-950/90 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-red-400 font-mono flex items-center gap-2">
            <span>DEXTER HOLOGRAPHIC CORE</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/50">
              MARK VII • J.A.R.V.I.S.
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline / Ollama Engine Indicator Pill */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border cursor-pointer ${
              engineMode === 'qwen_ollama'
                ? 'bg-amber-950/30 border-amber-600/50 text-amber-300 hover:bg-amber-900/30'
                : 'bg-red-950/40 border-red-700/50 text-red-300 hover:bg-red-900/30'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            <span>
              {engineMode === 'qwen_ollama'
                ? 'Offline: Qwen 2.5'
                : engineMode === 'auto'
                ? 'Auto: Cloud/Ollama'
                : 'Cloud: Gemini 3.8'}
            </span>
            <Settings2 className="w-3 h-3 text-red-400/80 ml-0.5" />
          </button>

          {/* Voice Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={voiceMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              voiceMuted
                ? 'bg-rose-950/30 border-rose-700/50 text-rose-400 hover:bg-rose-900/30'
                : 'bg-[#150507] border-red-900/60 text-red-200 hover:text-white hover:border-red-700'
            }`}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Dock to Floating Desktop Orb */}
          {onToggleFloatingDock && (
            <button
              onClick={onToggleFloatingDock}
              title="Dock as floating mini desktop orb"
              className="p-2 rounded-xl bg-[#150507] border border-red-900/60 text-red-200 hover:text-white hover:bg-red-950/40 hover:border-red-700 transition-all cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel Drawer (Engine / Ollama Selector) */}
      {showSettings && (
        <div className="relative mt-4 p-4 rounded-2xl bg-[#120406]/95 border border-red-800/60 space-y-3 z-20 animate-in fade-in duration-200 shadow-xl shadow-red-950/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-red-400" />
              Intelligence Engine Configuration
            </span>
            <button
              onClick={onRefreshOllama}
              title="Ping local Ollama connection"
              className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-mono"
            >
              <RefreshCw className="w-3 h-3" />
              Check Ollama
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Auto Routing */}
            <button
              onClick={() => onSelectEngineMode('auto')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                engineMode === 'auto'
                  ? 'bg-red-950/60 border-red-500 text-red-200 shadow-sm shadow-red-900/30'
                  : 'bg-[#150508]/60 border-red-950 text-red-300/70 hover:border-red-800'
              }`}
            >
              <div className="font-semibold text-red-100 mb-0.5">Auto Intelligent</div>
              <p className="text-[11px] text-red-300/60">
                Prefers Gemini cloud; auto-falls back to local Qwen Ollama when offline.
              </p>
            </button>

            {/* Offline Qwen Ollama */}
            <button
              onClick={() => onSelectEngineMode('qwen_ollama')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                engineMode === 'qwen_ollama'
                  ? 'bg-amber-950/50 border-amber-500 text-amber-200 shadow-sm shadow-amber-900/30'
                  : 'bg-[#150508]/60 border-red-950 text-red-300/70 hover:border-red-800'
              }`}
            >
              <div className="font-semibold text-red-100 mb-0.5 flex items-center gap-1">
                <span>Qwen Ollama</span>
                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">100% Offline</span>
              </div>
              <p className="text-[11px] text-red-300/60">
                Runs entirely on your PC via local Ollama (127.0.0.1:11434). No internet needed.
              </p>
            </button>

            {/* Cloud Gemini */}
            <button
              onClick={() => onSelectEngineMode('gemini')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                engineMode === 'gemini'
                  ? 'bg-red-950/60 border-red-500 text-red-200 shadow-sm shadow-red-900/30'
                  : 'bg-[#150508]/60 border-red-950 text-red-300/70 hover:border-red-800'
              }`}
            >
              <div className="font-semibold text-red-100 mb-0.5">Gemini 3.8 Flash</div>
              <p className="text-[11px] text-red-300/60">
                Google GenAI multi-modal models with Search & Maps Grounding.
              </p>
            </button>
          </div>

          {/* Ollama Status Readout */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-950 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-red-300/70">Local Ollama Status:</span>
              {ollamaStatus.online ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active on 127.0.0.1:11434 ({ollamaStatus.models.length} models installed)
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Offline / Waiting for `ollama run qwen2.5`
                </span>
              )}
            </div>

            {ollamaStatus.models.length > 0 && (
              <div className="text-red-300/70">
                Active model:{' '}
                <span className="text-red-300 font-mono">
                  {ollamaStatus.activeModel || 'qwen2.5'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Stark-Tech Holographic Core Video Display & Face */}
      <div className="relative flex flex-col items-center justify-center my-6 sm:my-8">
        {/* Outward Shockwave Ripple Rings (when speaking or listening) */}
        {(isListening || isSpeaking) && (
          <>
            <div
              className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-red-500/40 animate-jarvis-ripple pointer-events-none"
              style={{ animationDelay: '0s' }}
            />
            <div
              className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-rose-600/30 animate-jarvis-ripple pointer-events-none"
              style={{ animationDelay: '0.8s' }}
            />
          </>
        )}

        {/* Outer Rotating Holographic Reticle HUD */}
        <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-red-500/25 animate-jarvis-reticle pointer-events-none flex items-center justify-center">
          <div className="w-full h-full rounded-full border-t-2 border-b-2 border-red-500/50 opacity-80" />
        </div>

        {/* Counter-rotating Inner Telemetry Ring */}
        <div className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-dashed border-red-600/30 animate-jarvis-reticle-reverse pointer-events-none" />

        {/* Dynamic Dark Red Aura Backlight */}
        <div
          className={`absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-red-600/30 blur-3xl transition-all duration-700 pointer-events-none ${
            isSpeaking
              ? 'opacity-80 scale-125'
              : isListening
              ? 'opacity-70 scale-110'
              : isProcessing
              ? 'opacity-90 scale-115'
              : 'opacity-40 scale-100'
          }`}
        />

        {/* The Central Holographic Video Display Container */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            onClick={onToggleListen}
            title={isListening ? 'Stop listening' : 'Click core to activate voice listener'}
            className="group relative w-56 h-56 sm:w-72 sm:h-72 rounded-full p-2 bg-gradient-to-tr from-red-600 via-rose-600 to-red-950 shadow-[0_0_60px_rgba(220,38,38,0.5)] group-hover:shadow-[0_0_90px_rgba(239,68,68,0.8)] transition-all duration-300 cursor-pointer overflow-hidden border-2 border-red-500/80 active:scale-98"
          >
            {/* Holographic Core Video Asset */}
            <video
              ref={heroVideoRef}
              src={CORE_VIDEO_SRC}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-full filter contrast-125 brightness-110 group-hover:scale-105 transition-transform duration-700"
            />

            {/* Scanline Texture Overlay */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,3,4,0.6)_100%)] pointer-events-none" />

            {/* Targeting Crosshairs & Reticle Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-400/80" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-400/80" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-400/80" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-400/80" />
            </div>

            {/* Center Arc Reactor / Interactive Status Core */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#120406]/85 border border-red-400/70 shadow-[0_0_20px_rgba(239,68,68,0.8)] flex flex-col items-center justify-center transition-all ${
                  isListening || isSpeaking ? 'scale-110' : 'group-hover:scale-105'
                }`}
              >
                {isListening ? (
                  <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-red-300 animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 text-red-300 animate-pulse" />
                ) : isProcessing ? (
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 animate-spin" />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 group-hover:text-red-200 transition-colors" />
                    <div className="absolute w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  </div>
                )}
              </div>
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-x-0 bottom-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-red-300 border border-red-500/40">
                {isListening ? 'Click to Stop' : 'Click to Speak'}
              </span>
            </div>
          </div>
        </div>

        {/* Holographic Status Badge & Audio Frequency Visualizer */}
        <div className="mt-5 text-center space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#140507]/90 border border-red-700/50 text-xs font-mono font-medium text-red-300 shadow-lg shadow-red-950/60">
            <span
              className={`w-2 h-2 rounded-full ${
                isSpeaking
                  ? 'bg-rose-400 animate-pulse'
                  : isProcessing
                  ? 'bg-amber-400 animate-ping'
                  : isListening
                  ? 'bg-red-400 animate-ping'
                  : 'bg-red-500'
              }`}
            />
            <span className="tracking-wider uppercase font-bold">{stateLabel}</span>
            <span className="text-red-800">•</span>
            <span className="text-red-200/90 font-mono">
              {engineMode === 'qwen_ollama'
                ? 'Qwen 2.5 (Offline Engine)'
                : engineMode === 'auto'
                ? 'Dual Hybrid (Gemini + Qwen)'
                : 'Gemini 3.8 Flash (Cloud)'}
            </span>
          </div>

          {/* Subtext Prompt Guidance */}
          <p className="text-xs text-red-300/80 font-mono tracking-wide">
            {stateSubtext}
          </p>

          {/* Audio Waveform Equalizer (Vibrant Dark Red) */}
          {(isListening || isSpeaking) && (
            <div className="flex items-center justify-center gap-1.5 h-6 pt-1">
              {[0.4, 0.8, 1, 0.7, 0.9, 0.5, 0.85, 0.6].map((scale, i) => (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-red-600 to-rose-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                  style={{
                    height: `${Math.max(6, Math.min(24, simulatedLevel * 24 * scale))}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Audio Transcript Display */}
        {transcript && (
          <div className="mt-3 max-w-lg w-full text-center px-4 py-2.5 rounded-xl bg-[#150508]/80 border border-red-800/40 text-xs font-mono text-red-200 animate-in fade-in z-10 shadow-lg">
            <span className="text-red-400 mr-2 uppercase text-[10px] font-bold">Input:</span>
            <span className="italic">"{transcript}"</span>
          </div>
        )}

        {/* Dexter's Spoken Response Readout */}
        {lastSpokenText && !transcript && (
          <div className="mt-3 max-w-xl w-full text-center px-4 py-2 rounded-xl bg-[#120406]/60 border border-red-950/70 text-xs text-red-200/90 font-mono z-10">
            <span className="text-red-400 mr-1.5 font-bold uppercase text-[10px]">Dexter:</span>
            <span>"{lastSpokenText}"</span>
          </div>
        )}
      </div>

      {/* Bottom Diagnostic Strip */}
      <div className="relative pt-4 border-t border-red-950/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-red-400/80 z-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-red-400" />
            <span>Neural Sync: Active</span>
          </span>
          <span className="text-red-950">•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span>Persona: J.A.R.V.I.S. (Polite British)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {engineMode === 'qwen_ollama' ? (
            <span className="text-amber-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              100% Offline Mode Active
            </span>
          ) : (
            <span className="text-red-300/80 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              Cloud Grounded + Offline Qwen Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
