import React, { useState, useMemo, useEffect } from 'react';
import { llmOptions, ttsOptions, telephonyOptions, getPricePerMinute } from '@/data/pricingData';

export default function PricingCalculator({ onConfigChange }) {
  const [selectedLLM, setSelectedLLM] = useState('Claude 4.6 sonnet');
  const [selectedTTS, setSelectedTTS] = useState('Elevenlabs Voices');
  const [selectedTelephony, setSelectedTelephony] = useState('Twilio/Telnyx');
  const [minutes, setMinutes] = useState(1200);

  const pricePerMin = useMemo(() => {
    return getPricePerMinute(selectedLLM, selectedTTS, selectedTelephony);
  }, [selectedLLM, selectedTTS, selectedTelephony]);

  const totalMonthly = useMemo(() => {
    return parseFloat((pricePerMin * minutes).toFixed(2));
  }, [pricePerMin, minutes]);

  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({ llm: selectedLLM, tts: selectedTTS, telephony: selectedTelephony, minutes, pricePerMin, totalMonthly });
    }
  }, [selectedLLM, selectedTTS, selectedTelephony, minutes, pricePerMin, totalMonthly]);

  const btnBase = "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer border";
  const btnActive = "bg-[#0077b6] text-white border-[#0077b6] shadow-sm";
  const btnInactive = "bg-white text-[#0077b6] border-[#c8e6f0] hover:border-[#0077b6] hover:bg-[#f0f8ff]";
  const recommendedRing = "border-[#d4af37] ring-1 ring-[#d4af37]/40";
  const recommendedInactive = "bg-[#fff6d6] text-[#8a6a10] border-[#d4af37] hover:bg-[#ffefb3] hover:border-[#d4af37]";
  const recommendedPill = "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border border-[#d4af37] text-[#8a6a10] bg-[#fff6d6]";

  const recommended = {
    llm: 'Claude 4.6 sonnet',
    tts: 'Elevenlabs Voices',
    telephony: 'Twilio/Telnyx',
  };

  const optionClass = (isSelected, isRecommended) => {
    if (isSelected) {
      return `${btnBase} ${btnActive} ${isRecommended ? recommendedRing : ""}`;
    }
    if (isRecommended) {
      return `${btnBase} ${recommendedInactive} ${recommendedRing}`;
    }
    return `${btnBase} ${btnInactive}`;
  };

  const formatMinutes = (v) => {
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
    return v.toString();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 lg:p-10">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Stima il tuo costo</h2>
        <p className="text-gray-500 mb-10">Configura il tuo agente AI e scopri il costo mensile stimato in base ai minuti di chiamata.</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: config */}
          <div className="flex-1 space-y-8">
            {/* Minutes slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">Inserisci il volume mensile stimato in minuti di chiamata</p>
                <span className="text-2xl font-semibold text-gray-900 tabular-nums">{minutes.toLocaleString('it-IT')}</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={minutes}
                onChange={e => setMinutes(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #0077b6 0%, #0077b6 ${(minutes - 100) / (10000 - 100) * 100}%, #e5e7eb ${(minutes - 100) / (10000 - 100) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>100 min</span>
                <span>10.000 min</span>
              </div>
            </div>

            {/* Options */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-6">Scegli le opzioni</h3>

              {/* LLM */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-3">LLM</p>
                <div className="flex flex-wrap gap-2">
                  {llmOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedLLM(opt)}
                      className={optionClass(selectedLLM === opt, opt === recommended.llm)}
                    >
                      {opt}
                      {opt === recommended.llm && <span className={recommendedPill}>Consigliato</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* TTS */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-3">Text To Speech</p>
                <div className="flex flex-wrap gap-2">
                  {ttsOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedTTS(opt)}
                      className={optionClass(selectedTTS === opt, opt === recommended.tts)}
                    >
                      {opt}
                      {opt === recommended.tts && <span className={recommendedPill}>Consigliato</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telephony */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Telefonia</p>
                <div className="flex flex-wrap gap-2">
                  {telephonyOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedTelephony(opt)}
                      className={optionClass(selectedTelephony === opt, opt === recommended.telephony)}
                    >
                      {opt}
                      {opt === recommended.telephony && <span className={recommendedPill}>Consigliato</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: price card */}
          <div className="lg:w-72 xl:w-80">
            <div className="bg-[#0a0e1a] rounded-2xl p-7 text-white sticky top-8">
              <div className="flex items-baseline justify-between mb-6 pb-6 border-b border-white/10">
                <span className="text-base text-white/70">Costo per Minuto</span>
                <span className="text-3xl font-bold text-white">€{pricePerMin.toFixed(4)}</span>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Costo LLM</span>
                  <span className="text-white/90 font-mono">incluso</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">TTS</span>
                  <span className="text-white/90 font-mono">incluso</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Telefonia</span>
                  <span className="text-white/90 font-mono">{selectedTelephony === 'Twilio/Telnyx' ? 'inclusa' : 'custom'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Minuti/mese</span>
                  <span className="text-white/90 font-mono">{minutes.toLocaleString('it-IT')}</span>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-white/70 text-sm">Totale mensile</span>
                  <span className="text-4xl font-bold text-white">€{totalMonthly.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                </div>
                <p className="text-white/40 text-xs mt-1">Stima indicativa — preventivo definitivo via email</p>
              </div>

              <div className="mt-6 bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/50 leading-relaxed">
                  Configurazione: <span className="text-white/80">{selectedLLM}</span> + <span className="text-white/80">{selectedTTS}</span> + <span className="text-white/80">{selectedTelephony}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
