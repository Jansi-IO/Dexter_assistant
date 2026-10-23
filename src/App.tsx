import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { VoiceController } from './components/VoiceController';
import { CommandCenter } from './components/CommandCenter';
import { RoutineStudio } from './components/RoutineStudio';
import { ScriptStudio } from './components/ScriptStudio';
import { ExecutionConsole } from './components/ExecutionConsole';
import { LiveVoiceSession } from './components/LiveVoiceSession';
import { GroundingStudio } from './components/GroundingStudio';
import { DesktopCompanionGuide } from './components/DesktopCompanionGuide';
import { GeminiChatbot } from './components/GeminiChatbot';
import { ThreeScene } from './components/ThreeScene';
import { BioscienceHub } from './components/BioscienceHub';
import { DexterOrb } from './components/DexterOrb';
import {
  processDexterCommand,
  executeActionOnLocalPc,
  speakResponse,
  stopSpeaking,
  checkLocalBridge,
  checkOllamaStatus,
} from './services/dexterApi';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  testFirestoreConnection,
  saveRoutineToFirestore,
  deleteRoutineFromFirestore,
  saveScriptToFirestore,
  deleteScriptFromFirestore,
  saveLogToFirestore,
  db,
} from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  DexterCommandResponse,
  DexterAction,
  ExecutionLogEntry,
  AutomationRoutine,
  AutomationScript,
  LocalBridgeStatus,
  GeneratedScript,
  AiEngineMode,
  OllamaStatus,
} from './types/dexter';
import { INITIAL_ROUTINES } from './data/defaultRoutines';
import { INITIAL_SCRIPTS } from './data/defaultScripts';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('command');
  const [osType, setOsType] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isFloatingDocked, setIsFloatingDocked] = useState(false);
  const [engineMode, setEngineMode] = useState<AiEngineMode>('auto');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    online: false,
    url: 'http://127.0.0.1:11434',
    models: [],
    activeModel: 'qwen2.5',
    hasQwen: false,
    lastChecked: null,
  });
  const voiceTriggerRef = useRef<(() => void) | null>(null);
  const [lastResponse, setLastResponse] = useState<DexterCommandResponse | null>(null);

  // Firebase state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(false);

  const [bridgeStatus, setBridgeStatus] = useState<LocalBridgeStatus>({
    online: false,
    platform: 'Virtual Desktop Host',
    assistant: 'Dexter',
    version: '2.6.0',
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
      command: 'Dexter AI Suite Boot',
      origin: 'text',
      intent: 'SYSTEM_BOOT',
      status: 'success',
      spokenResponse: 'Dexter online. Grounding, voice recognition, and Firestore persistence active.',
      outputDetails: '[Dexter Core v2.6] Loaded intelligence models: gemini-3.8-flash, gemini-3.8-live, gemini-3.5-transcribe, Google Search & Maps Grounding.',
    },
  ]);

  // Test Firestore on boot (Pillar constraint)
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setFirestoreConnected(connected);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore routines & scripts when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    // Listen to user routines
    const routinesQuery = query(collection(db, 'users', currentUser.uid, 'routines'));
    const unsubRoutines = onSnapshot(
      routinesQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteRoutines: AutomationRoutine[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            let steps = [];
            try {
              steps = JSON.parse(d.stepsJson || '[]');
            } catch {
              steps = [];
            }
            return {
              id: d.id,
              name: d.name,
              description: d.description || '',
              triggerVoicePhrases: (d.triggerVoicePhrases || '').split(',').filter(Boolean),
              category: d.category || 'productivity',
              steps,
              active: d.active ?? true,
              runCount: d.runCount || 0,
              lastRun: d.lastRun,
            };
          });
          setRoutines(remoteRoutines);
        }
      },
      (error) => {
        console.warn('Routines snapshot sync notice:', error.message);
      }
    );

    // Listen to user scripts
    const scriptsQuery = query(collection(db, 'users', currentUser.uid, 'scripts'));
    const unsubScripts = onSnapshot(
      scriptsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteScripts: AutomationScript[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: d.id,
              title: d.title,
              description: d.description || '',
              language: d.language || 'python',
              category: d.category || 'system',
              code: d.code,
              dependencies: (d.dependencies || '').split(',').map((s: string) => s.trim()).filter(Boolean),
              safetyNotes: d.safetyNotes || '',
              steps: d.steps || [],
              dateUpdated: d.updatedAt || 'Recently',
            };
          });
          setScripts(remoteScripts);
        }
      },
      (error) => {
        console.warn('Scripts snapshot sync notice:', error.message);
      }
    );

    return () => {
      unsubRoutines();
      unsubScripts();
    };
  }, [currentUser]);

  // Check PC Bridge connection periodically
  const refreshBridge = useCallback(async () => {
    const status = await checkLocalBridge();
    setBridgeStatus(status);
  }, []);

  // Check Ollama Local AI Engine periodically
  const refreshOllama = useCallback(async () => {
    try {
      const status = await checkOllamaStatus();
      setOllamaStatus(status);
    } catch {
      setOllamaStatus((prev) => ({ ...prev, online: false }));
    }
  }, []);

  useEffect(() => {
    refreshBridge();
    refreshOllama();
    const interval = setInterval(() => {
      refreshBridge();
      refreshOllama();
    }, 12000);
    return () => clearInterval(interval);
  }, [refreshBridge, refreshOllama]);

  // Google Sign-In Handler
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Ignored: benign cancellation or popup suppression is handled in signInWithGoogle
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

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
      const response = await processDexterCommand(command, osType, {
        engineMode,
        ollamaModel: ollamaStatus.activeModel || undefined,
      });
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

        const pendingEntry: ExecutionLogEntry = {
          ...newLog,
          intent: response.intent,
          status: 'needs_confirmation',
          spokenResponse: response.spokenResponse,
          action: response.action,
        };

        setLogs((prev) => prev.map((l) => (l.id === logId ? pendingEntry : l)));

        if (currentUser) {
          saveLogToFirestore(currentUser.uid, pendingEntry).catch(() => {});
        }

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

      const completedLog: ExecutionLogEntry = {
        ...newLog,
        intent: response.intent,
        status: 'success',
        spokenResponse: response.spokenResponse,
        action: response.action,
        outputDetails: executionResult.result,
        durationMs,
        scriptCode: response.scriptGenerated?.code,
      };

      setLogs((prev) => prev.map((l) => (l.id === logId ? completedLog : l)));

      if (currentUser) {
        saveLogToFirestore(currentUser.uid, completedLog).catch(() => {});
      }
    } catch (err: any) {
      console.error('Error running command:', err);
      const durationMs = Date.now() - startTime;

      const failedLog: ExecutionLogEntry = {
        ...newLog,
        status: 'failed',
        outputDetails: `Error: ${err.message || String(err)}`,
        durationMs,
      };

      setLogs((prev) => prev.map((l) => (l.id === logId ? failedLog : l)));

      if (currentUser) {
        saveLogToFirestore(currentUser.uid, failedLog).catch(() => {});
      }

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
    const startLog: ExecutionLogEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      command: `Routine: ${routine.name}`,
      origin: 'macro',
      intent: 'ROUTINE_EXECUTION',
      status: 'executing',
      spokenResponse: `Executing routine: ${routine.name}`,
    };
    setLogs((prev) => [startLog, ...prev]);

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
      const updatedRoutine = {
        ...routine,
        runCount: routine.runCount + 1,
        lastRun: 'Just now',
      };

      setRoutines((prev) =>
        prev.map((r) => (r.id === routine.id ? updatedRoutine : r))
      );

      if (currentUser) {
        saveRoutineToFirestore(currentUser.uid, updatedRoutine).catch(() => {});
      }

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

  // Routine Create / Delete with Firestore persistence
  const handleCreateRoutine = (newR: AutomationRoutine) => {
    setRoutines((prev) => [newR, ...prev]);
    if (currentUser) {
      saveRoutineToFirestore(currentUser.uid, newR).catch(() => {});
    }
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    if (currentUser) {
      deleteRoutineFromFirestore(currentUser.uid, id).catch(() => {});
    }
  };

  // Script Execute / Save with Firestore persistence
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

  // Keyboard shortcut: Escape to close modals or stop speaking
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
    <div className="min-h-screen bg-[#0a0304] text-[#fce7e7] flex flex-col selection:bg-red-900/60 selection:text-red-100">
      {/* Top Navigation with Firebase Auth */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bridgeStatus={bridgeStatus}
        voiceMuted={voiceMuted}
        setVoiceMuted={setVoiceMuted}
        osType={osType}
        setOsType={setOsType}
        onOpenAgentModal={() => setShowAgentModal(true)}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        firestoreConnected={firestoreConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Voice Controller bar (Available across all tabs) */}
        <VoiceController
          onCommandCaptured={(voiceCmd) => handleExecuteCommand(voiceCmd, 'voice')}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          voiceMuted={voiceMuted}
          onListeningChange={setIsListening}
          onTranscriptChange={setTranscript}
          triggerToggleRef={voiceTriggerRef}
        />

        {/* Tab Content Views */}
        {activeTab === 'command' && (
          <div className="space-y-6">
            {!isFloatingDocked && (
              <DexterOrb
                isListening={isListening}
                isProcessing={isProcessing}
                isSpeaking={isSpeaking}
                voiceMuted={voiceMuted}
                onToggleListen={() => voiceTriggerRef.current?.()}
                onToggleMute={() => setVoiceMuted((prev) => !prev)}
                onExecuteCommand={(cmd) => handleExecuteCommand(cmd, 'voice')}
                engineMode={engineMode}
                onSelectEngineMode={setEngineMode}
                ollamaStatus={ollamaStatus}
                onRefreshOllama={refreshOllama}
                transcript={transcript}
                lastSpokenText={lastResponse?.spokenResponse}
                isFloatingDocked={isFloatingDocked}
                onToggleFloatingDock={() => setIsFloatingDocked(!isFloatingDocked)}
              />
            )}

            <CommandCenter
              onExecuteCommand={(cmd) => handleExecuteCommand(cmd, 'text')}
              isProcessing={isProcessing}
              lastResponse={lastResponse}
              bridgeStatus={bridgeStatus}
              onOpenAgentModal={() => setShowAgentModal(true)}
              pendingConfirmation={pendingConfirmation}
              onConfirmPending={handleConfirmPending}
            />
          </div>
        )}

        {activeTab === 'chatbot' && <GeminiChatbot />}

        {activeTab === 'three3d' && (
          <ThreeScene isSpeaking={isSpeaking} isProcessing={isProcessing} />
        )}

        {activeTab === 'bioscience' && (
          <BioscienceHub onOpen3DView={() => setActiveTab('three3d')} />
        )}

        {activeTab === 'live' && (
          <LiveVoiceSession voiceMuted={voiceMuted} />
        )}

        {activeTab === 'grounding' && (
          <GroundingStudio
            onSendToDexterCommand={(cmd) => handleExecuteCommand(cmd, 'text')}
            userId={currentUser?.uid}
          />
        )}

        {activeTab === 'routines' && (
          <RoutineStudio
            routines={routines}
            onRunRoutine={handleRunRoutine}
            onCreateRoutine={handleCreateRoutine}
            onDeleteRoutine={handleDeleteRoutine}
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

        {activeTab === 'agent' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl">
            <DesktopCompanionGuide
              bridgeStatus={bridgeStatus}
              onRefreshBridge={refreshBridge}
              onClose={() => setActiveTab('command')}
            />
          </div>
        )}
      </main>

      {/* Floating Desktop Orb (Docked mode visible across all views) */}
      {isFloatingDocked && (
        <DexterOrb
          isListening={isListening}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          voiceMuted={voiceMuted}
          onToggleListen={() => voiceTriggerRef.current?.()}
          onToggleMute={() => setVoiceMuted((prev) => !prev)}
          onExecuteCommand={(cmd) => handleExecuteCommand(cmd, 'voice')}
          engineMode={engineMode}
          onSelectEngineMode={setEngineMode}
          ollamaStatus={ollamaStatus}
          onRefreshOllama={refreshOllama}
          transcript={transcript}
          lastSpokenText={lastResponse?.spokenResponse}
          isFloatingDocked={isFloatingDocked}
          onToggleFloatingDock={() => setIsFloatingDocked(false)}
        />
      )}

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
      <footer className="border-t border-red-950/80 py-4 text-center text-xs text-red-400/60 font-mono">
        <p>Dexter PC Voice Assistant & Task Automation Studio · Mark VII J.A.R.V.I.S. Core</p>
      </footer>
    </div>
  );
}
