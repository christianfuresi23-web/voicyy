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
    working_time_slots: [{ start: '', end: '' }],
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
  const [createdRequestId, setCreatedRequestId] = useState('');
  const [error, setError] = useState('');
  const [showDriveInfo, setShowDriveInfo] = useState(false);
  const [paymentSetupOpen, setPaymentSetupOpen] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState('');
  const [paymentCustomerId, setPaymentCustomerId] = useState('');
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentFinalizing, setPaymentFinalizing] = useState(false);
  const [paymentFinalized, setPaymentFinalized] = useState(false);
  const [paymentSetupIntentId, setPaymentSetupIntentId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState('');
  const [stripeSubscriptionItemId, setStripeSubscriptionItemId] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const requiresPaymentMethod = Boolean(stripePublicKey);

  const parseTimeToMinutes = (value) => {
    if (!value || typeof value !== 'string') return null;
    const m = value.match(/^(\d{2}):(\d{2})$/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  };

  const buildWorkingHoursString = (data) => {
    const slots = Array.isArray(data?.working_time_slots) ? data.working_time_slots : [];
    return slots
      .map((s) => (s?.start && s?.end ? `${s.start}–${s.end}` : ''))
      .filter(Boolean)
      .join(' / ');
  };

  const computeWorkingHoursPerDay = (data) => {
    const slots = Array.isArray(data?.working_time_slots) ? data.working_time_slots : [];
    if (slots.length === 0) return null;

    let totalMinutes = 0;
    for (const slot of slots) {
      const s = parseTimeToMinutes(slot?.start);
      const e = parseTimeToMinutes(slot?.end);
      if (s == null || e == null) return null;
      if (e <= s) return null;
      totalMinutes += (e - s);
    }

    const hours = totalMinutes / 60;
    return Math.round(hours * 100) / 100;
  };

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

    const workingHoursPerDay = computeWorkingHoursPerDay(form);
    if (workingHoursPerDay == null) {
      setError('Inserisci un orario valido: per ogni fascia devi indicare inizio e fine (la fine deve essere dopo l’inizio).');
      return;
    }

    setSubmitting(true);
    try {
      setPaymentFinalized(false);
      setPaymentReady(false);
      setPaymentSetupIntentId('');
      setPaymentMethodId('');
      setPaymentCustomerId('');
      setStripeSubscriptionId('');
      setStripeSubscriptionItemId('');

      const requestData = {
        ...form,
        working_days: form.working_days.join(', '),
        working_hours: buildWorkingHoursString(form),
        working_hours_per_day: workingHoursPerDay,
        payment_status: requiresPaymentMethod ? 'missing' : 'not_required',
        llm: pricingConfig?.llm || '',
        tts: pricingConfig?.tts || '',
        telephony: pricingConfig?.telephony || '',
        minutes: pricingConfig?.minutes || 0,
        cost_per_minute: pricingConfig?.pricePerMin || 0,
        total_monthly_cost: pricingConfig?.totalMonthly || 0,
        status: 'nuova',
        stripe_customer_id: '',
        stripe_setup_intent_id: '',
        stripe_payment_method_id: '',
        stripe_subscription_id: '',
        stripe_subscription_item_id: '',
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
      const created = await api.entities.AgentRequest.create(requestData);
      setCreatedRequestId(created?.id || '');
      // #region debug-point B:agentrequest-create-ok
      __dbg('B', 'AgentRequestForm.jsx:handleSubmit', 'AgentRequest.create ok', {});
      // #endregion

      // Send admin notification email
      try {
        // #region debug-point D:send-admin-email-start
        __dbg('D', 'AgentRequestForm.jsx:SendEmail', 'SendEmail admin start', { to: 'info.voicyy@gmail.com' });
        // #endregion
        const adminEmailRes = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'info.voicyy@gmail.com',
            subject: `🔔 Nuova richiesta agente — ${form.business_name}`,
            html: (() => {
              const safe = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              const paymentLabel = requestData.payment_status === 'provided'
                ? 'Pagamento: inserito ✅'
                : (requestData.payment_status === 'missing' ? 'Pagamento: mancante ⚠️' : 'Pagamento: non richiesto');
              const paymentBg = requestData.payment_status === 'provided'
                ? 'background:#f0fdf4;border:1px solid #dcfce7;color:#166534;'
                : (requestData.payment_status === 'missing' ? 'background:#fff7ed;border:1px solid #ffedd5;color:#9a3412;' : 'background:#f7f7fa;border:1px solid #efeff4;color:#1d1d1f;');
              return `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f5f7;padding:24px;">
                  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,0.08);border:1px solid #eef0f3;">
                    <div style="background:linear-gradient(135deg,#00b4d8,#0077b6);padding:28px 24px;">
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                        <div>
                          <div style="color:#e6f8ff;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Nuova richiesta</div>
                          <div style="color:#fff;font-size:20px;font-weight:800;margin-top:6px;">${safe(requestData.business_name)}</div>
                        </div>
                        <div style="color:#e6f8ff;font-size:12px;">${safe(new Date().toLocaleString('it-IT'))}</div>
                      </div>
                    </div>
                    <div style="padding:24px;">
                      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
                        <div style="background:#f0fbff;border:1px solid #d9f3ff;color:#0077b6;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:700;">
                          €${safe(parseFloat(requestData.total_monthly_cost || 0).toFixed(2))}/mese
                        </div>
                        <div style="background:#f7f7fa;border:1px solid #efeff4;color:#1d1d1f;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:600;">
                          ${safe(requestData.minutes?.toLocaleString?.('it-IT') ?? requestData.minutes)} min/mese
                        </div>
                        <div style="${paymentBg}padding:10px 12px;border-radius:12px;font-size:13px;font-weight:800;">
                          ${safe(paymentLabel)}
                        </div>
                        <div style="background:#f7f7fa;border:1px solid #efeff4;color:#1d1d1f;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:600;">
                          ${safe(requestData.llm || '—')} · ${safe(requestData.tts || '—')} · ${safe(requestData.telephony || '—')}
                        </div>
                      </div>

                      <div style="display:grid;grid-template-columns:1fr;gap:14px;">
                        <div style="background:#fafafa;border:1px solid #f0f0f2;border-radius:14px;padding:16px;">
                          <div style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Contatto</div>
                          <div style="margin-top:10px;font-size:14px;color:#1d1d1f;font-weight:700;">${safe(requestData.contact_name)} — <a href="mailto:${safe(requestData.contact_email)}" style="color:#0077b6;text-decoration:none;">${safe(requestData.contact_email)}</a></div>
                          <div style="margin-top:6px;font-size:14px;color:#1d1d1f;">Telefono: <a href="tel:${safe(requestData.phone)}" style="color:#1d1d1f;text-decoration:none;">${safe(requestData.phone)}</a></div>
                          ${requestData.website ? `<div style="margin-top:6px;font-size:14px;color:#1d1d1f;">Sito: <a href="${safe(requestData.website)}" style="color:#0077b6;text-decoration:none;">${safe(requestData.website)}</a></div>` : ''}
                        </div>

                        <div style="background:#ffffff;border:1px solid #f0f0f2;border-radius:14px;padding:16px;">
                          <div style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Operatività</div>
                          <div style="margin-top:10px;font-size:14px;color:#1d1d1f;"><strong>Giorni:</strong> ${safe(requestData.working_days || '—')}</div>
                          <div style="margin-top:6px;font-size:14px;color:#1d1d1f;"><strong>Orari:</strong> ${safe(requestData.working_hours || '—')} (${safe(requestData.working_hours_per_day)}h/giorno)</div>
                          <div style="margin-top:6px;font-size:14px;color:#1d1d1f;"><strong>Email Calendar:</strong> ${safe(requestData.calendar_email || '—')}</div>
                          <div style="margin-top:6px;font-size:14px;color:#1d1d1f;"><strong>Drive Folder ID:</strong> ${safe(requestData.drive_folder_id || '—')}</div>
                          <div style="margin-top:6px;font-size:14px;color:#1d1d1f;"><strong>Email notifiche:</strong> ${safe(requestData.notification_email || '—')}</div>
                        </div>

                        <div style="background:#ffffff;border:1px solid #f0f0f2;border-radius:14px;padding:16px;">
                          <div style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Servizi</div>
                          <div style="margin-top:10px;font-size:14px;color:#1d1d1f;white-space:pre-wrap;">${safe(requestData.services || '—')}</div>
                          ${requestData.hours_per_service ? `<div style="margin-top:10px;font-size:13px;color:#424245;"><strong>Durata per servizio:</strong> ${safe(requestData.hours_per_service)}</div>` : ''}
                        </div>

                        <div style="background:#fff7ed;border:1px solid #ffedd5;border-radius:14px;padding:16px;">
                          <div style="font-size:12px;color:#9a3412;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">Note</div>
                          <div style="margin-top:10px;font-size:14px;color:#7c2d12;white-space:pre-wrap;">${safe(requestData.additional_notes || '—')}</div>
                          <div style="margin-top:10px;font-size:13px;color:#7c2d12;"><strong>Consenso marketing:</strong> ${requestData.accepted_marketing ? 'Sì' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            })(),
          }),
        });
        const adminEmailData = await adminEmailRes.json().catch(() => ({}));
        if (!adminEmailRes.ok) throw new Error(adminEmailData?.error || 'Invio email admin fallito');
        // #region debug-point D:send-admin-email-ok
        __dbg('D', 'AgentRequestForm.jsx:SendEmail', 'SendEmail admin ok', {});
        // #endregion
      } catch (e) { console.warn('Admin email failed', e); }

      // Send client confirmation email
      try {
        // #region debug-point D:send-client-email-start
        __dbg('D', 'AgentRequestForm.jsx:SendEmail', 'SendEmail client start', { to: form.contact_email });
        // #endregion
        const clientEmailRes = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: form.contact_email,
            subject: '✅ Richiesta ricevuta — Voicyy AI Agent',
            html: (() => {
              const safe = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              const hasPayment = requestData.payment_status === 'provided';
              return `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f5f7;padding:24px;">
                  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,0.08);border:1px solid #eef0f3;">
                    <div style="background:linear-gradient(135deg,#00b4d8,#0077b6);padding:32px 24px;text-align:center;">
                      <div style="color:rgba(255,255,255,0.9);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Voicyy</div>
                      <h1 style="color:#fff;margin:10px 0 0;font-size:22px;font-weight:900;">Richiesta inviata con successo</h1>
                      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">Se stai leggendo questa email, l’invio è andato a buon fine.</p>
                    </div>
                    <div style="padding:24px;">
                      <p style="margin:0;color:#1d1d1f;font-size:15px;line-height:1.6;">
                        Ciao <strong>${safe(requestData.contact_name)}</strong>, abbiamo ricevuto la tua richiesta per <strong>${safe(requestData.business_name)}</strong>.
                      </p>

                      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:16px 0 0;">
                        <div style="background:#ecfeff;border:1px solid #cffafe;color:#0e7490;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:800;">Stato: Ricevuta ✅</div>
                        <div style="background:#f7f7fa;border:1px solid #efeff4;color:#1d1d1f;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:700;">${safe(requestData.minutes || '—')} min/mese</div>
                        <div style="background:#f7f7fa;border:1px solid #efeff4;color:#1d1d1f;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:700;">Totale stimato: €${safe(parseFloat(requestData.total_monthly_cost || 0).toFixed(2))}/mese</div>
                      </div>

                      <div style="margin-top:18px;background:#fafafa;border:1px solid #f0f0f2;border-radius:14px;padding:16px;">
                        <div style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">Riepilogo</div>
                        <div style="margin-top:10px;font-size:14px;color:#1d1d1f;"><strong>Configurazione:</strong> ${safe(requestData.llm || '—')} · ${safe(requestData.tts || '—')} · ${safe(requestData.telephony || '—')}</div>
                        <div style="margin-top:8px;font-size:14px;color:#1d1d1f;"><strong>Giorni lavorativi:</strong> ${safe(requestData.working_days || '—')}</div>
                        <div style="margin-top:8px;font-size:14px;color:#1d1d1f;"><strong>Orari:</strong> ${safe(requestData.working_hours || '—')} (${safe(requestData.working_hours_per_day)}h/giorno)</div>
                        <div style="margin-top:8px;font-size:14px;color:#1d1d1f;"><strong>Email notifiche:</strong> ${safe(requestData.notification_email || '—')}</div>
                      </div>

                      <div style="margin-top:18px;background:${hasPayment ? '#f0fdf4' : '#fff7ed'};border:1px solid ${hasPayment ? '#dcfce7' : '#ffedd5'};border-radius:14px;padding:16px;">
                        <div style="font-size:12px;color:${hasPayment ? '#166534' : '#9a3412'};text-transform:uppercase;letter-spacing:0.12em;font-weight:900;">Pagamento</div>
                        <div style="margin-top:10px;font-size:14px;color:${hasPayment ? '#166534' : '#9a3412'};line-height:1.6;">
                          ${hasPayment ? 'Metodo di pagamento salvato correttamente (0€ ora). ✅' : 'Ultimo passo: aggiungi un metodo di pagamento (0€ ora) per assicurarti la demo. Se non lo inserisci subito, ti contatteremo comunque.'}
                        </div>
                      </div>

                      <div style="margin-top:18px;background:#eef2ff;border:1px solid #e0e7ff;border-radius:14px;padding:16px;">
                        <div style="font-size:12px;color:#3730a3;text-transform:uppercase;letter-spacing:0.12em;font-weight:900;">Prossimi passi</div>
                        <div style="margin-top:10px;font-size:14px;color:#312e81;line-height:1.6;">
                          Ti contatteremo a breve per iniziare la configurazione personalizzata. Se vuoi aggiungere dettagli, rispondi a questa email.
                        </div>
                      </div>

                      <p style="margin:18px 0 0;color:#86868b;font-size:12px;line-height:1.6;">
                        Supporto: <a href="mailto:info.voicyy@gmail.com" style="color:#0077b6;text-decoration:none;">info.voicyy@gmail.com</a>
                      </p>
                    </div>
                    <div style="background:#f5f5f7;padding:18px 24px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Voicyy — AI Voice Agents</p>
                    </div>
                  </div>
                </div>
              `;
            })(),
          }),
        });
        const clientEmailData = await clientEmailRes.json().catch(() => ({}));
        if (!clientEmailRes.ok) throw new Error(clientEmailData?.error || 'Invio email cliente fallito');
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

  const inputClass = "w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-[16px] md:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0077b6]/20 focus:border-[#0077b6] transition-all";
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

  const setTimeSlot = (index, field, value) => {
    setForm(prev => {
      const slots = Array.isArray(prev.working_time_slots) ? prev.working_time_slots : [];
      const nextSlots = slots.map((s, i) => (i === index ? { ...s, [field]: value } : s));
      return { ...prev, working_time_slots: nextSlots };
    });
  };

  const addTimeSlot = () => {
    setForm(prev => {
      const slots = Array.isArray(prev.working_time_slots) ? prev.working_time_slots : [];
      return { ...prev, working_time_slots: [...slots, { start: '', end: '' }] };
    });
  };

  const removeTimeSlot = (index) => {
    setForm(prev => {
      const slots = Array.isArray(prev.working_time_slots) ? prev.working_time_slots : [];
      const next = slots.filter((_, i) => i !== index);
      return { ...prev, working_time_slots: next.length ? next : [{ start: '', end: '' }] };
    });
  };

  const finalizePaymentForRequest = async ({ setupIntentId, customerId, paymentMethodId: pmId }) => {
    if (!createdRequestId) {
      setPaymentError('Richiesta non trovata. Reinvia il modulo oppure contattaci su WhatsApp.');
      return;
    }
    const pricePerMin = Number(pricingConfig?.pricePerMin || 0);
    if (!pricePerMin || !Number.isFinite(pricePerMin)) {
      setPaymentError('Seleziona prima una configurazione valida nel calcolatore (costo/minuto), poi riprova ad aggiungere il metodo di pagamento.');
      return;
    }

    setPaymentError('');
    setPaymentFinalizing(true);
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
      if (!res.ok) throw new Error(data?.error || 'Errore nel collegare la tariffa a Stripe.');

      const patch = {
        payment_status: 'provided',
        stripe_customer_id: customerId || '',
        stripe_setup_intent_id: setupIntentId || '',
        stripe_payment_method_id: pmId || '',
        stripe_subscription_id: data.subscriptionId || '',
        stripe_subscription_item_id: data.subscriptionItemId || '',
      };
      await api.entities.AgentRequest.update(createdRequestId, patch);

      setPaymentReady(true);
      setPaymentFinalized(true);
      setStripeSubscriptionId(patch.stripe_subscription_id);
      setStripeSubscriptionItemId(patch.stripe_subscription_item_id);
      setPaymentSetupOpen(false);
    } catch (e) {
      setPaymentError(e?.message || 'Errore nel salvare il metodo di pagamento.');
    } finally {
      setPaymentFinalizing(false);
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
          Ti contatteremo entro <strong className="text-gray-900">1–2 giorni lavorativi</strong>.
        </p>

        {requiresPaymentMethod && (
          <div className={`mt-8 rounded-2xl border p-6 text-left ${paymentFinalized ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
            <p className="text-sm font-semibold text-gray-900">Ultimo passo</p>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              {paymentFinalized
                ? 'Metodo di pagamento salvato correttamente (0€ ora). ✅'
                : 'Inserisci un metodo di pagamento (0€) per assicurarti la demo. Se non lo inserisci subito, la richiesta resta valida e ti contatteremo comunque.'}
            </p>
            <button
              type="button"
              onClick={openPaymentSetup}
              disabled={paymentFinalized || paymentFinalizing}
              className="mt-4 w-full py-3 px-6 bg-[#0077b6] hover:bg-[#005f8f] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all"
            >
              {paymentFinalized ? 'Metodo inserito ✅' : (paymentFinalizing ? 'Salvataggio in corso...' : 'Inserisci metodo di pagamento')}
            </button>
          </div>
        )}

        <p className="text-gray-400 text-sm mt-6">Controlla la tua email per il riepilogo — potrebbe trovarsi nella cartella spam.</p>
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
                  <label className={labelClass}>Orari di lavoro <span className="text-red-400">*</span></label>
                  <div className="space-y-3">
                    {(Array.isArray(form.working_time_slots) ? form.working_time_slots : [{ start: '', end: '' }]).map((slot, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-xs font-semibold text-gray-500">Fascia {idx + 1}</p>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(idx)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                              Rimuovi
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 mb-1.5">Inizio</p>
                            <input
                              type="time"
                              className={`${inputClass} px-3 py-2 md:px-4 md:py-3`}
                              value={slot?.start || ''}
                              onChange={e => setTimeSlot(idx, 'start', e.target.value)}
                              required
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 mb-1.5">Fine</p>
                            <input
                              type="time"
                              className={`${inputClass} px-3 py-2 md:px-4 md:py-3`}
                              value={slot?.end || ''}
                              onChange={e => setTimeSlot(idx, 'end', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border bg-white text-gray-700 border-gray-200 hover:border-[#0077b6]"
                    >
                      Aggiungi fascia oraria (pausa pranzo)
                    </button>
                  </div>
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
            disabled={submitting}
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
            ) : 'Invia Richiesta →'}
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

            {paymentFinalizing && (
              <div className="text-sm text-gray-600">Collegamento in corso...</div>
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
                    const setupIntentId = setupIntent?.id || '';
                    const customerId = setupIntent?.customer || paymentCustomerId || '';
                    const pmId = setupIntent?.payment_method || '';
                    setPaymentSetupIntentId(setupIntentId);
                    setPaymentMethodId(pmId);
                    setPaymentCustomerId(customerId);
                    void finalizePaymentForRequest({ setupIntentId, customerId, paymentMethodId: pmId });
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
