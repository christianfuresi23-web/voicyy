import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Volume2, VolumeX, PlugZap, Plug } from 'lucide-react';
import VoicyyLogo from '@/components/VoicyyLogo';

export default function Demo() {
  const [config, setConfig] = React.useState(null);
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState('');
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [audioMode, setAudioMode] = React.useState('tts');
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [agentSampleRate, setAgentSampleRate] = React.useState(16000);

  const wsRef = React.useRef(null);
  const audioCtxRef = React.useRef(null);
  const nextPlayTimeRef = React.useRef(0);
  const sourcesRef = React.useRef([]);
  const speakingTimeoutRef = React.useRef(null);
  const ttsAudioRef = React.useRef(null);

  const decodeBase64 = React.useCallback((base64) => {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }, []);

  const parseSampleRate = React.useCallback((format) => {
    const m = String(format || '').match(/pcm_(\d+)/);
    const n = m?.[1] ? Number(m[1]) : NaN;
    return Number.isFinite(n) ? n : 16000;
  }, []);

  const ensureAudioContext = React.useCallback(async () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxRef.current.state !== 'running') {
      try {
        await audioCtxRef.current.resume();
      } catch {}
    }
    return audioCtxRef.current;
  }, []);

  const stopAudio = React.useCallback(() => {
    const sources = sourcesRef.current;
    sourcesRef.current = [];
    for (const s of sources) {
      try {
        s.stop(0);
      } catch {}
    }
    nextPlayTimeRef.current = 0;
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
      } catch {}
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current.src = '';
      ttsAudioRef.current = null;
    }
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const normalizeForSpeech = React.useCallback((text) => {
    const t = String(text || '');
    return t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, (email) => {
      return email
        .replace(/@/g, ' chiocciola ')
        .replace(/\./g, ' punto ')
        .replace(/_/g, ' underscore ')
        .replace(/-/g, ' trattino ');
    });
  }, []);

  const playTts = React.useCallback(async (text) => {
    const cfg = config;
    const voiceId = cfg?.tts?.voice_id;
    const modelId = cfg?.tts?.model_id;
    const qs = new URLSearchParams({
      text: normalizeForSpeech(text),
      ...(voiceId ? { voice_id: voiceId } : null),
      ...(modelId ? { model_id: modelId } : null),
      ...(cfg?.tts?.stability != null ? { stability: String(cfg.tts.stability) } : null),
      ...(cfg?.tts?.similarity_boost != null ? { similarity_boost: String(cfg.tts.similarity_boost) } : null),
      ...(cfg?.tts?.speed != null ? { speed: String(cfg.tts.speed) } : null),
      ...(cfg?.tts?.optimize_streaming_latency != null ? { optimize_streaming_latency: String(cfg.tts.optimize_streaming_latency) } : null),
    });

    const resp = await fetch(`/api/tts?${qs.toString()}`);
    if (!resp.ok) {
      const details = await resp.json().catch(() => ({}));
      const message = details?.details || details?.error || 'TTS non disponibile';
      throw new Error(message);
    }
    const blob = await resp.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    ttsAudioRef.current = audio;
    setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(audioUrl);
      if (ttsAudioRef.current === audio) ttsAudioRef.current = null;
    };
    await audio.play();
  }, [config, normalizeForSpeech]);

  const playPcm16Chunk = React.useCallback(async (base64Audio) => {
    const ctx = await ensureAudioContext();
    const buf = decodeBase64(base64Audio);
    const view = new DataView(buf);
    const samples = new Float32Array(view.byteLength / 2);
    for (let i = 0; i < samples.length; i += 1) {
      const s = view.getInt16(i * 2, true);
      samples[i] = Math.max(-1, Math.min(1, s / 32768));
    }

    const audioBuffer = ctx.createBuffer(1, samples.length, agentSampleRate);
    audioBuffer.copyToChannel(samples, 0);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current || ctx.currentTime);
    source.start(startAt);
    nextPlayTimeRef.current = startAt + audioBuffer.duration;

    sourcesRef.current.push(source);
    source.onended = () => {
      sourcesRef.current = sourcesRef.current.filter((x) => x !== source);
    };

    setIsSpeaking(true);
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    speakingTimeoutRef.current = setTimeout(() => setIsSpeaking(false), 700);
  }, [agentSampleRate, decodeBase64, ensureAudioContext]);

  const loadConfig = React.useCallback(async () => {
    const resp = await fetch('/api/demo-config');
    if (!resp.ok) {
      const details = await resp.json().catch(() => ({}));
      throw new Error(details?.details || details?.error || 'Config non disponibile');
    }
    const data = await resp.json().catch(() => null);
    if (!data?.agent_id) throw new Error('agent_id mancante nel JSON');
    setConfig(data);
    return data;
  }, []);

  const disconnect = React.useCallback(() => {
    try {
      wsRef.current?.close?.();
    } catch {}
    wsRef.current = null;
    setStatus('idle');
    stopAudio();
  }, [stopAudio]);

  const connect = React.useCallback(async () => {
    setError('');
    setStatus('connecting');
    stopAudio();
    try {
      const cfg = config || (await loadConfig());
      const resp = await fetch('/api/convai-signed-url');
      if (!resp.ok) {
        const details = await resp.json().catch(() => ({}));
        throw new Error(details?.details?.error || details?.details || details?.error || 'Impossibile avviare la demo');
      }
      const { signed_url: signedUrl } = await resp.json();
      if (!signedUrl) throw new Error('signed_url mancante');

      const ws = new WebSocket(signedUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        await ensureAudioContext();
        setStatus('connected');
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          conversation_config_override: {
            conversation: { text_only: false },
          },
        }));
      };

      ws.onclose = () => {
        if (wsRef.current === ws) disconnect();
      };

      ws.onerror = () => {
        setError('Connessione non riuscita');
        disconnect();
      };

      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        const type = msg?.type;

        if (type === 'ping') {
          const eventId = msg?.ping_event?.event_id ?? msg?.event_id;
          try {
            ws.send(JSON.stringify({ type: 'pong', event_id: eventId }));
          } catch {}
          return;
        }

        if (type === 'conversation_initiation_metadata') {
          const fmt = msg?.conversation_initiation_metadata_event?.agent_output_audio_format;
          if (fmt) setAgentSampleRate(parseSampleRate(fmt));
          if (cfg?.first_message) {
            setMessages((m) => (m.length ? m : [{ role: 'agent', text: cfg.first_message }]));
          }
          return;
        }

        if (type === 'agent_response') {
          const text = msg?.agent_response_event?.agent_response;
          if (text) {
            setMessages((m) => [...m, { role: 'agent', text }]);
            if (audioEnabled && audioMode === 'tts') {
              stopAudio();
              playTts(text).catch((e) => setError(e?.message || 'Errore TTS'));
            }
          }
          return;
        }

        if (type === 'audio') {
          const b64 = msg?.audio_event?.audio_base_64;
          if (audioEnabled && audioMode === 'agent' && b64) playPcm16Chunk(b64);
        }
      };
    } catch (e) {
      setError(e?.message || 'Errore');
      disconnect();
    }
  }, [audioEnabled, config, disconnect, ensureAudioContext, loadConfig, parseSampleRate, playPcm16Chunk, stopAudio]);

  const sendMessage = React.useCallback(() => {
    const text = String(input || '').trim();
    if (!text) return;
    if (status !== 'connected' || !wsRef.current) {
      setError('Connettiti prima alla demo');
      return;
    }
    setError('');
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    stopAudio();
    try {
      wsRef.current.send(JSON.stringify({ type: 'user_message', text }));
    } catch {
      setError('Invio messaggio non riuscito');
    }
  }, [input, status, stopAudio]);

  React.useEffect(() => {
    loadConfig().catch(() => {});
    return () => disconnect();
  }, [disconnect, loadConfig]);

  const agentName = config?.name || 'Voicyy';
  const orb1 = config?.colors?.orb_1 || '#00b4d8';
  const orb2 = config?.colors?.orb_2 || '#0077b6';

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">Demo</p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mt-3">
              {agentName}
            </h1>
            <p className="text-gray-500 mt-4 leading-relaxed">
              Chatta con l’agente e ascolta la voce in tempo reale. Interfaccia Voicyy (bianco + azzurro), senza pagine esterne.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {status !== 'connected' ? (
                <button
                  type="button"
                  onClick={connect}
                  disabled={status === 'connecting'}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0077b6] hover:bg-[#005f8f] disabled:opacity-60 text-white text-sm font-semibold transition-all"
                >
                  <PlugZap className="w-4 h-4" />
                  {status === 'connecting' ? 'Connessione...' : 'Avvia demo'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={disconnect}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 hover:border-[#0077b6] text-gray-700 text-sm font-semibold transition-all"
                >
                  <Plug className="w-4 h-4" />
                  Disconnetti
                </button>
              )}

              <button
                type="button"
                onClick={() => setAudioEnabled((v) => !v)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 hover:border-[#0077b6] text-gray-700 text-sm font-semibold transition-all"
              >
                {audioEnabled ? <Volume2 className="w-4 h-4 text-[#0077b6]" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                Audio {audioEnabled ? 'ON' : 'OFF'}
              </button>

            <button
              type="button"
              onClick={() => { setAudioMode((m) => (m === 'tts' ? 'agent' : 'tts')); stopAudio(); }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 hover:border-[#0077b6] text-gray-700 text-sm font-semibold transition-all"
            >
              Voce: {audioMode === 'tts' ? 'Voicyy' : 'Agent'}
            </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words">
                {error}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Chat</div>
                <div className={`text-xs font-semibold ${status === 'connected' ? 'text-green-700' : status === 'connecting' ? 'text-amber-700' : 'text-gray-500'}`}>
                  {status === 'connected' ? 'Online' : status === 'connecting' ? 'Connessione...' : 'Offline'}
                </div>
              </div>
              <div className="px-5 py-4 space-y-3 max-h-[420px] overflow-auto">
                {messages.length === 0 ? (
                  <div className="text-sm text-gray-500">Avvia la demo per iniziare.</div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${m.role === 'user' ? 'bg-[#0077b6] text-white' : 'bg-gray-50 text-gray-800 border border-gray-100'} px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed`}>
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-[16px] md:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0077b6]/20 focus:border-[#0077b6] transition-all"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0077b6] hover:bg-[#005f8f] text-white text-sm font-semibold transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-60 ${isSpeaking ? 'animate-pulse' : ''}`} style={{ background: `linear-gradient(135deg, ${orb1}, ${orb2})` }} />
              <div className={`absolute inset-6 rounded-full bg-white/70 backdrop-blur-xl border border-gray-100 ${isSpeaking ? 'animate-pulse' : ''}`} />
              <div className={`absolute inset-10 rounded-full border border-gray-100 shadow-[0_30px_80px_rgba(0,119,182,0.18)] ${isSpeaking ? 'animate-pulse' : ''}`} style={{ background: 'linear-gradient(135deg, #e8f4fc, #ffffff, #e8f4fc)' }} />
              <div className={`absolute inset-0 rounded-full ${isSpeaking ? 'shadow-[0_0_0_14px_rgba(0,180,216,0.10)]' : ''}`} />
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
