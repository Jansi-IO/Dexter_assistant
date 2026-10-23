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
  Laptop,
  Globe,
  Sparkles,
  LogIn,
  LogOut,
  User as UserIcon,
  MessageSquare,
  Box,
  Dna,
} from 'lucide-react';
import { LocalBridgeStatus } from '../types/dexter';
import { User } from 'firebase/auth';

export type NavTab =
  | 'command'
  | 'chatbot'
  | 'three3d'
  | 'bioscience'
  | 'live'
  | 'grounding'
  | 'routines'
  | 'scripts'
  | 'logs'
  | 'agent';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  bridgeStatus: LocalBridgeStatus;
  voiceMuted: boolean;
  setVoiceMuted: (muted: boolean) => void;
  osType: 'windows' | 'mac' | 'linux';
  setOsType: (os: 'windows' | 'mac' | 'linux') => void;
  onOpenAgentModal: () => void;
  currentUser: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  firestoreConnected: boolean;
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
  currentUser,
  onSignIn,
  onSignOut,
  firestoreConnected,
}) => {
  return (
    <header className="border-b border-red-950/80 bg-[#0a0304]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-red-950 text-white shadow-lg shadow-red-950/80 border border-red-500/40">
            <Terminal className="w-5 h-5 stroke-[2.5]" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0304] ${
                bridgeStatus.online ? 'bg-red-400 animate-pulse' : 'bg-amber-400'
              }`}
              title={bridgeStatus.online ? 'Local PC Agent Connected' : 'Virtual Sandbox Host'}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-red-100 font-mono">DEXTER</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60">
                MARK VII
              </span>
            </div>
            <p className="text-xs text-red-300/70 hidden sm:block font-mono">Iron Man Voice Assistant & Automation</p>
          </div>
        </div>

        {/* Center navigation tabs */}
        <nav className="flex items-center gap-1 bg-[#120406]/90 p-1 rounded-xl border border-red-950/90 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('command')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'command'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            <span>Command Center</span>
          </button>

          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'chatbot'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
            <span>Gemini Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('three3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'three3d'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-red-400" />
            <span>3D Hologram</span>
          </button>

          <button
            onClick={() => setActiveTab('bioscience')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'bioscience'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-rose-400" />
            <span>Bioscience</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'live'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>Live Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('grounding')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'grounding'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Grounding & Media</span>
          </button>

          <button
            onClick={() => setActiveTab('routines')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'routines'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-red-400" />
            <span>Routines</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'scripts'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-red-400" />
            <span>Scripts</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
              activeTab === 'logs'
                ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm shadow-red-950/60 font-semibold'
                : 'text-red-300/70 hover:text-red-100 hover:bg-red-950/40'
            }`}
          >
            <ListRestart className="w-3.5 h-3.5 text-red-400" />
            <span>Logs</span>
          </button>
        </nav>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* OS Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-[#120406] border border-red-950/90 px-2 py-1 rounded-lg text-xs text-red-300/80">
            <Laptop className="w-3.5 h-3.5 text-red-400" />
            <select
              value={osType}
              onChange={(e) => setOsType(e.target.value as any)}
              className="bg-transparent text-red-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="windows" className="bg-[#120406] text-red-200">Windows</option>
              <option value="mac" className="bg-[#120406] text-red-200">macOS</option>
              <option value="linux" className="bg-[#120406] text-red-200">Linux</option>
            </select>
          </div>

          {/* Local Bridge Link indicator */}
          <button
            onClick={onOpenAgentModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              bridgeStatus.online
                ? 'bg-red-950/70 text-red-300 border-red-700/80 hover:bg-red-900/60'
                : 'bg-[#120406] text-red-300/60 border-red-950 hover:text-red-200 hover:border-red-800'
            }`}
            title="Desktop Companion Agent Status"
          >
            <Radio className={`w-3.5 h-3.5 ${bridgeStatus.online ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">
              {bridgeStatus.online ? 'PC Connected' : 'PC Agent'}
            </span>
          </button>

          {/* Voice Mute/Unmute */}
          <button
            onClick={() => setVoiceMuted(!voiceMuted)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              voiceMuted
                ? 'bg-[#120406] border-red-950 text-red-500/60 hover:text-red-400'
                : 'bg-red-950/50 border-red-700/50 text-red-300 hover:bg-red-900/50'
            }`}
            title={voiceMuted ? 'Voice audio muted' : 'Voice audio enabled'}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Google Firebase Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-1.5 p-1 pr-2 bg-[#120406] border border-red-950 rounded-lg text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-red-400" />
                )}
                <span className="hidden md:inline font-medium text-red-200 max-w-[90px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'User'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="Firestore Synced" />
              </div>

              <button
                onClick={onSignOut}
                className="p-1.5 text-red-400/80 hover:text-red-200 rounded-lg hover:bg-red-950/40 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white transition-all cursor-pointer shadow-sm shadow-red-950/60"
              title="Sign in with Google to sync Firestore routines & scripts"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
