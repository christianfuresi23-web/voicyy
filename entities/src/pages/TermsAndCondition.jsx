import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Torna alla home
        </Link>

        <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">Termini e Condizioni di Vendita</h1>
        <p className="text-gray-500 mb-12">Ultimo aggiornamento: giugno 2025</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Soggetto Titolare e Generalità</h2>
            <p>Il presente documento disciplina i Termini e le Condizioni di Vendita dei servizi offerti da <strong>Voicyy</strong> (di seguito "Voicyy" o il "Fornitore"), attività specializzata nello sviluppo e nella fornitura di agenti vocali AI e chatbot per la gestione automatizzata di prenotazioni e segreteria virtuale.</p>
            <p className="mt-3">Compilando il modulo di richiesta presente sul sito e accettando i presenti Termini, il Cliente (di seguito "Cliente" o "Utente") dichiara di aver letto, compreso e accettato integralmente le condizioni qui riportate.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrizione del Servizio</h2>
            <p>Voicyy fornisce:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Sviluppo su misura</strong> di agenti vocali AI e chatbot integrati con il calendario Google del Cliente;</li>
              <li><strong>Configurazione</strong> dell'automazione delle prenotazioni, raccolta dati clienti e notifiche;</li>
              <li><strong>Canone mensile di manutenzione</strong> per garantire il funzionamento continuativo del servizio;</li>
              <li><strong>Supporto tecnico</strong> per il corretto utilizzo del sistema.</li>
            </ul>
            <p className="mt-3">I tempi di consegna stimati sono di <strong>1–2 settimane</strong> dalla ricezione di tutti i dati necessari e della conferma dell'ordine.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Formazione del Contratto</h2>
            <p>La compilazione del modulo di richiesta non costituisce un contratto vincolante. Il contratto si perfeziona esclusivamente con la comunicazione scritta di conferma da parte di Voicyy (via email) e il successivo pagamento del corrispettivo concordato.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Prezzi e Pagamenti</h2>
            <p>I prezzi indicati nel configuratore del sito sono <strong>stime indicative</strong> basate sulla configurazione selezionata (LLM, TTS, telefonia e volume di minuti mensili). Il preventivo definitivo sarà comunicato dal Fornitore prima della conferma del contratto.</p>
            <p className="mt-3">I pagamenti devono essere effettuati secondo le modalità e le scadenze indicate in sede di accordo contrattuale. In caso di ritardo nel pagamento del canone mensile superiore a 15 giorni, Voicyy si riserva il diritto di sospendere il servizio fino alla regolarizzazione.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Obblighi del Cliente</h2>
            <p>Il Cliente si impegna a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Fornire informazioni veritiere, accurate e aggiornate al momento della compilazione del modulo;</li>
              <li>Cooperare con Voicyy durante la fase di configurazione e testing dell'agente;</li>
              <li>Utilizzare il servizio nel rispetto della normativa vigente, incluso il GDPR (Reg. UE 2016/679) e il Codice del Consumo;</li>
              <li>Non cedere a terzi le credenziali o l'accesso al sistema fornito da Voicyy senza preventiva autorizzazione scritta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitazione di Responsabilità</h2>
            <p>Voicyy non sarà responsabile per:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Interruzioni del servizio dipendenti da piattaforme terze (es. OpenAI, Google, Retell AI);</li>
              <li>Perdita di dati imputabile a malfunzionamenti di servizi di terzi;</li>
              <li>Danni indiretti, conseguenti o perdita di profitto derivanti dall'uso o dall'impossibilità di usare il servizio.</li>
            </ul>
            <p className="mt-3">La responsabilità massima di Voicyy nei confronti del Cliente è limitata all'importo pagato nell'ultimo mese di servizio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Proprietà Intellettuale</h2>
            <p>Tutti i sistemi, algoritmi, configurazioni e flussi sviluppati da Voicyy rimangono di proprietà intellettuale del Fornitore. Il Cliente acquisisce il diritto di utilizzo del servizio per la durata del contratto, non la proprietà del codice o delle configurazioni sottostanti.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Recesso e Disdetta</h2>
            <p>Il Cliente può recedere dal contratto con un preavviso scritto di <strong>30 giorni</strong>. La quota una tantum di setup non è rimborsabile. Il canone mensile, se già corrisposto, non viene rimborsato pro-rata.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Legge Applicabile e Foro Competente</h2>
            <p>Il presente contratto è regolato dalla legge italiana. Per qualsiasi controversia le parti eleggono il Foro del luogo di residenza o domicilio del Fornitore.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Modifiche</h2>
            <p>Voicyy si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Le modifiche saranno comunicate via email o pubblicate sul sito con almeno 15 giorni di preavviso. L'utilizzo continuato del servizio successivo alla modifica costituisce accettazione delle nuove condizioni.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contatti</h2>
            <p>Per qualsiasi informazione: <a href="mailto:info.voicyy@gmail.com" className="text-cyan-500 hover:underline">info.voicyy@gmail.com</a> — WhatsApp: <a href="https://wa.me/393921143643" className="text-cyan-500 hover:underline">+39 392 114 3643</a></p>
          </section>

        </div>
      </div>
    </div>
  );
}