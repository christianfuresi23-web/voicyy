import React, { useState } from 'react';
import { api } from '@/api/client';
import { Info, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const WORKING_DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// #region debug-point A:reporter
const __DBG_URL = import.meta.env.VITE_DEBUG_SERVER_URL || 'http://127.0.0.1:7777/event';
const __DBG_SESSION = 'agent-request-submit';
const __DBG_RUN = 'pre';
const __dbg = (hypothesisId, location, msg, data) => {
  try {
    fetch(__DBG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: __DBG_SESSION,
        runId: __DBG_RUN,
        hypothesisId,
        location,
        msg: `[DEBUG] ${msg}`,
        data: data || {},
        ts: Date.now(),
      }),
    }).catch(() => {});
  } catch {}
};
// #endregion

function StripeSetupForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!stripe || !elements) return;

    setSubmitting(true);
    // #region debug-point A:stripe-confirm-setup
    __dbg('A', 'AgentRequestForm.jsx:confirmSetup', 'stripe.confirmSetup start', {});
    // #endregion
    const result = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });

    if (result.error) {
      // #region debug-point A:stripe-confirm-setup-error
      __dbg('A', 'AgentRequestForm.jsx:confirmSetup', 'stripe.confirmSetup error', { message: result.error.message, type: result.error.type, code: result.error.code });
      // #endregion
      setError(result.error.message || 'Si è verificato un errore. Riprova.');
      setSubmitting(false);
      return;
    }

    if (result.setupIntent?.status === 'succeeded' || result.setupIntent?.status === 'processing') {
      // #region debug-point A:stripe-confirm-setup-ok
      __dbg('A', 'AgentRequestForm.jsx:confirmSetup', 'stripe.confirmSetup ok', { status: result.setupIntent?.status, id: result.setupIntent?.id });
      // #endregion
      onSuccess(result.setupIntent);
      return;
    }

    setError('Si è verificato un errore. Riprova.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full py-3 px-6 bg-[#0077b6] hover:bg-[#005f8f] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all"
      >
        {submitting ? 'Salvataggio in corso...' : 'Salva metodo di pagamento'}
      </button>
    </form>
  );
}

export default function AgentRequestForm({ pricingConfig }) {
  const [form, setForm] = useState({
    contact_name: '',
    contact_email: '',
    business_name: '',
    services: '',
    hours_per_service: '',
    working_hours_per_day: '',
    working_days: [],
    calendar_email: '',
    drive_folder_id: '',
    notification_email: '',
    phone: '',
    website: '',
    additional_notes: '',
    accepted_terms: false,
    accepted_marketing: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showDriveInfo, setShowDriveInfo] = useState(false);
  const [paymentSetupOpen, setPaymentSetupOpen] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState('');
  const [paymentCustomerId, setPaymentCustomerId] = useState('');
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentSetupIntentId, setPaymentSetupIntentId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState('');
  const [stripeSubscriptionItemId, setStripeSubscriptionItemId] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const requiresPaymentMethod = Boolean(stripePublicKey);

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // #region debug-point A:submit-start
    __dbg('A', 'AgentRequestForm.jsx:handleSubmit', 'submit start', {
      hasPricingConfig: Boolean(pricingConfig),
      pricePerMin: pricingConfig?.pricePerMin,
      totalMonthly: pricingConfig?.totalMonthly,
      paymentReady,
      hasSetupIntent: Boolean(paymentSetupIntentId),
      hasCustomerId: Boolean(paymentCustomerId),
      hasPaymentMethodId: Boolean(paymentMethodId),
      hasSubItemId: Boolean(stripeSubscriptionItemId),
    });
    // #endregion

    if (!form.accepted_terms) {
      setError('Devi accettare i Termini e Condizioni per procedere.');
      return;
    }

    if (requiresPaymentMethod && !paymentReady) {
      setError('Per assicurarti la demo devi aggiungere un metodo di pagamento (0€). Non verrà addebitato nulla ora.');
      return;
    }

    setSubmitting(true);
    try {
      if (requiresPaymentMethod && paymentReady && !stripeSubscriptionItemId) {
        const pricePerMin = Number(pricingConfig?.pricePerMin || 0);
        if (!pricePerMin || !Number.isFinite(pricePerMin)) {
          throw new Error('Seleziona prima una configurazione valida nel calcolatore (costo/minuto).');
        }

        // #region debug-point A:subscribe-metered-start
        __dbg('A', 'AgentRequestForm.jsx:handleSubmit', 'subscribe-metered start', { pricePerMin, setupIntentId: paymentSetupIntentId });
        // #endregion
        const res = await fetch('/api/stripe/subscribe-metered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setup_intent_id: paymentSetupIntentId,
            price_per_min: pricePerMin,
            currency: 'eur',
          }),
        });
        const data = await res.json();
        // #region debug-point A:subscribe-metered-response
        __dbg('A', 'AgentRequestForm.jsx:handleSubmit', 'subscribe-metered response', { ok: res.ok, status: res.status, data });
        // #endregion
        if (!res.ok) throw new Error(data?.error || 'Errore nel collegare la tariffa a Stripe.');
        setStripeSubscriptionId(data.subscriptionId || '');
        setStripeSubscriptionItemId(data.subscriptionItemId || '');
      }

      const requestData = {
        ...form,
        working_days: form.working_days.join(', '),
        llm: pricingConfig?.llm || '',
        tts: pricingConfig?.tts || '',
        telephony: pricingConfig?.telephony || '',
        minutes: pricingConfig?.minutes || 0,
        cost_per_minute: pricingConfig?.pricePerMin || 0,
        total_monthly_cost: pricingConfig?.totalMonthly || 0,
        status: 'nuova',
        stripe_customer_id: paymentCustomerId || '',
        stripe_setup_intent_id: paymentSetupIntentId || '',
        stripe_payment_method_id: paymentMethodId || '',
        stripe_subscription_id: stripeSubscriptionId || '',
        stripe_subscription_item_id: stripeSubscriptionItemId || '',
      };

      // #region debug-point B:agentrequest-create-start
      __dbg('B', 'AgentRequestForm.jsx:handleSubmit', 'AgentRequest.create start', {
        contact_email: requestData.contact_email,
        business_name: requestData.business_name,
        minutes: requestData.minutes,
        cost_per_minute: requestData.cost_per_minute,
        total_monthly_cost: requestData.total_monthly_cost,
      });
      // #endregion
      await api.entities.AgentRequest.create(requestData);
      // #region debug-point B:agentrequest-create-ok
      __dbg('B', 'AgentRequestForm.jsx:handleSubmit', 'AgentRequest.create ok', {});
      // #endregion

      // Send admin notification email
      try {
        // #region debug-point D:send-admin-email-start
        __dbg('D', 'AgentRequestForm.jsx:SendEmail', 'SendEmail admin start', { to: 'info.voicyy@gmail.com' });
        // #endregion
        await api.integrations.Core.SendEmail({
          to: 'info.voicyy@gmail.com',
          from_name: 'Voicyy',
          subject: `🔔 Nuova richiesta agente — ${form.business_name}`,
          body: `Nuova richiesta da ${requestData.contact_name} (${requestData.contact_email}) per ${requestData.business_name}.\nTelefono: ${requestData.phone}\nLLM: ${requestData.llm} | TTS: ${requestData.tts} | Telefonia: ${requestData.telephony}\nMinuti/mese: ${requestData.minutes} | Totale mensile: €${parseFloat(requestData.total_monthly_cost).toFixed(2)}\nServizi: ${requestData.services}\nGiorni: ${requestData.working_days} | Ore/giorno: ${requestData.working_hours_per_day}\nEmail Calendar: ${requestData.calendar_email}\nEmail notifiche: ${requestData.notification_email}\nNote: ${requestData.additional_notes || '—'}\nMarketing: ${requestData.accepted_marketing ? 'Sì' : 'No'}`,
        });
        // #region debug-point D:send-admin-email-ok
        __dbg('D', 'AgentRequestForm.jsx:SendEmail', 'SendEmail admin ok', {});
        // #endregion
      } catch (e) { console.warn('Admin email failed', e); }

      // Send client confirmation email
      try {
        // #region debug-point D:send-client-email-start
        __dbg('D', 'AgentRequestForm.jsx:SendEmail', 'SendEmail client start', { to: form.contact_email });
        // #endregion
        await api.integrations.Core.SendEmail({
          to: form.contact_email,
          from_name: 'Voicyy',
          subject: '✅ Richiesta ricevuta — Voicyy AI Agent',
          body: `Ciao ${requestData.contact_name},\n\nabbiamo ricevuto la tua richiesta per ${requestData.business_name}.\n\nConfigurazione selezionata:\n- LLM: ${requestData.llm || '—'}\n- Voce TTS: ${requestData.tts || '—'}\n- Telefonia: ${requestData.telephony || '—'}\n- Minuti/mese: ${requestData.minutes || '—'}\n- Costo stimato/min: €${parseFloat(requestData.cost_per_minute || 0).toFixed(4)}\n- Totale mensile stimato: €${parseFloat(requestData.total_monthly_cost || 0).toFixed(2)}\n\nIl tuo agente sarà pronto entro 1–2 settimane. Ti contatteremo presto per iniziare la configurazione personalizzata.\n\nPer qualsiasi domanda: info.voicyy@gmail.com\n\n© 2025 Voicyy — AI Voice Agents`,
        });
        // #region debug-point D:send-client-email-ok
        __dbg('D', 'AgentRequestForm.jsx:SendEmail', 'SendEmail client ok', {});
        // #endregion
      } catch (e) { console.warn('Client email failed', e); }

      setSubmitted(true);
    } catch (err) {
      // #region debug-point E:submit-error
      __dbg('E', 'AgentRequestForm.jsx:handleSubmit', 'submit error', {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
      });
      // #endregion
      setError(err?.message ? `Errore: ${err.message}` : 'Si è verificato un errore. Riprova o contattaci su WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0077b6]/20 focus:border-[#0077b6] transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  const openPaymentSetup = async () => {
    setPaymentError('');
    setError('');

    if (!stripePromise) {
      setPaymentError("Pagamento non configurato: manca la chiave pubblica Stripe nel sito. Su Vercel deve chiamarsi esattamente VITE_STRIPE_PUBLISHABLE_KEY ed essere impostata su Production, poi devi rifare un redeploy.");
      setPaymentSetupOpen(true);
      return;
    }

    if (!form.contact_email) {
      setPaymentError("Inserisci prima l'email di contatto.");
      setPaymentSetupOpen(true);
      return;
    }

    setPaymentSetupOpen(true);
    if (paymentClientSecret) return;

    setPaymentLoading(true);
    try {
      const res = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.contact_email,
          name: form.contact_name,
          business_name: form.business_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Errore nel creare il metodo di pagamento.');
      setPaymentClientSecret(data.clientSecret);
      setPaymentCustomerId(data.customerId || '');
    } catch (e) {
      setPaymentError(e?.message || 'Errore nel creare il metodo di pagamento.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleEmailChange = (value) => {
    set('contact_email', value);
    if (paymentReady) {
      setPaymentReady(false);
      setPaymentClientSecret('');
      setPaymentCustomerId('');
      setPaymentSetupIntentId('');
      setPaymentMethodId('');
      setStripeSubscriptionId('');
      setStripeSubscriptionItemId('');
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">Richiesta inviata con successo!</h3>
        <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
          Abbiamo ricevuto la tua richiesta per <strong className="text-gray-900">{form.business_name}</strong>. 
          Ti contatteremo entro <strong className="text-gray-900">1–2 giorni lavorativi</strong> per avviare la configurazione del tuo agente AI.
        </p>
        <p className="text-gray-400 text-sm mt-4">Controlla la tua email per il riepilogo — potrebbe trovarsi nella cartella spam.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 lg:p-10">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Richiedi il tuo Agente AI</h2>
        <p className="text-gray-500 mb-10">Compila il modulo — ti risponderemo entro 1–2 giorni lavorativi per iniziare la configurazione.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact info */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-100">Dati di contatto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Nome e Cognome <span className="text-red-400">*</span></label>
                <input type="text" className={inputClass} placeholder="Mario Rossi" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Email di contatto <span className="text-red-400">*</span></label>
                <input type="email" className={inputClass} placeholder="mario@esempio.it" value={form.contact_email} onChange={e => handleEmailChange(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Numero di telefono <span className="text-red-400">*</span></label>
                <input type="tel" className={inputClass} placeholder="+39 333 000 0000" value={form.phone} onChange={e => set('phone', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Sito web</label>
                <input type="url" className={inputClass} placeholder="https://www.tuosito.it" value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Business info */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-100">Informazioni sull'attività</h3>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Nome dell'attività <span className="text-red-400">*</span></label>
                <input type="text" className={inputClass} placeholder="Studio Dentistico Rossi" value={form.business_name} onChange={e => set('business_name', e.target.value)} required />
              </div>

              <div>
                <label className={labelClass}>Servizi offerti <span className="text-red-400">*</span></label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Es. Visita di controllo, Pulizia denti, Otturazione, Sbiancamento..." value={form.services} onChange={e => set('services', e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Durata per servizio (in ore)</label>
                  <input type="text" className={inputClass} placeholder="Es. Visita 1h, Pulizia 0.5h" value={form.hours_per_service} onChange={e => set('hours_per_service', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Ore lavorative al giorno</label>
                  <input type="number" min="1" max="24" className={inputClass} placeholder="8" value={form.working_hours_per_day} onChange={e => set('working_hours_per_day', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Giorni lavorativi</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {WORKING_DAYS.map(day => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${form.working_days.includes(day) ? 'bg-[#0077b6] text-white border-[#0077b6]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0077b6]'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Integration info */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-100">Configurazione automazione</h3>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Email Google Calendar <span className="text-red-400">*</span></label>
                <input type="email" className={inputClass} placeholder="calendario@gmail.com" value={form.calendar_email} onChange={e => set('calendar_email', e.target.value)} required />
                <p className="text-xs text-gray-400 mt-1.5">L'email associata al calendario Google dove verranno create le prenotazioni.</p>
              </div>

              <div>
                <label className={labelClass}>
                  ID cartella Google Drive
                  <button type="button" onClick={() => setShowDriveInfo(!showDriveInfo)} className="ml-2 text-[#0077b6] hover:text-[#005f8f] inline-flex items-center gap-1 text-xs font-normal">
                    <Info className="w-3.5 h-3.5" />
                    Come trovarlo?
                    {showDriveInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </label>
                {showDriveInfo && (
                  <div className="mb-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
                    <p className="font-medium mb-2">Come trovare l'ID della cartella Google Drive:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-blue-700">
                      <li>Apri <strong>Google Drive</strong> sul browser</li>
                      <li>Naviga nella cartella che vuoi condividere</li>
                      <li>Guarda l'URL: <code className="bg-blue-100 px-1 rounded">drive.google.com/drive/folders/<strong>QUESTO-È-L-ID</strong></code></li>
                      <li>Copia la parte dopo <code className="bg-blue-100 px-1 rounded">/folders/</code></li>
                    </ol>
                  </div>
                )}
                <input type="text" className={inputClass} placeholder="1W9a0hzTXSKr0YS10OV-lNFB2-1rkR6ql" value={form.drive_folder_id} onChange={e => set('drive_folder_id', e.target.value)} />
              </div>

              <div>
                <label className={labelClass}>Email per notifiche prenotazioni <span className="text-red-400">*</span></label>
                <input type="email" className={inputClass} placeholder="notifiche@tuaattivita.it" value={form.notification_email} onChange={e => set('notification_email', e.target.value)} required />
                <p className="text-xs text-gray-400 mt-1.5">Riceverai una notifica ogni volta che un cliente effettua una nuova prenotazione.</p>
              </div>
            </div>
          </div>

          {/* Additional notes */}
          <div>
            <label className={labelClass}>Note e dettagli aggiuntivi</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              placeholder="Qualsiasi informazione utile per personalizzare al meglio il tuo agente AI: tono di voce preferito, domande frequenti dei clienti, procedure specifiche..."
              value={form.additional_notes}
              onChange={e => set('additional_notes', e.target.value)}
            />
          </div>

          {/* Selected config summary */}
          {pricingConfig && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Configurazione selezionata</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><p className="text-xs text-gray-400">LLM</p><p className="text-sm font-semibold text-gray-900">{pricingConfig.llm}</p></div>
                <div><p className="text-xs text-gray-400">TTS</p><p className="text-sm font-semibold text-gray-900">{pricingConfig.tts}</p></div>
                <div><p className="text-xs text-gray-400">Telefonia</p><p className="text-sm font-semibold text-gray-900">{pricingConfig.telephony}</p></div>
                <div><p className="text-xs text-gray-400">Totale/mese</p><p className="text-sm font-semibold text-[#0077b6]">€{(pricingConfig.totalMonthly || 0).toFixed(2)}</p></div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Aggiungi metodo di pagamento (0€)</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Quando clicchi, <span className="font-semibold text-gray-900">NON TI VERRÀ ADDEBITATO ANCORA NULLA</span>. Verrà addebitato solo quello che utilizzerai (minuti dell'agente) quando sarà pubblicato e pronto per essere integrato nella tua attività.
                </p>
              </div>
              <button
                type="button"
                onClick={openPaymentSetup}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-200 hover:border-[#0077b6] text-gray-900 text-sm font-semibold rounded-xl transition-all"
              >
                {paymentReady ? 'Metodo salvato ✅' : 'Aggiungi metodo'}
              </button>
            </div>
            {requiresPaymentMethod && !paymentReady && (
              <p className="text-xs text-gray-400 mt-3">Obbligatorio per assicurarsi la demo.</p>
            )}
          </div>

          {/* Consents */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={form.accepted_terms}
                onChange={e => set('accepted_terms', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0077b6] focus:ring-[#0077b6]/30 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                <span className="font-medium text-gray-900">Obbligatorio — </span>
                Accetto i{' '}
                <a href="/terms" target="_blank" className="text-[#0077b6] hover:underline font-medium">Termini e Condizioni di Vendita</a>
                {' '}e dichiaro di aver preso visione della{' '}
                <a href="/privacy" target="_blank" className="text-[#0077b6] hover:underline font-medium">Privacy Policy</a>.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="marketing"
                checked={form.accepted_marketing}
                onChange={e => set('accepted_marketing', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0077b6] focus:ring-[#0077b6]/30 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="marketing" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                <span className="font-medium text-gray-900">Opzionale — </span>
                Acconsento al trattamento dei miei dati per finalità di marketing, invio di newsletter e offerte commerciali da parte di Voicyy.
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || (requiresPaymentMethod && !paymentReady)}
            className="w-full py-4 px-8 bg-[#0077b6] hover:bg-[#005f8f] disabled:opacity-60 text-white font-semibold text-base rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.99]"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Invio in corso...
              </span>
            ) : (requiresPaymentMethod && !paymentReady ? 'Aggiungi metodo di pagamento per continuare' : 'Invia Richiesta →')}
          </button>

          <p className="text-xs text-gray-400 text-center">Il tuo agente sarà pronto entro 1–2 settimane dalla conferma. Nessun addebito ora: paghi solo l'utilizzo quando sarà attivo.</p>
        </form>

        <Dialog open={paymentSetupOpen} onOpenChange={setPaymentSetupOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Aggiungi metodo di pagamento (0€)</DialogTitle>
              <DialogDescription>
                <span className="font-semibold">NON TI VERRÀ ADDEBITATO ANCORA NULLA.</span> Verrà addebitato solo quello che utilizzerai (minuti dell'agente) quando sarà pubblicato e pronto per essere integrato nella tua attività.
              </DialogDescription>
            </DialogHeader>

            {paymentError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                {paymentError}
              </div>
            )}

            {paymentLoading && (
              <div className="text-sm text-gray-600">Caricamento...</div>
            )}

            {!stripePromise && !paymentLoading && (
              <div className="text-sm text-gray-600">
                Pagamento non configurato.
              </div>
            )}

            {stripePromise && paymentClientSecret && !paymentLoading && (
              <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
                <StripeSetupForm
                  onSuccess={(setupIntent) => {
                    setPaymentReady(true);
                    setPaymentSetupIntentId(setupIntent?.id || '');
                    setPaymentMethodId(setupIntent?.payment_method || '');
                    setPaymentCustomerId(setupIntent?.customer || paymentCustomerId || '');
                    setPaymentSetupOpen(false);
                  }}
                />
              </Elements>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
