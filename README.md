# Voicyy web

Sito istituzionale e configuratore per agenti vocali AI e chatbot su misura.
Il progetto include homepage animata 3D, raccolta richieste, email transazionali,
database Supabase e visualizzatore delle richieste eseguibile soltanto in locale.

## Funzioni principali

- Homepage in italiano, responsive, accessibile e compatibile con
  `prefers-reduced-motion`.
- Configuratore LLM/TTS/telefonia e volume da 0 a 10.000 minuti.
- Servizi dinamici, giorni lavorativi e una o due fasce orarie.
- Consenso contrattuale/privacy obbligatorio e marketing facoltativo separato.
- Persistenza cifrata AES-256-GCM in `private.agent_requests`, schema non esposto
  alla Data API; Supabase conserva ciphertext e non può ricostruire le PII senza
  la chiave applicativa.
- Email HTML separate per Voicyy e cliente tramite Resend.
- Nessuna dashboard o API di lettura pubblica; visualizzatore locale separato,
  vincolato a `127.0.0.1` e collegato con un ruolo PostgreSQL read-only.
- Retention automatica giornaliera eseguita internamente da PostgreSQL con
  `pg_cron`, senza endpoint amministrativi pubblici.
- Google Drive predisposto ma disattivato finché non esiste un Service Account.

## Avvio locale

Requisiti: Node.js 20.9 o superiore e npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Aprire `http://localhost:3000`. Le variabili reali vanno inserite in
`.env.local`, che è escluso da Git. Non usare mai credenziali di produzione in
file versionati.

## Database

1. Creare un progetto Supabase in una regione coerente con il deploy.
2. Applicare e verificare [`database/schema.sql`](database/schema.sql).
3. Registrare il digest SHA-256 di `SUBMISSION_WRITE_SECRET` in
   `private.request_ingress_secret`, poi configurare su Vercel soltanto
   `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, il secret in chiaro e
   `REQUEST_DATA_ENCRYPTION_KEY`.
4. Eseguire gli advisor di sicurezza/performance e generare una migrazione
   ufficiale con Supabase CLI dopo la verifica dello schema.

Le PII entrano nel database soltanto come envelope AES-256-GCM autenticato. Lo
schema `private` non deve essere aggiunto alla Data API; le RPC pubbliche
accettano soltanto inserimenti validati e non restituiscono righe personali. Non
configurare `service_role`, `DATABASE_URL` o la chiave locale del viewer su
Vercel.

## Visualizzatore richieste privato

Le richieste possono essere consultate con `npm run requests:local`. Il processo
usa un LOGIN read-only per recuperare il ciphertext e
`LOCAL_DATA_ENCRYPTION_KEY` per decifrarlo sul PC autorizzato. Entrambi devono
esistere soltanto in `.env.viewer.local`. Configurazione e procedura sono descritte in
[`docs/VISUALIZZATORE_LOCALE.md`](docs/VISUALIZZATORE_LOCALE.md).

Tutte le credenziali condivise in chat o in ambienti di prova devono essere
ruotate prima del go-live.

## Listino

Il listino è stato importato dal foglio `Tutte le Combinazioni` del workbook
fornito. Il JSON contiene 192 combinazioni coerenti con le opzioni esposte dal
configuratore; `Custom LLM` resta su preventivo perché non ha un costo sorgente.
La procedura e il formato generato sono descritti in
[`scripts/README-pricing.md`](scripts/README-pricing.md). L'app applica la
maggiorazione unica richiesta del 45% (`costo base × 1,45`) e mostra sia il
prezzo al minuto sia la stima mensile fino a 10.000 minuti.

## Controlli

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

La pipeline GitHub esegue automaticamente lint, TypeScript, test e build su
push e pull request.

## Deploy Vercel

Collegare la repository privata a Vercel, aggiungere le variabili per gli
ambienti Preview e Production e verificare un dominio mittente in Resend. Con
la sandbox Resend l'email al cliente può essere rifiutata: il form registra
comunque la richiesta e comunica il relativo codice.

Prima della pubblicazione seguire
[`docs/README_OPERATIVO.md`](docs/README_OPERATIVO.md). Il piano economico e
legale interno è in [`docs/PIANO_INTERNO_ITALIA.md`](docs/PIANO_INTERNO_ITALIA.md)
e non costituisce consulenza professionale.

## Identità visiva

La homepage usa due pose WebP trasparenti della mascotte Voicyy: la posa di
discesa e quella di ritorno sono asset distinti, così la risalita non riproduce
la stessa animazione al contrario. Il wordmark resta in SVG trasparente per
conservare bordi nitidi su schermi ad alta densità.
