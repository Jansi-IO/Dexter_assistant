import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  RefreshCw,
  User,
  Terminal,
  Play,
  Pause,
} from 'lucide-react';
import { chatLiveConversation } from '../services/dexterApi';

interface LiveMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  audioBase64?: string | null;
}

interface LiveVoiceSessionProps {
  voiceMuted: boolean;
}

export const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({ voiceMuted }) => {
  const [messages, setMessages] = useState<LiveMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Dexter Live Voice API initialized. I'm connected to the real-time audio pipeline. What can I do for you?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition for live voice input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: LiveMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const response = await chatLiveConversation(textToSend.trim(), history);

      const modelMsg: LiveMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString(),
        audioBase64: response.audioBase64,
      };

      setMessages((prev) => [...prev, modelMsg]);

      // Play audio if available and not muted
      if (response.audioBase64 && !voiceMuted) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(`data:audio/wav;base64,${response.audioBase64}`);
        audioRef.current = audio;
        audio.onplay = () => setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.play().catch(() => {});
      }
    } catch (err) {
      console.error('Live voice conversation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold text-slate-100">Live Voice Conversation</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              gemini-3.8-live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time interactive speech session with low-latency responses and voice feedback.
          </p>
        </div>

        {/* Live Audio Visualizer Orb */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all ${
              isPlayingAudio
                ? 'bg-emerald-500/20 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/30'
                : isListening
                ? 'bg-teal-500/20 border-teal-400 animate-pulse'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            {isPlayingAudio ? (
              <Volume2 className="w-5 h-5 text-emerald-400 animate-bounce" />
            ) : isListening ? (
              <Mic className="w-5 h-5 text-teal-400 animate-pulse" />
            ) : (
              <Radio className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Conversation Feed */}
      <div className="h-80 overflow-y-auto space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 border border-slate-700 text-emerald-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
              </div>

              <div
                className={`p-3 rounded-xl text-xs ${
                  isUser
                    ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-100'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">
                    {isUser ? 'You' : 'Dexter Live'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>Dexter is formulating response...</span>
          </div>
        )}
      </div>

      {/* Input controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          disabled={isProcessing}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse shadow-lg shadow-red-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title={isListening ? 'Stop listening' : 'Start microphone'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex-1 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder="Talk with Dexter in live voice mode..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Speak</span>
          </button>
        </form>
      </div>
    </div>
  );
};
