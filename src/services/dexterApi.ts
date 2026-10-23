import {
  DexterCommandResponse,
  GeneratedScript,
  LocalBridgeStatus,
  DexterAction,
  OllamaStatus,
  AiEngineMode,
} from '../types/dexter';

const LOCAL_BRIDGE_URL = 'http://127.0.0.1:8765';
const OLLAMA_DEFAULT_URL = 'http://127.0.0.1:11434';

export async function processDexterCommand(
  command: string,
  osType: string = 'windows',
  options: { engineMode?: AiEngineMode; ollamaModel?: string } = {}
): Promise<DexterCommandResponse> {
  const { engineMode = 'auto', ollamaModel } = options;
  const response = await fetch('/api/dexter/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, osType, engineMode, ollamaModel }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const res = await fetch('/api/dexter/ollama-status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }

  // Fallback direct probe if server-side proxy failed
  try {
    const start = Date.now();
    const directRes = await fetch(`${OLLAMA_DEFAULT_URL}/api/tags`, {
      method: 'GET',
    });
    if (directRes.ok) {
      const data = await directRes.json();
      const models = (data.models || []).map((m: any) => m.name);
      const hasQwen = models.some((m: string) => m.toLowerCase().includes('qwen'));
      const activeModel = models.find((m: string) => m.toLowerCase().includes('qwen')) || models[0] || 'qwen2.5:latest';
      return {
        online: true,
        url: OLLAMA_DEFAULT_URL,
        models,
        activeModel,
        hasQwen,
        lastChecked: Date.now(),
        latencyMs: Date.now() - start,
      };
    }
  } catch {
    // Ollama offline
  }

  return {
    online: false,
    url: OLLAMA_DEFAULT_URL,
    models: [],
    activeModel: 'qwen2.5',
    hasQwen: false,
    lastChecked: Date.now(),
    error: 'Ollama is offline or unreachable at 127.0.0.1:11434',
  };
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

  // Fallback to browser SpeechSynthesis with JARVIS British voice profile
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // JARVIS signature cadence: measured, polite, composed
    utterance.rate = 0.98;
    utterance.pitch = 0.93;

    // Pick British English voice to match Iron Man JARVIS (Paul Bettany)
    const voices = window.speechSynthesis.getVoices();
    const jarvisVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().includes('en-gb') ||
          v.lang.toLowerCase().includes('en_gb') ||
          v.name.toLowerCase().includes('uk english') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('oliver') ||
          v.name.toLowerCase().includes('arthur')
      ) ||
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David'))
      );

    if (jarvisVoice) {
      utterance.voice = jarvisVoice;
    }

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

// Google Search Grounding Client
export async function searchWithGoogle(query: string): Promise<{ answer: string; groundingMetadata: any; sources: string[] }> {
  const res = await fetch('/api/dexter/search-grounding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

// Google Maps Grounding Client
export async function lookupWithGoogleMaps(query: string): Promise<{ answer: string; groundingMetadata: any }> {
  const res = await fetch('/api/dexter/maps-grounding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Maps lookup failed');
  return res.json();
}

// Audio Transcription with gemini-3.5-transcribe
export async function transcribeAudioWithGemini(audioBase64: string, mimeType = 'audio/webm'): Promise<{ transcript: string }> {
  const res = await fetch('/api/dexter/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType }),
  });
  if (!res.ok) throw new Error('Transcription failed');
  return res.json();
}

// Live Voice Conversation with gemini-3.8-live
export async function chatLiveConversation(message: string, history: Array<{ role: string; text: string }> = []): Promise<{ reply: string; audioBase64: string | null }> {
  const res = await fetch('/api/dexter/live-conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('Live chat failed');
  return res.json();
}

// Media Generation (Music, Video, Image)
export async function generateMediaItem(payload: { mediaType: 'music' | 'video' | 'image'; prompt: string; duration?: string; aspectRatio?: string }): Promise<any> {
  const res = await fetch('/api/dexter/generate-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Media generation failed');
  return res.json();
}

// Multi-Turn Chatbot Client with Role and Model Routing
export async function sendMultiTurnChat(payload: {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  role: 'pc_engineer' | 'bioscience_researcher' | 'workflow_architect' | 'general_assistant';
  model: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
}): Promise<{ reply: string; modelUsed: string; role: string }> {
  const res = await fetch('/api/dexter/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

// Animate Images into Video with Veo 3 (veo-3.1-fast-generate-preview)
export async function animateVideoVeo(payload: {
  prompt: string;
  imageBase64?: string;
  aspectRatio: '16:9' | '9:16';
}): Promise<any> {
  const res = await fetch('/api/dexter/animate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Video animation failed');
  return res.json();
}

// Create or Edit Images with gemini-nano-banana-2.1
export async function createOrEditImage(payload: {
  prompt: string;
  imageBase64?: string;
  mode: 'create' | 'edit';
}): Promise<any> {
  const res = await fetch('/api/dexter/create-edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Image creation failed');
  return res.json();
}

// Bioscience API Clients
export async function fetchProteinData(id: string): Promise<any> {
  const res = await fetch(`/api/science/protein/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Protein not found');
  return res.json();
}

export async function fetchCompoundData(query: string): Promise<any> {
  const res = await fetch(`/api/science/compound/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Compound not found');
  return res.json();
}

export async function searchPubMedLiterature(query: string): Promise<any> {
  const res = await fetch('/api/science/literature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Literature query failed');
  return res.json();
}
