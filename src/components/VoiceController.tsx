import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface VoiceControllerProps {
  onCommandCaptured: (command: string) => void;
  isProcessing: boolean;
  isSpeaking: boolean;
  voiceMuted: boolean;
  onListeningChange?: (listening: boolean) => void;
  onTranscriptChange?: (text: string) => void;
  triggerToggleRef?: React.MutableRefObject<(() => void) | null>;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onCommandCaptured,
  isProcessing,
  isSpeaking,
  voiceMuted,
  onListeningChange,
  onTranscriptChange,
  triggerToggleRef,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Sync listening state to parent
  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  // Sync transcript to parent
  useEffect(() => {
    onTranscriptChange?.(transcript);
  }, [transcript, onTranscriptChange]);

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
              const lower = finalPhrase.toLowerCase();
              // Check wake word if in continuous mode or strip prefixes
              if (continuousMode) {
                const wakeKeywords = ['hey dexter', 'dexter', 'ok dexter'];
                const matched = wakeKeywords.find((kw) => lower.includes(kw));
                if (matched) {
                  const idx = lower.indexOf(matched);
                  const commandAfter = finalPhrase.slice(idx + matched.length).replace(/^[,\s.:-]+/, '').trim();
                  if (commandAfter) {
                    onCommandCaptured(commandAfter);
                  } else {
                    onCommandCaptured('hello');
                  }
                }
              } else {
                onCommandCaptured(finalPhrase);
              }
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

  // Expose toggleListening via ref for external triggers like DexterOrb
  useEffect(() => {
    if (triggerToggleRef) {
      triggerToggleRef.current = toggleListening;
    }
    return () => {
      if (triggerToggleRef) {
        triggerToggleRef.current = null;
      }
    };
  });

  return (
    <div className="bg-[#0e0406]/90 border border-red-950/90 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur shadow-xl shadow-red-950/40">
      {/* Background ambient glow when listening or speaking */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isListening
            ? 'bg-red-600/20 opacity-100'
            : isSpeaking
            ? 'bg-rose-600/20 opacity-100'
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
                ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-800 text-white scale-105 shadow-red-600/40 border border-red-400/60'
                : 'bg-[#150508] text-red-200 hover:bg-red-950/60 hover:text-white border border-red-900/60 shadow-red-950/50'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isListening ? 'Click to stop listening' : 'Click or speak "Hey Dexter"'}
          >
            {isListening ? (
              <Mic className="w-6 h-6 animate-pulse text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-red-400/80" />
            )}

            {/* Pulsing ring during listening */}
            {isListening && (
              <span className="absolute -inset-1 rounded-2xl border-2 border-red-500/60 animate-ping pointer-events-none" />
            )}
          </button>

          {/* Transcript / Instructions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400 font-mono">
                {isListening
                  ? 'Listening for voice directive...'
                  : isProcessing
                  ? 'Dexter analyzing intent...'
                  : isSpeaking
                  ? 'Dexter transmitting speech...'
                  : 'Voice Command Ready'}
              </span>

              {/* Dynamic waveform visualizer */}
              {(isListening || isSpeaking) && (
                <div className="flex items-center gap-1 h-3.5 px-1">
                  <span className="w-1 bg-red-500 rounded-full animate-voice-wave [animation-delay:0.1s]" />
                  <span className="w-1 bg-rose-400 rounded-full animate-voice-wave [animation-delay:0.3s]" />
                  <span className="w-1 bg-red-500 rounded-full animate-voice-wave [animation-delay:0.2s]" />
                  <span className="w-1 bg-rose-300 rounded-full animate-voice-wave [animation-delay:0.4s]" />
                  <span className="w-1 bg-red-500 rounded-full animate-voice-wave [animation-delay:0.15s]" />
                </div>
              )}
            </div>

            <p className="text-sm font-medium text-red-100 truncate font-mono">
              {transcript ? (
                <span className="text-red-300 italic">"{transcript}"</span>
              ) : isListening ? (
                <span className="text-red-200/90">
                  {continuousMode ? 'Always listening: Say "Dexter" or "Hey Dexter"...' : 'Listening: Speak your command now...'}
                </span>
              ) : (
                <span className="text-red-300/70">
                  Tap microphone or say "Hey Dexter" with Continuous Wake enabled
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
                ? 'bg-red-950/60 text-red-300 border-red-700/60 shadow-sm'
                : 'bg-[#150508] text-red-300/70 border-red-950 hover:text-red-100 hover:border-red-800'
            }`}
            title="Keep microphone active continuously"
          >
            Continuous Wake
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#150508] border border-red-950 text-xs text-red-300/80">
            <Volume2 className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-200">Voice: {voiceMuted ? 'Muted' : 'J.A.R.V.I.S. (British)'}</span>
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
