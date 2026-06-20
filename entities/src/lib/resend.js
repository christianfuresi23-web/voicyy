const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

export async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) throw new Error('Missing VITE_RESEND_API_KEY');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    }),
  });
  const data = await response.json();
  return data;
}

export function buildClientConfirmationEmail(data) {
  return `
    <!DOCTYPE html>
    <html lang="it">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#00b4d8,#0077b6);padding:40px 32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Voicyy</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">AI Voice Agents</p>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#1d1d1f;font-size:22px;font-weight:600;margin:0 0 16px;">Richiesta ricevuta con successo ✓</h2>
          <p style="color:#424245;font-size:16px;line-height:1.6;margin:0 0 24px;">
            Ciao <strong>${data.contact_name}</strong>, abbiamo ricevuto la tua richiesta per <strong>${data.business_name}</strong>.
          </p>
          <div style="background:#f5f5f7;border-radius:12px;padding:24px;margin-bottom:24px;">
            <h3 style="color:#1d1d1f;font-size:15px;font-weight:600;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">Riepilogo configurazione</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#86868b;font-size:14px;width:40%;">LLM scelto</td><td style="padding:6px 0;color:#1d1d1f;font-size:14px;font-weight:500;">${data.llm || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#86868b;font-size:14px;">Voce TTS</td><td style="padding:6px 0;color:#1d1d1f;font-size:14px;font-weight:500;">${data.tts || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#86868b;font-size:14px;">Telefonia</td><td style="padding:6px 0;color:#1d1d1f;font-size:14px;font-weight:500;">${data.telephony || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#86868b;font-size:14px;">Minuti/mese</td><td style="padding:6px 0;color:#1d1d1f;font-size:14px;font-weight:500;">${data.minutes || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#86868b;font-size:14px;">Costo stimato/min</td><td style="padding:6px 0;color:#1d1d1f;font-size:14px;font-weight:500;">€${parseFloat(data.cost_per_minute || 0).toFixed(4)}</td></tr>
              <tr><td style="padding:6px 0;color:#86868b;font-size:14px;">Totale mensile stimato</td><td style="padding:6px 0;color:#00b4d8;font-size:16px;font-weight:700;">€${parseFloat(data.total_monthly_cost || 0).toFixed(2)}</td></tr>
            </table>
          </div>
          <div style="background:#e8f8fc;border-left:4px solid #00b4d8;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
            <p style="color:#0077b6;font-size:14px;margin:0;font-weight:500;">
              🕐 Il tuo agente sarà pronto entro <strong>1–2 settimane</strong>. Ti contatteremo presto per iniziare la configurazione personalizzata.
            </p>
          </div>
          <p style="color:#424245;font-size:15px;line-height:1.6;margin:0 0 8px;">Per qualsiasi domanda, scrivici su WhatsApp o contattaci a:</p>
          <p style="margin:0;"><a href="mailto:info.voicyy@gmail.com" style="color:#00b4d8;font-weight:600;text-decoration:none;">info.voicyy@gmail.com</a></p>
        </div>
        <div style="background:#f5f5f7;padding:24px 32px;text-align:center;border-top:1px solid #e5e5e7;">
          <p style="color:#86868b;font-size:12px;margin:0;">© 2025 Voicyy — AI Voice Agents. Tutti i diritti riservati.</p>
          <p style="color:#86868b;font-size:12px;margin:4px 0 0;">Hai ricevuto questa email perché hai compilato il modulo di richiesta sul nostro sito.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function buildAdminNotificationEmail(data) {
  return `
    <!DOCTYPE html>
    <html lang="it">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:#1d1d1f;padding:32px;text-align:center;">
          <h1 style="color:#00b4d8;margin:0;font-size:22px;font-weight:700;">🔔 Nuova richiesta agente — Voicyy</h1>
        </div>
        <div style="padding:32px;">
          <h3 style="color:#1d1d1f;margin:0 0 20px;">Dati cliente</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;width:45%;">Nome contatto</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.contact_name}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Email contatto</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.contact_email}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Attività</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.business_name}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Telefono</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.phone}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Sito web</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.website || '—'}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Servizi offerti</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.services}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Ore/servizio</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.hours_per_service}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Ore lav./giorno</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.working_hours_per_day}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Giorni lavorativi</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.working_days}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Email Google Cal</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.calendar_email}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Drive Folder ID</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.drive_folder_id || '—'}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Email notifiche</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.notification_email}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">LLM</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.llm}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">TTS</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.tts}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Telefonia</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.telephony}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Minuti/mese</td><td style="padding:10px 0;color:#00b4d8;font-weight:700;">${data.minutes}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Costo/min</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">€${parseFloat(data.cost_per_minute || 0).toFixed(4)}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e7;"><td style="padding:10px 0;color:#86868b;">Totale mensile</td><td style="padding:10px 0;color:#00b4d8;font-size:18px;font-weight:700;">€${parseFloat(data.total_monthly_cost || 0).toFixed(2)}</td></tr>
            <tr><td style="padding:10px 0;color:#86868b;">Note aggiuntive</td><td style="padding:10px 0;color:#1d1d1f;font-weight:500;">${data.additional_notes || '—'}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#f0fff4;border-radius:8px;border-left:4px solid #34c759;">
            <p style="margin:0;color:#1a7f37;font-size:14px;font-weight:600;">✅ Consenso marketing: ${data.accepted_marketing ? 'Sì — puoi ricontattare per offerte' : 'No'}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
