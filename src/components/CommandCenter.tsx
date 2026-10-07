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
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-xl shadow-slate-950/40 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 text-emerald-400 pl-2">
            <Terminal className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            disabled={isProcessing}
            placeholder="Type command or voice phrase (e.g. 'open vscode', 'read file C:\Dexter\notes.txt', 'clean temp files')..."
            className="flex-1 bg-transparent px-2 py-2 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputCommand.trim() || isProcessing}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              inputCommand.trim() && !isProcessing
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
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
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-slate-200 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold text-amber-300">Action Confirmation Required</h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {pendingConfirmation.prompt ||
                  `Dexter is preparing to execute: ${pendingConfirmation.action.type} -> ${pendingConfirmation.action.target}`}
              </p>

              {pendingConfirmation.prompt?.includes('OVERWRITE') && (
                <div className="pt-2">
                  <label className="block text-xs text-slate-400 mb-1">
                    Type <code className="text-amber-300 font-mono font-bold">OVERWRITE</code> to proceed:
                  </label>
                  <input
                    type="text"
                    value={overwriteConfirmText}
                    onChange={(e) => setOverwriteConfirmText(e.target.value)}
                    placeholder="OVERWRITE"
                    className="bg-slate-900 border border-amber-600/50 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-200 focus:outline-none uppercase w-48"
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
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
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
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Dexter Intelligence Engine
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Model: gemini-3.8-flash
              </span>
            </div>

            {lastResponse ? (
              <div className="space-y-4">
                {/* Spoken feedback */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-400">{lastResponse.title}</span>
                        <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {lastResponse.intent}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 mt-1 font-medium leading-relaxed">
                        "{lastResponse.spokenResponse}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Executed Action Details */}
                {lastResponse.action && lastResponse.action.type !== 'none' && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-emerald-400">Action:</span>
                      <span className="font-semibold text-slate-100">{lastResponse.action.type}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-300 truncate max-w-xs">{lastResponse.action.target}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{bridgeStatus.online ? 'Executed on PC' : 'Simulated Host'}</span>
                    </div>
                  </div>
                )}

                {/* Generated script preview if any */}
                {lastResponse.scriptGenerated && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5" />
                        Generated {lastResponse.scriptGenerated.language} Script
                      </span>
                      <span className="text-xs text-slate-400">{lastResponse.scriptGenerated.explanation}</span>
                    </div>
                    <pre className="text-xs font-mono bg-slate-900/90 p-3 rounded-lg text-slate-300 overflow-x-auto border border-slate-800/80">
                      <code>{lastResponse.scriptGenerated.code}</code>
                    </pre>
                  </div>
                )}

                {/* Follow up suggestions */}
                {lastResponse.suggestedFollowUps && lastResponse.suggestedFollowUps.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Suggested Next Commands:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {lastResponse.suggestedFollowUps.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(suggestion)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/30 transition-all text-left"
                        >
                          <span>{suggestion}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                <Terminal className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">Dexter is standing by for your first command or voice request.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try saying "Open Visual Studio Code" or select a quick action below.
                </p>
              </div>
            )}
          </div>

          {/* Quick PC Command Launcher */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Direct PC Quick Launchers
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Native applications and utilities wired directly to Dexter's local engine.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleQuickAction('open vscode')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left transition-all group"
              >
                <Code className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">VS Code</div>
                  <div className="text-[10px] text-slate-400 font-mono">code</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('calculator')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left transition-all group"
              >
                <Calculator className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Calculator</div>
                  <div className="text-[10px] text-slate-400 font-mono">calc.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('notepad')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left transition-all group"
              >
                <FileText className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Notepad</div>
                  <div className="text-[10px] text-slate-400 font-mono">notepad.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('file explorer')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left transition-all group"
              >
                <Folder className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Explorer</div>
                  <div className="text-[10px] text-slate-400 font-mono">explorer.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('command prompt')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left transition-all group"
              >
                <Terminal className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">CMD Prompt</div>
                  <div className="text-[10px] text-slate-400 font-mono">cmd.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('paint')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left transition-all group"
              >
                <Paintbrush className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">MS Paint</div>
                  <div className="text-[10px] text-slate-400 font-mono">mspaint.exe</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('github')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left transition-all group"
              >
                <Github className="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">GitHub</div>
                  <div className="text-[10px] text-slate-400 font-mono">github.com</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('youtube')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left transition-all group"
              >
                <Youtube className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">YouTube</div>
                  <div className="text-[10px] text-slate-400 font-mono">youtube.com</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Local PC Bridge Status & Quick Guide */}
        <div className="space-y-6">
          {/* Bridge connection card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                PC Companion Bridge
              </span>
              <span
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  bridgeStatus.online ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    bridgeStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {bridgeStatus.online ? 'Online (8765)' : 'Virtual Host'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Target System:</span>
                <span className="font-mono text-slate-200">{bridgeStatus.platform}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Agent Engine:</span>
                <span className="font-mono text-slate-200">{bridgeStatus.assistant} {bridgeStatus.version}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Voice Recognition:</span>
                <span className="text-slate-200 font-mono">
                  {bridgeStatus.voiceInput ? 'Web Speech API' : 'Microphone Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Speech Audio (TTS):</span>
                <span className="text-slate-200 font-mono">Gemini Flash TTS</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={onOpenAgentModal}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Configure Local PC Agent</span>
              </button>
            </div>
          </div>

          {/* Quick Voice Phrases Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Popular Voice Commands
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Dexter recognizes conversational phrases naturally:
            </p>

            <ul className="space-y-2 text-xs">
              <li
                onClick={() => handleQuickAction('open vscode')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer text-slate-300 hover:text-emerald-300 transition-colors"
              >
                "Dexter, open Visual Studio Code"
              </li>
              <li
                onClick={() => handleQuickAction('start my workday')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer text-slate-300 hover:text-emerald-300 transition-colors"
              >
                "Dexter, start my workday routine"
              </li>
              <li
                onClick={() => handleQuickAction('clean temp files')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer text-slate-300 hover:text-emerald-300 transition-colors"
              >
                "Dexter, clean temp files and flush DNS"
              </li>
              <li
                onClick={() => handleQuickAction('what time is it')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer text-slate-300 hover:text-emerald-300 transition-colors"
              >
                "Dexter, what time is it?"
              </li>
              <li
                onClick={() => handleQuickAction('read file C:\\Dexter\\notes.txt')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer text-slate-300 hover:text-emerald-300 transition-colors"
              >
                "Dexter, read file C:\Dexter\notes.txt"
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
