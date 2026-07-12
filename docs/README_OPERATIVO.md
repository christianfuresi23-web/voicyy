# Voicyy — prerequisiti operativi per il go-live

**Documento interno — non pubblicare**
**Ultimo controllo:** 12 luglio 2026

Questo elenco separa ciò che può essere sviluppato da ciò che richiede ancora dati, account, decisioni o verifica professionale. Nessun segreto deve essere copiato in questo file, nel repository, nei log o nel browser.

## Bloccanti legali e societari

- [ ] Definire il soggetto che vende: denominazione/nome completo, forma giuridica, sede, codice fiscale e Partita IVA.
- [ ] Ottenere iscrizione e dati Registro Imprese/REA ove applicabili, PEC e domicilio digitale.
- [ ] Scegliere ATECO 2025, regime fiscale e gestione previdenziale con commercialista.
- [ ] Formalizzare cosa rappresenta il 10% dell'investitore e la relativa base di calcolo.
- [ ] Decidere se il servizio è solo B2B o anche B2C.
- [ ] Far validare Termini, Privacy, contratto quadro, ordine/preventivo, SLA, DPA e lista sub-responsabili.
- [ ] Rivedere nei Termini foro, recesso B2C, setup non rimborsabile, limitazioni di responsabilità, sospensione e modifica unilaterale.
- [ ] Aggiornare “Ultimo aggiornamento” dopo la revisione finale: nelle pagine è mantenuto “giugno 2025” perché richiesto, ma non deve risultare fuorviante al lancio.
- [ ] Definire informativa iniziale per chiamata/chat, disclosure AI, escalation umana e politica sulle registrazioni.
- [ ] Completare registro trattamenti, screening/DPIA, retention per categoria e procedura data breach.
- [ ] Verificare che la frase “solo cookie tecnici” corrisponda agli script realmente caricati.

## Branding e prezzi

- [ ] Conservare il logo originale ad alta risoluzione e con diritto d'uso documentato; verificare la versione trasparente/wordmark presente nel progetto contro l'allegato originale.
- [ ] Archiviare il file XLSX sorgente della tabella prezzi in un'area interna controllata e riconciliare il JSON generato con ogni riga/combinazione.
- [x] Applicare la formula unica approvata: **costo sorgente × 1,45**.
- [ ] Verificare che tutti i prezzi mostrati siano indicativi, coerenti fino a 10.000 minuti e distinti dall'IVA.
- [ ] Misurare costi effettivi, arrotondamenti, valuta, minimi dei fornitori e picchi prima di usare il configuratore in produzione.

## Email transazionale / Resend

- [ ] Verificare un dominio mittente in Resend; la sandbox non è sufficiente per consegnare in modo affidabile a qualsiasi cliente.
- [ ] Pubblicare e validare record DNS richiesti (SPF/DKIM e, se adottato, DMARC).
- [ ] Impostare `RESEND_API_KEY` solo nelle variabili server di Vercel e ruotare ogni chiave già condivisa durante sviluppo/chat.
- [ ] Impostare `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `SITE_URL` e `NEXT_PUBLIC_SITE_URL` senza hardcode nel codice.
- [ ] Testare notifica a Voicyy e conferma al cliente su provider diversi, bounce, retry e mancata consegna.
- [ ] Non includere nella conferma dettagli sensibili non necessari; aggiungere riferimenti richiesta e canale di assistenza.
- [ ] Separare email operative da marketing e implementare revoca/unsubscribe per il marketing.

## Database e richieste

- [ ] Creare il progetto Supabase Postgres di produzione e impostare in Vercel, esclusivamente lato server, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUBMISSION_WRITE_SECRET` e `REQUEST_DATA_ENCRYPTION_KEY`; non configurare `service_role`, secret key o URL PostgreSQL sul sito.
- [ ] Applicare `database/schema.sql`, verificare RLS/grant e generare poi una migrazione ufficiale con Supabase CLI.
- [ ] Applicare e versionare migrazioni; testare indici, vincoli e transazioni.
- [x] Cifrare l'intero payload con AES-256-GCM prima del database; conservare la chiave fuori da Supabase.
- [ ] Impedire che i dati delle richieste finiscano in log di build/runtime o analytics.
- [ ] Configurare backup, retention e prova di ripristino.
- [ ] Definire chi può vedere/esportare/cancellare le richieste e registrare gli accessi amministrativi.
- [ ] Preparare procedura per accesso, rettifica, cancellazione, opposizione e portabilità.

## Visualizzatore locale delle richieste

- [ ] Verificare che non esistano pagine o API web capaci di leggere le richieste.
- [ ] Creare un LOGIN PostgreSQL dedicato, membro soltanto di `voicyy_local_reader`, con password casuale, `CONNECTION LIMIT 1` e `default_transaction_read_only=on`.
- [ ] Conservare `LOCAL_DATABASE_URL` e `LOCAL_DATA_ENCRYPTION_KEY` esclusivamente in `.env.viewer.local` sul PC autorizzato; non copiarle in `.env.local`, GitHub, chat, log o screenshot.
- [ ] Usare TLS `verify-full` e, se disponibile sul piano, limitare le connessioni database all'IP pubblico autorizzato.
- [ ] Proteggere account Windows e disco, non salvare export locali non cifrati e ruotare la password del LOGIN in caso di sospetta esposizione.
- [ ] Collaudare `npm run requests:local`: membership read-only, ruolo non privilegiato, TLS verificato, bind `127.0.0.1`, bootstrap monouso, cookie HttpOnly, decifrazione e arresto con `Ctrl+C`.
- [ ] Generare `SUBMISSION_WRITE_SECRET` con 48 byte casuali e conservarne soltanto il digest SHA-256 nel database; generare separatamente una chiave dati di 32 byte. Verificare `pg_cron` senza endpoint HTTP amministrativi.

## Google Drive opzionale

- [ ] Creare un progetto Google Cloud dedicato e un Service Account con privilegi minimi.
- [ ] Ottenere il JSON del Service Account da canale sicuro; non caricarlo nel repository né nel browser.
- [ ] Condividere esclusivamente la cartella target con l'indirizzo del Service Account.
- [ ] Salvare credenziali e `GOOGLE_DRIVE_FOLDER_ID` nel secret store di Vercel.
- [ ] Definire se Drive è copia operativa, archivio o export: evitare due fonti dati divergenti.
- [ ] Testare creazione file, collisioni, retry, revoca permessi, cancellazione e audit.
- [ ] Aggiungere Google ai documenti privacy/DPA e verificare localizzazione/trasferimenti.

## GitHub e repository

- [ ] Scegliere account/organizzazione, nome della nuova repository, visibilità e proprietari.
- [ ] Inizializzare Git se necessario, verificare `.gitignore` e scansionare la cronologia per segreti prima del primo push.
- [ ] Proteggere il branch principale, richiedere review/check e limitare i collaboratori.
- [ ] Attivare secret scanning e aggiornamenti dipendenze.
- [ ] Non commettere `.env*`, dump database, export richieste, password del viewer, Service Account JSON o chiavi API.

## Vercel e dominio

- [ ] Creare/collegare il progetto Vercel alla nuova repository e scegliere regione coerente con database e fornitori.
- [ ] Configurare separatamente variabili Development, Preview e Production; usare credenziali/database distinti dove possibile.
- [ ] Applicare migrazioni in modo controllato prima di promuovere il deploy.
- [ ] Collegare dominio, DNS e HTTPS; impostare URL canonico e mittente email sul dominio verificato.
- [ ] Disabilitare l'indicizzazione delle preview e proteggere eventuali ambienti di collaudo.
- [ ] Definire retention dei log, allarmi errori, uptime e costi; verificare impatto privacy di analytics/monitoraggio.
- [ ] Testare rollback e ripristino database prima del lancio.

## Collaudo end-to-end obbligatorio

- [ ] Form con validazione, giorni/orari, seconda fascia, configurazione e calcolo fino a 10.000 minuti.
- [ ] Due checkbox separate, non preselezionate: accettazione documenti obbligatoria e marketing facoltativo.
- [ ] Link a Termini e Privacy apribili e leggibili su mobile/tastiera/screen reader.
- [ ] WhatsApp apre il numero internazionale corretto con URL `wa.me` valido e messaggio codificato.
- [ ] Salvataggio database atomico e gestione invii duplicati/retry.
- [ ] Email Voicyy e cliente, inclusa gestione errore senza mostrare un falso successo.
- [ ] Visualizzatore locale: nessuna route pubblica di lettura, ruolo PostgreSQL read-only, TLS, bind loopback e token effimero.
- [ ] Export/Drive opzionale senza esporre credenziali o dati ad altri clienti.
- [ ] Test con dati sintetici; cancellare i dati di prova prima della produzione.
- [ ] Verifica responsive, accessibilità, performance, errori console/server e intestazioni di sicurezza.

## Criterio “pronto a pubblicare”

Il go-live è autorizzabile solo quando:

1. identità e posizioni dell'attività sono definite;
2. commercialista e legale hanno validato i punti di competenza;
3. dominio email, database, segreti e backup sono di produzione;
4. i costi reali rendono ogni configurazione sostenibile;
5. i flussi privacy e i fornitori corrispondono alle informative;
6. sicurezza del database, visualizzatore locale e test end-to-end sono superati;
7. nessun segreto esposto in precedenza è ancora valido.
