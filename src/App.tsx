import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { VoiceController } from './components/VoiceController';
import { CommandCenter } from './components/CommandCenter';
import { RoutineStudio } from './components/RoutineStudio';
import { ScriptStudio } from './components/ScriptStudio';
import { ExecutionConsole } from './components/ExecutionConsole';
import { DesktopCompanionGuide } from './components/DesktopCompanionGuide';
import {
  processDexterCommand,
  executeActionOnLocalPc,
  speakResponse,
  stopSpeaking,
  checkLocalBridge,
} from './services/dexterApi';
import {
  DexterCommandResponse,
  DexterAction,
  ExecutionLogEntry,
  AutomationRoutine,
  AutomationScript,
  LocalBridgeStatus,
  GeneratedScript,
} from './types/dexter';
import { INITIAL_ROUTINES } from './data/defaultRoutines';
import { INITIAL_SCRIPTS } from './data/defaultScripts';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('command');
  const [osType, setOsType] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponse, setLastResponse] = useState<DexterCommandResponse | null>(null);

  const [bridgeStatus, setBridgeStatus] = useState<LocalBridgeStatus>({
    online: false,
    platform: 'Virtual Desktop Host',
    assistant: 'Dexter',
    version: '2.5.0',
    voiceInput: true,
    tts: true,
    lastChecked: null,
  });

  const [pendingConfirmation, setPendingConfirmation] = useState<{
    command: string;
    action: DexterAction;
    prompt: string;
    logId: string;
  } | null>(null);

  const [routines, setRoutines] = useState<AutomationRoutine[]>(INITIAL_ROUTINES);
  const [scripts, setScripts] = useState<AutomationScript[]>(INITIAL_SCRIPTS);
  const [runningRoutineId, setRunningRoutineId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showAgentModal, setShowAgentModal] = useState(false);

  // Initial execution log history
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([
    {
      id: 'log-init',
      timestamp: new Date().toLocaleTimeString(),
      command: 'Dexter System Initialize',
      origin: 'text',
      intent: 'SYSTEM_BOOT',
      status: 'success',
      spokenResponse: 'Dexter online. AI Assistant initialized and standing by.',
      outputDetails: '[Dexter Core v2.5] Loaded 4 automation routines and 4 system scripts. Voice recognition listening channel active.',
    },
  ]);

  // Check PC Bridge connection periodically
  const refreshBridge = useCallback(async () => {
    const status = await checkLocalBridge();
    setBridgeStatus(status);
  }, []);

  useEffect(() => {
    refreshBridge();
    const interval = setInterval(refreshBridge, 12000);
    return () => clearInterval(interval);
  }, [refreshBridge]);

  // Main Command Dispatcher
  const handleExecuteCommand = async (
    command: string,
    origin: 'voice' | 'text' | 'macro' = 'text'
  ) => {
    if (!command.trim() || isProcessing) return;

    // Check if command triggers an existing automation routine directly
    const lowerCmd = command.toLowerCase().trim();
    const matchedRoutine = routines.find((r) =>
      r.triggerVoicePhrases.some((phrase) => lowerCmd.includes(phrase.toLowerCase()))
    );

    if (matchedRoutine) {
      await handleRunRoutine(matchedRoutine);
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();
    const logId = `log-${Date.now()}`;

    // Add pending log entry
    const newLog: ExecutionLogEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      command,
      origin,
      intent: 'PARSING',
      status: 'executing',
    };
    setLogs((prev) => [newLog, ...prev]);

    try {
      const response = await processDexterCommand(command, osType);
      setLastResponse(response);

      // Check if dangerous / file overwrite action requires confirmation
      if (response.action && response.action.confirmationRequired) {
        setPendingConfirmation({
          command,
          action: response.action,
          prompt:
            response.action.confirmationPrompt ||
            `Dexter is preparing to execute: ${response.action.type} -> ${response.action.target}`,
          logId,
        });

        // Update log to pending confirmation
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  intent: response.intent,
                  status: 'needs_confirmation',
                  spokenResponse: response.spokenResponse,
                  action: response.action,
                }
              : l
          )
        );

        if (!voiceMuted) {
          speakResponse(
            response.action.confirmationPrompt ||
              'Confirmation required before proceeding with this action.',
            {
              onStart: () => setIsSpeaking(true),
              onEnd: () => setIsSpeaking(false),
            }
          );
        }
        return;
      }

      // Execute on local PC Bridge or Simulated Desktop
      const executionResult = await executeActionOnLocalPc(command, response.action);
      const durationMs = Date.now() - startTime;

      // Speak response aloud
      if (!voiceMuted && response.spokenResponse) {
        speakResponse(response.spokenResponse, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }

      // Update log
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                intent: response.intent,
                status: 'success',
                spokenResponse: response.spokenResponse,
                action: response.action,
                outputDetails: executionResult.result,
                durationMs,
                scriptCode: response.scriptGenerated?.code,
              }
            : l
        )
      );
    } catch (err: any) {
      console.error('Error running command:', err);
      const durationMs = Date.now() - startTime;

      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'failed',
                outputDetails: `Error: ${err.message || String(err)}`,
                durationMs,
              }
            : l
        )
      );

      if (!voiceMuted) {
        speakResponse('Sorry, I encountered an issue processing that command.', {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Confirmation Dialog response
  const handleConfirmPending = async (confirmed: boolean) => {
    if (!pendingConfirmation) return;
    const { command, action, logId } = pendingConfirmation;
    setPendingConfirmation(null);

    if (confirmed) {
      setIsProcessing(true);
      try {
        const executionResult = await executeActionOnLocalPc(command, action);
        if (!voiceMuted) {
          speakResponse(`Confirmed. Executing ${action.type}.`, {
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false),
          });
        }
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  status: 'success',
                  outputDetails: executionResult.result,
                }
              : l
          )
        );
      } catch (err: any) {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  status: 'failed',
                  outputDetails: `Execution failed: ${err.message}`,
                }
              : l
          )
        );
      } finally {
        setIsProcessing(false);
      }
    } else {
      // User cancelled
      if (!voiceMuted) {
        speakResponse('Cancelled. The operation was not executed.', {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'failed',
                outputDetails: 'Action was aborted by user confirmation request.',
              }
            : l
        )
      );
    }
  };

  // Handle Running Multi-Step Automation Routine
  const handleRunRoutine = async (routine: AutomationRoutine) => {
    if (runningRoutineId) return;

    setRunningRoutineId(routine.id);
    setActiveStepIndex(0);

    const logId = `log-routine-${Date.now()}`;
    setLogs((prev) => [
      {
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        command: `Routine: ${routine.name}`,
        origin: 'macro',
        intent: 'ROUTINE_EXECUTION',
        status: 'executing',
        spokenResponse: `Executing routine: ${routine.name}`,
      },
      ...prev,
    ]);

    if (!voiceMuted) {
      speakResponse(`Running ${routine.name}.`, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }

    try {
      for (let i = 0; i < routine.steps.length; i++) {
        setActiveStepIndex(i);
        const step = routine.steps[i];

        await executeActionOnLocalPc(step.label, {
          type: step.type,
          target: step.target,
          content: step.content,
          confirmationRequired: false,
        });

        // Step delay
        if (step.delayMs) {
          await new Promise((res) => setTimeout(res, step.delayMs));
        }
      }

      // Mark routine completed
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === routine.id
            ? { ...r, runCount: r.runCount + 1, lastRun: 'Just now' }
            : r
        )
      );

      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'success',
                outputDetails: `All ${routine.steps.length} steps executed successfully.`,
              }
            : l
        )
      );

      if (!voiceMuted) {
        speakResponse(`${routine.name} completed successfully.`, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
    } catch (err: any) {
      console.error('Routine execution error:', err);
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'failed',
                outputDetails: `Failed at step ${activeStepIndex + 1}: ${err.message}`,
              }
            : l
        )
      );
    } finally {
      setRunningRoutineId(null);
      setActiveStepIndex(0);
    }
  };

  // Handle Script Execution
  const handleExecuteScript = async (script: AutomationScript | GeneratedScript) => {
    const title = 'title' in script && script.title ? script.title : 'Custom Automation Script';
    const logId = `log-script-${Date.now()}`;

    setLogs((prev) => [
      {
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        command: `Execute Script: ${title}`,
        origin: 'text',
        intent: 'SCRIPT_EXECUTION',
        status: 'executing',
        scriptCode: script.code,
      },
      ...prev,
    ]);

    try {
      const execResult = await executeActionOnLocalPc(title, {
        type: script.language === 'python' ? 'python_cmd' : 'powershell_cmd',
        target: script.code,
        confirmationRequired: false,
      });

      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'success',
                outputDetails: execResult.result,
              }
            : l
        )
      );

      if (!voiceMuted) {
        speakResponse(`Script ${title} executed successfully.`, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
    } catch (err: any) {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'failed',
                outputDetails: `Script error: ${err.message}`,
              }
            : l
        )
      );
    }
  };

  // Keyboard shortcut: Spacebar (when not typing) can trigger voice recognition or command focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopSpeaking();
        setIsSpeaking(false);
        if (showAgentModal) setShowAgentModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAgentModal]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bridgeStatus={bridgeStatus}
        voiceMuted={voiceMuted}
        setVoiceMuted={setVoiceMuted}
        osType={osType}
        setOsType={setOsType}
        onOpenAgentModal={() => setShowAgentModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Voice Controller bar (Available across all tabs) */}
        <VoiceController
          onCommandCaptured={(voiceCmd) => handleExecuteCommand(voiceCmd, 'voice')}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          voiceMuted={voiceMuted}
        />

        {/* Tab Content Views */}
        {activeTab === 'command' && (
          <CommandCenter
            onExecuteCommand={(cmd) => handleExecuteCommand(cmd, 'text')}
            isProcessing={isProcessing}
            lastResponse={lastResponse}
            bridgeStatus={bridgeStatus}
            onOpenAgentModal={() => setShowAgentModal(true)}
            pendingConfirmation={pendingConfirmation}
            onConfirmPending={handleConfirmPending}
          />
        )}

        {activeTab === 'routines' && (
          <RoutineStudio
            routines={routines}
            onRunRoutine={handleRunRoutine}
            onCreateRoutine={(newR) => setRoutines((prev) => [newR, ...prev])}
            onDeleteRoutine={(id) => setRoutines((prev) => prev.filter((r) => r.id !== id))}
            runningRoutineId={runningRoutineId}
            activeStepIndex={activeStepIndex}
          />
        )}

        {activeTab === 'scripts' && (
          <ScriptStudio
            scripts={scripts}
            onExecuteScript={handleExecuteScript}
            osType={osType}
          />
        )}

        {activeTab === 'logs' && (
          <ExecutionConsole
            logs={logs}
            onClearLogs={() => setLogs([])}
            onRerunCommand={(cmd) => handleExecuteCommand(cmd, 'text')}
          />
        )}
      </main>

      {/* Modal: Desktop Companion Setup Guide */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DesktopCompanionGuide
              bridgeStatus={bridgeStatus}
              onRefreshBridge={refreshBridge}
              onClose={() => setShowAgentModal(false)}
            />
          </div>
        </div>
      )}

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-400">
        <p>Dexter PC Voice Assistant & Automation Engine · Connected to Gemini 3.8 Flash</p>
      </footer>
    </div>
  );
}
