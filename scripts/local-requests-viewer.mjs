import { createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

import postgres from "postgres";

const LOOPBACK_HOST = "127.0.0.1";
const DEFAULT_PORT = 4317;
const MAX_ROWS = 200;
const DATABASE_FETCH_LIMIT = 1000;
const COOKIE_NAME = "voicyy_local_session";
const ALLOWED_STATUSES = new Set([
  "new",
  "contacted",
  "qualified",
  "in_progress",
  "completed",
  "rejected",
]);

function fatal(message) {
  console.error(`\n[Voicyy] ${message}\n`);
  process.exit(1);
}

function databaseErrorSummary(error) {
  if (!error || typeof error !== "object") return "errore database";
  const code = "code" in error ? String(error.code) : "";
  return code && /^[A-Z0-9_]{2,12}$/.test(code)
    ? `errore database (${code})`
    : "errore database";
}

function clampInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(date);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function safeJson(value) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return "—";
  }
}

function detail(label, value, className = "") {
  const visible = value === null || value === undefined || value === "" ? "—" : value;
  return `<div class="detail ${escapeHtml(className)}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(visible)}</dd></div>`;
}

function jsonDetail(label, value) {
  return `<div class="detail detail-wide"><dt>${escapeHtml(label)}</dt><dd><pre>${escapeHtml(safeJson(value))}</pre></dd></div>`;
}

function requestCard(request) {
  const configuration = request.configuration ?? {};
  return `
    <details class="request-card">
      <summary>
        <span class="request-reference">${escapeHtml(request.reference_code)}</span>
        <span class="request-business">${escapeHtml(request.businessName)}</span>
        <span class="request-contact">${escapeHtml(request.contactName)}</span>
        <span class="status status-${escapeHtml(request.status)}">${escapeHtml(request.status.replaceAll("_", " "))}</span>
        <time>${escapeHtml(formatDate(request.created_at))}</time>
      </summary>
      <div class="request-body">
        <dl class="detail-grid">
          ${detail("Referente", request.contactName)}
          ${detail("Attività", request.businessName)}
          ${detail("Email contatto", request.contactEmail)}
          ${detail("Email notifiche", request.notificationEmail)}
          ${detail("Telefono", request.phone)}
          ${detail("Sito web", request.website)}
          ${detail("Email Google Calendar", request.calendarEmail)}
          ${detail("Cartella Google Drive", request.driveFolderId)}
          ${detail("LLM", configuration.llm)}
          ${detail("Text to speech", configuration.textToSpeech)}
          ${detail("Telefonia", configuration.telephony)}
          ${detail("Minuti mensili", configuration.minutes)}
          ${detail("Stima mensile", formatMoney(request.estimatedMonthlyPrice))}
          ${detail("Ore lavorative/giorno", request.hoursPerDay)}
          ${detail("Consenso marketing", request.marketing_consent ? "Sì" : "No")}
          ${detail("Termini", request.terms_version)}
          ${detail("Privacy", request.privacy_version)}
          ${detail("Email Voicyy", request.owner_email_status)}
          ${detail("Email cliente", request.client_email_status)}
          ${detail("Export Drive", request.drive_status)}
          ${detail("Consenso acquisito", formatDate(request.consented_at))}
          ${detail("Ultimo aggiornamento", formatDate(request.updated_at))}
          ${detail("Dettagli aggiuntivi", request.details, "detail-wide")}
          ${jsonDetail("Servizi", request.services)}
          ${jsonDetail("Giorni lavorativi", request.workingDays)}
          ${jsonDetail("Orari", request.schedule)}
        </dl>
      </div>
    </details>`;
}

function renderPage({ requests, query, status, limit, nonce }) {
  const cards = requests.length
    ? requests.map(requestCard).join("\n")
    : `<div class="empty"><strong>Nessuna richiesta trovata.</strong><span>Modifica i filtri oppure attendi una nuova richiesta.</span></div>`;

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <title>Richieste Voicyy — visualizzatore locale</title>
    <style nonce="${nonce}">
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #080b0a; color: #f3f6f4; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 80% -10%, rgba(183, 243, 74, .15), transparent 38rem), #080b0a; }
      main { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 48px 0 72px; }
      header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
      .eyebrow { color: #b7f34a; text-transform: uppercase; letter-spacing: .15em; font: 700 12px/1.2 ui-monospace, monospace; }
      h1 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 64px); letter-spacing: -.055em; line-height: .95; }
      .local-badge { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid rgba(183, 243, 74, .25); background: rgba(183, 243, 74, .08); border-radius: 999px; color: #d9ff91; font-size: 13px; white-space: nowrap; }
      .local-badge::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #b7f34a; box-shadow: 0 0 18px #b7f34a; }
      form { display: grid; grid-template-columns: minmax(220px, 1fr) 190px 110px auto; gap: 10px; padding: 14px; margin-bottom: 16px; border: 1px solid #222926; background: rgba(16, 20, 18, .88); border-radius: 20px; backdrop-filter: blur(18px); }
      input, select, button { min-height: 46px; border-radius: 12px; border: 1px solid #2b3430; background: #0d110f; color: inherit; padding: 0 14px; font: inherit; }
      input:focus, select:focus, button:focus-visible, summary:focus-visible { outline: 2px solid #b7f34a; outline-offset: 2px; }
      button { cursor: pointer; border-color: #b7f34a; background: #b7f34a; color: #071006; font-weight: 750; }
      .count { margin: 0 2px 14px; color: #909b96; font-size: 14px; }
      .request-card { border: 1px solid #202724; border-radius: 18px; background: rgba(14, 18, 16, .92); overflow: hidden; margin: 10px 0; }
      .request-card[open] { border-color: rgba(183, 243, 74, .34); box-shadow: 0 20px 60px rgba(0, 0, 0, .22); }
      summary { cursor: pointer; list-style: none; display: grid; grid-template-columns: 164px minmax(180px, 1.4fr) minmax(150px, 1fr) 110px 165px; gap: 16px; align-items: center; padding: 18px 20px; }
      summary::-webkit-details-marker { display: none; }
      .request-reference { color: #b7f34a; font: 650 12px/1 ui-monospace, monospace; }
      .request-business { font-weight: 720; }
      .request-contact, time { color: #9da7a2; }
      time { text-align: right; font-size: 13px; }
      .status { justify-self: start; padding: 6px 9px; border: 1px solid #344039; border-radius: 999px; color: #cbd3cf; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
      .status-new, .status-qualified, .status-in_progress { border-color: rgba(183, 243, 74, .35); color: #d9ff91; }
      .request-body { border-top: 1px solid #202724; padding: 20px; background: #0b0f0d; }
      .detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 0; }
      .detail { min-width: 0; padding: 14px; border: 1px solid #1e2522; border-radius: 13px; background: #0e1311; }
      .detail-wide { grid-column: 1 / -1; }
      dt { color: #7e8b85; font-size: 11px; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 7px; }
      dd { margin: 0; overflow-wrap: anywhere; line-height: 1.5; }
      pre { margin: 0; white-space: pre-wrap; color: #c7d0cc; font: 13px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace; }
      .empty { display: grid; gap: 6px; place-items: center; min-height: 260px; border: 1px dashed #2c3531; border-radius: 20px; color: #8c9892; text-align: center; }
      .empty strong { color: #e8edea; font-size: 18px; }
      footer { margin-top: 24px; color: #68736d; font-size: 12px; text-align: center; }
      @media (max-width: 860px) { header { align-items: flex-start; flex-direction: column; } form { grid-template-columns: 1fr 1fr; } form input { grid-column: 1 / -1; } summary { grid-template-columns: 145px 1fr auto; } summary .request-contact, summary time { display: none; } .detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { main { width: min(100% - 20px, 1180px); padding-top: 28px; } form, .detail-grid { grid-template-columns: 1fr; } form input, .detail-wide { grid-column: auto; } summary { grid-template-columns: 1fr auto; gap: 8px; } summary .request-reference, summary .request-business { grid-column: 1; } summary .status { grid-column: 2; grid-row: 1 / 3; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div><div class="eyebrow">Voicyy / archivio cifrato</div><h1>Richieste ricevute</h1></div>
        <div class="local-badge">decifrazione soltanto su questo PC</div>
      </header>
      <form method="post" action="/">
        <input name="q" maxlength="80" value="${escapeHtml(query)}" placeholder="Cerca codice, attività, nome, email o telefono" aria-label="Cerca richieste">
        <select name="status" aria-label="Filtra per stato">
          <option value="">Tutti gli stati</option>
          ${[...ALLOWED_STATUSES].map((option) => `<option value="${option}"${status === option ? " selected" : ""}>${escapeHtml(option.replaceAll("_", " "))}</option>`).join("")}
        </select>
        <select name="limit" aria-label="Numero massimo di richieste">
          ${[25, 50, 100, 200].map((option) => `<option value="${option}"${limit === option ? " selected" : ""}>${option}</option>`).join("")}
        </select>
        <button type="submit">Filtra</button>
      </form>
      <p class="count">${requests.length} ${requests.length === 1 ? "richiesta visualizzata" : "richieste visualizzate"}</p>
      <section aria-label="Elenco richieste">${cards}</section>
      <footer>Il database contiene solo dati cifrati. Chiudi il terminale per eliminare la sessione locale.</footer>
    </main>
  </body>
</html>`;
}

function securityHeaders(nonce, extra = {}) {
  return {
    "Cache-Control": "no-store, max-age=0",
    "Content-Security-Policy": `default-src 'none'; style-src 'nonce-${nonce}'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`,
    "Content-Type": "text/html; charset=utf-8",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    Pragma: "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    ...extra,
  };
}

function tokenMatches(candidate, expected) {
  if (typeof candidate !== "string") return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function cookieValue(header, name) {
  return String(header ?? "")
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

function encryptionKey() {
  const encoded = process.env.LOCAL_DATA_ENCRYPTION_KEY?.trim();
  if (!encoded || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(encoded)) {
    fatal("LOCAL_DATA_ENCRYPTION_KEY non è configurata in .env.viewer.local.");
  }
  const key = Buffer.from(encoded, "base64");
  if (key.byteLength !== 32) {
    fatal("LOCAL_DATA_ENCRYPTION_KEY deve contenere esattamente 32 byte in base64.");
  }
  return key;
}

function decryptRequest(row, key) {
  if (Number(row.encryption_version) !== 1) {
    throw new Error("versione cifratura non supportata");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(row.payload_iv, "base64url"),
  );
  decipher.setAAD(
    Buffer.from(`voicyy-agent-request:v1:${row.submission_id}`, "utf8"),
  );
  decipher.setAuthTag(Buffer.from(row.payload_auth_tag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(row.payload_ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const payload = JSON.parse(plaintext);
  return { ...row, ...payload };
}

function matchesQuery(request, query) {
  if (!query) return true;
  const needle = query.toLocaleLowerCase("it-IT");
  return [
    request.reference_code,
    request.businessName,
    request.contactName,
    request.contactEmail,
    request.notificationEmail,
    request.phone,
  ].some((value) => String(value ?? "").toLocaleLowerCase("it-IT").includes(needle));
}

async function fetchRequests(sql, key, query, status, limit) {
  const rows = await sql`
    select
      submission_id,
      reference_code,
      status,
      payload_ciphertext,
      payload_iv,
      payload_auth_tag,
      encryption_version,
      terms_version,
      privacy_version,
      marketing_consent,
      consented_at,
      owner_email_status,
      client_email_status,
      drive_status,
      created_at,
      updated_at
    from private.agent_requests
    where (${status}::text = '' or status = ${status}::text)
    order by created_at desc
    limit ${DATABASE_FETCH_LIMIT}
  `;

  return rows
    .map((row) => decryptRequest(row, key))
    .filter((request) => matchesQuery(request, query))
    .slice(0, limit);
}

function readFormBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 4096) reject(new Error("corpo richiesta troppo grande"));
    });
    request.on("end", () => resolve(new URLSearchParams(body)));
    request.on("error", reject);
  });
}

const connectionUrl = process.env.LOCAL_DATABASE_URL?.trim();
if (!connectionUrl) fatal("LOCAL_DATABASE_URL non è configurata in .env.viewer.local.");

let parsedConnection;
try {
  parsedConnection = new URL(connectionUrl);
} catch {
  fatal("LOCAL_DATABASE_URL non è una URL PostgreSQL valida.");
}
if (!["postgres:", "postgresql:"].includes(parsedConnection.protocol)) {
  fatal("LOCAL_DATABASE_URL deve usare postgres:// o postgresql://.");
}

const port = clampInteger(process.env.LOCAL_VIEWER_PORT, DEFAULT_PORT, 1024, 65535);
const accessToken = randomBytes(32).toString("base64url");
const dataKey = encryptionKey();
let bootstrapConsumed = false;

const sql = postgres(connectionUrl, {
  application_name: "voicyy-local-requests-viewer",
  connect_timeout: 10,
  fetch_types: false,
  idle_timeout: 10,
  max: 1,
  max_lifetime: 60 * 30,
  prepare: false,
  ssl: "verify-full",
});

let identity;
try {
  [identity] = await sql`
    select
      current_user as current_user,
      session_user as session_user,
      current_user = session_user as same_identity,
      pg_catalog.pg_has_role(current_user, 'voicyy_local_reader', 'member') as is_local_reader,
      pg_catalog.current_setting('transaction_read_only') = 'on' as is_read_only,
      role.rolsuper,
      role.rolinherit,
      role.rolcreaterole,
      role.rolcreatedb,
      role.rolcanlogin,
      role.rolreplication,
      role.rolbypassrls,
      role.rolconnlimit
    from pg_catalog.pg_roles as role
    where role.rolname = current_user
  `;
} catch (error) {
  await sql.end({ timeout: 1 }).catch(() => {});
  fatal(`Connessione non riuscita: ${databaseErrorSummary(error)}. Verifica credenziali, certificato TLS e ruolo.`);
}

if (
  !identity?.same_identity ||
  !identity?.is_local_reader ||
  !identity?.is_read_only ||
  !identity?.rolcanlogin ||
  !identity?.rolinherit ||
  identity?.rolsuper ||
  identity?.rolcreaterole ||
  identity?.rolcreatedb ||
  identity?.rolreplication ||
  identity?.rolbypassrls ||
  Number(identity?.rolconnlimit) !== 1
) {
  await sql.end({ timeout: 1 }).catch(() => {});
  fatal("Il LOGIN deve essere dedicato, read-only, non privilegiato, membro di voicyy_local_reader e con CONNECTION LIMIT 1.");
}

const server = createServer(async (request, response) => {
  const nonce = randomBytes(18).toString("base64");
  const expectedHost = `${LOOPBACK_HOST}:${port}`;
  const url = new URL(request.url || "/", `http://${expectedHost}`);

  if (request.headers.host !== expectedHost) {
    response.writeHead(421, securityHeaders(nonce));
    response.end("Host non consentito");
    return;
  }
  if (url.pathname !== "/") {
    response.writeHead(404, securityHeaders(nonce));
    response.end("Pagina non trovata");
    return;
  }

  const bootstrapToken = url.searchParams.get("token");
  if (
    request.method === "GET" &&
    !bootstrapConsumed &&
    tokenMatches(bootstrapToken, accessToken)
  ) {
    bootstrapConsumed = true;
    response.writeHead(
      303,
      securityHeaders(nonce, {
        Location: "/",
        "Set-Cookie": `${COOKIE_NAME}=${accessToken}; HttpOnly; SameSite=Strict; Path=/`,
      }),
    );
    response.end();
    return;
  }

  if (!tokenMatches(cookieValue(request.headers.cookie, COOKIE_NAME), accessToken)) {
    response.writeHead(401, securityHeaders(nonce));
    response.end("Sessione locale non valida. Riavvia il programma e usa il nuovo link.");
    return;
  }

  if (request.method !== "GET" && request.method !== "POST") {
    response.writeHead(405, { ...securityHeaders(nonce), Allow: "GET, POST" });
    response.end("Metodo non consentito");
    return;
  }

  let form = new URLSearchParams();
  if (request.method === "POST") {
    if (!String(request.headers["content-type"] ?? "").startsWith("application/x-www-form-urlencoded")) {
      response.writeHead(415, securityHeaders(nonce));
      response.end("Formato non consentito");
      return;
    }
    try {
      form = await readFormBody(request);
    } catch {
      response.writeHead(413, securityHeaders(nonce));
      response.end("Richiesta troppo grande");
      return;
    }
  }

  const query = (form.get("q") || "").trim().slice(0, 80);
  const requestedStatus = form.get("status") || "";
  const status = ALLOWED_STATUSES.has(requestedStatus) ? requestedStatus : "";
  const limit = clampInteger(form.get("limit"), 50, 1, MAX_ROWS);

  try {
    const requests = await fetchRequests(sql, dataKey, query, status, limit);
    response.writeHead(200, securityHeaders(nonce));
    response.end(renderPage({ requests, query, status, limit, nonce }));
  } catch (error) {
    console.error(`[Voicyy] Lettura/decifrazione fallita: ${databaseErrorSummary(error)}`);
    response.writeHead(500, securityHeaders(nonce));
    response.end("Impossibile decifrare le richieste. Verifica la chiave locale e il terminale.");
  }
});

server.on("clientError", (_error, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
});
server.on("error", async (error) => {
  await sql.end({ timeout: 1 }).catch(() => {});
  fatal(`Il visualizzatore non può avviarsi: ${error.message}`);
});

server.listen(port, LOOPBACK_HOST, () => {
  console.log("\nVoicyy — visualizzatore richieste cifrate");
  console.log(`Database: ${identity.current_user} · TLS verify-full · sola lettura`);
  console.log(`Apri una sola volta: http://${LOOPBACK_HOST}:${port}/?token=${accessToken}`);
  console.log("Il token viene scambiato con un cookie locale e poi invalidato.");
  console.log("Premi Ctrl+C per chiudere e cancellare la sessione.\n");
});

async function shutdown() {
  server.close();
  await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
