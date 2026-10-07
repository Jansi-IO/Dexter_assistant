import React, { useState } from 'react';
import {
  Laptop,
  Download,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Radio,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { LocalBridgeStatus } from '../types/dexter';

interface DesktopCompanionGuideProps {
  bridgeStatus: LocalBridgeStatus;
  onRefreshBridge: () => void;
  onClose?: () => void;
}

export const DesktopCompanionGuide: React.FC<DesktopCompanionGuideProps> = ({
  bridgeStatus,
  onRefreshBridge,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const installCommand =
    'pip install google-genai python-dotenv SpeechRecognition pyttsx3 flask flask-cors';

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(installCommand);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleDownloadAgent = async () => {
    try {
      const res = await fetch('/api/dexter/agent-source');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/x-python;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dexter_agent.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download agent file:', e);
    }
  };

  const handleCopyCode = async () => {
    try {
      const res = await fetch('/api/dexter/agent-source');
      const text = await res.text();
      navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  const handleTestPing = async () => {
    setIsPinging(true);
    await onRefreshBridge();
    setIsPinging(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-2xl space-y-6">
      {/* Title & Close */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Dexter Local PC Bridge & Companion Setup
            </h3>
            <p className="text-xs text-slate-400">
              Wire this web dashboard directly to your local PC for real desktop automation.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Live Bridge Ping Status */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          bridgeStatus.online
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : 'bg-amber-950/20 border-amber-600/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              bridgeStatus.online ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span>Local Bridge Status:</span>
              <span
                className={`font-mono uppercase ${
                  bridgeStatus.online ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {bridgeStatus.online ? 'CONNECTED (127.0.0.1:8765)' : 'SANDBOX / STANDBY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {bridgeStatus.online
                ? `Running on ${bridgeStatus.platform}. Commands execute directly on your PC.`
                : 'Local Python agent not detected. Operating in simulated virtual host mode.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleTestPing}
          disabled={isPinging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>Test Connection</span>
        </button>
      </div>

      {/* 3 Step Setup Guide */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          How to connect in 2 minutes:
        </h4>

        {/* Step 1 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-[10px]">
                1
              </span>
              Install Python dependencies
            </span>
            <button
              onClick={handleCopyInstall}
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono"
            >
              {copiedInstall ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedInstall ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-slate-300 border border-slate-800 select-all overflow-x-auto">
            {installCommand}
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-[10px]">
                2
              </span>
              Download Dexter Agent Script
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownloadAgent}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download dexter_agent.py</span>
              </button>
            </div>
          </div>
          <p className="text-slate-400">
            This enhanced Python script contains your full command set, local voice recognition with microphone, local speech playback, and an HTTP bridge server on port 8765.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <span className="font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-[10px]">
              3
            </span>
            Launch Dexter in PowerShell or Terminal
          </span>
          <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-slate-300 border border-slate-800">
            python dexter_agent.py
          </div>
          <p className="text-slate-400">
            Once running, refresh this page or click "Test Connection". Commands sent from this dashboard or your voice will execute directly on your physical PC!
          </p>
        </div>
      </div>
    </div>
  );
};
