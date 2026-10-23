import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Terminal,
  Cpu,
  Dna,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { sendMultiTurnChat } from '../services/dexterApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export const GeminiChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-chat',
      role: 'model',
      text: "Greetings. I am Dexter's Multi-Turn Gemini Core. I can switch personas and models dynamically based on task complexity. How can I assist your engineering or research workflow today?",
      timestamp: new Date().toLocaleTimeString(),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<
    'pc_engineer' | 'bioscience_researcher' | 'workflow_architect' | 'general_assistant'
  >('general_assistant');

  const [selectedModel, setSelectedModel] = useState<
    'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'
  >('gemini-3.8-flash');

  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await sendMultiTurnChat({
        message: userText,
        history: historyPayload,
        role: selectedRole,
        model: selectedModel,
      });

      const modelMsg: ChatMessage = {
        id: `mdl-${Date.now()}`,
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: res.modelUsed,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `Error connecting to model: ${err.message || String(err)}. Please try again.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'model',
        text: `Conversation history reset. Ready in ${selectedRole.replace('_', ' ')} mode using ${selectedModel}.`,
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur flex flex-col h-[650px] shadow-2xl">
      {/* Header with Role and Model Switchers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">
              Dexter Multi-Turn Chatbot
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {selectedModel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Preserves multi-turn state, customized roles, and dynamic model routing.
          </p>
        </div>

        {/* Role & Model Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Persona selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-slate-500">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="general_assistant" className="bg-slate-900 text-slate-200">General Assistant</option>
              <option value="pc_engineer" className="bg-slate-900 text-slate-200">PC & Terminal Engineer</option>
              <option value="bioscience_researcher" className="bg-slate-900 text-slate-200">Bioscience Researcher</option>
              <option value="workflow_architect" className="bg-slate-900 text-slate-200">Workflow Architect</option>
            </select>
          </div>

          {/* Model selection */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-slate-500">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="bg-transparent text-emerald-300 font-mono font-medium focus:outline-none cursor-pointer"
            >
              <option value="gemini-4-argon" className="bg-slate-900 text-slate-200">gemini-4-argon (Complex)</option>
              <option value="gemini-3.8-flash" className="bg-slate-900 text-slate-200">gemini-3.8-flash (General)</option>
              <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-slate-200">gemini-3.1-flash-lite (Fast)</option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
            title="Reset conversation thread"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Chat Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[88%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 border border-slate-700 text-emerald-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm space-y-2 ${
                  isUser
                    ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-100'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'You' : 'Dexter'}
                    </span>
                    {!isUser && msg.modelUsed && (
                      <span className="font-mono text-emerald-400">({msg.modelUsed})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-slate-200"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Dexter ({selectedModel}) is thinking...</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="pt-3 border-t border-slate-800 flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading}
          placeholder={`Ask Dexter anything in ${selectedRole.replace('_', ' ')} mode...`}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
