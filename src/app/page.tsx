import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  Clock3,
  Headphones,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { AgentRequestForm } from "@/components/configurator/AgentRequestForm";
import { Header } from "@/components/landing/Header";
import { ImmersiveHero } from "@/components/landing/ImmersiveHero";
import { ProcessAccordion } from "@/components/landing/ProcessAccordion";
import { Reveal } from "@/components/landing/Reveal";
import { VoiceScene } from "@/components/landing/VoiceScene";
import { Wordmark } from "@/components/landing/Wordmark";

const whatsappHref =
  "https://wa.me/393921143643?text=Ciao%20Voicyy%2C%20vorrei%20prenotare%20una%20consulenza%20gratuita%20per%20un%20agent%20AI.";

const benefits = [
  {
    icon: Clock3,
    number: "24/7",
    title: "Sempre presente",
    description:
      "Risponde anche fuori orario, così ogni richiesta trova ascolto nel momento in cui arriva.",
  },
  {
    icon: PhoneCall,
    number: "30",
    suffix: "chiamate",
    title: "Nessuna coda inutile",
    description:
      "Gestione progettata per sostenere fino a 30 chiamate simultanee, in base all’infrastruttura scelta.",
  },
  {
    icon: CalendarCheck2,
    number: "Auto",
    title: "Agenda coordinata",
    description:
      "Raccoglie i dati, verifica la disponibilità e organizza gli appuntamenti nel tuo calendario.",
  },
];

const trustItems = (
  <>
    <strong>Google Calendar</strong>
    <i aria-hidden="true" />
    <strong>Google Drive</strong>
    <i aria-hidden="true" />
    <strong>Telefonia</strong>
    <i aria-hidden="true" />
    <strong>Chat</strong>
  </>
);

const process = [
  {
    step: "01",
    title: "Ci racconti l’attività",
    description:
      "Servizi, tempi, orari e strumenti: il configuratore raccoglie ciò che serve per partire bene.",
    detail:
      "Partiamo dal lavoro reale, non da un modello generico. Organizziamo le informazioni in una mappa operativa chiara, così la demo parla già il linguaggio della tua attività.",
    highlights: [
      "Servizi e relative durate",
      "Giorni, fasce orarie e pause",
      "Contatti e strumenti già in uso",
    ],
  },
  {
    step: "02",
    title: "Progettiamo il flusso",
    description:
      "Costruiamo conversazioni, regole di prenotazione e integrazioni attorno al tuo modo di lavorare.",
    detail:
      "Definiamo cosa deve chiedere l’agent, quali risposte può dare e quando deve coinvolgere una persona. Ogni passaggio resta leggibile e verificabile prima dell’attivazione.",
    highlights: [
      "Tono di voce e domande frequenti",
      "Regole di disponibilità",
      "Escalation verso il team",
    ],
  },
  {
    step: "03",
    title: "Testiamo insieme",
    description:
      "Verifichiamo i casi reali, perfezioniamo il tono e controlliamo i passaggi più delicati.",
    detail:
      "Simuliamo richieste semplici, eccezioni e conversazioni incomplete. Correggiamo insieme i punti deboli prima che l’agent incontri i tuoi clienti.",
    highlights: [
      "Scenari realistici",
      "Controllo delle prenotazioni",
      "Revisione condivisa",
    ],
  },
  {
    step: "04",
    title: "Il tuo agent va online",
    description:
      "Dopo l’approvazione, attiviamo il servizio e restiamo presenti per manutenzione e supporto.",
    detail:
      "La messa online avviene dopo il tuo via libera. Monitoriamo il funzionamento iniziale e interveniamo sugli aggiustamenti concordati, senza lasciarti solo dopo la consegna.",
    highlights: [
      "Attivazione concordata",
      "Monitoraggio iniziale",
      "Manutenzione e supporto",
    ],
  },
];

const scenarios = [
  {
    sector: "Studio odontoiatrico",
    title: "La reception continua anche mentre il team è occupato.",
    description:
      "Un possibile agent risponde alle domande ricorrenti, raccoglie il motivo della chiamata e propone gli slot disponibili senza interrompere il personale.",
    tags: ["Prenotazioni", "FAQ", "Promemoria"],
  },
  {
    sector: "Centro estetico",
    title: "Ogni trattamento trova il tempo corretto in agenda.",
    description:
      "Un flusso configurato sui servizi può distinguere durate, operatori e pause, riducendo i passaggi manuali prima della conferma.",
    tags: ["Durate su misura", "Calendario", "Notifiche"],
  },
  {
    sector: "Assistenza e servizi",
    title: "Le richieste arrivano già ordinate e complete.",
    description:
      "L’agent può raccogliere i dati essenziali, classificare il bisogno e inoltrare una notifica chiara alla persona giusta.",
    tags: ["Raccolta dati", "Smistamento", "Follow-up"],
  },
];

export default function Home() {
  return (
    <main className="overflow-clip bg-white text-neutral-950">
      <Header />

      <ImmersiveHero
        copy={
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="hero-kicker__pulse" aria-hidden="true" />
              Agent vocali AI e chatbot, su misura
            </div>
            <h1 id="hero-title">
              Ogni chiamata,
              <span>una risposta.</span>
            </h1>
            <p className="hero-lead">
              Voicyy trasforma chiamate, chat e prenotazioni in un flusso semplice.
              Il tuo team resta concentrato; il tuo cliente trova sempre qualcuno pronto
              ad aiutarlo.
            </p>

            <div className="hero-actions">
              <a href="#configura" className="button button-lime button-large">
                Configura il tuo agent
                <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline button-large"
                aria-label="Scrivi a Voicyy su WhatsApp per una consulenza gratuita (si apre in una nuova scheda)"
              >
                <MessageCircle aria-hidden="true" size={18} />
                Consulenza gratuita
              </a>
            </div>

            <ul className="hero-proof" aria-label="Informazioni principali">
              <li>
                <Check aria-hidden="true" size={15} />
                Demo su misura
              </li>
              <li>
                <Check aria-hidden="true" size={15} />
                Consegna stimata 1–2 settimane
              </li>
              <li>
                <Check aria-hidden="true" size={15} />
                Supporto in italiano
              </li>
            </ul>
          </div>
        }
        scene={
          <div className="hero-scene-wrap">
            <VoiceScene />
            <div className="scene-note scene-note--top" aria-hidden="true">
              <span>Chiamata in corso</span>
              <strong>00:42</strong>
            </div>
            <div className="scene-note scene-note--bottom" aria-hidden="true">
              <CalendarCheck2 size={17} />
              <span>
                <small>Agenda aggiornata</small>
                Appuntamento confermato
              </span>
            </div>
          </div>
        }
      />

      <section className="trust-strip" aria-label="Integrazioni e capacità">
        <div className="site-shell trust-strip__inner">
          <span>Un solo flusso, intorno alla tua attività</span>
          <div className="trust-strip__marquee" aria-label="Tecnologie integrabili">
            <div className="trust-strip__track">
              <div className="trust-strip__items">{trustItems}</div>
              <div className="trust-strip__items" aria-hidden="true">
                {trustItems}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="vantaggi" className="dark-section" aria-labelledby="benefits-title">
        <div className="site-shell">
          <Reveal className="section-heading section-heading--light">
            <div>
              <span className="eyebrow eyebrow-light">Presenza, senza attese</span>
              <h2 id="benefits-title">La segreteria che non perde il filo.</h2>
            </div>
            <p>
              Un agent progettato sui tuoi processi risponde, comprende e porta avanti
              il lavoro operativo, senza trasformare l’esperienza in un percorso
              impersonale.
            </p>
          </Reveal>

          <div className="benefit-grid">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Reveal key={benefit.title} delay={index * 0.08}>
                  <article className="benefit-card">
                    <div className="benefit-card__top">
                      <span className="benefit-card__icon">
                        <Icon aria-hidden="true" size={22} />
                      </span>
                      <span className="benefit-card__index">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="benefit-card__metric">
                      <strong>{benefit.number}</strong>
                      {benefit.suffix && <span>{benefit.suffix}</span>}
                    </div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="automation-banner">
            <div className="automation-banner__icon">
              <Workflow aria-hidden="true" size={25} />
            </div>
            <div>
              <span>Dalla conversazione all’azione</span>
              <strong>
                Chiamata ricevuta <i /> Dati raccolti <i /> Slot verificato <i />
                Conferma inviata
              </strong>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="come-funziona" className="process-section" aria-labelledby="process-title">
        <div className="site-shell">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow eyebrow-dark">Dal brief alla prima chiamata</span>
              <h2 id="process-title">Su misura. Senza complicazioni.</h2>
            </div>
            <div className="delivery-badge">
              <Clock3 aria-hidden="true" size={20} />
              <span>
                Tempo stimato
                <strong>1–2 settimane</strong>
              </span>
            </div>
          </Reveal>

          <Reveal>
            <ProcessAccordion items={process} />
          </Reveal>
        </div>
      </section>

      <section className="human-section" aria-labelledby="human-title">
        <div className="site-shell human-layout">
          <Reveal className="human-visual">
            <div className="conversation-window" aria-hidden="true">
              <div className="conversation-window__top">
                <span>
                  <i /> Voicyy agent
                </span>
                <small>Ora</small>
              </div>
              <div className="voice-message">
                <div className="voice-message__play">
                  <PhoneCall size={17} />
                </div>
                <div className="voice-wave">
                  {[9, 16, 24, 14, 30, 22, 12, 26, 18, 8, 20, 11].map(
                    (height, index) => (
                      <i key={`${height}-${index}`} style={{ height }} />
                    ),
                  )}
                </div>
                <span>00:18</span>
              </div>
              <div className="conversation-card">
                <CalendarCheck2 size={20} />
                <span>
                  <small>Nuova prenotazione</small>
                  Giovedì · 15:30
                </span>
                <Check size={17} />
              </div>
            </div>
          </Reveal>

          <Reveal className="human-copy" delay={0.1}>
            <span className="eyebrow eyebrow-dark">Tecnologia, con il tono giusto</span>
            <h2 id="human-title">Automatizzare non significa sembrare automatici.</h2>
            <p>
              Progettiamo ogni conversazione in italiano, con regole chiare e un tono
              coerente con il tuo brand. Quando serve una persona, l’agent sa come
              inoltrare la richiesta.
            </p>
            <ul>
              <li>
                <Headphones aria-hidden="true" size={19} />
                Voce e linguaggio scelti per il tuo pubblico
              </li>
              <li>
                <Bot aria-hidden="true" size={19} />
                Flussi testati sui casi reali dell’attività
              </li>
              <li>
                <ShieldCheck aria-hidden="true" size={19} />
                Raccolta dati limitata alle finalità dichiarate
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      <section id="scenari" className="scenarios-section" aria-labelledby="scenarios-title">
        <div className="site-shell">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow eyebrow-dark">Possibili applicazioni</span>
              <h2 id="scenarios-title">Immaginalo nella tua giornata.</h2>
            </div>
            <p>
              Questi esempi illustrano flussi possibili e non sono testimonianze di
              clienti reali né risultati garantiti.
            </p>
          </Reveal>

          <div className="scenario-grid">
            {scenarios.map((scenario, index) => (
              <Reveal key={scenario.sector} delay={index * 0.08}>
                <article className="scenario-card">
                  <div className="scenario-card__label">
                    <Sparkles aria-hidden="true" size={14} />
                    Scenario esemplificativo
                  </div>
                  <span className="scenario-card__sector">{scenario.sector}</span>
                  <h3>{scenario.title}</h3>
                  <p>{scenario.description}</p>
                  <ul aria-label={`Funzioni ipotetiche per ${scenario.sector}`}>
                    {scenario.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="configura" className="configurator-section" aria-labelledby="config-title">
        <div className="site-shell">
          <Reveal className="configurator-intro">
            <div>
              <span className="eyebrow eyebrow-light">Il tuo agent, da qui</span>
              <h2 id="config-title">Raccontaci cosa deve saper fare.</h2>
            </div>
            <p>
              Compila il brief: riceveremo la richiesta, ti invieremo una conferma e ti
              ricontatteremo per trasformarla in una demo su misura.
            </p>
          </Reveal>

          <Reveal className="form-shell">
            <AgentRequestForm />
          </Reveal>
        </div>
      </section>

      <section className="contact-cta" aria-labelledby="contact-title">
        <div className="site-shell">
          <Reveal className="contact-cta__card">
            <div>
              <span className="eyebrow eyebrow-dark">Preferisci parlarne?</span>
              <h2 id="contact-title">Partiamo da una conversazione vera.</h2>
              <p>
                Scrivici su WhatsApp: una consulenza iniziale, senza impegno, per capire
                se un agent Voicyy è adatto alla tua attività.
              </p>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="button whatsapp-button button-large"
              aria-label="Apri una conversazione WhatsApp con Voicyy (si apre in una nuova scheda)"
            >
              <MessageCircle aria-hidden="true" size={21} />
              Scrivici su WhatsApp
              <ArrowRight aria-hidden="true" size={18} />
            </a>
          </Reveal>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-shell">
          <div className="footer-main">
            <div>
              <Wordmark light />
              <p>Agent vocali AI e chatbot pensati intorno alla tua attività.</p>
            </div>
            <div className="footer-links">
              <div>
                <span>Esplora</span>
                <a href="#vantaggi">Vantaggi</a>
                <a href="#come-funziona">Come funziona</a>
                <a href="#configura">Configura</a>
              </div>
              <div>
                <span>Contatti</span>
                <a href="mailto:info.voicyy@gmail.com">info.voicyy@gmail.com</a>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  +39 392 114 3643
                </a>
              </div>
              <div>
                <span>Informazioni</span>
                <a href="/termini-e-condizioni">Termini e condizioni</a>
                <a href="/privacy-policy">Privacy policy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Voicyy. Tutti i diritti riservati.</span>
            <span>Progettato in Italia · AI, con una voce umana.</span>
          </div>
        </div>
      </footer>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp"
        aria-label="Contatta Voicyy su WhatsApp (si apre in una nuova scheda)"
      >
        <MessageCircle aria-hidden="true" size={22} />
        <span>Parliamone</span>
      </a>
    </main>
  );
}
