import React, { useState, useRef } from 'react';
import {
  Globe,
  MapPin,
  Mic,
  Square,
  Copy,
  Check,
  Music,
  Video,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Send,
  Upload,
  Play,
  Film,
} from 'lucide-react';
import {
  searchWithGoogle,
  lookupWithGoogleMaps,
  transcribeAudioWithGemini,
  animateVideoVeo,
  createOrEditImage,
  generateMediaItem,
} from '../services/dexterApi';

interface GroundingStudioProps {
  onSendToDexterCommand: (cmd: string) => void;
  userId?: string;
}

type StudioTab = 'search' | 'maps' | 'transcribe' | 'media';

export const GroundingStudio: React.FC<GroundingStudioProps> = ({
  onSendToDexterCommand,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('search');

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{ answer: string; sources: string[] } | null>(null);

  // Maps Grounding State
  const [mapsQuery, setMapsQuery] = useState('');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResult, setMapsResult] = useState<{ answer: string } | null>(null);

  // Audio Transcriber State
  const [isRecording, setIsRecording] = useState(false);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Media Studio State
  const [mediaType, setMediaType] = useState<'music' | 'video' | 'image'>('music');
  const [mediaPrompt, setMediaPrompt] = useState('');
  const [mediaDuration, setMediaDuration] = useState<'30s' | 'full'>('30s');
  const [mediaAspectRatio, setMediaAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaResult, setMediaResult] = useState<any | null>(null);
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');

  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Execute Search Grounding (gemini-3.8-flash)
  const handleRunSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await searchWithGoogle(searchQuery.trim());
      setSearchResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  // Execute Maps Grounding (gemini-3.8-flash)
  const handleRunMaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapsQuery.trim() || mapsLoading) return;
    setMapsLoading(true);
    try {
      const res = await lookupWithGoogleMaps(mapsQuery.trim());
      setMapsResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setMapsLoading(false);
    }
  };

  // Audio Recording with gemini-3.5-transcribe
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          if (base64String) {
            setTranscribeLoading(true);
            try {
              const res = await transcribeAudioWithGemini(base64String, 'audio/webm');
              setTranscriptResult(res.transcript);
            } catch (err) {
              console.error('Transcription error:', err);
            } finally {
              setTranscribeLoading(false);
            }
          }
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Image file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedImagePreview(result);
      setUploadedImageBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  // Media Generation Handler (Veo 3 video, Lyria music, Gemini-nano-banana image)
  const handleGenerateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaPrompt.trim() || mediaLoading) return;
    setMediaLoading(true);

    try {
      if (mediaType === 'video') {
        const res = await animateVideoVeo({
          prompt: mediaPrompt.trim(),
          imageBase64: uploadedImageBase64 || undefined,
          aspectRatio: mediaAspectRatio,
        });
        setMediaResult(res);
      } else if (mediaType === 'image') {
        const res = await createOrEditImage({
          prompt: mediaPrompt.trim(),
          imageBase64: uploadedImageBase64 || undefined,
          mode: imageMode,
        });
        setMediaResult(res);
      } else {
        // Music (Lyria)
        const res = await generateMediaItem({
          mediaType: 'music',
          prompt: mediaPrompt.trim(),
          duration: mediaDuration,
        });
        setMediaResult(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Switcher */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>Dexter Intelligence & Grounding Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time web search (gemini-3.8-flash), Google Maps places, speech transcription, and Veo / Lyria / Image generation.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-slate-800 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Search</span>
          </button>

          <button
            onClick={() => setActiveTab('maps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'maps'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Google Maps</span>
          </button>

          <button
            onClick={() => setActiveTab('transcribe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'transcribe'
                ? 'bg-slate-800 text-purple-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Transcribe Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'media'
                ? 'bg-slate-800 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Veo / Lyria / Image</span>
          </button>
        </div>
      </div>

      {/* 1. Google Search Grounding Tab (gemini-3.8-flash) */}
      {activeTab === 'search' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Google Search Grounding
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
              gemini-3.8-flash + googleSearch
            </span>
          </div>

          <form onSubmit={handleRunSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Latest Python 3.13 features, Windows 11 terminal commands, current tech documentation..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim() || searchLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              <span>Search Web</span>
            </button>
          </form>

          {searchResult && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-emerald-400">Grounded Search Response (gemini-3.8-flash)</span>
                <button
                  onClick={() => handleCopy(searchResult.answer)}
                  className="flex items-center gap-1 hover:text-slate-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {searchResult.answer}
              </p>

              {searchResult.sources && searchResult.sources.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">Sources:</span>
                  {searchResult.sources.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Google Maps Grounding Tab (gemini-3.8-flash) */}
      {activeTab === 'maps' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Google Maps Grounding
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              gemini-3.8-flash + googleMaps
            </span>
          </div>

          <form onSubmit={handleRunMaps} className="flex gap-2">
            <input
              type="text"
              value={mapsQuery}
              onChange={(e) => setMapsQuery(e.target.value)}
              placeholder="e.g. Best coffee shops near Seattle Center, Computer hardware stores in Austin, TX..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={!mapsQuery.trim() || mapsLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              {mapsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              <span>Query Places</span>
            </button>
          </form>

          {mapsResult && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-teal-400">Maps Grounded Data (gemini-3.8-flash)</span>
                <button
                  onClick={() => handleCopy(mapsResult.answer)}
                  className="flex items-center gap-1 hover:text-slate-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {mapsResult.answer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Audio Transcriber Tab (gemini-3.5-transcribe) */}
      {activeTab === 'transcribe' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Audio Transcription Engine
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-400 border border-slate-700">
              gemini-3.5-transcribe
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-semibold text-slate-200">
                {isRecording ? 'Recording audio from microphone...' : 'Microphone Transcriber Ready'}
              </div>
              <p className="text-xs text-slate-400">
                Click Record, speak into your mic, and click Stop. Dexter will transcribe your voice using gemini-3.5-transcribe.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-semibold animate-pulse transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop & Transcribe</span>
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={transcribeLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Record Audio</span>
                </button>
              )}
            </div>
          </div>

          {transcribeLoading && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Transcribing audio with gemini-3.5-transcribe...</span>
            </div>
          )}

          {transcriptResult && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-purple-400">Verbatim Transcription</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(transcriptResult)}
                    className="flex items-center gap-1 hover:text-slate-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => onSendToDexterCommand(transcriptResult)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Run as Command</span>
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
                "{transcriptResult}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Media Studio: Veo 3 Video, Lyria Music & Gemini-nano-banana Image */}
      {activeTab === 'media' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Veo 3 Video & Media Creation Suite
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              veo-3.1-fast-generate-preview · lyria · gemini-nano-banana-2.1
            </span>
          </div>

          {/* Media Sub-tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMediaType('video')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                mediaType === 'video'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Veo 3 Video (Photo & Text)</span>
            </button>

            <button
              onClick={() => setMediaType('image')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                mediaType === 'image'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>gemini-nano-banana-2.1</span>
            </button>

            <button
              onClick={() => setMediaType('music')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                mediaType === 'music'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Lyria Music (30s / Full)</span>
            </button>
          </div>

          {/* Video / Image File Upload Dropzone */}
          {(mediaType === 'video' || mediaType === 'image') && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  {mediaType === 'video'
                    ? 'Upload Photo to Animate into Video (Veo 3)'
                    : 'Reference Photo for Image Generation / Editing'}
                </span>
                {uploadedImagePreview && (
                  <button
                    onClick={() => {
                      setUploadedImagePreview(null);
                      setUploadedImageBase64(null);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    Clear Image
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Choose Image File</span>
                </button>

                {uploadedImagePreview ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                    />
                    <span className="text-[11px] text-emerald-400 font-mono">Image attached</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">
                    Optional: Attach photo to animate with Veo, or create directly from text prompt.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleGenerateMedia} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={mediaPrompt}
                onChange={(e) => setMediaPrompt(e.target.value)}
                placeholder={
                  mediaType === 'video'
                    ? 'e.g. Cinematic flyover of futuristic holographic computer terminal in neon rain...'
                    : mediaType === 'image'
                    ? 'e.g. Cyberpunk Dexter personal desktop assistant robotic mascot with glowing cyan visor...'
                    : 'e.g. Ambient electronic synthesizer melody for coding concentration...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />

              {mediaType === 'video' && (
                <select
                  value={mediaAspectRatio}
                  onChange={(e) => setMediaAspectRatio(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none"
                >
                  <option value="16:9">16:9 Landscape (veo-3.1-fast-generate-preview)</option>
                  <option value="9:16">9:16 Portrait (veo-3.1-fast-generate-preview)</option>
                </select>
              )}

              {mediaType === 'music' && (
                <select
                  value={mediaDuration}
                  onChange={(e) => setMediaDuration(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                >
                  <option value="30s">lyria-3-clip-preview (30s clip)</option>
                  <option value="full">lyria-3-pro-preview (Full Track)</option>
                </select>
              )}

              {mediaType === 'image' && (
                <select
                  value={imageMode}
                  onChange={(e) => setImageMode(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                >
                  <option value="create">Create New Image</option>
                  <option value="edit">Edit Uploaded Image</option>
                </select>
              )}

              <button
                type="submit"
                disabled={!mediaPrompt.trim() || mediaLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex-shrink-0"
              >
                {mediaLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate {mediaType.toUpperCase()}</span>
              </button>
            </div>
          </form>

          {mediaResult && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-semibold text-amber-400">{mediaResult.title || mediaResult.videoTitle}</span>
                <span className="font-mono text-slate-500">{mediaResult.model}</span>
              </div>
              <p className="text-slate-300">{mediaResult.description}</p>

              {mediaResult.sampleVideoUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-800 mt-2">
                  <video
                    src={mediaResult.sampleVideoUrl}
                    controls
                    className="w-full max-h-64 object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
