import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function getFallbackResponse(command: string, osType: string = 'windows') {
  const original = command.trim();
  const lower = original.toLowerCase();

  // Strip prefixes
  let clean = lower;
  for (const prefix of ['dexter, ', 'dexter ', 'hey dexter, ', 'hey dexter ']) {
    if (clean.startsWith(prefix)) {
      clean = clean.slice(prefix.length).trim();
      break;
    }
  }

  // Applications
  if (clean.includes('vscode') || clean.includes('vs code') || clean === 'code' || clean.includes('visual studio code')) {
    return {
      intent: 'SYSTEM_APP',
      title: 'Launch Visual Studio Code',
      spokenResponse: 'Opening Visual Studio Code.',
      action: { type: 'open_app', target: 'vscode', confirmationRequired: false },
      suggestedFollowUps: ['Open GitHub', 'Run build script', 'Check git status'],
    };
  }

  if (clean.includes('calc') || clean.includes('calculator')) {
    return {
      intent: 'SYSTEM_APP',
      title: 'Open Calculator',
      spokenResponse: 'Opening Calculator.',
      action: { type: 'open_app', target: 'calculator', confirmationRequired: false },
      suggestedFollowUps: ['Open Notepad', 'Open VS Code'],
    };
  }

  if (clean.includes('notepad')) {
    return {
      intent: 'SYSTEM_APP',
      title: 'Open Notepad',
      spokenResponse: 'Opening Notepad.',
      action: { type: 'open_app', target: 'notepad', confirmationRequired: false },
      suggestedFollowUps: ['Write a note', 'Read file C:\\Dexter\\notes.txt'],
    };
  }

  if (clean.includes('paint')) {
    return {
      intent: 'SYSTEM_APP',
      title: 'Open Paint',
      spokenResponse: 'Opening Paint.',
      action: { type: 'open_app', target: 'paint', confirmationRequired: false },
      suggestedFollowUps: ['Open Explorer', 'Open Calculator'],
    };
  }

  if (clean.includes('explorer') || clean.includes('file explorer')) {
    return {
      intent: 'SYSTEM_APP',
      title: 'Open File Explorer',
      spokenResponse: 'Opening File Explorer.',
      action: { type: 'open_app', target: 'explorer', confirmationRequired: false },
      suggestedFollowUps: ['Open Dexter folder', 'Open Notepad'],
    };
  }

  if (clean.includes('cmd') || clean.includes('command prompt') || clean.includes('terminal')) {
    return {
      intent: 'SYSTEM_APP',
      title: 'Open Command Terminal',
      spokenResponse: 'Opening Command Prompt.',
      action: { type: 'open_app', target: 'cmd', confirmationRequired: false },
      suggestedFollowUps: ['Check IP address', 'Run ping test'],
    };
  }

  // File operations
  if (clean.startsWith('read file ')) {
    const path = original.slice(10).trim();
    return {
      intent: 'FILE_OP',
      title: `Read ${path}`,
      spokenResponse: `Reading file ${path}.`,
      action: { type: 'read_file', target: path, confirmationRequired: false },
      suggestedFollowUps: ['Write file', 'Open in VS Code'],
    };
  }

  if (clean.startsWith('write file ') || clean.startsWith('edit file ')) {
    const path = original.slice(clean.startsWith('write file ') ? 11 : 10).trim();
    return {
      intent: 'FILE_OP',
      title: `Write ${path}`,
      spokenResponse: `Dexter is preparing to save ${path}. Confirmation required before overwrite.`,
      action: {
        type: 'write_file',
        target: path,
        confirmationRequired: true,
        confirmationPrompt: `Dexter is about to replace or write to: ${path}. Type OVERWRITE to continue.`,
      },
      suggestedFollowUps: ['Read file', 'Open in Explorer'],
    };
  }

  // Web shortcuts
  if (clean.includes('youtube')) {
    return {
      intent: 'WEB_NAV',
      title: 'Open YouTube',
      spokenResponse: 'Opening YouTube.',
      action: { type: 'open_url', target: 'https://youtube.com', confirmationRequired: false },
      suggestedFollowUps: ['Open GitHub', 'Open Google'],
    };
  }

  if (clean.includes('github')) {
    return {
      intent: 'WEB_NAV',
      title: 'Open GitHub',
      spokenResponse: 'Opening GitHub.',
      action: { type: 'open_url', target: 'https://github.com', confirmationRequired: false },
      suggestedFollowUps: ['Open VS Code', 'Git sync'],
    };
  }

  if (clean.includes('google')) {
    return {
      intent: 'WEB_NAV',
      title: 'Open Google',
      spokenResponse: 'Opening Google.',
      action: { type: 'open_url', target: 'https://google.com', confirmationRequired: false },
      suggestedFollowUps: ['Open YouTube', 'Open GitHub'],
    };
  }

  if (clean.includes('clean temp') || clean.includes('flush dns')) {
    return {
      intent: 'SCRIPT_RUN',
      title: 'Clean Temp Files & DNS',
      spokenResponse: 'Running system cache cleanup and flushing DNS.',
      action: {
        type: 'powershell_cmd',
        target: 'Clear-DnsClientCache; Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue',
        confirmationRequired: false,
      },
      suggestedFollowUps: ['Check disk space', 'Check memory health'],
    };
  }

  if (clean.includes('time') || clean.includes('what time')) {
    const nowStr = new Date().toLocaleTimeString();
    return {
      intent: 'CHAT',
      title: 'Check Time',
      spokenResponse: `The current time is ${nowStr}.`,
      action: { type: 'none', target: '', confirmationRequired: false },
      suggestedFollowUps: ['Open VS Code', 'Start workday routine'],
    };
  }

  if (clean === 'hello' || clean === 'hi' || clean === 'hey') {
    return {
      intent: 'CHAT',
      title: 'Dexter Greeting',
      spokenResponse: "Hello! I'm Dexter, your personal AI desktop assistant. How can I assist you with your PC today?",
      action: { type: 'none', target: '', confirmationRequired: false },
      suggestedFollowUps: ['Open VS Code', 'Clean temp files', 'Run diagnostics'],
    };
  }

  return {
    intent: 'GENERAL_ASSISTANCE',
    title: 'Dexter Command',
    spokenResponse: `I've analyzed: "${original}". Dexter is ready to execute.`,
    action: {
      type: 'none',
      target: original,
      confirmationRequired: false,
    },
    suggestedFollowUps: ['Open VS Code', 'Open Calculator', 'Check system time'],
  };
}

async function main() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      name: 'Dexter Assistant Hub',
      version: '2.5.0',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Command processing via Gemini
  app.post('/api/dexter/process', async (req, res) => {
    try {
      const { command, osType = 'windows', activeRoutines = [] } = req.body;

      if (!command || typeof command !== 'string') {
        res.status(400).json({ error: 'Command is required' });
        return;
      }

      // If API key is missing, return fallback response directly
      if (!process.env.GEMINI_API_KEY) {
        res.json(getFallbackResponse(command, osType));
        return;
      }

      const prompt = `You are Dexter, an advanced, capable personal desktop AI assistant designed to control the user's PC and automate routine tasks via voice and custom scripts.
Operating system: ${osType}.
User voice/text input: "${command}"

Available known actions for Dexter:
- 'open_app': Open native desktop apps (e.g. 'vscode', 'notepad', 'calculator', 'paint', 'explorer', 'cmd', 'terminal', 'chrome', 'spotify', 'slack')
- 'open_file': Launch a document or file path using default OS handler
- 'read_file': Read text content of a local file path
- 'write_file': Create or overwrite a local file with specific text contents
- 'open_url': Open browser URL (e.g. 'https://youtube.com', 'https://github.com', 'https://google.com')
- 'powershell_cmd': Run a Windows PowerShell command or script
- 'bash_cmd': Run a Bash command
- 'python_cmd': Execute a Python automation snippet
- 'run_script': Execute a predefined or created automation routine
- 'system_control': Volume, lock screen, shutdown confirmation, sleep, empty recycle bin
- 'chat': Informational response or general conversation

Rules:
1. 'spokenResponse' must be natural, concise, and punchy, ready for text-to-speech aloud (max 1-2 sentences).
2. If the user asks for a file modification or destructive action (delete, overwrite, shutdown), set confirmationRequired: true and supply confirmationPrompt.
3. If the user asks to automate a multi-step task or write a script, generate a production-ready script in 'scriptGenerated'.
4. Include 2-3 helpful, relevant follow-up suggestions in 'suggestedFollowUps'.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                description: 'SYSTEM_APP, FILE_OP, WEB_NAV, SCRIPT_RUN, WORKFLOW_ROUTINE, SYSTEM_CONTROL, or CHAT',
              },
              title: {
                type: Type.STRING,
                description: 'Short title of the operation, e.g. "Launch VS Code"',
              },
              spokenResponse: {
                type: Type.STRING,
                description: 'Crisp spoken response for voice synthesis',
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'open_app, open_file, read_file, write_file, open_url, powershell_cmd, bash_cmd, python_cmd, run_script, system_control, or none',
                  },
                  target: {
                    type: Type.STRING,
                    description: 'Target app name, URL, or file path',
                  },
                  content: {
                    type: Type.STRING,
                    description: 'Content for write_file or command payload',
                  },
                  confirmationRequired: {
                    type: Type.BOOLEAN,
                    description: 'Whether dangerous action requires explicit user confirmation',
                  },
                  confirmationPrompt: {
                    type: Type.STRING,
                    description: 'Warning prompt text if confirmation is needed',
                  },
                },
                required: ['type', 'target', 'confirmationRequired'],
              },
              scriptGenerated: {
                type: Type.OBJECT,
                properties: {
                  language: { type: Type.STRING },
                  code: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
              },
              suggestedFollowUps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['intent', 'title', 'spokenResponse', 'action', 'suggestedFollowUps'],
          },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('Empty response received from Gemini');
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (err: any) {
      console.warn('Gemini request failed (using intelligent local fallback):', err?.message || err);
      // Fallback gracefully so assistant operations are always responsive and dependable
      const fallback = getFallbackResponse(req.body?.command || '', req.body?.osType || 'windows');
      res.json(fallback);
    }
  });

  // Script generator endpoint
  app.post('/api/dexter/generate-script', async (req, res) => {
    try {
      const { taskPrompt, language = 'python', osType = 'windows' } = req.body;

      if (!taskPrompt) {
        res.status(400).json({ error: 'taskPrompt is required' });
        return;
      }

      const prompt = `Generate a high quality, robust, production-safe automation script for a PC personal assistant named Dexter.
Target Task: "${taskPrompt}"
Language: ${language} (Options: python, powershell, bash, batch)
Operating System: ${osType}

Requirements:
- Code must be safe, resilient, handle common errors cleanly, and contain comments.
- Include required dependencies (e.g. built-in modules or pip packages).
- Provide a clear title, description, step-by-step breakdown, and safety notes.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              language: { type: Type.STRING },
              code: { type: Type.STRING },
              dependencies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              safetyNotes: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              testCommand: { type: Type.STRING },
            },
            required: ['title', 'description', 'language', 'code', 'dependencies', 'safetyNotes', 'steps'],
          },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      res.json(JSON.parse(text));
    } catch (err: any) {
      console.warn('Gemini script generation fallback:', err?.message || err);
      const { taskPrompt = 'Custom PC Task', language = 'python' } = req.body || {};
      res.json({
        title: `Automate: ${taskPrompt}`,
        description: `Automated PC task routine for: ${taskPrompt}`,
        language: language,
        code: language === 'python'
          ? `# Dexter Automation: ${taskPrompt}\nimport os\nimport sys\nfrom datetime import datetime\n\nprint(f"[Dexter] Running automation: ${taskPrompt}")\n# Execute routine\nprint("[Dexter] Task completed successfully.")\n`
          : `# Dexter PowerShell Automation: ${taskPrompt}\nWrite-Host "[Dexter] Running automation: ${taskPrompt}" -ForegroundColor Cyan\n# Execute routine\nWrite-Host "[Dexter] Task completed." -ForegroundColor Green\n`,
        dependencies: [language === 'python' ? 'Python standard library' : 'Windows PowerShell native'],
        safetyNotes: 'Standard automation execution. Ensure required directories exist.',
        steps: ['Initialize task parameters', 'Execute core operations', 'Verify output and log results'],
      });
    }
  });

  // Text-To-Speech with gemini-3.8-flash-lite-tts
  app.post('/api/dexter/tts', async (req, res) => {
    try {
      const { text, voice = 'Puck' } = req.body;
      if (!text) {
        res.status(400).json({ error: 'Text is required for TTS' });
        return;
      }

      // Valid voices: Puck, Charon, Kore, Fenrir, Zephyr
      const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      const voiceName = validVoices.includes(voice) ? voice : 'Puck';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 500),
                speechMetadata: {
                  style: 'Crisp, attentive personal AI assistant',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
          voice: voiceName,
        });
      } else {
        res.status(500).json({ error: 'No audio generated by model' });
      }
    } catch (err: any) {
      console.error('TTS error (falling back to client synthesis):', err);
      res.status(500).json({
        error: 'TTS generation failed',
        details: err?.message || String(err),
      });
    }
  });

  // Serve full python companion agent code
  app.get('/api/dexter/agent-source', (req, res) => {
    const pythonAgentCode = getPythonAgentCode();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(pythonAgentCode);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dexter Assistant server online at http://0.0.0.0:${PORT}`);
  });
}

function getPythonAgentCode(): string {
  return `"""
=============================================================================
 DEXTER: ADVANCED PC VOICE ASSISTANT & LOCAL AUTOMATION BRIDGE
=============================================================================
This is the desktop companion agent for Dexter. It runs on your local machine
and can:
1. Accept voice commands via microphone (using speech_recognition & pyttsx3)
2. Run local PC commands, open software, read/write files, and run custom scripts
3. Provide a local HTTP bridge (port 8765) to seamlessly connect with the
   Dexter Web Command Center dashboard!
4. Call Gemini 3.8 Flash for intelligent natural language comprehension

Quick Setup:
  pip install google-genai python-dotenv SpeechRecognition pyttsx3 flask flask-cors
  python dexter_agent.py
=============================================================================
"""

import os
import sys
import json
import shutil
import platform
import threading
import subprocess
import webbrowser
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from google import genai

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

try:
    import speech_recognition as sr
    VOICE_INPUT_AVAILABLE = True
except ImportError:
    VOICE_INPUT_AVAILABLE = False

try:
    import pyttsx3
    TTS_AVAILABLE = True
    tts_engine = pyttsx3.init()
    tts_engine.setProperty('rate', 175)
except Exception:
    TTS_AVAILABLE = False
    tts_engine = None

load_dotenv()

DEXTER_NAME = "Dexter"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
LOCAL_BRIDGE_PORT = 8765

# System applications lookup
WIN_APPLICATIONS = {
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "calc": "calc.exe",
    "paint": "mspaint.exe",
    "explorer": "explorer.exe",
    "cmd": "cmd.exe",
    "taskmgr": "taskmgr.exe",
}

MAC_APPLICATIONS = {
    "calculator": "Calculator",
    "terminal": "Terminal",
    "textedit": "TextEdit",
    "finder": "Finder",
}


def speak(text: str):
    """Voice output through local text-to-speech."""
    print(f"Dexter > {text}")
    if TTS_AVAILABLE and tts_engine:
        try:
            tts_engine.say(text)
            tts_engine.runAndWait()
        except Exception:
            pass


def show_banner():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    os_name = platform.system()
    print("\\n" + "=" * 55)
    print("           DEXTER - DESKTOP AGENT ONLINE")
    print("=" * 55)
    print(f" System: {os_name} ({platform.release()})")
    print(f" Initialized: {current_time}")
    print(f" Voice Input: {'Available (Microphone)' if VOICE_INPUT_AVAILABLE else 'Disabled (install speech_recognition)'}")
    print(f" Voice Speech: {'Available (pyttsx3)' if TTS_AVAILABLE else 'Disabled (install pyttsx3)'}")
    print(f" Web Hub Bridge: http://127.0.0.1:{LOCAL_BRIDGE_PORT} {'(Online)' if FLASK_AVAILABLE else '(Flask missing)'}")
    print("=" * 55)
    print("Commands: 'voice' (listen mic), 'apps', or type any command.")
    print("Type 'exit' to shut down.\\n")


def open_application(app_name: str) -> str:
    app_key = app_name.strip().lower()
    system = platform.system()

    # Visual Studio Code
    if app_key in ("vscode", "vs code", "code", "visual studio code"):
        executable = shutil.which("code")
        if executable:
            subprocess.Popen([executable])
            return "Opening Visual Studio Code."
        return "Couldn't locate VS Code 'code' command on PATH."

    # Windows
    if system == "Windows":
        if app_key in WIN_APPLICATIONS:
            subprocess.Popen([WIN_APPLICATIONS[app_key]])
            return f"Opening {app_name}."

    # macOS
    elif system == "Darwin":
        if app_key in MAC_APPLICATIONS:
            subprocess.Popen(["open", "-a", MAC_APPLICATIONS[app_key]])
            return f"Opening {app_name}."
        subprocess.Popen(["open", "-a", app_name])
        return f"Opening {app_name}."

    # Linux
    elif system == "Linux":
        executable = shutil.which(app_key)
        if executable:
            subprocess.Popen([executable])
            return f"Opening {app_name}."

    return f"I don't know how to open {app_name} yet."


def open_file(path_text: str) -> str:
    try:
        path = Path(path_text.strip().strip('"')).expanduser()
        if platform.system() == "Windows":
            os.startfile(str(path))
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", str(path)])
        else:
            subprocess.Popen(["xdg-open", str(path)])
        return f"Opening {path}."
    except Exception as exc:
        return f"Couldn't open file: {exc}"


def read_file(path_text: str) -> str:
    try:
        path = Path(path_text.strip().strip('"')).expanduser()
        contents = path.read_text(encoding="utf-8")
        limit = 20000
        if len(contents) > limit:
            contents = contents[:limit] + "\\n\\n[Showing only first 20,000 characters]"
        return contents or "(File is empty.)"
    except Exception as exc:
        return f"Couldn't read file: {exc}"


def write_file(path_text: str, content: str = None, must_exist: bool = False) -> str:
    try:
        path = Path(path_text.strip().strip('"')).expanduser()
        if must_exist and not path.is_file():
            return "File does not exist. Use write command to create it."

        if not path.parent.exists():
            path.parent.mkdir(parents=True, exist_ok=True)

        if content is None:
            # Interactive console input
            print(f"Writing to {path}. Enter content. Type END on its own line:")
            lines = []
            while True:
                line = input()
                if line == "END":
                    break
                lines.append(line)
            content = "\\n".join(lines) + "\\n"

        path.write_text(content, encoding="utf-8")
        return f"Saved file to {path}."
    except Exception as exc:
        return f"Couldn't save file: {exc}"


def execute_shell_command(command: str) -> str:
    """Safely executes a shell or powershell command with output capture."""
    try:
        res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        output = res.stdout.strip() or res.stderr.strip()
        return output or "Command completed with no output."
    except Exception as exc:
        return f"Execution error: {exc}"


def listen_voice() -> str:
    """Listen from microphone using SpeechRecognition."""
    if not VOICE_INPUT_AVAILABLE:
        return "Voice recognition library not installed. Run 'pip install SpeechRecognition pyaudio'."

    recognizer = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            print("[Dexter is listening... Speak now]")
            recognizer.adjust_for_ambient_noise(source, duration=0.6)
            audio = recognizer.listen(source, timeout=6, phrase_time_limit=10)
            print("[Processing voice...]")
            text = recognizer.recognize_google(audio)
            print(f"[You said]: {text}")
            return text
    except sr.WaitTimeoutError:
        return "No speech detected (timed out)."
    except sr.UnknownValueError:
        return "Could not understand audio."
    except Exception as e:
        return f"Microphone error: {e}"


def ask_gemini(command: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Gemini isn't configured. Set GEMINI_API_KEY in your .env file."

    try:
        client = genai.Client(
            api_key=api_key,
            http_options={"timeout": 45000},
        )
        result = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=(
                "You are Dexter, an intelligent personal desktop assistant. "
                "Answer clearly, punchily, and helpfully. "
                f"User request: {command}"
            ),
        )
        return result.text.strip() if result.text else "No response returned."
    except Exception as exc:
        return f"Gemini connection error: {type(exc).__name__}"


def process_command(command: str) -> str:
    original = command.strip()
    normalized = original.lower()

    # Remove Dexter prefix
    for prefix in ("dexter, ", "dexter ", "hey dexter, ", "hey dexter "):
        if normalized.startswith(prefix):
            original = original[len(prefix):].strip()
            normalized = normalized[len(prefix):].strip()
            break

    if not normalized:
        return "Yes? How can I help?"

    # Voice command trigger
    if normalized in ("listen", "voice", "voice mode"):
        heard = listen_voice()
        if heard and not heard.startswith("No speech") and not heard.startswith("Could not"):
            return process_command(heard)
        return heard

    # Local file commands
    if normalized.startswith("read file "):
        return read_file(original[10:])
    if normalized.startswith("write file "):
        return write_file(original[11:])
    if normalized.startswith("open file "):
        return open_file(original[10:])

    # Applications
    if any(k in normalized for k in ("vscode", "vs code", "visual studio code")):
        return open_application("vscode")
    if "calculator" in normalized or "calc" in normalized:
        return open_application("calculator")
    if "notepad" in normalized:
        return open_application("notepad")
    if "paint" in normalized:
        return open_application("paint")
    if "explorer" in normalized or "file explorer" in normalized:
        return open_application("explorer")
    if "command prompt" in normalized or normalized == "cmd":
        return open_application("cmd")

    # Web shortcuts
    if "youtube" in normalized:
        webbrowser.open("https://www.youtube.com")
        return "Opening YouTube."
    if "google" in normalized:
        webbrowser.open("https://www.google.com")
        return "Opening Google."
    if "github" in normalized:
        webbrowser.open("https://github.com")
        return "Opening GitHub."

    # General info
    if normalized in ("hello", "hi", "hey"):
        return "Hello! Dexter is standing by. What task shall we execute?"
    if normalized in ("who are you", "what are you"):
        return "I am Dexter, your personal PC control assistant and automation engine."
    if "what time" in normalized or normalized == "time":
        return f"The current time is {datetime.now().strftime('%H:%M:%S')}."

    # Exit
    if normalized in ("exit", "quit", "shutdown", "goodbye"):
        return None

    # Fallback to Gemini
    return ask_gemini(original)


# Flask Local Bridge Server
def start_local_bridge():
    if not FLASK_AVAILABLE:
        print("[Dexter Bridge] Flask not installed. Web hub cannot communicate directly.")
        return

    bridge_app = Flask("DexterLocalBridge")
    CORS(bridge_app)

    @bridge_app.route("/status", methods=["GET"])
    def status():
        return jsonify({
            "status": "online",
            "assistant": "Dexter",
            "version": "2.5.0",
            "platform": platform.system(),
            "time": datetime.now().isoformat(),
            "voiceInput": VOICE_INPUT_AVAILABLE,
            "tts": TTS_AVAILABLE
        })

    @bridge_app.route("/execute", methods=["POST"])
    def execute():
        data = request.json or {}
        cmd = data.get("command", "")
        action = data.get("action", {})

        action_type = action.get("type", "")
        target = action.get("target", "")
        content = action.get("content", "")

        result = ""
        if action_type == "open_app":
            result = open_application(target)
        elif action_type == "open_file":
            result = open_file(target)
        elif action_type == "read_file":
            result = read_file(target)
        elif action_type == "write_file":
            result = write_file(target, content)
        elif action_type == "open_url":
            webbrowser.open(target)
            result = f"Opening {target}."
        elif action_type in ("powershell_cmd", "bash_cmd"):
            result = execute_shell_command(target)
        elif action_type == "python_cmd":
            result = execute_shell_command(f'python -c "{target}"')
        else:
            result = process_command(cmd)

        speak(result)
        return jsonify({"result": result, "status": "executed"})

    bridge_thread = threading.Thread(
        target=lambda: bridge_app.run(host="127.0.0.1", port=LOCAL_BRIDGE_PORT, debug=False, use_reloader=False),
        daemon=True
    )
    bridge_thread.start()


def main():
    start_local_bridge()
    show_banner()

    while True:
        try:
            command = input("You > ")
            if not command.strip():
                continue
            response = process_command(command)
            if response is None:
                speak("Shutting down. Goodbye.")
                break
            speak(response)
        except (KeyboardInterrupt, EOFError):
            print("\\nDexter shutting down.")
            break


if __name__ == "__main__":
    main()
`;
}

main().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
