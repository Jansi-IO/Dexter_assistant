import React, { useState } from 'react';
import {
  ListRestart,
  Trash2,
  Download,
  Terminal,
  Mic,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  Code2,
  Copy,
  Check,
} from 'lucide-react';
import { ExecutionLogEntry } from '../types/dexter';

interface ExecutionConsoleProps {
  logs: ExecutionLogEntry[];
  onClearLogs: () => void;
  onRerunCommand: (cmd: string) => void;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  logs,
  onClearLogs,
  onRerunCommand,
}) => {
  const [filter, setFilter] = useState<'all' | 'voice' | 'actions' | 'scripts'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'voice') return log.origin === 'voice';
    if (filter === 'actions') return log.action && log.action.type !== 'none';
    if (filter === 'scripts') return log.scriptCode || (log.action && log.action.type.includes('cmd'));
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dexter_activity_logs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListRestart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Execution Activity Log</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time audit log of all voice commands, automation dispatches, and PC outputs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('voice')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'voice'
                  ? 'bg-slate-800 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Voice
            </button>
            <button
              onClick={() => setFilter('actions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'actions'
                  ? 'bg-slate-800 text-teal-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PC Actions
            </button>
            <button
              onClick={() => setFilter('scripts')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'scripts'
                  ? 'bg-slate-800 text-purple-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scripts
            </button>
          </div>

          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 disabled:opacity-40 transition-colors"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 border border-slate-700/60 disabled:opacity-40 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-3 font-mono text-xs">
          {filteredLogs.map((log) => {
            const isSuccess = log.status === 'success';
            const isFailed = log.status === 'failed';
            const isPending = log.status === 'needs_confirmation';

            return (
              <div
                key={log.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur space-y-2 hover:border-slate-700 transition-colors"
              >
                {/* Meta line */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono">{log.timestamp}</span>
                    <span className="text-slate-600">·</span>

                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {log.origin === 'voice' ? (
                        <>
                          <Mic className="w-3 h-3 text-emerald-400" />
                          <span>Voice</span>
                        </>
                      ) : log.origin === 'macro' ? (
                        <>
                          <Layers className="w-3 h-3 text-teal-400" />
                          <span>Macro</span>
                        </>
                      ) : (
                        <>
                          <Terminal className="w-3 h-3 text-slate-400" />
                          <span>Console</span>
                        </>
                      )}
                    </span>

                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-mono font-medium">{log.intent}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.durationMs && (
                      <span className="text-slate-500 font-mono text-[10px]">{log.durationMs}ms</span>
                    )}

                    <span
                      className={`flex items-center gap-1 font-semibold text-[11px] ${
                        isSuccess
                          ? 'text-emerald-400'
                          : isFailed
                          ? 'text-red-400'
                          : isPending
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isFailed && <XCircle className="w-3.5 h-3.5" />}
                      {isPending && <AlertTriangle className="w-3.5 h-3.5" />}
                      <span className="uppercase">{log.status}</span>
                    </span>
                  </div>
                </div>

                {/* Command text */}
                <div className="flex items-start justify-between gap-2 text-slate-100 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">$</span>
                    <span>{log.command}</span>
                  </div>

                  <div className="flex items-center gap-1 font-sans">
                    <button
                      onClick={() => handleCopy(log.id, log.command)}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"
                      title="Copy command"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onRerunCommand(log.command)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-500/10 transition-colors"
                    >
                      Re-run
                    </button>
                  </div>
                </div>

                {/* Spoken Response if available */}
                {log.spokenResponse && (
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-sans text-slate-300">
                    <span className="text-emerald-400 font-semibold font-mono text-[11px] mr-1.5">
                      Dexter:
                    </span>
                    <span>{log.spokenResponse}</span>
                  </div>
                )}

                {/* Output Details / Terminal Result */}
                {log.outputDetails && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 whitespace-pre-wrap font-mono">
                    {log.outputDetails}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <Terminal className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No activity records logged yet.</p>
          <p className="text-xs text-slate-500 mt-1">Commands, voice requests, and routine executions will appear here.</p>
        </div>
      )}
    </div>
  );
};
