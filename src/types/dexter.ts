export type ActionType =
  | 'open_app'
  | 'open_file'
  | 'read_file'
  | 'write_file'
  | 'open_url'
  | 'powershell_cmd'
  | 'bash_cmd'
  | 'python_cmd'
  | 'run_script'
  | 'system_control'
  | 'chat'
  | 'none';

export interface DexterAction {
  type: ActionType;
  target: string;
  content?: string;
  args?: string[];
  confirmationRequired: boolean;
  confirmationPrompt?: string;
}

export interface GeneratedScript {
  title?: string;
  language: 'python' | 'powershell' | 'bash' | 'batch';
  code: string;
  explanation: string;
  dependencies?: string[];
  safetyNotes?: string;
  steps?: string[];
}

export interface DexterCommandResponse {
  intent: string;
  title: string;
  spokenResponse: string;
  action: DexterAction;
  scriptGenerated?: GeneratedScript;
  suggestedFollowUps: string[];
}

export interface ExecutionLogEntry {
  id: string;
  timestamp: string;
  command: string;
  origin: 'voice' | 'text' | 'macro' | 'scheduled';
  intent: string;
  status: 'pending' | 'executing' | 'success' | 'failed' | 'needs_confirmation';
  spokenResponse?: string;
  action?: DexterAction;
  outputDetails?: string;
  scriptCode?: string;
  durationMs?: number;
}

export interface WorkflowStep {
  id: string;
  label: string;
  type: ActionType;
  target: string;
  content?: string;
  delayMs?: number;
}

export interface AutomationRoutine {
  id: string;
  name: string;
  description: string;
  triggerVoicePhrases: string[];
  category: 'productivity' | 'system' | 'dev' | 'utility';
  steps: WorkflowStep[];
  active: boolean;
  lastRun?: string;
  runCount: number;
}

export interface AutomationScript {
  id: string;
  title: string;
  description: string;
  language: 'python' | 'powershell' | 'bash' | 'batch';
  category: 'system' | 'files' | 'dev' | 'network';
  code: string;
  dependencies: string[];
  safetyNotes: string;
  steps: string[];
  dateUpdated: string;
}

export interface LocalBridgeStatus {
  online: boolean;
  platform: string;
  assistant: string;
  version: string;
  voiceInput: boolean;
  tts: boolean;
  lastChecked: number | null;
  error?: string;
}
