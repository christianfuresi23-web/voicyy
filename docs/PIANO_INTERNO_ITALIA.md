# Voicyy — piano interno per avvio e conformità in Italia

**Documento interno — non pubblicare sul sito**
**Stato della ricognizione:** 12 luglio 2026

> Questo documento è una traccia operativa e finanziaria costruita sulle sole informazioni disponibili. Non è un parere legale, fiscale, previdenziale o del lavoro e non certifica la conformità dell'attività. Prima di vendere, far validare struttura, contratti, flussi dati e simulazioni da commercialista e legale con esperienza in tecnologia, privacy e contratti digitali.

## 1. Dati certi e dati mancanti

### Dati forniti

- marchio/progetto: **Voicyy**;
- offerta: agenti vocali AI e chatbot su misura, automazione di prenotazioni, calendario, raccolta dati e notifiche;
- prezzo di setup indicato: **€3.000 una tantum per cliente**;
- mantenimento indicato: **€200–300 al mese per cliente**;
- obiettivo dichiarato: **€50 al mese per cliente destinati al titolare**;
- quota dell'investitore indicata: **10%**.

### Informazioni indispensabili non ancora disponibili

- budget iniziale totale e orizzonte di cassa;
- età, residenza fiscale, altre attività/redditi e posizione previdenziale del fondatore;
- forma giuridica scelta;
- natura del 10% dell'investitore: quota societaria, percentuale sui ricavi, sugli incassi o sugli utili;
- costi reali per minuto e per fornitore (LLM, TTS, telefonia), hosting, database, email, assistenza e sviluppo;
- numero medio di minuti e chiamate per cliente, picchi e tasso di contemporaneità;
- clientela esclusivamente professionale (**B2B**) oppure anche consumatori (**B2C**);
- eventuale trattamento di dati sanitari, registrazione delle chiamate o analisi della voce;
- presenza di dipendenti, collaboratori o agenti commerciali;
- sede, dati anagrafici e fiscali completi del soggetto che venderà il servizio.

Senza questi elementi non è possibile produrre un netto fiscale attendibile né confermare che il budget sia sufficiente. Il piano usa pertanto formule e soglie, non aliquote inventate.

## 2. Decisioni da prendere prima dell'apertura

### 2.1 Forma giuridica e accordo con l'investitore

Con commercialista e legale confrontare almeno:

- **impresa individuale/professionista**, se compatibile con l'attività: avvio più lineare, ma assenza di quote societarie e responsabilità personale da valutare;
- **SRL/SRLS**: soggetto distinto e struttura adatta a una partecipazione societaria, ma con governance, contabilità e costi da quotare;
- altra struttura solo se motivata dai ruoli effettivi, dal capitale e dalla crescita prevista.

Il “10%” va documentato prima di fatturare. L'accordo deve chiarire almeno base di calcolo, IVA esclusa o inclusa, momento di maturazione (fatturato/incassato), rimborsi e insoluti, costi deducibili, durata, rendicontazione, diritto di controllo, proprietà intellettuale, uscita e risoluzione. Se è una quota di capitale, il 10% **non equivale automaticamente** al 10% di ogni incasso.

### 2.2 Attività, ATECO e iscrizioni

1. Descrivere con precisione cosa vende Voicyy: licenza/SaaS, sviluppo software, configurazione, consulenza, assistenza, traffico telefonico o rivendita di servizi.
2. Scegliere con il professionista il codice o i codici **ATECO 2025** coerenti. ATECO 2025 è operativa per finalità statistiche, fiscali e amministrative dal 1° aprile 2025; non assegnare un codice “a intuito” ([Istat — ATECO 2025](https://www.istat.it/classificazione/ateco-2025/)).
3. Verificare se l'attività è impresa o lavoro autonomo e la gestione previdenziale corretta.
4. Per un'impresa, predisporre PEC/domicilio digitale e firma digitale e usare la **Comunicazione Unica**, che può assolvere gli adempimenti verso Registro Imprese, Agenzia delle Entrate, INPS, INAIL e, ove previsto, SUAP ([Registro Imprese — impresa individuale](https://www.registroimprese.it/impresa-individuale), [prerequisiti ComUnica](https://www.registroimprese.it/prerequisiti)).
5. Controllare con il SUAP del Comune se la sede o l'attività richiede SCIA o altri procedimenti ([Impresa in un giorno — impresa e Comune](https://www.impresainungiorno.gov.it/it/web/l-impresa-e-il-comune/home)).

### 2.3 Fisco, previdenza e amministrazione

- Aprire la posizione fiscale e scegliere il regime solo dopo una simulazione sul profilo reale. Non è possibile stabilire qui se il regime forfettario sia accessibile o conveniente.
- Determinare il trattamento IVA di setup, canone e componenti telefoniche. L'IVA eventualmente incassata non va confusa con ricavo o margine.
- Attivare fatturazione elettronica, conservazione e riconciliazione degli incassi. L'Agenzia delle Entrate descrive l'obbligo e il processo tramite Sistema di Interscambio ([Agenzia delle Entrate — fatturazione elettronica](https://www1.agenziaentrate.gov.it/web_app_entrate/fatturazione_elettronica.html)).
- Far determinare da INPS/commercialista la gestione applicabile. Per il 2026 l'INPS pubblica regole e aliquote specifiche per artigiani e commercianti, ma non vanno applicate a Voicyy prima di aver qualificato l'attività ([INPS — contribuzione artigiani e commercianti 2026](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestioni-artigiani-commercianti-i-contributi-per-il-2026.html)). È disponibile anche un simulatore ufficiale, con risultati dichiarati orientativi ([INPS — simulatore contributi](https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.simulatore-calcolo-contributi-artigiani-e-commercianti.html)).
- Aprire un conto dedicato e definire deleghe, scadenziario, prima nota, gestione rimborsi e insoluti.
- Chiedere preventivi per RC professionale/cyber e verificare coperture, franchigie ed esclusioni relative ad AI, telefonia e dati personali.

## 3. Pacchetto contrattuale minimo

Per ogni cliente predisporre e far validare:

1. **offerta/ordine** con perimetro, integrazioni, volume incluso, prezzi, IVA, durata, pagamento e accettazione;
2. **contratto quadro** con consegna, collaudo, change request, dipendenze del cliente, sospensione, recesso, rinnovo, proprietà intellettuale, riservatezza e uscita/esportazione dati;
3. **SLA/supporto** con disponibilità misurabile, finestre di manutenzione, tempi di risposta e rimedi; non promettere “24/7”, “nessuna chiamata persa” o “30 chiamate simultanee” senza test, limiti tecnici e dipendenze dichiarate;
4. **DPA ex art. 28 GDPR** quando Voicyy tratta per conto del cliente i dati delle persone che prenotano;
5. elenco aggiornato di **sub-responsabili**, sedi di trattamento e meccanismi di trasferimento;
6. istruzioni per informativa iniziale della chiamata, escalation umana, gestione errori ed eventuali emergenze;
7. allegato sicurezza e procedura di data breach;
8. verbale di collaudo e accettazione.

La clausola che limita ogni responsabilità all'ultimo mese pagato e l'esclusione generalizzata per fornitori terzi richiedono verifica specifica: potrebbero non essere efficaci in tutti i casi e possono creare uno squilibrio, soprattutto in B2C. Vanno inoltre disciplinati dolo/colpa grave, violazioni di riservatezza e dati, IP, danni diretti, massimali assicurativi e obblighi inderogabili.

## 4. B2B, B2C e rischi nei Termini attuali

L'offerta sembra rivolta ad attività professionali, ma il form pubblico non impedisce di fatto a un consumatore di inviare una richiesta. Decidere esplicitamente il perimetro:

- se **solo B2B**, dichiarare destinazione professionale, raccogliere ragione sociale/Partita IVA e verificare che l'acquisto avvenga per finalità professionali;
- se anche **B2C**, aggiornare funnel e condizioni con tutte le informazioni precontrattuali, conferma su supporto durevole e disciplina del recesso.

Rischi da correggere prima della pubblicazione definitiva:

- la clausola “Foro del luogo del Fornitore” non può essere usata per sottrarre al consumatore il foro protetto; il MIMIT include tra le clausole presumibilmente vessatorie la scelta di una località diversa dalla residenza/domicilio del consumatore ([MIMIT — FAQ clausole vessatorie](https://www.mimit.gov.it/it/assistenza/domande-frequenti/le-clausole-vessatorie-nei-contratti-tra-professionista-e-consumatore-domande-frequenti-faq));
- il preavviso contrattuale di 30 giorni non sostituisce l'eventuale diritto B2C di recesso da un servizio acquistato a distanza, normalmente esercitabile entro 14 giorni dalla conclusione; l'esecuzione anticipata e le eccezioni richiedono richieste/consensi specifici ([Your Europe — commercio elettronico B2C](https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_it.htm));
- “setup non rimborsabile” non va presentato come eccezione automatica al recesso B2C solo perché il servizio è personalizzato;
- identità, indirizzo fisico, contatti, dati di registrazione, prezzo totale o metodo di calcolo, durata e condizioni di cessazione devono essere disponibili prima dell'ordine quando richiesto;
- le clausole devono essere chiare e le clausole vessatorie richiedono analisi distinta; la sola checkbox generale non sana una clausola nulla o abusiva.

## 5. Privacy e sicurezza: modello operativo

### 5.1 Ruoli e documenti

Separare i trattamenti:

- Voicyy è normalmente **titolare** per lead, preventivi, fatturazione, assistenza e marketing proprio;
- il cliente è normalmente **titolare** delle prenotazioni dei propri utenti e Voicyy opera come **responsabile** sulle sue istruzioni;
- i ruoli possono cambiare per telemetria, miglioramento modelli, prevenzione frodi o usi autonomi dei dati: non riutilizzare conversazioni o trascrizioni senza base e ruolo definiti.

Il DPA deve coprire oggetto/durata, categorie di dati/interessati, istruzioni, riservatezza, sicurezza, sub-responsabili, assistenza sui diritti e DPIA, data breach, cancellazione/restituzione e audit. Il GDPR disciplina titolare/responsabile, sicurezza e DPIA negli artt. 28, 32 e 35 ([EUR-Lex — Regolamento UE 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=it)).

### 5.2 Mappa dati e minimizzazione

Prima della prima demo reale, creare un registro per ogni flusso:

- dati raccolti e campi obbligatori/facoltativi;
- finalità e base giuridica;
- origine e destinatari;
- sistemi e regioni di hosting;
- sub-responsabili e trasferimenti;
- retention e procedura di cancellazione;
- misure di sicurezza e accessi;
- eventuale uso per training o quality assurance, da disabilitare per default se non necessario e contrattualizzato.

In ambito dentistico o sanitario una conversazione può contenere dati relativi alla salute. Non far raccogliere diagnosi o dettagli clinici se basta il tipo di appuntamento; applicare una base dell'art. 9 GDPR individuata dal titolare e garanzie rafforzate. La voce non è automaticamente dato biometrico “speciale”, ma può diventarlo se trattata tecnicamente per identificare in modo univoco una persona.

### 5.3 DPIA, chiamate e trasparenza

- Eseguire uno screening DPIA per ogni caso d'uso e formalizzare la DPIA prima del trattamento se è probabile un rischio elevato. Il Garante pubblica l'elenco nazionale dei trattamenti soggetti a DPIA ([Garante — elenco DPIA](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9058979)).
- Decidere se le chiamate vengono registrate. Se sì, definire scopo, base giuridica, informativa all'inizio della chiamata, accessi, retention, opposizione/diritti e disciplina per operatori/lavoratori. Trascrizione e analisi non sono una scorciatoia rispetto alle regole sulla registrazione.
- Informare chiaramente la persona che sta parlando con un sistema AI, offrire un canale umano ragionevole e non lasciare all'agente decisioni mediche, legali o di emergenza.
- L'art. 4 dell'AI Act sull'alfabetizzazione AI è applicabile dal 2 febbraio 2025; gli obblighi di trasparenza per sistemi che interagiscono direttamente con persone sono previsti dall'art. 50 e, alla data di questa ricognizione, sono programmati dal 2 agosto 2026. Verificare testo e linee guida finali subito prima del lancio ([EUR-Lex — Regolamento UE 2024/1689](https://eur-lex.europa.eu/legal-content/it/ALL/?uri=CELEX%3A32024R1689), [Commissione europea — AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)).

### 5.4 Fornitori e trasferimenti

Per LLM, TTS, telefonia, hosting, database, email, Calendar e Drive:

- sottoscrivere DPA e verificare sub-fornitori, regioni, retention e uso per training;
- verificare misure tecniche e organizzative e accessi del supporto;
- per trasferimenti extra SEE individuare decisione di adeguatezza o garanzie ex art. 46, effettuando le valutazioni necessarie; il Garante riepiloga decisioni di adeguatezza e clausole contrattuali tipo ([Garante — trasferimenti all'estero](https://www.garanteprivacy.it/it/temi/trasferimento-di-dati-all-estero));
- mantenere un elenco versionato dei sub-responsabili e un processo di notifica/obiezione ai clienti.

### 5.5 Consensi, cookie e retention

- La checkbox contrattuale/privacy deve essere obbligatoria solo per inviare la richiesta; non descriverla come “consenso privacy” quando la base è precontrattuale.
- Il marketing deve avere checkbox separata, facoltativa e non preselezionata. Registrare testo/versione, timestamp, sorgente e prova; fornire revoca semplice e lista di soppressione.
- Non conservare automaticamente per dieci anni ogni campo del form: separare documenti fiscali/contrattuali, lead non convertiti, log, registrazioni e marketing e assegnare una retention giustificata a ciascuno.
- La dichiarazione “solo cookie tecnici” deve corrispondere al deploy effettivo. Se si aggiungono analytics, pixel, chat/widget o altri tracciamenti, aggiornare inventario, banner e informativa. I cookie non tecnici richiedono consenso preventivo secondo le linee guida del Garante ([Garante — cookie e altri strumenti di tracciamento](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876)).

### 5.6 Sicurezza minima

- cifratura in transito e, ove disponibile, a riposo;
- segreti solo in secret manager/variabili server, mai in repository o browser;
- nessuna dashboard pubblica di lettura; accesso alle richieste soltanto dal visualizzatore locale con ruolo PostgreSQL dedicato e read-only;
- ruoli e minimo privilegio per database, Drive, Calendar e supporto;
- backup cifrati, test di ripristino e retention definita;
- logging senza contenuti sensibili non necessari;
- patching, dipendenze, scansione vulnerabilità e revisione accessi;
- piano incidenti e data breach, con valutazione della notifica al Garante entro 72 ore quando ricorrono i presupposti dell'art. 33 GDPR.

Il solo bind su `127.0.0.1` non protegge una credenziale database rubata: applicare minimo privilegio, TLS, protezione del PC e, quando disponibile, restrizioni di rete. Le credenziali già condivise in chat o durante lo sviluppo vanno ruotate prima del go-live.

## 6. Lavoro, collaboratori e proprietà intellettuale

Prima di coinvolgere persone:

- qualificare correttamente rapporto subordinato, collaborazione e lavoro autonomo; il Ministero distingue il lavoro autonomo dall'attività sotto direzione del datore ([Ministero del Lavoro — disciplina del rapporto](https://www.lavoro.gov.it/temi-e-priorita/rapporti-di-lavoro-e-relazioni-industriali/focus-on/disciplina-rapporto-lavoro/pagine/default));
- per dipendenti, fare comunicazione obbligatoria preventiva e consegnare contratto/lettera con le informazioni previste ([Ministero del Lavoro — informazioni sui contratti](https://www.lavoro.gov.it/sportello-unico-digitale/termini-e-condizioni-di-impiego/informazioni-sui-contratti-di-lavoro));
- verificare CCNL, inquadramento, busta paga, sicurezza sul lavoro, INPS e INAIL con consulente del lavoro; l'INAIL indica la denuncia di iscrizione contestuale all'avvio quando sussiste l'obbligo assicurativo ([INAIL — impresa con dipendenti](https://www.inail.it/portale/assicurazione/it/Datore-di-Lavoro/Impresa-con-dipendenti-industria-artigianato-terziario-altre-attivita.html));
- firmare riservatezza, assegnazione/licenza IP, regole su repository e accessi, restituzione dispositivi/dati e cancellazione account;
- vietare l'uso di dati reali dei clienti in strumenti AI personali o non approvati.

## 7. Stima economica per cliente

### 7.1 Assunzione usata soltanto per gli scenari

Per dare seguito alla richiesta di “10% in meno”, si assume **solo a fini matematici** che l'investitore riceva il 10% di ogni importo imponibile incassato, prima dei costi e delle imposte. Questa assunzione deve essere sostituita con l'accordo reale.

Definizioni:

- `S = €3.000` setup una tantum;
- `M = €200, €250 oppure €300` mantenimento mensile;
- `q = 10%` quota investitore assunta;
- `Cs` = costi diretti reali del setup;
- `Cm` = costi diretti mensili reali (minuti, LLM, TTS, telefonia, hosting, assistenza ecc.);
- `T` = imposte e contributi effettivi, oggi non determinabili;
- `€50` = obiettivo mensile dichiarato per il titolare, **non automaticamente un costo deducibile né un netto personale**.

### 7.2 Setup

| Voce | Formula | Importo |
|---|---:|---:|
| Setup imponibile incassato | `S` | €3.000 |
| 10% investitore (ipotesi) | `S × 10%` | €300 |
| Resta all'attività prima di costi e fisco | `S × 90%` | **€2.700** |
| Margine setup prima di fisco | `€2.700 − Cs` | da calcolare |

Il netto del setup è quindi `€2.700 − Cs − quota di T attribuibile`, non €2.700.

### 7.3 Ricorrenza mensile

| Canone `M` | 10% investitore | Resta prima di costi e fisco | Dopo accantonamento-obiettivo di €50 al titolare* |
|---:|---:|---:|---:|
| €200 | €20 | **€180** | €130 |
| €250 | €25 | **€225** | €175 |
| €300 | €30 | **€270** | €220 |

\* La colonna finale non è “netto in tasca”: indica solo quanta parte resterebbe per costi e fisco se si riservassero contabilmente €50. Il prelievo/remunerazione del titolare ha effetti diversi secondo la forma giuridica.

Formule corrette:

- margine mensile prima di fisco: `0,90 × M − Cm`;
- cassa dell'attività dopo fisco: `0,90 × M − Cm − T_mese`;
- netto personale del titolare: dipende da forma di prelievo/remunerazione e fiscalità personale.

Per lasciare almeno €50 **prima del fisco**, i costi diretti mensili massimi sarebbero rispettivamente €130, €175 o €220. Per lasciare €50 netti dopo imposte/contributi, i costi devono essere più bassi di tali soglie di un importo oggi non calcolabile.

### 7.4 Primo anno di un cliente, assumendo 12 canoni

| Canone mensile | Ricavi imponibili setup + 12 mesi | 10% investitore (ipotesi) | Resta prima di costi e fisco |
|---:|---:|---:|---:|
| €200 | €5.400 | €540 | **€4.860** |
| €250 | €6.000 | €600 | **€5.400** |
| €300 | €6.600 | €660 | **€5.940** |

Formula del risultato del primo anno per cliente:

`€2.700 − Cs + 12 × (0,90 × M − Cm) − T_anno`

Per `N` clienti omogenei acquisiti tutti a inizio anno, moltiplicare la componente per cliente per `N`; nella realtà vanno considerati mese di acquisizione, insoluti, churn, rimborsi, costi condivisi e capacità di supporto.

### 7.5 Dati da raccogliere per una simulazione fiscale utile

1. preventivo commercialista per le forme giuridiche candidate;
2. regime fiscale e previdenziale applicabile al fondatore/società;
3. definizione contrattuale del 10% investitore;
4. costo unitario di ogni combinazione LLM/TTS/telefonia e markup effettivo;
5. consumo medio, 90°/95° percentile e costo dei picchi per cliente;
6. ore di sviluppo iniziale e assistenza mensile valorizzate;
7. hosting, database, email, dominio, monitoraggio, assicurazione e consulenze;
8. IVA e tempi di incasso/pagamento;
9. tasso di mancato pagamento, resi/rimborsi e abbandono.

## 8. Budget: metodo finché manca l'importo

Non è stato fornito il budget totale richiamato nella richiesta. Non va quindi proposta un'allocazione numerica fittizia. Costruire un budget a preventivi con queste righe:

- costituzione/apertura, commercialista, legale e privacy;
- PEC, firma digitale, conto e fatturazione;
- dominio, email transazionale e hosting;
- LLM, TTS, telefonia, numeri e traffico di test;
- database, backup, monitoraggio e sicurezza;
- design/sviluppo e collaudo;
- assicurazioni;
- vendita e onboarding;
- costo del lavoro/collaboratori;
- imposte, contributi e cuscinetto di liquidità;
- riserva incidenti/rimborsi.

Formula di fabbisogno iniziale:

`costi una tantum + costi fissi del periodo di runway scelto + consumi variabili attesi + scadenze fiscali/previdenziali + riserva − incassi prudentemente disponibili`

Non finanziare i costi correnti con IVA o somme che devono essere riversate all'investitore senza separarli in contabilità/cassa.

## 9. Ordine operativo consigliato

### Blocco 1 — prima di accettare dati reali

- scegliere forma, ATECO, regime e accordo investitore;
- completare identità legale e aprire posizioni necessarie;
- approvare contratti, DPA, informative e registro trattamenti;
- inventariare fornitori, trasferimenti e retention;
- verificare dominio email e infrastruttura sicura;
- completare threat model, accessi e piano incidenti.

### Blocco 2 — pilota controllato

- usare dati sintetici;
- misurare accuratezza, latenza, costo/minuto e picchi;
- testare informativa AI/vocale, escalation umana, cancellazioni e diritti;
- validare preventivo, collaudo e supporto con un cliente pilota;
- aggiornare DPIA/screening e documenti con i flussi reali.

### Blocco 3 — vendita

- accettare solo configurazioni con margine misurato;
- versionare preventivo, Termini, Privacy, DPA e consensi;
- riconciliare fatture, incassi, quota investitore e costi per cliente;
- riesaminare mensilmente margine, errori, incidenti e sub-responsabili.

## 10. Fonti ufficiali consultate

Tutte le fonti sono state consultate il **12 luglio 2026**. La normativa e le istruzioni operative possono cambiare; verificare di nuovo prima dell'apertura e del lancio.

- [Registro Imprese — Impresa individuale e Comunicazione Unica](https://www.registroimprese.it/impresa-individuale)
- [Registro Imprese — prerequisiti ComUnica](https://www.registroimprese.it/prerequisiti)
- [Impresa in un giorno — SUAP](https://www.impresainungiorno.gov.it/it/web/l-impresa-e-il-comune/home)
- [Istat — classificazione ATECO 2025](https://www.istat.it/classificazione/ateco-2025/)
- [Agenzia delle Entrate — fatturazione elettronica](https://www1.agenziaentrate.gov.it/web_app_entrate/fatturazione_elettronica.html)
- [INPS — contribuzione artigiani e commercianti 2026](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestioni-artigiani-commercianti-i-contributi-per-il-2026.html)
- [INPS — simulatore contributi artigiani e commercianti](https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.simulatore-calcolo-contributi-artigiani-e-commercianti.html)
- [MIMIT — Codice del Consumo](https://www.mimit.gov.it/it/mercato-e-consumatori/tutela-del-consumatore/codice-del-consumo)
- [MIMIT — FAQ clausole vessatorie](https://www.mimit.gov.it/it/assistenza/domande-frequenti/le-clausole-vessatorie-nei-contratti-tra-professionista-e-consumatore-domande-frequenti-faq)
- [Commissione europea, Your Europe — vendita a distanza B2C](https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_it.htm)
- [EUR-Lex — Regolamento UE 2016/679 (GDPR)](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=it)
- [Garante Privacy — guida al GDPR](https://www.garanteprivacy.it/documents/10160/0/Guida%2Ball%2Bapplicazione%2Bdel%2BRegolamento%2BUE%2B2016%2B679.pdf/2281f960-a7b2-4c53-a3f1-ad7578f8761d?download=true&version=2.0)
- [Garante Privacy — trattamenti soggetti a DPIA](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9058979)
- [Garante Privacy — trasferimenti di dati all'estero](https://www.garanteprivacy.it/it/temi/trasferimento-di-dati-all-estero)
- [Garante Privacy — linee guida cookie](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876)
- [EUR-Lex — Regolamento UE 2024/1689 (AI Act)](https://eur-lex.europa.eu/legal-content/it/ALL/?uri=CELEX%3A32024R1689)
- [Commissione europea — quadro e calendario AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [Ministero del Lavoro — disciplina del rapporto di lavoro](https://www.lavoro.gov.it/temi-e-priorita/rapporti-di-lavoro-e-relazioni-industriali/focus-on/disciplina-rapporto-lavoro/pagine/default)
- [Ministero del Lavoro — informazioni sui contratti](https://www.lavoro.gov.it/sportello-unico-digitale/termini-e-condizioni-di-impiego/informazioni-sui-contratti-di-lavoro)
- [INAIL — impresa con dipendenti](https://www.inail.it/portale/assicurazione/it/Datore-di-Lavoro/Impresa-con-dipendenti-industria-artigianato-terziario-altre-attivita.html)
