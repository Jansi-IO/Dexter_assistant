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
    'pip install google-genai python-dotenv SpeechRecognition pyttsx3 pyaudio flask flask-cors requests';

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
    <div className="bg-[#0e0406]/95 border border-red-950/90 rounded-2xl p-6 backdrop-blur shadow-2xl space-y-6">
      {/* Title & Close */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-red-950/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-700/50 flex items-center justify-center text-red-400">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-100 font-mono">
              Dexter Local PC Bridge & Companion Setup
            </h3>
            <p className="text-xs text-red-400/80 font-mono">
              Wire this web dashboard directly to your local PC for real desktop automation.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-red-400/70 hover:text-red-200 rounded-lg hover:bg-red-950/40"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Live Bridge Ping Status */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          bridgeStatus.online
            ? 'bg-red-950/40 border-red-700/60'
            : 'bg-[#150508] border-red-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              bridgeStatus.online ? 'bg-red-500 animate-ping' : 'bg-amber-400'
            }`}
          />
          <div>
            <div className="text-xs font-semibold text-red-200 flex items-center gap-2 font-mono">
              <span>Local Bridge Status:</span>
              <span
                className={`font-mono uppercase font-bold ${
                  bridgeStatus.online ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                {bridgeStatus.online ? 'CONNECTED (127.0.0.1:8765)' : 'SANDBOX / STANDBY'}
              </span>
            </div>
            <p className="text-[11px] text-red-400/70 mt-0.5 font-mono">
              {bridgeStatus.online
                ? `Running on ${bridgeStatus.platform}. Commands execute directly on your PC.`
                : 'Local Python agent not detected. Operating in simulated virtual host mode.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleTestPing}
          disabled={isPinging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#150508] hover:bg-red-950 text-red-200 border border-red-900/60 transition-colors self-start sm:self-center font-mono cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>Test Connection</span>
        </button>
      </div>

      {/* 4 Step Setup Guide */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 font-mono">
          How to connect in 2 minutes:
        </h4>

        {/* Step 1 */}
        <div className="p-4 rounded-xl bg-[#140507]/90 border border-red-950/90 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-red-100 flex items-center gap-2 font-mono">
              <span className="w-5 h-5 rounded-full bg-red-950 border border-red-700/60 text-red-300 flex items-center justify-center font-mono text-[10px]">
                1
              </span>
              Install Python dependencies
            </span>
            <button
              onClick={handleCopyInstall}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-mono cursor-pointer"
            >
              {copiedInstall ? <Check className="w-3 h-3 text-red-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedInstall ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-[#0a0304] p-2.5 rounded-lg font-mono text-red-300 border border-red-950 select-all overflow-x-auto">
            {installCommand}
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-xl bg-[#140507]/90 border border-red-950/90 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-red-100 flex items-center gap-2 font-mono">
              <span className="w-5 h-5 rounded-full bg-red-950 border border-red-700/60 text-red-300 flex items-center justify-center font-mono text-[10px]">
                2
              </span>
              Download Dexter Agent Script
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] text-red-400/80 hover:text-red-200 font-mono cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-red-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownloadAgent}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs shadow-sm shadow-red-950/60 cursor-pointer font-mono"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download dexter_agent.py</span>
              </button>
            </div>
          </div>
          <p className="text-red-300/80 font-mono">
            This Python companion gives Dexter his physical desktop presence and J.A.R.V.I.S. persona. It features continuous background wake-word listening ("Dexter" or "Hey Dexter"), British text-to-speech audio, local PC automation, and built-in offline support via local <strong>Qwen Ollama</strong> (<code className="text-red-400">ollama run qwen2.5</code>) when internet is disconnected.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-xl bg-[#140507]/90 border border-red-950/90 space-y-2 text-xs">
          <span className="font-semibold text-red-100 flex items-center gap-2 font-mono">
            <span className="w-5 h-5 rounded-full bg-red-950 border border-red-700/60 text-red-300 flex items-center justify-center font-mono text-[10px]">
              3
            </span>
            Add Gemini API Key (.env file)
          </span>
          <p className="text-red-300/80 font-mono">
            Create a file named <code className="text-red-400 bg-[#0a0304] px-1 py-0.5 rounded font-mono border border-red-950">.env</code> in the same folder as <code className="text-red-400 bg-[#0a0304] px-1 py-0.5 rounded font-mono border border-red-950">dexter_agent.py</code>:
          </p>
          <div className="bg-[#0a0304] p-2.5 rounded-lg font-mono text-red-400 border border-red-950 select-all">
            GEMINI_API_KEY="AIzaSy...your_gemini_key..."
          </div>
          <p className="text-[11px] text-red-400/70 font-mono">
            Uses Google's recommended <code className="text-red-300">client.chats.create()</code> and <code className="text-red-300">chat.send_message()</code> for smooth multi-turn memory without AFC warnings.
          </p>
        </div>

        {/* Step 4 */}
        <div className="p-4 rounded-xl bg-[#140507]/90 border border-red-950/90 space-y-2 text-xs">
          <span className="font-semibold text-red-100 flex items-center gap-2 font-mono">
            <span className="w-5 h-5 rounded-full bg-red-950 border border-red-700/60 text-red-300 flex items-center justify-center font-mono text-[10px]">
              4
            </span>
            Launch Dexter in PowerShell or Terminal
          </span>
          <div className="bg-[#0a0304] p-2.5 rounded-lg font-mono text-red-200 border border-red-950">
            python dexter_agent.py
          </div>
          <p className="text-red-300/80 font-mono">
            Once running, click "Test Connection" above. Commands sent from this dashboard or spoken into your microphone will execute directly on your PC!
          </p>
        </div>
      </div>
    </div>
  );
};
