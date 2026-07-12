# Voicyy web

Sito istituzionale e configuratore per agenti vocali AI e chatbot su misura.
Il progetto include homepage animata 3D, raccolta richieste, email transazionali,
database Supabase e dashboard amministrativa con autenticazione a tre fattori.

## Funzioni principali

- Homepage in italiano, responsive, accessibile e compatibile con
  `prefers-reduced-motion`.
- Configuratore LLM/TTS/telefonia e volume da 0 a 10.000 minuti.
- Servizi dinamici, giorni lavorativi e una o due fasce orarie.
- Consenso contrattuale/privacy obbligatorio e marketing facoltativo separato.
- Persistenza server-only su Supabase Postgres con RLS e nessun accesso browser.
- Email HTML separate per Voicyy e cliente tramite Resend.
- Dashboard non linkata su `/voicyy-admin-x9k2`, protetta da password, TOTP e
  frase di sicurezza.
- Sessioni admin revocabili, passaggi monouso e protezione anti-replay TOTP.
- Retention automatica giornaliera tramite Vercel Cron protetto.
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
3. Impostare `SUPABASE_URL` e `SUPABASE_SECRET_KEY` esclusivamente lato server.
4. Eseguire gli advisor di sicurezza/performance e generare una migrazione
   ufficiale con Supabase CLI dopo la verifica dello schema.

Lo schema abilita RLS su tutte le tabelle, revoca i privilegi a `anon` e
`authenticated` e concede accesso soltanto a `service_role`. La secret key non
deve mai avere prefisso `NEXT_PUBLIC_`.

## Configurazione privata

Le variabili richieste sono documentate in [`.env.example`](.env.example).
Password e frase di sicurezza sono salvate soltanto come hash; la password usa
bcrypt direttamente, mentre la frase usa bcrypt sul digest SHA-256 della frase
normalizzata. La frase
va normalizzata in minuscolo con un singolo spazio tra le 12 parole prima di
generare l'hash. Il segreto TOTP viene creato al primo accesso, mostrato come QR
dopo la password e salvato cifrato AES-256-GCM nel database.

Tutte le credenziali condivise in chat o in ambienti di prova devono essere
ruotate prima del go-live.

## Listino

Il file Excel sorgente non era disponibile nel workspace. Per questo il sito
non inventa prezzi e mostra “Listino in attesa di importazione”. La procedura e
il formato della tabella generata sono descritti in
[`scripts/README-pricing.md`](scripts/README-pricing.md). L'app applica una
maggiorazione totale del 40% (`costo base × 1,40`).

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

## Asset mancanti

Il wordmark SVG presente è un sostituto trasparente e provvisorio. Per
replicare esattamente il logo originale e importare i costi reali servono
nuovamente l'immagine sorgente e il workbook `.xlsx` citati nella richiesta.
