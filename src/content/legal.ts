export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  afterParagraphs?: readonly string[];
};

export type LegalDocument = {
  title: string;
  updated: string;
  updatedDate: string;
  introduction?: string;
  sections: readonly LegalSection[];
};

export const termsDocument: LegalDocument = {
  title: "Termini e Condizioni di Vendita",
  updated: "Ultimo aggiornamento: giugno 2025",
  updatedDate: "2025-06",
  sections: [
    {
      id: "soggetto-titolare-e-generalita",
      title: "1. Soggetto Titolare e Generalità",
      paragraphs: [
        'Il presente documento disciplina i Termini e le Condizioni di Vendita dei servizi offerti da Voicyy (di seguito "Voicyy" o il "Fornitore"), attività specializzata nello sviluppo e nella fornitura di agenti vocali AI e chatbot per la gestione automatizzata di prenotazioni e segreteria virtuale.',
        'Compilando il modulo di richiesta presente sul sito e accettando i presenti Termini, il Cliente (di seguito "Cliente" o "Utente") dichiara di aver letto, compreso e accettato integralmente le condizioni qui riportate.',
      ],
    },
    {
      id: "descrizione-del-servizio",
      title: "2. Descrizione del Servizio",
      paragraphs: ["Voicyy fornisce:"],
      bullets: [
        "Sviluppo su misura di agenti vocali AI e chatbot integrati con il calendario Google del Cliente;",
        "Configurazione dell'automazione delle prenotazioni, raccolta dati clienti e notifiche;",
        "Canone mensile di manutenzione per garantire il funzionamento continuativo del servizio;",
        "Supporto tecnico per il corretto utilizzo del sistema.",
      ],
      afterParagraphs: [
        "I tempi di consegna stimati sono di 1–2 settimane dalla ricezione di tutti i dati necessari e della conferma dell'ordine.",
      ],
    },
    {
      id: "formazione-del-contratto",
      title: "3. Formazione del Contratto",
      paragraphs: [
        "La compilazione del modulo di richiesta non costituisce un contratto vincolante. Il contratto si perfeziona esclusivamente con la comunicazione scritta di conferma da parte di Voicyy (via email) e il successivo pagamento del corrispettivo concordato.",
      ],
    },
    {
      id: "prezzi-e-pagamenti",
      title: "4. Prezzi e Pagamenti",
      paragraphs: [
        "I prezzi indicati nel configuratore del sito sono stime indicative basate sulla configurazione selezionata (LLM, TTS, telefonia e volume di minuti mensili). Il preventivo definitivo sarà comunicato dal Fornitore prima della conferma del contratto.",
        "I pagamenti devono essere effettuati secondo le modalità e le scadenze indicate in sede di accordo contrattuale. In caso di ritardo nel pagamento del canone mensile superiore a 15 giorni, Voicyy si riserva il diritto di sospendere il servizio fino alla regolarizzazione.",
      ],
    },
    {
      id: "obblighi-del-cliente",
      title: "5. Obblighi del Cliente",
      paragraphs: ["Il Cliente si impegna a:"],
      bullets: [
        "Fornire informazioni veritiere, accurate e aggiornate al momento della compilazione del modulo;",
        "Cooperare con Voicyy durante la fase di configurazione e testing dell'agente;",
        "Utilizzare il servizio nel rispetto della normativa vigente, incluso il GDPR (Reg. UE 2016/679) e il Codice del Consumo;",
        "Non cedere a terzi le credenziali o l'accesso al sistema fornito da Voicyy senza preventiva autorizzazione scritta.",
      ],
    },
    {
      id: "limitazione-di-responsabilita",
      title: "6. Limitazione di Responsabilità",
      paragraphs: ["Voicyy non sarà responsabile per:"],
      bullets: [
        "Interruzioni del servizio dipendenti da piattaforme terze (es. OpenAI, Google, Retell AI);",
        "Perdita di dati imputabile a malfunzionamenti di servizi di terzi;",
        "Danni indiretti, conseguenti o perdita di profitto derivanti dall'uso o dall'impossibilità di usare il servizio.",
      ],
      afterParagraphs: [
        "La responsabilità massima di Voicyy nei confronti del Cliente è limitata all'importo pagato nell'ultimo mese di servizio.",
      ],
    },
    {
      id: "proprieta-intellettuale",
      title: "7. Proprietà Intellettuale",
      paragraphs: [
        "Tutti i sistemi, algoritmi, configurazioni e flussi sviluppati da Voicyy rimangono di proprietà intellettuale del Fornitore. Il Cliente acquisisce il diritto di utilizzo del servizio per la durata del contratto, non la proprietà del codice o delle configurazioni sottostanti.",
      ],
    },
    {
      id: "recesso-e-disdetta",
      title: "8. Recesso e Disdetta",
      paragraphs: [
        "Il Cliente può recedere dal contratto con un preavviso scritto di 30 giorni. La quota una tantum di setup non è rimborsabile. Il canone mensile, se già corrisposto, non viene rimborsato pro-rata.",
      ],
    },
    {
      id: "legge-applicabile-e-foro-competente",
      title: "9. Legge Applicabile e Foro Competente",
      paragraphs: [
        "Il presente contratto è regolato dalla legge italiana. Per qualsiasi controversia le parti eleggono il Foro del luogo di residenza o domicilio del Fornitore.",
      ],
    },
    {
      id: "modifiche",
      title: "10. Modifiche",
      paragraphs: [
        "Voicyy si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Le modifiche saranno comunicate via email o pubblicate sul sito con almeno 15 giorni di preavviso. L'utilizzo continuato del servizio successivo alla modifica costituisce accettazione delle nuove condizioni.",
      ],
    },
    {
      id: "contatti",
      title: "11. Contatti",
      paragraphs: [
        "Per qualsiasi informazione: info.voicyy@gmail.com — WhatsApp: +39 392 114 3643",
      ],
    },
  ],
};

export const privacyDocument: LegalDocument = {
  title: "Informativa sulla Privacy",
  updated: "Ultimo aggiornamento: luglio 2026",
  updatedDate: "2026-07",
  introduction: "Ai sensi del Regolamento UE 2016/679 (GDPR)",
  sections: [
    {
      id: "titolare-del-trattamento",
      title: "1. Titolare del Trattamento",
      paragraphs: [
        "Il Titolare del trattamento dei dati personali è Voicyy, raggiungibile all'indirizzo email info.voicyy@gmail.com.",
      ],
    },
    {
      id: "dati-raccolti",
      title: "2. Dati Raccolti",
      paragraphs: [
        "Attraverso il modulo di richiesta presente sul sito, Voicyy raccoglie i seguenti dati personali:",
      ],
      bullets: [
        "Dati anagrafici: nome e cognome del referente;",
        "Dati di contatto: indirizzo email, numero di telefono;",
        "Dati aziendali: nome dell'attività, sito web, servizi offerti, orari di lavoro;",
        "Dati tecnici: configurazione dell'agente AI richiesta (LLM, TTS, telefonia, volume minuti);",
        "Dati di integrazione: indirizzo email Google Calendar, ID cartella Google Drive per le sole finalità tecniche di configurazione.",
        "Dati tecnici di sicurezza pseudonimizzati: hash HMAC dell'indirizzo IP usato esclusivamente per limitare abusi e invii ripetuti. Gli indirizzi IP in chiaro non vengono conservati nel database delle richieste.",
      ],
    },
    {
      id: "finalita-e-base-giuridica",
      title: "3. Finalità e Base Giuridica del Trattamento",
      paragraphs: [
        "A) Gestione della richiesta e fornitura del servizio",
        "Base giuridica: esecuzione di un contratto o misure precontrattuali (Art. 6, par. 1, lett. b GDPR). I dati sono necessari per elaborare la richiesta, configurare l'agente AI e comunicare con il Cliente. Senza questi dati non è possibile fornire il servizio.",
        "B) Marketing e comunicazioni commerciali",
        "Base giuridica: consenso dell'interessato (Art. 6, par. 1, lett. a GDPR). Solo se l'utente fornisce il consenso apposito (casella 2 del modulo), Voicyy potrà utilizzare i dati per inviare newsletter, aggiornamenti e offerte commerciali. Il consenso è revocabile in qualsiasi momento.",
        "C) Sicurezza, prevenzione degli abusi e tutela del servizio",
        "Base giuridica: legittimo interesse del Titolare a proteggere il sito, il modulo e l'infrastruttura di raccolta da accessi non autorizzati, spam e frodi (Art. 6, par. 1, lett. f GDPR). Gli identificativi tecnici sono pseudonimizzati mediante HMAC e non vengono usati per profilazione o marketing.",
      ],
    },
    {
      id: "modalita-di-raccolta-e-utilizzo-ai",
      title: "4. Modalità di Raccolta e Utilizzo dell'AI",
      paragraphs: [
        "Voicyy utilizza sistemi di intelligenza artificiale per la gestione automatizzata delle prenotazioni nell'ambito del servizio fornito al Cliente. I dati dei clienti finali dell'attività (nome, cognome, numero di telefono, email) vengono raccolti dall'agente AI esclusivamente per finalità di prenotazione e non vengono:",
      ],
      bullets: [
        "condivisi con terze parti per scopi commerciali;",
        "venduti o ceduti a nessun titolo;",
        "utilizzati per creare profili di utenti o per finalità di profilazione.",
      ],
    },
    {
      id: "conservazione-dei-dati",
      title: "5. Conservazione dei Dati",
      paragraphs: [
        "I dati relativi alle richieste di servizio sono conservati per il periodo necessario all'esecuzione del contratto e per i successivi 10 anni per obblighi fiscali e contabili (D.P.R. 600/1973).",
        "I dati trattati per finalità di marketing sono conservati fino alla revoca del consenso o, in assenza di revoca, per un massimo di 24 mesi dall'ultima interazione.",
        "I contatori pseudonimizzati usati per limitare gli abusi sono eliminati entro 48 ore. Un processo automatico giornaliero applica questa scadenza, la conservazione prevista per le richieste e la disattivazione dei consensi marketing scaduti.",
      ],
    },
    {
      id: "comunicazione-e-trasferimento-dei-dati",
      title: "6. Comunicazione e Trasferimento dei Dati",
      paragraphs: ["I dati personali non vengono diffusi. Possono essere comunicati a:"],
      bullets: [
        "Fornitori di servizi tecnici (hosting, database, piattaforme AI) che operano come Responsabili del Trattamento ex Art. 28 GDPR;",
        "Google LLC per i servizi Calendar e Drive, nell'ambito della configurazione tecnica del servizio;",
        "Autorità competenti nei casi previsti dalla legge.",
      ],
      afterParagraphs: [
        "Alcuni fornitori potrebbero operare al di fuori dell'UE (es. USA). In tal caso, il trasferimento avviene nel rispetto delle garanzie previste dal GDPR (Decisioni di adeguatezza, Clausole Contrattuali Standard).",
        "Le richieste archiviate nel database applicativo sono protette con cifratura AES-256-GCM prima del salvataggio. La chiave di decifratura è conservata separatamente dal database e l'accesso operativo avviene tramite strumenti riservati al Titolare.",
      ],
    },
    {
      id: "diritti-dell-interessato",
      title: "7. Diritti dell'Interessato",
      paragraphs: ["L'interessato ha il diritto di:"],
      bullets: [
        "Accesso (Art. 15): ottenere copia dei dati trattati;",
        "Rettifica (Art. 16): correggere dati inesatti;",
        "Cancellazione (Art. 17): ottenere la cancellazione dei dati (\"diritto all'oblio\");",
        "Limitazione (Art. 18): limitare il trattamento;",
        "Portabilità (Art. 20): ricevere i dati in formato strutturato;",
        "Opposizione (Art. 21): opporsi al trattamento;",
        "Revoca del consenso in qualsiasi momento, senza pregiudizio per la liceità del trattamento precedente;",
        "Reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).",
      ],
      afterParagraphs: ["Per esercitare i propri diritti: info.voicyy@gmail.com"],
    },
    {
      id: "cookie-e-dati-di-navigazione",
      title: "8. Cookie e Dati di Navigazione",
      paragraphs: [
        "Il sito utilizza esclusivamente cookie tecnici strettamente necessari al funzionamento. Non vengono utilizzati cookie di profilazione o di tracciamento di terze parti.",
      ],
    },
    {
      id: "modifiche-all-informativa",
      title: "9. Modifiche all'Informativa",
      paragraphs: [
        "Voicyy si riserva il diritto di aggiornare la presente Informativa. Le modifiche saranno pubblicate su questa pagina con la relativa data di aggiornamento.",
      ],
    },
  ],
};
