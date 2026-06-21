import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { verifyTOTP, TOTP_SECRET, getTOTPQRUrl } from '@/lib/totpUtils';
import { Eye, EyeOff, LogOut, RefreshCw, Mail, ChevronDown, ChevronUp, Shield, Smartphone, Key, CheckCircle } from 'lucide-react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';
const SECRET_WORDS = ['cane', 'lupo', 'soldi', 'pad', 'mouse', 'pulsante', 'tastiera', 'iphone', 'mini', 'giochi', 'play', 'neve'];
const AUTH_KEY = 'voicyy_admin_auth';

const STEP_PASSWORD = 1;
const STEP_TOTP = 2;
const STEP_WORDS = 3;
const STEP_DASHBOARD = 4;

export default function AdminDashboard() {
  const [step, setStep] = useState(STEP_PASSWORD);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [wordInputs, setWordInputs] = useState(Array(12).fill(''));
  const [wordBulkInput, setWordBulkInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentSetupIntentId, setPaymentSetupIntentId] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth === 'granted') setStep(STEP_DASHBOARD);
  }, []);

  useEffect(() => {
    if (step === STEP_DASHBOARD) fetchRequests();
  }, [step]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await api.entities.AgentRequest.list('-created_date', 100);
      setRequests(data);
    } catch (e) { setError('Errore nel caricamento delle richieste.'); }
    finally { setLoadingRequests(false); }
  };

  const handlePassword = (e) => {
    e.preventDefault();
    setError('');
    if (!ADMIN_PASSWORD) {
      setError('Password admin non configurata. Imposta VITE_ADMIN_PASSWORD nelle variabili d’ambiente del progetto.');
      return;
    }
    if (password === ADMIN_PASSWORD) {
      setStep(STEP_TOTP);
    } else {
      setError('Password errata.');
    }
  };

  const handleTOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!TOTP_SECRET) {
      setError('TOTP non configurato. Imposta VITE_ADMIN_TOTP_SECRET nelle variabili d’ambiente del progetto.');
      return;
    }
    setLoading(true);
    try {
      const valid = await verifyTOTP(TOTP_SECRET, totpCode.trim());
      if (valid) {
        setStep(STEP_WORDS);
      } else {
        setError('Codice non valido. Controlla Google Authenticator e riprova (il codice cambia ogni 30 secondi).');
      }
    } catch (err) {
      setError('Errore nella verifica del codice.');
    } finally {
      setLoading(false);
    }
  };

  const handleWords = (e) => {
    e.preventDefault();
    setError('');
    const entered = wordInputs.map(w => w.trim().toLowerCase());
    const correct = SECRET_WORDS.map(w => w.toLowerCase());
    const allMatch = entered.every((w, i) => w === correct[i]);
    if (allMatch) {
      sessionStorage.setItem(AUTH_KEY, 'granted');
      setStep(STEP_DASHBOARD);
    } else {
      setError('Le parole sono sbagliate o nell’ordine sbagliato. Riprova.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setStep(STEP_PASSWORD);
    setPassword('');
    setTotpCode('');
    setWordInputs(Array(12).fill(''));
    setWordBulkInput('');
    setError('');
  };

  const updateStatus = async (id, status) => {
    await api.entities.AgentRequest.update(id, { status });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const openPaymentModal = (req) => {
    setPaymentTarget(req);
    setPaymentSetupIntentId('');
    setPaymentError('');
    setPaymentModalOpen(true);
  };

  const submitAdminPayment = async (e) => {
    e.preventDefault();
    if (!paymentTarget?.id) return;
    setPaymentError('');
    const setupIntentId = paymentSetupIntentId.trim();
    if (!setupIntentId) {
      setPaymentError('Inserisci un SetupIntent ID valido (es: seti_...).');
      return;
    }
    const pricePerMin = Number(paymentTarget?.cost_per_minute || 0);
    if (!pricePerMin || !Number.isFinite(pricePerMin)) {
      setPaymentError('Costo/min non valido nella richiesta (configurazione mancante).');
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await fetch('/api/stripe/subscribe-metered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setup_intent_id: setupIntentId,
          price_per_min: pricePerMin,
          currency: 'eur',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Errore nel salvare il metodo di pagamento.');

      const patch = {
        payment_status: 'provided',
        stripe_setup_intent_id: setupIntentId,
        stripe_customer_id: data.customerId || '',
        stripe_payment_method_id: data.paymentMethodId || '',
        stripe_subscription_id: data.subscriptionId || '',
        stripe_subscription_item_id: data.subscriptionItemId || '',
      };
      const updated = await api.entities.AgentRequest.update(paymentTarget.id, patch);
      setRequests(prev => prev.map(r => r.id === paymentTarget.id ? { ...r, ...updated } : r));
      setPaymentModalOpen(false);
      setPaymentTarget(null);
    } catch (err) {
      setPaymentError(err?.message || 'Errore nel salvare il metodo di pagamento.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const filteredRequests = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);

  const statusColors = {
    nuova: 'bg-blue-50 text-blue-700 border-blue-100',
    in_lavorazione: 'bg-amber-50 text-amber-700 border-amber-100',
    completata: 'bg-green-50 text-green-700 border-green-100',
    annullata: 'bg-red-50 text-red-700 border-red-100',
  };
  const statusLabels = { nuova: 'Nuova', in_lavorazione: 'In Lavorazione', completata: 'Completata', annullata: 'Annullata' };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/20 focus:border-[#0077b6] transition-all";

  // Auth screens
  if (step !== STEP_DASHBOARD) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0077b6]/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#0077b6]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Voicyy Admin</h1>
              <p className="text-xs text-gray-400">Pannello di controllo privato</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {[{ label: 'Password', icon: <Key className="w-3 h-3" /> }, { label: '2FA', icon: <Smartphone className="w-3 h-3" /> }, { label: 'Parole', icon: <Shield className="w-3 h-3" /> }].map((s, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${step === i + 1 ? 'bg-[#0077b6] text-white' : step > i + 1 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {step > i + 1 ? <CheckCircle className="w-3 h-3" /> : s.icon}
                  {s.label}
                </div>
                {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? 'bg-[#0077b6]' : 'bg-gray-200'}`}></div>}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Password */}
          {step === STEP_PASSWORD && (
            <form onSubmit={handlePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password amministratore</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={inputClass}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Inserisci la password"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
              <button type="submit" className="w-full py-3 bg-[#0077b6] text-white font-semibold rounded-xl hover:bg-[#005f8f] transition-all">
                Continua →
              </button>
            </form>
          )}

          {/* Step 2: TOTP */}
          {step === STEP_TOTP && (
            <form onSubmit={handleTOTP} className="space-y-5">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-medium mb-1 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Verifica Google Authenticator</p>
                <p className="text-blue-600">Apri Google Authenticator sul tuo telefono e inserisci il codice a 6 cifre per <strong>Voicyy Admin</strong>.</p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  disabled={!TOTP_SECRET}
                  className="text-sm text-[#0077b6] hover:underline mb-3 flex items-center gap-1 disabled:opacity-60 disabled:hover:no-underline"
                >
                  {showQR ? 'Nascondi QR Code' : '📷 Prima configurazione? Scansiona il QR Code'}
                  {showQR ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showQR && (
                  <div className="text-center mb-4 p-4 bg-gray-50 rounded-xl">
                    <img src={getTOTPQRUrl(TOTP_SECRET)} alt="QR Code Google Authenticator" className="mx-auto rounded-lg" />
                    <p className="text-xs text-gray-400 mt-1">Scansiona una volta sola con Google Authenticator</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Codice a 6 cifre</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
              <button type="submit" disabled={loading || totpCode.length !== 6} className="w-full py-3 bg-[#0077b6] text-white font-semibold rounded-xl hover:bg-[#005f8f] transition-all disabled:opacity-60">
                {loading ? 'Verifica...' : 'Verifica Codice →'}
              </button>
            </form>
          )}

          {/* Step 3: 12 Words */}
          {step === STEP_WORDS && (
            <form onSubmit={handleWords} className="space-y-5">
              <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-medium mb-1">🔐 Frase di sicurezza</p>
                <p className="text-amber-700">Inserisci le 12 parole segrete nell'ordine esatto (maiuscolo/minuscolo non importa).</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Incolla le 12 parole (tutte insieme)</label>
                <textarea
                  value={wordBulkInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWordBulkInput(value);
                    const words = value.trim().split(/[\s,]+/).filter(Boolean).slice(0, 12);
                    if (words.length > 0) {
                      const next = Array(12).fill('');
                      for (let i = 0; i < 12; i++) next[i] = words[i] || '';
                      setWordInputs(next);
                    }
                  }}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/20 focus:border-[#0077b6] resize-none"
                  placeholder="es. parola1 parola2 parola3 ... parola12"
                />
                <p className="text-xs text-gray-400">Verranno distribuite automaticamente nei 12 slot sotto.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {wordInputs.map((w, i) => (
                  <div key={i} className="relative">
                    <span className="absolute left-3 top-3 text-xs text-gray-400 font-mono">{i + 1}.</span>
                    <input
                      type="text"
                      className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/20 focus:border-[#0077b6]"
                      value={w}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      onChange={e => { const arr = [...wordInputs]; arr[i] = e.target.value; setWordInputs(arr); }}
                      placeholder={`Parola ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
              <button type="submit" className="w-full py-3 bg-[#0077b6] text-white font-semibold rounded-xl hover:bg-[#005f8f] transition-all">
                Accedi alla Dashboard →
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#0077b6]" />
          <h1 className="text-lg font-semibold text-gray-900">Voicyy Admin</h1>
          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">Accesso sicuro</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchRequests} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Totale Richieste', value: requests.length, color: 'text-gray-900' },
            { label: 'Nuove', value: requests.filter(r => r.status === 'nuova').length, color: 'text-blue-600' },
            { label: 'In Lavorazione', value: requests.filter(r => r.status === 'in_lavorazione').length, color: 'text-amber-600' },
            { label: 'Completate', value: requests.filter(r => r.status === 'completata').length, color: 'text-green-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          {['all', 'nuova', 'in_lavorazione', 'completata', 'annullata'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${statusFilter === f ? 'bg-[#0077b6] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0077b6]'}`}
            >
              {f === 'all' ? 'Tutte' : statusLabels[f]}
            </button>
          ))}
        </div>

        {/* Requests list */}
        {loadingRequests ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0077b6] rounded-full animate-spin"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400">Nessuna richiesta trovata.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div
                  className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">{req.business_name}</p>
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColors[req.status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {statusLabels[req.status] || req.status}
                        </span>
                        {req.payment_status === 'missing' && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-amber-50 text-amber-800 border-amber-100">
                            Pagamento mancante
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />{req.contact_name} — {req.contact_email}
                        </span>
                        <span className="text-sm text-gray-400">{new Date(req.created_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right flex-shrink-0">
                      <p className="text-xl font-bold text-[#0077b6]">€{parseFloat(req.total_monthly_cost || 0).toFixed(0)}<span className="text-sm font-normal text-gray-400">/mese</span></p>
                      <p className="text-xs text-gray-400">{req.minutes?.toLocaleString('it-IT')} min/mese</p>
                    </div>
                  </div>
                  <div className="ml-4 text-gray-400">
                    {expandedId === req.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {expandedId === req.id && (
                  <div className="border-t border-gray-100 px-6 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dati Attività</h4>
                        <DetailRow label="Contatto" value={`${req.contact_name} — ${req.contact_email}`} />
                        <DetailRow label="Telefono" value={req.phone} />
                        <DetailRow label="Sito web" value={req.website || '—'} />
                        <DetailRow label="Servizi" value={req.services} />
                        <DetailRow label="Ore/servizio" value={req.hours_per_service} />
                        <DetailRow
                          label="Orari"
                          value={req.working_hours ? `${req.working_hours} (${req.working_hours_per_day}h/giorno)` : (req.working_hours_per_day ? `${req.working_hours_per_day}h/giorno` : '—')}
                        />
                        <DetailRow label="Giorni" value={req.working_days} />
                        <DetailRow label="Email Calendar" value={req.calendar_email} />
                        <DetailRow label="Drive Folder ID" value={req.drive_folder_id || '—'} />
                        <DetailRow label="Email notifiche" value={req.notification_email} />
                        <DetailRow
                          label="Pagamento"
                          value={req.payment_status === 'provided' ? '✅ Metodo inserito' : (req.payment_status === 'missing' ? '⚠️ Mancante' : '—')}
                        />
                        {req.payment_status !== 'provided' && (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(req)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl bg-[#0077b6] hover:bg-[#005f8f] text-white text-sm font-semibold transition-all"
                          >
                            Aggiungi Metoto Di Pagamento.
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configurazione AI</h4>
                        <DetailRow label="LLM" value={req.llm} highlight />
                        <DetailRow label="TTS" value={req.tts} highlight />
                        <DetailRow label="Telefonia" value={req.telephony} highlight />
                        <DetailRow label="Minuti/mese" value={req.minutes?.toLocaleString('it-IT')} highlight />
                        <DetailRow label="Costo/min" value={`€${parseFloat(req.cost_per_minute || 0).toFixed(4)}`} highlight />
                        <DetailRow label="Totale mensile" value={`€${parseFloat(req.total_monthly_cost || 0).toFixed(2)}`} highlight />
                        <DetailRow label="Marketing" value={req.accepted_marketing ? '✅ Sì' : '❌ No'} />
                        {req.additional_notes && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Note</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{req.additional_notes}</p>
                          </div>
                        )}

                        <div className="pt-4">
                          <p className="text-xs text-gray-400 mb-2">Aggiorna stato</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(statusLabels).map(([key, label]) => (
                              <button
                                key={key}
                                onClick={() => updateStatus(req.id, key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${req.status === key ? 'bg-[#0077b6] text-white border-[#0077b6]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0077b6]'}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {paymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPaymentModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Aggiungi metodo di pagamento</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Incolla l’ID del SetupIntent (seti_...) ottenuto dal cliente.
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setPaymentModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitAdminPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SetupIntent ID</label>
                <input
                  value={paymentSetupIntentId}
                  onChange={(e) => setPaymentSetupIntentId(e.target.value)}
                  placeholder="seti_123..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/20 focus:border-[#0077b6] transition-all"
                />
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
                  {paymentError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 transition-all"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#0077b6] hover:bg-[#005f8f] disabled:opacity-60 text-white text-sm font-semibold transition-all"
                >
                  {paymentSubmitting ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-gray-400 w-32 flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-[#0077b6]' : 'text-gray-900'} leading-relaxed`}>{value || '—'}</span>
    </div>
  );
}
