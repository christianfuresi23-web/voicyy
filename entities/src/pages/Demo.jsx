import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Square, Volume2 } from 'lucide-react';
import VoicyyLogo from '@/components/VoicyyLogo';

import agentConfig from '../../../voicyy-demo.json';

export default function Demo() {
  const agentName = agentConfig?.name || 'Voicyy';
  const firstMessage = agentConfig?.conversation_config?.agent?.first_message || 'Ciao, come posso aiutarti?';
  const voiceId = agentConfig?.conversation_config?.tts?.voice_id || '';
  const modelId = agentConfig?.conversation_config?.tts?.model_id || 'eleven_multilingual_v2';

  const [isLoading, setIsLoading] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [error, setError] = React.useState('');
  const audioRef = React.useRef(null);
  const abortRef = React.useRef(null);

  const stop = React.useCallback(() => {
    abortRef.current?.abort?.();
    abortRef.current = null;
    setIsLoading(false);
    setError('');
    setIsPlaying(false);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
  }, []);

  const playIntro = React.useCallback(async () => {
    setError('');
    if (!voiceId) {
      setError('Voice ID mancante nel JSON.');
      return;
    }
    stop();
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const qs = new URLSearchParams({
        text: firstMessage,
        voice_id: voiceId,
        model_id: modelId,
      });
      const resp = await fetch(`/api/tts?${qs.toString()}`, { signal: controller.signal });
      if (!resp.ok) {
        const details = await resp.json().catch(() => ({}));
        throw new Error(details?.error || details?.details || 'TTS non disponibile');
      }
      const blob = await resp.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (e) {
      if (e?.name === 'AbortError') return;
      setError(e?.message || 'Errore TTS');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [firstMessage, modelId, stop, voiceId]);

  React.useEffect(() => () => stop(), [stop]);

  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 bg-white border-b border-gray-100/80">
        <div className="h-full max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <div className="hidden sm:block">
              <VoicyyLogo size="sm" />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Powered by <span className="font-semibold"><span className="text-[#00b4d8]">voicy</span>y</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">Demo</p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mt-3">
              {agentName}
            </h1>
            <p className="text-gray-500 mt-4 leading-relaxed">
              Ascolta il messaggio di benvenuto dell’agente. Interfaccia Voicyy (bianco + azzurro), senza branding esterno.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={playIntro}
                disabled={isLoading || isPlaying}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0077b6] hover:bg-[#005f8f] disabled:opacity-60 text-white text-sm font-semibold transition-all"
              >
                <Play className="w-4 h-4" />
                Riproduci intro
              </button>
              <button
                type="button"
                onClick={stop}
                disabled={!isLoading && !isPlaying}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 hover:border-[#0077b6] disabled:opacity-60 text-gray-700 text-sm font-semibold transition-all"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Volume2 className="w-4 h-4 text-[#0077b6]" />
                Testo intro
              </div>
              <p className="mt-3 text-gray-700 leading-relaxed">
                {firstMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-60 bg-gradient-to-br from-[#00b4d8] to-[#0077b6] ${isLoading || isPlaying ? 'animate-pulse' : ''}`} />
              <div className={`absolute inset-6 rounded-full bg-white/70 backdrop-blur-xl border border-gray-100 ${isLoading || isPlaying ? 'animate-pulse' : ''}`} />
              <div className={`absolute inset-10 rounded-full bg-gradient-to-br from-[#e8f4fc] via-white to-[#e8f4fc] border border-gray-100 shadow-[0_30px_80px_rgba(0,119,182,0.18)] ${isLoading || isPlaying ? 'animate-pulse' : ''}`} />
              <div className={`absolute inset-0 rounded-full ${isLoading || isPlaying ? 'shadow-[0_0_0_14px_rgba(0,180,216,0.10)]' : ''}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">Voicyy</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">Demo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
