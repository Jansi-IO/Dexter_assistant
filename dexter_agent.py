"""
=============================================================================
 DEXTER: ADVANCED PC VOICE ASSISTANT & LOCAL AUTOMATION BRIDGE (J.A.R.V.I.S.)
=============================================================================
This is the desktop companion agent for Dexter. It runs on your local machine
and provides:
1. J.A.R.V.I.S. persona voice feedback via British English text-to-speech
2. Always-on continuous wake word listening ("Hey Dexter" or "Dexter")
3. Real PC execution (open apps, launch URLs, read/write files, PowerShell/Bash)
4. Offline local Qwen Ollama support (http://127.0.0.1:11434) when internet is down
5. Local HTTP bridge (port 8765) connecting directly with the Dexter Web Command Center

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
import warnings
from datetime import datetime
from pathlib import Path

# Suppress internal SDK notices or deprecation warnings
warnings.filterwarnings("ignore")

from dotenv import load_dotenv

try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

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
    tts_engine.setProperty('rate', 165)
except Exception:
    TTS_AVAILABLE = False
    tts_engine = None

# Load environment variables (.env or fallback .env.txt)
load_dotenv()
if not os.getenv("GEMINI_API_KEY") and os.path.exists(".env.txt"):
    load_dotenv(dotenv_path=".env.txt")

DEXTER_NAME = "Dexter"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
LOCAL_BRIDGE_PORT = 8765
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:latest")

# System applications lookup
WIN_APPLICATIONS = {
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "calc": "calc.exe",
    "paint": "mspaint.exe",
    "explorer": "explorer.exe",
    "cmd": "cmd.exe",
    "taskmgr": "taskmgr.exe",
    "snippingtool": "snippingtool.exe",
    "snipping": "snippingtool.exe",
}

MAC_APPLICATIONS = {
    "calculator": "Calculator",
    "terminal": "Terminal",
    "textedit": "TextEdit",
    "finder": "Finder",
}

VOICE_MUTED = False
_selected_voice_id = None

def init_tts():
    """Initializes and tunes high-quality British J.A.R.V.I.S. desktop TTS voice."""
    global tts_engine, TTS_AVAILABLE, _selected_voice_id
    if not TTS_AVAILABLE or not tts_engine:
        return
    try:
        voices = tts_engine.getProperty('voices')
        # Prioritize British English voices (e.g. en-GB, Daniel, George, Hazel, Oliver)
        if voices:
            for v in voices:
                v_name = v.name.lower()
                v_id = str(v.id).lower()
                if any(fav in v_name or fav in v_id for fav in ("en-gb", "en_gb", "british", "uk", "daniel", "george", "hazel", "oliver")):
                    tts_engine.setProperty('voice', v.id)
                    _selected_voice_id = v.id
                    break
            # Fallback to clear natural English voice if UK voice not installed
            if not _selected_voice_id:
                for v in voices:
                    v_name = v.name.lower()
                    if any(fav in v_name for fav in ("david", "alex", "samantha", "natural", "english")):
                        tts_engine.setProperty('voice', v.id)
                        _selected_voice_id = v.id
                        break
        # J.A.R.V.I.S. cadence: measured, composed
        tts_engine.setProperty('rate', 165)
        tts_engine.setProperty('volume', 1.0)
    except Exception:
        pass

init_tts()


def speak(text: str):
    """Voice output through local text-to-speech with British J.A.R.V.I.S. persona."""
    print(f"Dexter (J.A.R.V.I.S.) > {text}")
    if VOICE_MUTED:
        return
    if TTS_AVAILABLE and tts_engine:
        try:
            tts_engine.say(text)
            tts_engine.runAndWait()
        except Exception:
            try:
                # Re-initialize engine if COM/driver hung
                fresh_engine = pyttsx3.init()
                if _selected_voice_id:
                    fresh_engine.setProperty('voice', _selected_voice_id)
                fresh_engine.setProperty('rate', 165)
                fresh_engine.say(text)
                fresh_engine.runAndWait()
            except Exception:
                pass


def play_chime():
    """Play brief audio wake tone when wake word ('Dexter' or 'Hey Dexter') is detected."""
    try:
        if platform.system() == "Windows":
            import winsound
            winsound.Beep(980, 110)
            winsound.Beep(1320, 140)
        else:
            sys.stdout.write('\a')
            sys.stdout.flush()
    except Exception:
        pass


def show_banner():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    os_name = platform.system()
    print("\n" + "=" * 65)
    print("      DEXTER - J.A.R.V.I.S. DESKTOP VOICE AGENT & AUTOMATION HUB")
    print("=" * 65)
    print(f" System: {os_name} ({platform.release()})")
    print(f" Initialized: {current_time}")
    print(f" Persona: J.A.R.V.I.S. (Polite British Assistant)")
    print(f" Voice Speech: {'Available (pyttsx3 British tuning)' if TTS_AVAILABLE else 'Disabled (install pyttsx3)'}")
    print(f" Voice Input: {'Available (Microphone)' if VOICE_INPUT_AVAILABLE else 'Disabled (install SpeechRecognition)'}")
    print(f" Wake Detection: Active ('Dexter' or 'Hey Dexter')")
    print(f" Offline Fallback: Local Qwen Ollama ({OLLAMA_URL})")
    print(f" Web Hub Bridge: http://127.0.0.1:{LOCAL_BRIDGE_PORT} {'(Online)' if FLASK_AVAILABLE else '(Flask missing)'}")
    print("=" * 65)
    print("Dexter is now LIVING on your desktop with J.A.R.V.I.S. persona.")
    print("Simply say: 'Hey Dexter, open VS Code' or 'Dexter, what time is it?'")
    print("Or press Enter in this console anytime to type. Type 'exit' to quit.\n")


def open_application(app_name: str) -> str:
    app_key = app_name.strip().lower()
    system = platform.system()

    # Visual Studio Code
    if app_key in ("vscode", "vs code", "code", "visual studio code"):
        executable = shutil.which("code")
        if executable:
            subprocess.Popen([executable])
            return "Right away, sir. Launching Visual Studio Code now."
        return "I couldn't locate the 'code' executable on PATH, sir."

    # Windows
    if system == "Windows":
        if app_key in WIN_APPLICATIONS:
            subprocess.Popen([WIN_APPLICATIONS[app_key]])
            return f"Opening {app_name} for you, sir."

    # macOS
    elif system == "Darwin":
        if app_key in MAC_APPLICATIONS:
            subprocess.Popen(["open", "-a", MAC_APPLICATIONS[app_key]])
            return f"Opening {app_name} for you, sir."
        subprocess.Popen(["open", "-a", app_name])
        return f"Opening {app_name} for you, sir."

    # Linux
    elif system == "Linux":
        executable = shutil.which(app_key)
        if executable:
            subprocess.Popen([executable])
            return f"Opening {app_name} for you, sir."

    return f"I do not possess the profile to open {app_name} yet, sir."


def open_file(path_text: str) -> str:
    try:
        path = Path(path_text.strip().strip('"')).expanduser()
        if platform.system() == "Windows":
            os.startfile(str(path))
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", str(path)])
        else:
            subprocess.Popen(["xdg-open", str(path)])
        return f"Opening {path} for you, sir."
    except Exception as exc:
        return f"Couldn't access file, sir: {exc}"


def read_file(path_text: str) -> str:
    try:
        path = Path(path_text.strip().strip('"')).expanduser()
        contents = path.read_text(encoding="utf-8")
        limit = 20000
        if len(contents) > limit:
            contents = contents[:limit] + "\n\n[Displaying first 20,000 characters, sir]"
        return contents or "(The file is empty, sir.)"
    except Exception as exc:
        return f"File read error, sir: {exc}"


def write_file(path_text: str, content: str = None, must_exist: bool = False) -> str:
    try:
        path = Path(path_text.strip().strip('"')).expanduser()
        if must_exist and not path.is_file():
            return "The target file does not exist, sir."

        if not path.parent.exists():
            path.parent.mkdir(parents=True, exist_ok=True)

        if content is None:
            print(f"Writing to {path}. Enter content. Type END on its own line:")
            lines = []
            while True:
                line = input()
                if line == "END":
                    break
                lines.append(line)
            content = "\n".join(lines) + "\n"

        path.write_text(content, encoding="utf-8")
        return f"File successfully written to {path}, sir."
    except Exception as exc:
        return f"File save failed, sir: {exc}"


def execute_shell_command(command: str) -> str:
    """Safely executes a shell or powershell command with output capture."""
    try:
        res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        output = res.stdout.strip() or res.stderr.strip()
        return output or "Command completed with no output, sir."
    except Exception as exc:
        return f"Execution error, sir: {exc}"


def listen_voice() -> str:
    """Listen from microphone using SpeechRecognition for a single phrase."""
    if not VOICE_INPUT_AVAILABLE:
        return "Voice recognition library not installed. Run 'pip install SpeechRecognition pyaudio'."

    recognizer = sr.Recognizer()
    recognizer.dynamic_energy_threshold = True
    try:
        with sr.Microphone() as source:
            print("[Dexter is listening... Speak now]")
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio = recognizer.listen(source, timeout=6, phrase_time_limit=10)
            print("[Processing voice directive...]")
            text = recognizer.recognize_google(audio)
            print(f"[You said]: {text}")
            return text
    except sr.WaitTimeoutError:
        return "No speech detected (timed out)."
    except sr.UnknownValueError:
        return "Could not understand audio."
    except Exception as e:
        return f"Microphone error: {e}"


# Persistent multi-turn Gemini chat session
_gemini_client = None
_gemini_chat = None

def get_gemini_chat():
    """Initializes or returns active Chat session using recommended Chat.send_message standard."""
    global _gemini_client, _gemini_chat
    if not GENAI_AVAILABLE:
        return None, "google-genai SDK not installed."

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None, "Gemini isn't configured. Set GEMINI_API_KEY in your .env file or environment."

    if _gemini_chat is not None:
        return _gemini_chat, None

    try:
        _gemini_client = genai.Client(
            api_key=api_key,
            http_options={"timeout": 45000},
        )
        _gemini_chat = _gemini_client.chats.create(
            model=GEMINI_MODEL,
            config={
                "system_instruction": (
                    "You are Dexter, an advanced artificial intelligence desktop assistant operating with the persona, "
                    "courtesy, and sophistication of J.A.R.V.I.S. from Iron Man. "
                    "You address the user respectfully as 'sir'. You speak aloud via speech synthesis, so keep answers punchy, "
                    "polite, composed, and direct (1-2 sentences). You help control the PC, automate tasks, check systems, and answer queries."
                )
            }
        )
        return _gemini_chat, None
    except Exception as exc:
        return None, f"Gemini initialization error: {type(exc).__name__}"


def ask_gemini(command: str) -> str:
    """Send command to Gemini using Chat.send_message to eliminate AFC warnings and maintain memory."""
    chat, err = get_gemini_chat()
    if err:
        return err

    try:
        response = chat.send_message(command)
        text = response.text.strip() if response and response.text else "No response returned, sir."
        return text
    except Exception as exc:
        global _gemini_chat
        _gemini_chat = None
        try:
            retry_chat, retry_err = get_gemini_chat()
            if retry_chat:
                retry_res = retry_chat.send_message(command)
                return retry_res.text.strip() if retry_res and retry_res.text else "No response returned, sir."
        except Exception:
            pass
        return f"Gemini connection error: {type(exc).__name__}"


def ask_ollama(command: str) -> str:
    """Offline inference fallback with local Qwen Ollama model on 127.0.0.1:11434."""
    try:
        import urllib.request
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": (
                "You are Dexter, an intelligent artificial intelligence desktop assistant operating with the persona, "
                "courtesy, and sophistication of J.A.R.V.I.S. from Iron Man. "
                "Address the user respectfully as sir. Keep your spoken answers concise, polite, and direct (1-2 sentences max).\n\n"
                f"User command: {command}"
            ),
            "stream": False
        }
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=12) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                return data.get("response", "").strip() or "Instruction acknowledged, sir."
    except Exception:
        pass
    return None


def process_command(command: str) -> str:
    original = command.strip()
    normalized = original.lower()

    # Remove Dexter / JARVIS wake prefixes
    for prefix in ("hey dexter, ", "hey dexter ", "dexter, ", "dexter ", "ok dexter, ", "ok dexter ", "jarvis, ", "jarvis "):
        if normalized.startswith(prefix):
            original = original[len(prefix):].strip()
            normalized = normalized[len(prefix):].strip()
            break

    if not normalized:
        return "Yes, sir? I am listening."

    # Voice command trigger
    if normalized in ("listen", "voice", "voice mode"):
        heard = listen_voice()
        if heard and not heard.startswith("No speech") and not heard.startswith("Could not"):
            return process_command(heard)
        return heard

    # System controls
    if normalized in ("mute", "mute yourself", "mute dexter", "silence"):
        global VOICE_MUTED
        VOICE_MUTED = True
        return "Audio feedback muted, sir. Visual interface only."
    if normalized in ("unmute", "unmute yourself", "enable voice"):
        VOICE_MUTED = False
        return "Audio feedback restored, sir. Standing by."

    # Local file commands
    if normalized.startswith("read file "):
        return read_file(original[10:])
    if normalized.startswith("write file "):
        return write_file(original[11:])
    if normalized.startswith("open file "):
        return open_file(original[10:])

    # Applications
    if any(k in normalized for k in ("vscode", "vs code", "visual studio code", "open code")):
        return open_application("vscode")
    if "calculator" in normalized or "calc" in normalized:
        return open_application("calculator")
    if "notepad" in normalized:
        return open_application("notepad")
    if "paint" in normalized:
        return open_application("paint")
    if "explorer" in normalized or "file explorer" in normalized:
        return open_application("explorer")
    if "command prompt" in normalized or normalized == "cmd" or "terminal" in normalized:
        return open_application("cmd")
    if "task manager" in normalized or "taskmgr" in normalized:
        return open_application("taskmgr")
    if "screenshot" in normalized or "snipping" in normalized:
        return open_application("snippingtool")

    # Web shortcuts
    if "youtube" in normalized:
        webbrowser.open("https://www.youtube.com")
        return "Opening YouTube for you, sir."
    if "google" in normalized:
        webbrowser.open("https://www.google.com")
        return "Opening Google, sir."
    if "github" in normalized:
        webbrowser.open("https://github.com")
        return "Accessing your GitHub repositories, sir."

    # Quick System Utilities
    if "clean temp" in normalized or "flush dns" in normalized:
        if platform.system() == "Windows":
            execute_shell_command('Clear-DnsClientCache; Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue')
            return "Purged temporary cache and flushed DNS resolution, sir."
        else:
            execute_shell_command('rm -rf /tmp/* 2>/dev/null')
            return "Purged temporary cache directory, sir."

    if "lock" in normalized or "lock workstation" in normalized or "lock pc" in normalized:
        if platform.system() == "Windows":
            subprocess.Popen(["rundll32.exe", "user32.dll,LockWorkStation"])
            return "Workstation locked and secured, sir."

    # General info
    if normalized in ("hello", "hi", "hey", "hello dexter", "hello jarvis"):
        return "At your service, sir. All systems are operational. How may I assist your workstation today?"
    if normalized in ("who are you", "what are you"):
        return "I am Dexter, configured with the J.A.R.V.I.S. protocol. I live on your desktop to automate workflows and assist you on command, sir."
    if "what time" in normalized or normalized == "time":
        return f"The current time is {datetime.now().strftime('%I:%M %p')}, sir."

    # Exit
    if normalized in ("exit", "quit", "shutdown", "goodbye"):
        return None

    # 1. Try Gemini first if configured
    gemini_reply = ask_gemini(original)
    if gemini_reply and not gemini_reply.startswith("Gemini isn't configured") and not gemini_reply.startswith("Gemini connection error"):
        return gemini_reply

    # 2. Offline fallback: local Qwen Ollama
    ollama_reply = ask_ollama(original)
    if ollama_reply:
        return ollama_reply

    # 3. Rule fallback
    if gemini_reply and "isn't configured" in gemini_reply:
        return f"At your service, sir. I have registered your instruction: '{original}'. Initializing local routine."

    return gemini_reply or f"At your service, sir. Proceeding with '{original}'."


# Continuous Wake-Word Background Listener
wake_listener_active = True

def continuous_wake_listener():
    """Continuously monitors microphone for 'Dexter' or 'Hey Dexter' wake phrases in real time."""
    global wake_listener_active
    if not VOICE_INPUT_AVAILABLE:
        print("[Dexter Wake Engine] Speech recognition not available. Install 'SpeechRecognition' & 'pyaudio'.")
        return

    recognizer = sr.Recognizer()
    recognizer.dynamic_energy_threshold = True
    recognizer.energy_threshold = 400
    recognizer.pause_threshold = 0.8

    try:
        microphone = sr.Microphone()
        with microphone as source:
            print("[Dexter Wake Engine] Calibrating microphone for ambient room noise (1 sec)...")
            recognizer.adjust_for_ambient_noise(source, duration=1.0)
            print("[Dexter Wake Engine] Continuous Wake Detection ONLINE. Listening for 'Hey Dexter' or 'Dexter'...")
    except Exception as e:
        print(f"[Dexter Wake Engine] Microphone hardware initialization failed: {e}")
        return

    while wake_listener_active:
        try:
            with microphone as source:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=8)
            
            # Recognize speech
            try:
                raw_text = recognizer.recognize_google(audio)
                clean_text = raw_text.strip()
                lower_text = clean_text.lower()
                
                # Check for Wake Trigger
                wake_keywords = ("hey dexter", "dexter", "ok dexter", "hello dexter", "jarvis", "hey jarvis")
                matched_keyword = None
                for kw in wake_keywords:
                    if kw in lower_text:
                        matched_keyword = kw
                        break

                if matched_keyword:
                    play_chime()
                    print(f"\n[Wake Word Detected: '{matched_keyword}'] User said: '{clean_text}'")
                    
                    # Extract the payload after the wake keyword
                    idx = lower_text.find(matched_keyword)
                    command_payload = clean_text[idx + len(matched_keyword):].strip(" ,:.-")
                    
                    if not command_payload:
                        speak("Yes, sir? I am listening.")
                        follow_up = listen_voice()
                        if follow_up and not follow_up.startswith("No speech") and not follow_up.startswith("Could not"):
                            response = process_command(follow_up)
                            if response:
                                speak(response)
                    else:
                        response = process_command(command_payload)
                        if response:
                            speak(response)

            except sr.UnknownValueError:
                pass
            except sr.RequestError:
                pass

        except sr.WaitTimeoutError:
            pass
        except Exception:
            pass


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
            "persona": "J.A.R.V.I.S.",
            "version": "2.9.0",
            "platform": platform.system(),
            "time": datetime.now().isoformat(),
            "voiceInput": VOICE_INPUT_AVAILABLE,
            "tts": TTS_AVAILABLE,
            "wakeWordActive": wake_listener_active,
            "ollamaModel": OLLAMA_MODEL
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
            result = f"Opening {target} for you, sir."
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
    global wake_listener_active
    start_local_bridge()
    show_banner()

    # Announce voice readiness
    if TTS_AVAILABLE and not VOICE_MUTED:
        speak("Dexter J.A.R.V.I.S. protocol online and at your service, sir. Wake word detection is active.")

    # Start the continuous wake word listener in a background daemon thread
    if VOICE_INPUT_AVAILABLE:
        wake_thread = threading.Thread(target=continuous_wake_listener, daemon=True)
        wake_thread.start()

    # Interactive keyboard console loop for typing commands anytime
    while True:
        try:
            command = input("You > ")
            if not command.strip():
                continue
            response = process_command(command)
            if response is None:
                wake_listener_active = False
                speak("Shutting down workstation assistance. Goodbye, sir.")
                break
            speak(response)
        except (KeyboardInterrupt, EOFError):
            wake_listener_active = False
            print("\nDexter shutting down.")
            break


if __name__ == "__main__":
    main()
