import "server-only";

import { Resend } from "resend";

import type { AgentRequestInput } from "@/lib/validation/agent-request";

export type EmailDeliveryResult = {
  status: "accepted" | "failed" | "skipped";
  id: string | null;
  error: string | null;
  attemptedAt: Date;
  acceptedAt: Date | null;
};

type EmailContext = {
  referenceCode: string;
  request: AgentRequestInput;
  estimatedMonthlyPrice: number | null;
};

let resendClient: Resend | undefined;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Invio non riuscito";
  return message.replace(/[\r\n]+/g, " ").slice(0, 500);
}

function emailShell(preview: string, content: string) {
  return `<!doctype html>
<html lang="it">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;background:#f4f5f7;color:#141517;font-family:Inter,Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7">
      <tr><td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(18,22,33,.08)">
          <tr><td style="padding:28px 32px;background:#080a0d;color:#fff">
            <div style="font-size:25px;font-weight:800;letter-spacing:-.8px">voicyy<span style="color:#73ef9c">.</span></div>
            <div style="font-size:12px;color:#9ca3af;margin-top:4px;letter-spacing:.08em;text-transform:uppercase">AI voice &amp; chat agents</div>
          </td></tr>
          <tr><td style="padding:34px 32px">${content}</td></tr>
          <tr><td style="padding:22px 32px;border-top:1px solid #edf0f2;color:#6b7280;font-size:12px;line-height:1.6">
            Voicyy · <a href="mailto:info.voicyy@gmail.com" style="color:#374151">info.voicyy@gmail.com</a> · +39 392 114 3643
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function dataRow(label: string, value: unknown) {
  return `<tr>
    <td style="padding:10px 0;color:#6b7280;font-size:13px;vertical-align:top;width:42%">${escapeHtml(label)}</td>
    <td style="padding:10px 0;color:#17191c;font-size:14px;font-weight:600;vertical-align:top">${escapeHtml(value || "—")}</td>
  </tr>`;
}

function scheduleLabel(request: AgentRequestInput) {
  const { schedule } = request;
  const second =
    schedule.secondStart && schedule.secondEnd
      ? ` · ${schedule.secondStart}–${schedule.secondEnd}`
      : "";
  return `${schedule.start}–${schedule.end}${second}`;
}

function adminEmailHtml(context: EmailContext) {
  const { request, referenceCode, estimatedMonthlyPrice } = context;
  const services = request.services
    .map(
      (service) =>
        `<li style="margin:0 0 7px">${escapeHtml(service.name)} <span style="color:#6b7280">(${escapeHtml(service.durationHours)} h)</span></li>`,
    )
    .join("");
  const price =
    estimatedMonthlyPrice === null
      ? "Preventivo personalizzato"
      : new Intl.NumberFormat("it-IT", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 2,
        }).format(estimatedMonthlyPrice);

  return emailShell(
    `Nuova richiesta ${referenceCode} da ${request.businessName}`,
    `<div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#eafcf0;color:#14783c;font-size:12px;font-weight:700">NUOVA RICHIESTA · ${escapeHtml(referenceCode)}</div>
     <h1 style="margin:18px 0 8px;font-size:28px;line-height:1.15;letter-spacing:-.7px">Un nuovo progetto è pronto da valutare.</h1>
     <p style="margin:0 0 26px;color:#60656d;line-height:1.65">${escapeHtml(request.contactName)} ha configurato un agente per <strong style="color:#17191c">${escapeHtml(request.businessName)}</strong>.</p>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #edf0f2;border-bottom:1px solid #edf0f2">
       ${dataRow("Referente", request.contactName)}
       ${dataRow("Email di contatto", request.contactEmail)}
       ${dataRow("Telefono", request.phone)}
       ${dataRow("Email notifiche", request.notificationEmail)}
       ${dataRow("Sito", request.website)}
     </table>
     <h2 style="font-size:17px;margin:28px 0 10px">Operatività</h2>
     <ul style="margin:0 0 18px;padding-left:20px;color:#24272b;line-height:1.55">${services}</ul>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
       ${dataRow("Giorni", request.workingDays.join(", "))}
       ${dataRow("Fasce orarie", scheduleLabel(request))}
       ${dataRow("Ore al giorno", request.hoursPerDay)}
       ${dataRow("Google Calendar", request.calendarEmail)}
       ${dataRow("Cartella Drive", request.driveFolderId)}
     </table>
     <h2 style="font-size:17px;margin:28px 0 10px">Configurazione</h2>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;border-radius:14px;padding:8px 16px">
       ${dataRow("LLM", request.configuration.llm)}
       ${dataRow("Voce", request.configuration.textToSpeech)}
       ${dataRow("Telefonia", request.configuration.telephony)}
       ${dataRow("Minuti/mese", request.configuration.minutes)}
       ${dataRow("Stima mensile", price)}
     </table>
     <h2 style="font-size:17px;margin:28px 0 10px">Dettagli aggiuntivi</h2>
     <div style="white-space:pre-wrap;background:#f7f8fa;border-radius:14px;padding:16px;color:#3f444b;line-height:1.6">${escapeHtml(request.details || "Nessun dettaglio aggiuntivo")}</div>
     <p style="margin:24px 0 0;color:#6b7280;font-size:12px">Consenso marketing: <strong>${request.marketingConsent ? "sì" : "no"}</strong>. Termini e Privacy: accettati.</p>`,
  );
}

function clientEmailHtml(context: EmailContext) {
  const { request, referenceCode } = context;
  return emailShell(
    `Richiesta ${referenceCode} ricevuta correttamente`,
    `<div style="width:48px;height:48px;border-radius:50%;background:#eafcf0;color:#14783c;font-size:27px;line-height:48px;text-align:center;font-weight:800">✓</div>
     <h1 style="margin:20px 0 10px;font-size:29px;line-height:1.15;letter-spacing:-.7px">Richiesta ricevuta, ${escapeHtml(request.contactName)}.</h1>
     <p style="margin:0 0 22px;color:#5d626a;line-height:1.7">Grazie per aver raccontato a Voicyy le esigenze di <strong style="color:#17191c">${escapeHtml(request.businessName)}</strong>. I dati sono arrivati correttamente e verranno analizzati per preparare il prossimo passo.</p>
     <div style="padding:18px 20px;border-radius:16px;background:#080a0d;color:#fff">
       <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em">Codice richiesta</div>
       <div style="font-size:21px;font-weight:800;margin-top:5px;letter-spacing:.04em">${escapeHtml(referenceCode)}</div>
     </div>
     <h2 style="font-size:17px;margin:28px 0 8px">Cosa succede ora?</h2>
     <ol style="margin:0;padding-left:21px;color:#484d54;line-height:1.75">
       <li>Verifichiamo servizi, orari e integrazioni richieste.</li>
       <li>Ti ricontattiamo per chiarimenti e consulenza.</li>
       <li>Dopo conferma scritta e accordo, avviamo lo sviluppo su misura.</li>
     </ol>
     <a href="https://wa.me/393921143643?text=Salve%20Voicyy%2C%20vorrei%20parlare%20della%20richiesta%20${encodeURIComponent(referenceCode)}" style="display:inline-block;margin-top:26px;padding:13px 18px;border-radius:999px;background:#25d366;color:#07140b;text-decoration:none;font-weight:800">Scrivici su WhatsApp</a>
     <p style="margin:22px 0 0;color:#6b7280;font-size:12px;line-height:1.6">Questa email conferma la ricezione della richiesta; non costituisce accettazione dell'ordine né conclusione del contratto.</p>`,
  );
}

async function deliver(
  payload: {
    to: string;
    subject: string;
    html: string;
    idempotencyKey: string;
  },
): Promise<EmailDeliveryResult> {
  const attemptedAt = new Date();
  const resend = getResend();
  if (!resend) {
    return {
      status: "skipped",
      id: null,
      error: "RESEND_API_KEY non configurata",
      attemptedAt,
      acceptedAt: null,
    };
  }

  try {
    const { data, error } = await resend.emails.send(
      {
        from:
          process.env.RESEND_FROM_EMAIL?.trim() ||
          "Voicyy <onboarding@resend.dev>",
        to: payload.to,
        replyTo: "info.voicyy@gmail.com",
        subject: payload.subject,
        html: payload.html,
      },
      { idempotencyKey: payload.idempotencyKey },
    );

    if (error) {
      return {
        status: "failed",
        id: null,
        error: safeError(error),
        attemptedAt,
        acceptedAt: null,
      };
    }

    return {
      status: "accepted",
      id: data?.id ?? null,
      error: null,
      attemptedAt,
      acceptedAt: new Date(),
    };
  } catch (error) {
    return {
      status: "failed",
      id: null,
      error: safeError(error),
      attemptedAt,
      acceptedAt: null,
    };
  }
}

export function sendAdminNotification(context: EmailContext) {
  return deliver({
    to:
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
      "info.voicyy@gmail.com",
    subject: `Nuova richiesta Voicyy · ${context.request.businessName} · ${context.referenceCode}`,
    html: adminEmailHtml(context),
    idempotencyKey: `request-${context.referenceCode}-admin-v1`,
  });
}

export function sendClientConfirmation(context: EmailContext) {
  return deliver({
    to: context.request.contactEmail,
    subject: `Abbiamo ricevuto la tua richiesta · ${context.referenceCode}`,
    html: clientEmailHtml(context),
    idempotencyKey: `request-${context.referenceCode}-client-v1`,
  });
}
