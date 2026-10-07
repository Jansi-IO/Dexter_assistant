import React, { useState } from 'react';
import {
  Code2,
  Sparkles,
  Play,
  Copy,
  Check,
  Download,
  Terminal,
  Shield,
  FileCode,
  FileText,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { AutomationScript, GeneratedScript } from '../types/dexter';
import { generateAutomationScript } from '../services/dexterApi';

interface ScriptStudioProps {
  scripts: AutomationScript[];
  onExecuteScript: (script: AutomationScript | GeneratedScript) => Promise<void>;
  osType: 'windows' | 'mac' | 'linux';
}

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  scripts,
  onExecuteScript,
  osType,
}) => {
  const [selectedScript, setSelectedScript] = useState<AutomationScript>(scripts[0]);
  const [promptInput, setPromptInput] = useState('');
  const [promptLanguage, setPromptLanguage] = useState<'python' | 'powershell' | 'bash' | 'batch'>('python');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedScript | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await generateAutomationScript(promptInput.trim(), promptLanguage, osType);
      setGeneratedResult(result);
    } catch (err) {
      console.error('Failed to generate script:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = (title: string, code: string, lang: string) => {
    const extensions: Record<string, string> = {
      python: '.py',
      powershell: '.ps1',
      bash: '.sh',
      batch: '.bat',
    };
    const ext = extensions[lang] || '.txt';
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}${ext}`;

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunActive = async () => {
    const target = generatedResult || selectedScript;
    if (!target) return;
    setIsRunning(true);
    try {
      await onExecuteScript(target);
    } finally {
      setIsRunning(false);
    }
  };

  const activeScript = generatedResult || selectedScript;

  return (
    <div className="space-y-6">
      {/* AI Script Generator Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">AI Custom Script Architect</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mb-4">
          Describe any routine PC task in plain English. Dexter will write, test, and safely format the automation script.
        </p>

        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. 'Organize my Downloads folder by file type (Images, Docs, Zip)' or 'Flush network routes and ping test'"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center gap-2">
              <select
                value={promptLanguage}
                onChange={(e) => setPromptLanguage(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-300 focus:outline-none"
              >
                <option value="python">Python</option>
                <option value="powershell">PowerShell</option>
                <option value="bash">Bash</option>
                <option value="batch">Windows Batch</option>
              </select>

              <button
                type="submit"
                disabled={!promptInput.trim() || isGenerating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex-shrink-0"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Writing Script...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Script</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Studio View: Script Library Sidebar + Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Script Library List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Automation Library ({scripts.length} scripts)
            </h3>

            <div className="space-y-2">
              {scripts.map((script) => {
                const isSelected = !generatedResult && selectedScript.id === script.id;

                return (
                  <div
                    key={script.id}
                    onClick={() => {
                      setGeneratedResult(null);
                      setSelectedScript(script);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {script.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 uppercase">
                        {script.language}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{script.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safety & Execution Policy card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 backdrop-blur">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Safe Execution Sandbox</span>
            </div>
            <p className="text-slate-400">
              Dexter inspects automation scripts for file deletion, system shutoffs, and locked resources before dispatching to the PC agent.
            </p>
          </div>
        </div>

        {/* Right: Code Viewer & Action Bar (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeScript ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur flex flex-col">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-100">
                      {'title' in activeScript && activeScript.title ? activeScript.title : 'Generated PC Automation'}
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {activeScript.language}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {'description' in activeScript ? activeScript.description : activeScript.explanation}
                  </p>
                </div>

                {/* Actions: Run, Copy, Download */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(activeScript.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleDownloadCode(
                        'title' in activeScript && activeScript.title ? activeScript.title : 'dexter_script',
                        activeScript.code,
                        activeScript.language
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                    title="Download script file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={handleRunActive}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    {isRunning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isRunning ? 'Running...' : 'Run on PC'}</span>
                  </button>
                </div>
              </div>

              {/* Safety & Dependencies Bar */}
              {activeScript.dependencies && activeScript.dependencies.length > 0 && (
                <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="font-semibold text-slate-300">Requirements:</span>
                    <span className="font-mono text-emerald-300">
                      {activeScript.dependencies.join(', ')}
                    </span>
                  </div>
                  {activeScript.safetyNotes && (
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="line-clamp-1">{activeScript.safetyNotes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Code viewer with line numbers */}
              <div className="bg-slate-950 p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed border-b border-slate-800">
                <pre className="overflow-x-auto">
                  <code>{activeScript.code}</code>
                </pre>
              </div>

              {/* Execution steps overview if present */}
              {activeScript.steps && activeScript.steps.length > 0 && (
                <div className="p-4 bg-slate-900/40 text-xs">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    How This Script Executes:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeScript.steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="w-4 h-4 rounded bg-slate-800 text-[10px] flex items-center justify-center font-mono text-emerald-400 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <FileCode className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p>Select a script from the library or generate a new one with AI above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
