import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Torna alla home
        </Link>

        <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">Informativa sulla Privacy</h1>
        <p className="text-gray-500 mb-12">Ai sensi del Regolamento UE 2016/679 (GDPR) — Ultimo aggiornamento: giugno 2025</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Titolare del Trattamento</h2>
            <p>Il Titolare del trattamento dei dati personali è <strong>Voicyy</strong>, raggiungibile all'indirizzo email <a href="mailto:info.voicyy@gmail.com" className="text-cyan-500 hover:underline">info.voicyy@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Dati Raccolti</h2>
            <p>Attraverso il modulo di richiesta presente sul sito, Voicyy raccoglie i seguenti dati personali:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Dati anagrafici</strong>: nome e cognome del referente;</li>
              <li><strong>Dati di contatto</strong>: indirizzo email, numero di telefono;</li>
              <li><strong>Dati aziendali</strong>: nome dell'attività, sito web, servizi offerti, orari di lavoro;</li>
              <li><strong>Dati tecnici</strong>: configurazione dell'agente AI richiesta (LLM, TTS, telefonia, volume minuti);</li>
              <li><strong>Dati di integrazione</strong>: indirizzo email Google Calendar, ID cartella Google Drive per le sole finalità tecniche di configurazione.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Finalità e Base Giuridica del Trattamento</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">A) Gestione della richiesta e fornitura del servizio</p>
                <p className="text-sm">Base giuridica: <em>esecuzione di un contratto o misure precontrattuali</em> (Art. 6, par. 1, lett. b GDPR). I dati sono necessari per elaborare la richiesta, configurare l'agente AI e comunicare con il Cliente. <strong>Senza questi dati non è possibile fornire il servizio.</strong></p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">B) Marketing e comunicazioni commerciali</p>
                <p className="text-sm">Base giuridica: <em>consenso dell'interessato</em> (Art. 6, par. 1, lett. a GDPR). Solo se l'utente fornisce il consenso apposito (casella 2 del modulo), Voicyy potrà utilizzare i dati per inviare newsletter, aggiornamenti e offerte commerciali. Il consenso è revocabile in qualsiasi momento.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Modalità di Raccolta e Utilizzo dell'AI</h2>
            <p>Voicyy utilizza sistemi di intelligenza artificiale per la gestione automatizzata delle prenotazioni nell'ambito del servizio fornito al Cliente. I dati dei clienti finali dell'attività (nome, cognome, numero di telefono, email) vengono raccolti dall'agente AI <strong>esclusivamente per finalità di prenotazione</strong> e non vengono:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>condivisi con terze parti per scopi commerciali;</li>
              <li>venduti o ceduti a nessun titolo;</li>
              <li>utilizzati per creare profili di utenti o per finalità di profilazione.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Conservazione dei Dati</h2>
            <p>I dati relativi alle richieste di servizio sono conservati per il periodo necessario all'esecuzione del contratto e per i successivi <strong>10 anni</strong> per obblighi fiscali e contabili (D.P.R. 600/1973).</p>
            <p className="mt-3">I dati trattati per finalità di marketing sono conservati fino alla revoca del consenso o, in assenza di revoca, per un massimo di <strong>24 mesi</strong> dall'ultima interazione.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Comunicazione e Trasferimento dei Dati</h2>
            <p>I dati personali non vengono diffusi. Possono essere comunicati a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Fornitori di servizi tecnici</strong> (hosting, database, piattaforme AI) che operano come Responsabili del Trattamento ex Art. 28 GDPR;</li>
              <li><strong>Google LLC</strong> per i servizi Calendar e Drive, nell'ambito della configurazione tecnica del servizio;</li>
              <li><strong>Autorità competenti</strong> nei casi previsti dalla legge.</li>
            </ul>
            <p className="mt-3">Alcuni fornitori potrebbero operare al di fuori dell'UE (es. USA). In tal caso, il trasferimento avviene nel rispetto delle garanzie previste dal GDPR (Decisioni di adeguatezza, Clausole Contrattuali Standard).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Diritti dell'Interessato</h2>
            <p>L'interessato ha il diritto di:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Accesso</strong> (Art. 15): ottenere copia dei dati trattati;</li>
              <li><strong>Rettifica</strong> (Art. 16): correggere dati inesatti;</li>
              <li><strong>Cancellazione</strong> (Art. 17): ottenere la cancellazione dei dati ("diritto all'oblio");</li>
              <li><strong>Limitazione</strong> (Art. 18): limitare il trattamento;</li>
              <li><strong>Portabilità</strong> (Art. 20): ricevere i dati in formato strutturato;</li>
              <li><strong>Opposizione</strong> (Art. 21): opporsi al trattamento;</li>
              <li><strong>Revoca del consenso</strong> in qualsiasi momento, senza pregiudizio per la liceità del trattamento precedente;</li>
              <li><strong>Reclamo</strong> al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).</li>
            </ul>
            <p className="mt-3">Per esercitare i propri diritti: <a href="mailto:info.voicyy@gmail.com" className="text-cyan-500 hover:underline">info.voicyy@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookie e Dati di Navigazione</h2>
            <p>Il sito utilizza esclusivamente cookie tecnici strettamente necessari al funzionamento. Non vengono utilizzati cookie di profilazione o di tracciamento di terze parti.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modifiche all'Informativa</h2>
            <p>Voicyy si riserva il diritto di aggiornare la presente Informativa. Le modifiche saranno pubblicate su questa pagina con la relativa data di aggiornamento.</p>
          </section>

        </div>
      </div>
    </div>
  );
}