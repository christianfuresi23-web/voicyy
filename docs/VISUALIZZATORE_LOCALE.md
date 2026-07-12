# Visualizzatore locale delle richieste

Il sito pubblico non include una dashboard e non espone alcun endpoint per
leggere le richieste. Il programma `scripts/local-requests-viewer.mjs` gira come
processo separato, si collega direttamente a PostgreSQL con un utente dedicato
in sola lettura, decifra i payload in memoria e ascolta esclusivamente su
`127.0.0.1`.

## Protezioni incluse

- nessuna credenziale PostgreSQL viene inviata a Vercel o al browser;
- il database conserva soltanto envelope AES-256-GCM nello schema non esposto
  `private`; la chiave non viene mai salvata in Supabase;
- il LOGIN deve appartenere soltanto al ruolo `voicyy_local_reader`;
- il programma rifiuta account privilegiati, `BYPASSRLS`, ruoli amministrativi,
  limiti di connessione diversi da 1 e sessioni non read-only;
- una sola connessione PostgreSQL, query parametrizzate e limite massimo di
  200 righe per schermata;
- TLS `verify-full`, server HTTP vincolato a `127.0.0.1`, controllo rigoroso
  dell'header `Host` e token bootstrap monouso scambiato con cookie HttpOnly;
- CSP restrittiva, `no-store`, `no-referrer`, nessuno script client e nessun
  collegamento esterno; i filtri con PII usano POST e non entrano nella URL.

## 1. Creare il LOGIN dedicato

Lo schema applicativo crea il ruolo `voicyy_local_reader` senza LOGIN e con il
solo privilegio `SELECT` su `private.agent_requests`. La password del LOGIN non
deve essere versionata: generarne una casuale lunga e creare l'utente una sola
volta dal SQL Editor di Supabase, sostituendo i due placeholder localmente.

```sql
create role voicyy_local_viewer
  login
  password '<PASSWORD_CASUALE_LUNGA>'
  in role voicyy_local_reader
  connection limit 1;

alter role voicyy_local_viewer
  set default_transaction_read_only = on;
```

Non usare `postgres`, `service_role`, la secret key Supabase o la password del
database principale. Ruotare subito la password se appare in chat, log o
screenshot.

## 2. Configurare soltanto il PC autorizzato

Creare `.env.viewer.local` sul solo PC autorizzato e inserirvi esclusivamente:

```dotenv
LOCAL_DATABASE_URL=postgresql://voicyy_local_viewer:<PASSWORD_URL_ENCODED>@<HOST>:5432/postgres?sslmode=verify-full
LOCAL_DATA_ENCRYPTION_KEY=<STESSA_CHIAVE_BASE64_DI_REQUEST_DATA_ENCRYPTION_KEY>
LOCAL_VIEWER_PORT=4317
```

La connessione diretta Supabase usa IPv6. Su una rete solo IPv4 si può usare il
pooler in modalità sessione; il nome utente del pooler può includere il project
ref. Il programma impone TLS `verify-full`: usare hostname e certificato CA
indicati nel pannello Database di Supabase.

`LOCAL_DATABASE_URL` non deve essere aggiunta alle variabili Vercel o al file
`.env.local` del sito. `LOCAL_DATA_ENCRYPTION_KEY` deve corrispondere alla chiave
di cifratura Vercel, ma la sua copia locale resta soltanto su questo PC.
`.env.viewer.local` è escluso da Git e deve restare
accessibile soltanto all'account Windows del proprietario. Separare i due file
evita di caricare nel processo locale le altre chiavi dell'applicazione.

## 3. Installare e avviare

Il visualizzatore usa `postgres` 3.4.9, dipendenza runtime senza dipendenze
transitive.

```powershell
npm install
npm run requests:local
```

Il terminale stampa un indirizzo simile a:

```text
http://127.0.0.1:4317/?token=<TOKEN-CASUALE>
```

Aprirlo sullo stesso PC. Il token cambia a ogni avvio, può essere usato una sola
volta e viene subito rimosso dalla barra indirizzi tramite redirect. `Ctrl+C`
chiude server, cookie effettivo e connessione al database.

## Difesa aggiuntiva consigliata

Nessun sistema collegato a Internet può essere definito “impossibile da
leggere”. In questa architettura una copia del database o la sola password
PostgreSQL non bastano a leggere le richieste: serve anche la chiave AES conservata
fuori da Supabase. Per ridurre ulteriormente il rischio, applicare le Network
Restrictions Supabase all'IP autorizzato, cifrare il disco Windows, proteggere
l'account con MFA e non salvare esportazioni in chiaro.
