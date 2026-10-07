import React from 'react';
import {
  Terminal,
  Cpu,
  Layers,
  Code2,
  ListRestart,
  Volume2,
  VolumeX,
  Radio,
  Download,
  Laptop,
} from 'lucide-react';
import { LocalBridgeStatus } from '../types/dexter';

export type NavTab = 'command' | 'routines' | 'scripts' | 'logs' | 'agent';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  bridgeStatus: LocalBridgeStatus;
  voiceMuted: boolean;
  setVoiceMuted: (muted: boolean) => void;
  osType: 'windows' | 'mac' | 'linux';
  setOsType: (os: 'windows' | 'mac' | 'linux') => void;
  onOpenAgentModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  bridgeStatus,
  voiceMuted,
  setVoiceMuted,
  osType,
  setOsType,
  onOpenAgentModal,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Terminal className="w-5 h-5 stroke-[2.5]" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                bridgeStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
              title={bridgeStatus.online ? 'Local PC Agent Connected' : 'Virtual Sandbox Host'}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-slate-100">DEXTER</span>
              <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60">
                v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">PC Voice Assistant & Task Automation</p>
          </div>
        </div>

        {/* Center navigation tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('command')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'command'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>

          <button
            onClick={() => setActiveTab('routines')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'routines'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Routines</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'scripts'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Script Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'logs'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ListRestart className="w-3.5 h-3.5" />
            <span>Activity Log</span>
          </button>
        </nav>

        {/* Right action controls */}
        <div className="flex items-center gap-2.5">
          {/* OS Selector */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs text-slate-400">
            <Laptop className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={osType}
              onChange={(e) => setOsType(e.target.value as any)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="windows" className="bg-slate-900 text-slate-200">Windows</option>
              <option value="mac" className="bg-slate-900 text-slate-200">macOS</option>
              <option value="linux" className="bg-slate-900 text-slate-200">Linux</option>
            </select>
          </div>

          {/* Local Bridge Link indicator */}
          <button
            onClick={onOpenAgentModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              bridgeStatus.online
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80 hover:bg-emerald-900/60'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
            title="Desktop Companion Agent Status"
          >
            <Radio className={`w-3.5 h-3.5 ${bridgeStatus.online ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">
              {bridgeStatus.online ? 'PC Connected' : 'PC Agent'}
            </span>
          </button>

          {/* Voice Mute/Unmute */}
          <button
            onClick={() => setVoiceMuted(!voiceMuted)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              voiceMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title={voiceMuted ? 'Voice audio muted' : 'Voice audio enabled'}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
