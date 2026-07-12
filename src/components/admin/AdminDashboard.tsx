import type { listAgentRequestsForAdmin } from "@/lib/server/admin-data";
import Link from "next/link";

type RequestItem = Awaited<ReturnType<typeof listAgentRequestsForAdmin>>[number];

const dayLabels: Record<string, string> = {
  lunedi: "Lunedì",
  martedi: "Martedì",
  mercoledi: "Mercoledì",
  giovedi: "Giovedì",
  venerdi: "Venerdì",
  sabato: "Sabato",
  domenica: "Domenica",
};

function dateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

function price(value: number | null) {
  if (value === null) return "Preventivo personalizzato";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}

function schedule(request: RequestItem) {
  const first = `${request.schedule.start}–${request.schedule.end}`;
  return request.schedule.secondStart && request.schedule.secondEnd
    ? `${first}, ${request.schedule.secondStart}–${request.schedule.secondEnd}`
    : first;
}

function StatusBadge({ value }: { value: string }) {
  const classes =
    value === "accepted" || value === "saved"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : value === "failed"
        ? "border-red-400/20 bg-red-400/10 text-red-200"
        : "border-amber-300/20 bg-amber-300/10 text-amber-200";
  const label: Record<string, string> = {
    accepted: "Accettata dal provider",
    saved: "Salvata",
    failed: "Errore",
    skipped: "Non attiva",
    pending: "In attesa",
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {label[value] ?? value}
    </span>
  );
}

function DataItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</dt>
      <dd className="mt-2 break-words text-sm leading-6 text-zinc-100">{value || "—"}</dd>
    </div>
  );
}

function RequestCard({ request }: { request: RequestItem }) {
  return (
    <details className="group rounded-[1.6rem] border border-white/[0.08] bg-white/[0.035] open:bg-white/[0.055]">
      <summary className="cursor-pointer list-none p-5 marker:hidden sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-emerald-400">
                {request.reference_code}
              </span>
              <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs text-zinc-300">
                {request.status === "new" ? "Nuova" : request.status}
              </span>
            </div>
            <h2 className="mt-3 truncate text-xl font-bold tracking-tight text-white">
              {request.business_name}
            </h2>
            <p className="mt-1 truncate text-sm text-zinc-400">
              {request.contact_name} · {request.contact_email}
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-5 sm:block sm:text-right">
            <p className="text-xs text-zinc-500">{dateTime(request.created_at)}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              {request.monthly_minutes.toLocaleString("it-IT")} min/mese
            </p>
          </div>
        </div>
        <span className="mt-4 inline-flex text-xs font-semibold text-zinc-500 group-open:hidden">
          Apri dettaglio ↓
        </span>
        <span className="mt-4 hidden text-xs font-semibold text-zinc-500 group-open:inline-flex">
          Chiudi dettaglio ↑
        </span>
      </summary>

      <div className="border-t border-white/[0.07] px-5 pb-6 pt-5 sm:px-6">
        <section aria-labelledby={`contact-${request.id}`}>
          <h3 id={`contact-${request.id}`} className="mb-3 text-sm font-bold text-white">
            Contatto e attività
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DataItem label="Referente" value={request.contact_name} />
            <DataItem
              label="Email di contatto"
              value={
                <a className="text-emerald-300 hover:underline" href={`mailto:${request.contact_email}`}>
                  {request.contact_email}
                </a>
              }
            />
            <DataItem
              label="Telefono"
              value={
                <a className="text-emerald-300 hover:underline" href={`tel:${request.phone}`}>
                  {request.phone}
                </a>
              }
            />
            <DataItem label="Email notifiche" value={request.notification_email} />
            <DataItem
              label="Sito"
              value={
                request.website ? (
                  <a
                    className="text-emerald-300 hover:underline"
                    href={request.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    {request.website}
                  </a>
                ) : null
              }
            />
            <DataItem label="Google Calendar" value={request.calendar_email} />
            <DataItem label="Cartella Drive" value={request.drive_folder_id} />
          </dl>
        </section>

        <section className="mt-7" aria-labelledby={`work-${request.id}`}>
          <h3 id={`work-${request.id}`} className="mb-3 text-sm font-bold text-white">
            Operatività
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DataItem
              label="Giorni"
              value={request.working_days.map((day) => dayLabels[day] ?? day).join(", ")}
            />
            <DataItem label="Orari" value={schedule(request)} />
            <DataItem label="Ore al giorno" value={`${request.hours_per_day} ore`} />
          </dl>
          <div className="mt-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Servizi</p>
            <ul className="mt-3 grid gap-2 text-sm text-zinc-200 sm:grid-cols-2">
              {request.services.map((service, index) => (
                <li key={`${service.name}-${index}`} className="rounded-xl bg-white/[0.04] px-3 py-2">
                  {service.name} · {service.durationHours} h
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-7" aria-labelledby={`config-${request.id}`}>
          <h3 id={`config-${request.id}`} className="mb-3 text-sm font-bold text-white">
            Configurazione agente
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <DataItem label="LLM" value={request.llm} />
            <DataItem label="Voce" value={request.text_to_speech} />
            <DataItem label="Telefonia" value={request.telephony} />
            <DataItem label="Volume" value={`${request.monthly_minutes.toLocaleString("it-IT")} min`} />
            <DataItem label="Stima" value={price(request.estimated_monthly_price)} />
          </dl>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-2" aria-label="Consensi e consegne">
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">Consensi acquisiti</h3>
            <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-sm text-zinc-300">
              <p>✓ Termini v{request.terms_version} e Privacy v{request.privacy_version}</p>
              <p>{request.marketing_consent ? "✓" : "—"} Marketing: {request.marketing_consent ? `consenso fornito (v${request.marketing_consent_version})` : "non autorizzato"}</p>
              {request.marketing_consented_at ? (
                <p className="text-xs text-zinc-500">Marketing: {dateTime(request.marketing_consented_at)}</p>
              ) : null}
              <p className="text-xs text-zinc-500">Registrati: {dateTime(request.consented_at)}</p>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">Consegne automatiche</h3>
            <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-300">Notifica amministratore</span>
                <StatusBadge value={request.admin_email_status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-300">Conferma cliente</span>
                <StatusBadge value={request.client_email_status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-300">Google Drive</span>
                <StatusBadge value={request.drive_status} />
              </div>
              {request.admin_email_error || request.client_email_error || request.drive_error ? (
                <div className="rounded-xl border border-red-400/15 bg-red-400/[0.06] p-3 text-xs leading-5 text-red-100">
                  {request.admin_email_error ? <p>Admin: {request.admin_email_error}</p> : null}
                  {request.client_email_error ? <p>Cliente: {request.client_email_error}</p> : null}
                  {request.drive_error ? <p>Drive: {request.drive_error}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-7" aria-labelledby={`details-${request.id}`}>
          <h3 id={`details-${request.id}`} className="mb-3 text-sm font-bold text-white">
            Dettagli aggiuntivi
          </h3>
          <p className="whitespace-pre-wrap rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-sm leading-6 text-zinc-300">
            {request.details || "Nessun dettaglio aggiuntivo."}
          </p>
        </section>
      </div>
    </details>
  );
}

export function AdminDashboard({ requests }: { requests: RequestItem[] }) {
  const deliveryIssues = requests.filter(
    (request) =>
      request.admin_email_status === "failed" ||
      request.client_email_status === "failed" ||
      request.drive_status === "failed",
  ).length;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
  }).format(new Date());
  const receivedToday = requests.filter(
    (request) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(
        new Date(request.created_at),
      ) === today,
  ).length;

  return (
    <main className="min-h-screen bg-[#080a0d] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-center">
          <div>
            <Link href="/" className="text-2xl font-black tracking-[-0.06em]" aria-label="Home Voicyy">
              voicyy<span className="text-emerald-400">.</span>
            </Link>
            <p className="mt-2 text-sm text-zinc-500">Dashboard riservata · ultime 100 richieste</p>
          </div>
          <form method="post" action="/api/admin/logout">
            <button className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white">
              Esci in sicurezza
            </button>
          </form>
        </header>

        <section className="grid gap-3 py-7 sm:grid-cols-3" aria-label="Riepilogo richieste">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-[0.13em] text-zinc-500">Visualizzate</p>
            <p className="mt-2 text-3xl font-bold">{requests.length}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-[0.13em] text-zinc-500">Oggi</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{receivedToday}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-[0.13em] text-zinc-500">Consegne da verificare</p>
            <p className={`mt-2 text-3xl font-bold ${deliveryIssues ? "text-amber-200" : "text-zinc-100"}`}>
              {deliveryIssues}
            </p>
          </div>
        </section>

        <div className="space-y-3">
          {requests.length ? (
            requests.map((request) => <RequestCard key={request.id} request={request} />)
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-white/10 px-6 py-16 text-center">
              <p className="text-lg font-semibold text-zinc-200">Nessuna richiesta ricevuta</p>
              <p className="mt-2 text-sm text-zinc-500">Le nuove richieste appariranno qui.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
