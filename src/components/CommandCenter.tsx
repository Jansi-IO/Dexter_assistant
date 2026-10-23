import React, { useState } from 'react';
import {
  Send,
  Terminal,
  Code,
  FileText,
  Calculator,
  Compass,
  Folder,
  Paintbrush,
  Globe,
  Youtube,
  Github,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  Clock,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Lock,
  Camera,
  Activity,
  Wifi,
  Layers,
  Cpu,
  Moon,
  Zap,
} from 'lucide-react';
import { DexterCommandResponse, DexterAction, LocalBridgeStatus } from '../types/dexter';

interface CommandCenterProps {
  onExecuteCommand: (command: string) => Promise<void>;
  isProcessing: boolean;
  lastResponse: DexterCommandResponse | null;
  bridgeStatus: LocalBridgeStatus;
  onOpenAgentModal: () => void;
  pendingConfirmation: {
    command: string;
    action: DexterAction;
    prompt: string;
  } | null;
  onConfirmPending: (confirmed: boolean) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onExecuteCommand,
  isProcessing,
  lastResponse,
  bridgeStatus,
  onOpenAgentModal,
  pendingConfirmation,
  onConfirmPending,
}) => {
  const [inputCommand, setInputCommand] = useState('');
  const [overwriteConfirmText, setOverwriteConfirmText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim() || isProcessing) return;
    const cmd = inputCommand.trim();
    setInputCommand('');
    onExecuteCommand(cmd);
  };

  const handleQuickAction = (cmd: string) => {
    if (isProcessing) return;
    onExecuteCommand(cmd);
  };

  return (
    <div className="space-y-6">
      {/* Search / Command Input Bar */}
      <div className="bg-[#0e0406]/90 border border-red-950/90 rounded-2xl p-2 sm:p-2.5 shadow-xl shadow-red-950/60 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 text-red-400 pl-2">
            <Terminal className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            disabled={isProcessing}
            placeholder="Type command or voice phrase (e.g. 'open vscode', 'read file C:\Dexter\notes.txt', 'clean temp files')..."
            className="flex-1 bg-transparent px-2 py-2 text-sm sm:text-base text-red-100 placeholder-red-400/40 focus:outline-none font-mono"
          />

          <button
            type="submit"
            disabled={!inputCommand.trim() || isProcessing}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              inputCommand.trim() && !isProcessing
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-900/40 cursor-pointer font-mono'
                : 'bg-[#150508] text-red-400/40 cursor-not-allowed border border-red-950'
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-red-300" />
            ) : (
              <>
                <span>Run</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Confirmation Banner if a destructive/file action needs user verification */}
      {pendingConfirmation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-red-100 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold text-amber-300">Action Confirmation Required</h4>
              <p className="text-xs sm:text-sm text-red-200">
                {pendingConfirmation.prompt ||
                  `Dexter is preparing to execute: ${pendingConfirmation.action.type} -> ${pendingConfirmation.action.target}`}
              </p>

              {pendingConfirmation.prompt?.includes('OVERWRITE') && (
                <div className="pt-2">
                  <label className="block text-xs text-red-300/80 mb-1">
                    Type <code className="text-amber-300 font-mono font-bold">OVERWRITE</code> to proceed:
                  </label>
                  <input
                    type="text"
                    value={overwriteConfirmText}
                    onChange={(e) => setOverwriteConfirmText(e.target.value)}
                    placeholder="OVERWRITE"
                    className="bg-[#150508] border border-amber-600/50 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-200 focus:outline-none uppercase w-48"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    if (
                      pendingConfirmation.prompt?.includes('OVERWRITE') &&
                      overwriteConfirmText !== 'OVERWRITE'
                    ) {
                      return;
                    }
                    setOverwriteConfirmText('');
                    onConfirmPending(true);
                  }}
                  disabled={
                    pendingConfirmation.prompt?.includes('OVERWRITE') &&
                    overwriteConfirmText !== 'OVERWRITE'
                  }
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm & Execute
                </button>
                <button
                  onClick={() => {
                    setOverwriteConfirmText('');
                    onConfirmPending(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#150508] hover:bg-red-950 text-red-300 transition-colors border border-red-950"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Live Execution Display + System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Last Dexter Command & Result */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Command Execution Panel */}
          <div className="bg-[#0e0406]/80 border border-red-950/90 rounded-2xl p-5 sm:p-6 backdrop-blur shadow-xl shadow-red-950/40">
            <div className="flex items-center justify-between pb-4 border-b border-red-950/90 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-200 uppercase tracking-wider font-mono">
                  Dexter Intelligence Directive
                </h3>
              </div>
              <span className="text-xs text-red-400/80 font-mono">
                Model: gemini-3.8-flash / qwen
              </span>
            </div>

            {lastResponse ? (
              <div className="space-y-4">
                {/* Spoken feedback */}
                <div className="p-4 rounded-xl bg-[#140507]/90 border border-red-950/90">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-700/40 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-300 font-mono">{lastResponse.title}</span>
                        <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-800/60">
                          {lastResponse.intent}
                        </span>
                      </div>
                      <p className="text-sm text-red-100 mt-1 font-medium leading-relaxed font-mono">
                        "{lastResponse.spokenResponse}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Executed Action Details */}
                {lastResponse.action && lastResponse.action.type !== 'none' && (
                  <div className="p-3.5 rounded-xl bg-[#120406] border border-red-950 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-red-300">
                      <span className="text-red-400 font-bold">Action:</span>
                      <span className="font-semibold text-red-100">{lastResponse.action.type}</span>
                      <span className="text-red-700">→</span>
                      <span className="text-red-300 truncate max-w-xs">{lastResponse.action.target}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-red-400 font-mono font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                      <span>{bridgeStatus.online ? 'Executed on PC' : 'Simulated Host'}</span>
                    </div>
                  </div>
                )}

                {/* Generated script preview if any */}
                {lastResponse.scriptGenerated && (
                  <div className="p-4 rounded-xl bg-[#120406] border border-red-950">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-red-400 flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5" />
                        Generated {lastResponse.scriptGenerated.language} Script
                      </span>
                      <span className="text-xs text-red-400/80 font-mono">{lastResponse.scriptGenerated.explanation}</span>
                    </div>
                    <pre className="text-xs font-mono bg-[#0a0304] p-3 rounded-lg text-red-200 overflow-x-auto border border-red-950">
                      <code>{lastResponse.scriptGenerated.code}</code>
                    </pre>
                  </div>
                )}

                {/* Follow up suggestions */}
                {lastResponse.suggestedFollowUps && lastResponse.suggestedFollowUps.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-red-400/80 mb-2 font-mono">
                      Suggested Next Directives:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {lastResponse.suggestedFollowUps.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(suggestion)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#150508] hover:bg-red-950/60 text-red-300 hover:text-red-100 border border-red-950 hover:border-red-700/60 transition-all text-left font-mono"
                        >
                          <ArrowRight className="w-3 h-3 text-red-400" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 mx-auto">
                  <Terminal className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-red-200 font-mono">Awaiting Voice or Text Instruction</h4>
                <p className="text-xs text-red-400/70 max-w-sm mx-auto font-mono">
                  Say "Dexter, open Visual Studio Code" or select a quick action below.
                </p>
              </div>
            )}
          </div>

          {/* Quick PC Command Launcher */}
          <div className="bg-[#0e0406]/80 border border-red-950/90 rounded-2xl p-5 sm:p-6 backdrop-blur shadow-xl shadow-red-950/40">
            <h3 className="text-sm font-semibold text-red-200 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-400" />
              Direct PC Quick Launchers
            </h3>
            <p className="text-xs text-red-400/70 mb-4 font-mono">
              Native applications and utilities wired directly to Dexter's local engine.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleQuickAction('open vscode')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Code className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">VS Code</div>
                  <div className="text-[10px] text-red-400/60 font-mono">code</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('calculator')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Calculator className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Calculator</div>
                  <div className="text-[10px] text-red-400/60 font-mono">calc.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('notepad')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <FileText className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Notepad</div>
                  <div className="text-[10px] text-red-400/60 font-mono">notepad.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('file explorer')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Folder className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Explorer</div>
                  <div className="text-[10px] text-red-400/60 font-mono">explorer.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('command prompt')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Terminal className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">CMD Prompt</div>
                  <div className="text-[10px] text-red-400/60 font-mono">cmd.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('paint')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Paintbrush className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">MS Paint</div>
                  <div className="text-[10px] text-red-400/60 font-mono">mspaint.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('github')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Github className="w-4 h-4 text-red-300 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">GitHub</div>
                  <div className="text-[10px] text-red-400/60 font-mono">github.com</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('youtube')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Youtube className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">YouTube</div>
                  <div className="text-[10px] text-red-400/60 font-mono">youtube.com</div>
                </div>
              </button>
            </div>
          </div>

          {/* PC System Controls & Routine Hygiene Deck */}
          <div className="bg-[#0e0406]/80 border border-red-950/90 rounded-2xl p-5 sm:p-6 backdrop-blur shadow-xl shadow-red-950/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-red-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-red-400" />
                Workstation Control & Diagnostics Deck
              </h3>
              <span className="text-xs text-red-400/70 font-mono">Stark OS Telemetry</span>
            </div>
            <p className="text-xs text-red-400/70 mb-4 font-mono">
              Direct OS routine triggers for workstation security, screen capture, performance, and cache management.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleQuickAction('lock pc')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Lock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Lock Station</div>
                  <div className="text-[10px] text-red-400/60 font-mono">LockWorkStation</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('screenshot')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Camera className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Screen Capture</div>
                  <div className="text-[10px] text-red-400/60 font-mono">Snipping Tool</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('task manager')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Activity className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Task Manager</div>
                  <div className="text-[10px] text-red-400/60 font-mono">taskmgr.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('clean temp files and flush dns')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <RefreshCw className="w-4 h-4 text-rose-400 group-hover:rotate-180 transition-transform duration-500" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Flush DNS & Temp</div>
                  <div className="text-[10px] text-red-400/60 font-mono">Clear Cache</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('check network ping and connectivity')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Wifi className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Ping & Latency</div>
                  <div className="text-[10px] text-red-400/60 font-mono">Test 8.8.8.8</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('check memory and cpu load')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Cpu className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Hardware Load</div>
                  <div className="text-[10px] text-red-400/60 font-mono">CPU & RAM</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('mute volume')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <VolumeX className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">Toggle Mute</div>
                  <div className="text-[10px] text-red-400/60 font-mono">Audio Master</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('sleep pc')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#150508] hover:bg-red-950/60 border border-red-950 hover:border-red-700/60 text-left transition-all group"
              >
                <Moon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-100 font-mono">System Sleep</div>
                  <div className="text-[10px] text-red-400/60 font-mono">Low Power Mode</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Local PC Bridge Status & Quick Guide */}
        <div className="space-y-6">
          {/* Bridge connection card */}
          <div className="bg-[#0e0406]/80 border border-red-950/90 rounded-2xl p-5 backdrop-blur shadow-xl shadow-red-950/40">
            <div className="flex items-center justify-between pb-3 border-b border-red-950/90 mb-3">
              <span className="text-xs font-semibold text-red-200 uppercase tracking-wider font-mono">
                PC Companion Bridge
              </span>
              <span
                className={`flex items-center gap-1.5 text-xs font-medium font-mono ${
                  bridgeStatus.online ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    bridgeStatus.online ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {bridgeStatus.online ? 'Online (8765)' : 'Virtual Host'}
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between text-red-400/70">
                <span>Target System:</span>
                <span className="text-red-100">{bridgeStatus.platform}</span>
              </div>
              <div className="flex justify-between text-red-400/70">
                <span>Agent Engine:</span>
                <span className="text-red-100">{bridgeStatus.assistant} {bridgeStatus.version}</span>
              </div>
              <div className="flex justify-between text-red-400/70">
                <span>Voice Recognition:</span>
                <span className="text-red-100">
                  {bridgeStatus.voiceInput ? 'Web Speech API' : 'Microphone Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-red-400/70">
                <span>Speech Audio (TTS):</span>
                <span className="text-red-100">J.A.R.V.I.S. British Engine</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-red-950">
              <button
                onClick={onOpenAgentModal}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#150508] hover:bg-red-950 text-red-200 text-xs font-medium transition-colors border border-red-900/60 font-mono cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>Configure Local PC Agent</span>
              </button>
            </div>
          </div>

          {/* Quick Voice Phrases Card */}
          <div className="bg-[#0e0406]/80 border border-red-950/90 rounded-2xl p-5 backdrop-blur shadow-xl shadow-red-950/40">
            <h4 className="text-xs font-semibold text-red-200 uppercase tracking-wider mb-2 font-mono">
              Popular Voice Commands
            </h4>
            <p className="text-xs text-red-400/70 mb-3 font-mono">
              Dexter recognizes conversational phrases naturally:
            </p>

            <ul className="space-y-2 text-xs font-mono">
              <li
                onClick={() => handleQuickAction('open vscode')}
                className="p-2 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 cursor-pointer text-red-200/90 hover:text-red-100 transition-colors"
              >
                <span className="text-red-400 font-semibold">"Hey Dexter,</span> open Visual Studio Code"
              </li>
              <li
                onClick={() => handleQuickAction('start my workday')}
                className="p-2 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 cursor-pointer text-red-200/90 hover:text-red-100 transition-colors"
              >
                <span className="text-red-400 font-semibold">"Dexter,</span> start my workday routine"
              </li>
              <li
                onClick={() => handleQuickAction('clean temp files')}
                className="p-2 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 cursor-pointer text-red-200/90 hover:text-red-100 transition-colors"
              >
                <span className="text-red-400 font-semibold">"Hey Dexter,</span> clean temp files and flush DNS"
              </li>
              <li
                onClick={() => handleQuickAction('what time is it')}
                className="p-2 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 cursor-pointer text-red-200/90 hover:text-red-100 transition-colors"
              >
                <span className="text-red-400 font-semibold">"Dexter,</span> what time is it?"
              </li>
              <li
                onClick={() => handleQuickAction('read file C:\\Dexter\\notes.txt')}
                className="p-2 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 cursor-pointer text-red-200/90 hover:text-red-100 transition-colors"
              >
                <span className="text-red-400 font-semibold">"Hey Dexter,</span> read file C:\Dexter\notes.txt"
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
