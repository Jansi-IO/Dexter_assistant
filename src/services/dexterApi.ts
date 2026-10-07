import { DexterCommandResponse, GeneratedScript, LocalBridgeStatus, DexterAction } from '../types/dexter';

const LOCAL_BRIDGE_URL = 'http://127.0.0.1:8765';

export async function processDexterCommand(
  command: string,
  osType: string = 'windows'
): Promise<DexterCommandResponse> {
  const response = await fetch('/api/dexter/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, osType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function generateAutomationScript(
  taskPrompt: string,
  language: string = 'python',
  osType: string = 'windows'
): Promise<GeneratedScript> {
  const response = await fetch('/api/dexter/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskPrompt, language, osType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate script');
  }

  return response.json();
}

export async function checkLocalBridge(): Promise<LocalBridgeStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${LOCAL_BRIDGE_URL}/status`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        platform: data.platform || 'Unknown',
        assistant: data.assistant || 'Dexter',
        version: data.version || '2.5.0',
        voiceInput: Boolean(data.voiceInput),
        tts: Boolean(data.tts),
        lastChecked: Date.now(),
      };
    }
  } catch {
    // Local bridge not running or timed out
  }

  return {
    online: false,
    platform: 'Virtual Desktop Host',
    assistant: 'Dexter',
    version: '2.5.0 (Sandbox Mode)',
    voiceInput: true,
    tts: true,
    lastChecked: Date.now(),
  };
}

export async function executeActionOnLocalPc(
  command: string,
  action: DexterAction
): Promise<{ result: string; mode: 'real_pc' | 'simulated' }> {
  // First attempt local bridge if available
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${LOCAL_BRIDGE_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, action }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        result: data.result || 'Command executed on PC.',
        mode: 'real_pc',
      };
    }
  } catch {
    // Fall back to virtual PC sandbox execution
  }

  // Simulated execution logic for the web client
  let simulatedResult = '';
  switch (action.type) {
    case 'open_app':
      simulatedResult = `[PC Bridge Simulated] Dispatched start process for application "${action.target}". Process spawned with PID ${Math.floor(1000 + Math.random() * 8000)}.`;
      break;
    case 'open_file':
      simulatedResult = `[PC Bridge Simulated] Calling OS default handler for file: ${action.target}`;
      break;
    case 'read_file':
      simulatedResult = `[PC Bridge Simulated] File ${action.target} read successfully (342 bytes).`;
      break;
    case 'write_file':
      simulatedResult = `[PC Bridge Simulated] Written ${action.content ? action.content.length : 0} characters to ${action.target}.`;
      break;
    case 'open_url':
      simulatedResult = `[PC Bridge] Opening browser tab to ${action.target}`;
      // In web app, we can also simulate or provide safe link preview
      break;
    case 'powershell_cmd':
    case 'bash_cmd':
    case 'python_cmd':
      simulatedResult = `[PC Bridge Simulated] Running command:\n${action.target}\nProcess finished with exit code 0.`;
      break;
    case 'system_control':
      simulatedResult = `[PC Bridge Simulated] System action "${action.target}" applied successfully.`;
      break;
    default:
      simulatedResult = `[PC Bridge Simulated] Action "${action.type}" handled.`;
      break;
  }

  return {
    result: simulatedResult,
    mode: 'simulated',
  };
}

// Speak aloud using browser Web Speech API or Gemini TTS
export async function speakResponse(
  text: string,
  options: { useGeminiTts?: boolean; voiceName?: string; onStart?: () => void; onEnd?: () => void } = {}
): Promise<void> {
  const { useGeminiTts = false, voiceName = 'Puck', onStart, onEnd } = options;

  if (useGeminiTts) {
    try {
      const res = await fetch('/api/dexter/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          if (onStart) audio.onplay = () => onStart();
          if (onEnd) audio.onended = () => onEnd();
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('Gemini TTS failed, falling back to browser synthesis:', e);
    }
  }

  // Fallback to browser SpeechSynthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David'))
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    if (onStart) utterance.onstart = () => onStart();
    if (onEnd) utterance.onend = () => onEnd();

    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
