import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface VoiceControllerProps {
  onCommandCaptured: (command: string) => void;
  isProcessing: boolean;
  isSpeaking: boolean;
  voiceMuted: boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onCommandCaptured,
  isProcessing,
  isSpeaking,
  voiceMuted,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition not supported in this browser. Please use Chrome/Edge or text input.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuousMode;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            const finalPhrase = item[0].transcript.trim();
            setTranscript(finalPhrase);
            if (finalPhrase.length > 0) {
              onCommandCaptured(finalPhrase);
            }
          } else {
            currentText += item[0].transcript;
            setTranscript(currentText);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal timeout if user was quiet
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permissions.');
        } else {
          setErrorMessage(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        if (continuousMode && !isProcessing) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (err: any) {
      setErrorMessage(`Speech init error: ${err.message}`);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [continuousMode, onCommandCaptured, isProcessing]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      setTranscript('');
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        console.warn('Recognition start error:', e);
        // Might already be active
      }
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur">
      {/* Background ambient glow when listening or speaking */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isListening
            ? 'bg-emerald-500/15 opacity-100'
            : isSpeaking
            ? 'bg-teal-500/15 opacity-100'
            : 'opacity-0'
        }`}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Voice status & transcript */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Main Mic Button */}
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all shadow-lg ${
              isListening
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 scale-105 shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/80 shadow-slate-950/50'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isListening ? 'Click to stop listening' : 'Click or speak "Hey Dexter"'}
          >
            {isListening ? (
              <Mic className="w-6 h-6 animate-pulse" />
            ) : (
              <MicOff className="w-6 h-6 text-slate-400" />
            )}

            {/* Pulsing ring during listening */}
            {isListening && (
              <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/50 animate-ping pointer-events-none" />
            )}
          </button>

          {/* Transcript / Instructions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isListening
                  ? 'Listening for voice command...'
                  : isProcessing
                  ? 'Dexter analyzing intent...'
                  : isSpeaking
                  ? 'Dexter speaking...'
                  : 'Voice Command Ready'}
              </span>

              {/* Dynamic waveform visualizer */}
              {(isListening || isSpeaking) && (
                <div className="flex items-center gap-1 h-3.5 px-1">
                  <span className="w-1 bg-emerald-400 rounded-full animate-voice-wave [animation-delay:0.1s]" />
                  <span className="w-1 bg-teal-400 rounded-full animate-voice-wave [animation-delay:0.3s]" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-voice-wave [animation-delay:0.2s]" />
                  <span className="w-1 bg-teal-300 rounded-full animate-voice-wave [animation-delay:0.4s]" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-voice-wave [animation-delay:0.15s]" />
                </div>
              )}
            </div>

            <p className="text-sm font-medium text-slate-200 truncate">
              {transcript ? (
                <span className="text-emerald-300 italic">"{transcript}"</span>
              ) : isListening ? (
                <span className="text-slate-400">Say: "Open VS Code", "Clean temp files", or "What time is it?"</span>
              ) : (
                <span className="text-slate-400">
                  Tap microphone or type command below to trigger PC routines
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Voice Settings */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setContinuousMode(!continuousMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              continuousMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title="Keep microphone active continuously"
          >
            Continuous Wake
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Dexter Voice: {voiceMuted ? 'Muted' : 'Puck (Active)'}</span>
          </div>
        </div>
      </div>

      {/* Error alert if mic was blocked */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
