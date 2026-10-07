import React, { useState } from 'react';
import {
  Layers,
  Play,
  Plus,
  Trash2,
  Clock,
  Mic,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Globe,
  FileText,
  Volume2,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { AutomationRoutine, WorkflowStep, ActionType } from '../types/dexter';

interface RoutineStudioProps {
  routines: AutomationRoutine[];
  onRunRoutine: (routine: AutomationRoutine) => Promise<void>;
  onCreateRoutine: (routine: AutomationRoutine) => void;
  onDeleteRoutine: (id: string) => void;
  runningRoutineId: string | null;
  activeStepIndex: number;
}

export const RoutineStudio: React.FC<RoutineStudioProps> = ({
  routines,
  onRunRoutine,
  onCreateRoutine,
  onDeleteRoutine,
  runningRoutineId,
  activeStepIndex,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newVoicePhrases, setNewVoicePhrases] = useState('');
  const [newSteps, setNewSteps] = useState<WorkflowStep[]>([
    {
      id: 'step-1',
      label: 'Launch Code Editor',
      type: 'open_app',
      target: 'vscode',
      delayMs: 300,
    },
    {
      id: 'step-2',
      label: 'Open Browser Dashboard',
      type: 'open_url',
      target: 'https://github.com',
      delayMs: 400,
    },
  ]);

  const handleAddStep = () => {
    setNewSteps([
      ...newSteps,
      {
        id: `step-${Date.now()}`,
        label: 'New Workflow Step',
        type: 'open_app',
        target: 'notepad',
        delayMs: 300,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setNewSteps(newSteps.filter((_, i) => i !== index));
  };

  const handleUpdateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const updated = [...newSteps];
    updated[index] = { ...updated[index], ...updates };
    setNewSteps(updated);
  };

  const handleSaveNewRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    const phrases = newVoicePhrases
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const created: AutomationRoutine = {
      id: `routine-${Date.now()}`,
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim() || 'Custom Dexter automation workflow.',
      triggerVoicePhrases: phrases.length > 0 ? phrases : [newRoutineName.toLowerCase()],
      category: 'productivity',
      steps: newSteps,
      active: true,
      runCount: 0,
    };

    onCreateRoutine(created);
    setShowCreateModal(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setNewVoicePhrases('');
  };

  return (
    <div className="space-y-6">
      {/* Header with stats and create button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Automation Routines</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Chain together multiple PC applications, scripts, and voice alerts into 1-trigger workflows.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routines.map((routine) => {
          const isRunning = runningRoutineId === routine.id;

          return (
            <div
              key={routine.id}
              className={`bg-slate-900/60 border rounded-2xl p-5 sm:p-6 backdrop-blur transition-all flex flex-col justify-between ${
                isRunning
                  ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Title and controls */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{routine.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{routine.description}</p>
                  </div>

                  <button
                    onClick={() => onDeleteRoutine(routine.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete routine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Voice Triggers */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-500 mb-1.5">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Voice Activation Phrases</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {routine.triggerVoicePhrases.map((phrase, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-emerald-300 font-mono border border-slate-700/60"
                      >
                        "{phrase}"
                      </span>
                    ))}
                  </div>
                </div>

                {/* Workflow Steps Preview */}
                <div className="space-y-2 mb-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Execution Pipeline ({routine.steps.length} steps)
                  </span>

                  <div className="space-y-1.5">
                    {routine.steps.map((step, idx) => {
                      const isCurrentStep = isRunning && activeStepIndex === idx;
                      const isCompletedStep = isRunning && activeStepIndex > idx;

                      return (
                        <div
                          key={step.id || idx}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs border transition-colors ${
                            isCurrentStep
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                              : isCompletedStep
                              ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                              : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400 flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-medium truncate">{step.label}</span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                            <span className="text-slate-500 truncate max-w-[120px]">{step.target}</span>
                            {isCurrentStep && (
                              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin flex-shrink-0" />
                            )}
                            {isCompletedStep && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer with Run Action */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Ran {routine.runCount} times
                </span>

                <button
                  onClick={() => onRunRoutine(routine)}
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isRunning
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 cursor-pointer'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing Steps...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Routine Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Routine */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100">Create PC Automation Routine</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRoutine} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Routine Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of Day Git & Clean"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short description of what happens..."
                  value={newRoutineDesc}
                  onChange={(e) => setNewRoutineDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Voice Trigger Phrases (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. wrap up my day, end workday, evening cleanup"
                  value={newVoicePhrases}
                  onChange={(e) => setNewVoicePhrases(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Step Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Workflow Steps ({newSteps.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-400">Step {idx + 1}</span>
                        {newSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Step label"
                          value={step.label}
                          onChange={(e) => handleUpdateStep(idx, { label: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
                        />

                        <select
                          value={step.type}
                          onChange={(e) => handleUpdateStep(idx, { type: e.target.value as ActionType })}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
                        >
                          <option value="open_app">Open App</option>
                          <option value="open_url">Open URL</option>
                          <option value="powershell_cmd">PowerShell Command</option>
                          <option value="system_control">Speak Voice Alert</option>
                          <option value="read_file">Read File</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        placeholder="Target (e.g. 'vscode', 'https://github.com', 'calc')"
                        value={step.target}
                        onChange={(e) => handleUpdateStep(idx, { target: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-300 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
