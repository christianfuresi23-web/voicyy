import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Users, TrendingDown, Calendar, Zap, Star, ArrowRight } from 'lucide-react';
import VoicyyLogo from '../components/VoicyyLogo';
import PricingCalculator from '../components/PricingCalculator';
import AgentRequestForm from '../components/AgentRequestForm';

const WHATSAPP_NUMBER = '393921143643';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Ciao! Vorrei saperne di più sugli agenti AI Voicyy per la mia attività.')}`;

export default function Home() {
  const [pricingConfig, setPricingConfig] = useState(null);
  const formRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <VoicyyLogo size="md" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#servizio" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Il Servizio</a>
            <a href="#vantaggi" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Vantaggi</a>
            <a href="#testimonianze" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Case Studies</a>
            <a href="#prezzi" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Prezzi</a>
            <button onClick={scrollToForm} className="px-5 py-2 bg-[#0077b6] text-white text-sm font-medium rounded-full hover:bg-[#005f8f] transition-all">
              Richiedi Demo
            </button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className="w-5 h-0.5 bg-gray-900 mb-1"></div>
            <div className="w-5 h-0.5 bg-gray-900 mb-1"></div>
            <div className="w-5 h-0.5 bg-gray-900"></div>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
            <a href="#servizio" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Il Servizio</a>
            <a href="#vantaggi" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Vantaggi</a>
            <a href="#testimonianze" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Case Studies</a>
            <a href="#prezzi" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Prezzi</a>
            <button onClick={() => { scrollToForm(); setMobileMenuOpen(false); }} className="px-5 py-2 bg-[#0077b6] text-white text-sm font-medium rounded-full">Richiedi Demo</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e8f4fc] rounded-full text-sm text-[#0077b6] font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Agenti AI Vocali 24/7 — Made in Italy
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-gray-900 tracking-tight mb-6 leading-[1.05]">
            La tua segretaria AI.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b4d8] to-[#0077b6]">
              Sempre disponibile.
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-12">
            Voicyy crea agenti AI vocali su misura per la tua attività. Gestisce prenotazioni, risponde alle chiamate e raccoglie dati — 24 ore su 24, 7 giorni su 7. Nessuna chiamata persa, mai.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToForm}
              className="px-8 py-4 bg-[#0077b6] hover:bg-[#005f8f] text-white font-semibold text-base rounded-2xl transition-all shadow-sm hover:shadow-lg active:scale-[0.98] flex items-center gap-2"
            >
              Configura il tuo Agente
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#25D366] hover:bg-[#1daf54] text-white font-semibold text-base rounded-2xl transition-all shadow-sm hover:shadow-lg active:scale-[0.98] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Consulenza Gratuita
            </a>
          </div>
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>Attivo 24/7</div>
            <div>Fino a 30 chiamate simultanee</div>
            <div>Setup in 1–2 settimane</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-gray-50" id="servizio">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: '€2.100', label: 'Risparmio mensile', sub: 'rispetto a una segretaria' },
            { value: '30', label: 'Chiamate simultanee', sub: 'gestite dall\'agente AI' },
            { value: '24/7', label: 'Disponibilità totale', sub: 'anche fuori orario' },
            { value: '0', label: 'Chiamate perse', sub: 'con il tuo agente attivo' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-[#0077b6] mb-2 tracking-tight">{stat.value}</div>
              <div className="text-sm font-medium text-gray-900 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-400">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-28 px-6" id="vantaggi">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">Come funziona Voicyy</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Un agente AI addestrato sulla tua attività, integrato con il tuo calendario, pronto in poche settimane.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Phone className="w-6 h-6" />, title: 'Risponde alle chiamate', desc: 'L\'agente risponde immediatamente, anche a 30 chiamate contemporaneamente, senza mai mettere in attesa.' },
              { icon: <Calendar className="w-6 h-6" />, title: 'Gestisce le prenotazioni', desc: 'Prenota automaticamente sul tuo Google Calendar, invia conferme e gestisce cancellazioni.' },
              { icon: <Users className="w-6 h-6" />, title: 'Raccoglie i dati', desc: 'Nome, cognome, email e telefono del cliente vengono salvati automaticamente ad ogni prenotazione.' },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white border border-gray-100 hover:border-[#0077b6]/20 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-[#e8f4fc] rounded-xl flex items-center justify-center text-[#0077b6] mb-6 group-hover:bg-[#0077b6] group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <div className="text-xs font-semibold text-[#0077b6] mb-2 tracking-widest uppercase">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div className="mt-20 bg-gradient-to-br from-[#0a0e1a] to-[#0d1f3c] rounded-2xl p-10 text-white">
            <h3 className="text-2xl font-semibold mb-8 text-center">Segretaria tradizionale vs Voicyy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-white/50 text-sm font-medium mb-4 uppercase tracking-wider">Segretaria tradizionale</p>
                <ul className="space-y-3 text-sm">
                  {['~€2.400/mese', 'Orario limitato (8h/giorno)', 'Max 1 chiamata alla volta', 'Ferie, malattie, assenze', 'Errori di annotazione'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/60">
                      <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs flex-shrink-0">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#0077b6]/20 border border-[#0077b6]/30 rounded-xl p-6">
                <p className="text-[#00b4d8] text-sm font-medium mb-4 uppercase tracking-wider">Agente Voicyy AI</p>
                <ul className="space-y-3 text-sm">
                  {['€200–300/mese tutto incluso', 'Attivo 24 ore su 24, 7/7', 'Fino a 30 chiamate simultanee', 'Mai assente, mai in ferie', 'Dati sempre accurati e organizzati'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white">
                      <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-white/60 text-sm">Con Voicyy risparmi in media</p>
              <p className="text-4xl font-bold text-[#00b4d8] mt-1">€2.100 <span className="text-white/60 text-xl font-normal">al mese</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonianze */}
      <section className="py-28 px-6 bg-gray-50" id="testimonianze">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">Case Studies</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Risultati reali da attività reali che hanno scelto Voicyy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Prima perdevo almeno 15 chiamate al giorno perché ero in studio con i pazienti. Ora ogni chiamata riceve risposta immediata e il calendario si aggiorna da solo.",
                name: "Dott. Marco Ferri",
                role: "Studio Dentistico Ferri, Milano",
                saving: "€2.100/mese risparmiati",
                stars: 5
              },
              {
                quote: "I miei clienti si prenotano anche alle 22:00 di domenica. L'agente gestisce tutto, io trovo il calendario pieno il lunedì mattina senza aver fatto nulla.",
                name: "Giulia Pavan",
                role: "Centro Estetico Aura, Roma",
                saving: "Zero chiamate perse",
                stars: 5
              },
              {
                quote: "Avevo paura che i clienti non accettassero un'AI, invece quasi nessuno se ne accorge. La voce è naturale e risponde a tutte le domande sui nostri servizi.",
                name: "Lorenzo Bianchi",
                role: "Studio Fisioterapico, Torino",
                saving: "30 chiamate gestite/giorno",
                stars: 5
              }
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col">
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 flex-1">"{t.quote}"</p>
                <div className="border-t border-gray-100 pt-5">
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t.role}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
                    <TrendingDown className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-green-700">{t.saving}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Calculator */}
      <section className="py-28 px-6" id="prezzi">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">Stima il costo mensile</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Seleziona la configurazione AI più adatta e calcola il costo in base ai tuoi volumi di chiamata.</p>
          </div>
          <PricingCalculator onConfigChange={setPricingConfig} />
          <p className="text-center text-sm text-gray-400 mt-6">
            Non sai quale configurazione scegliere?{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#0077b6] hover:underline font-medium">
              Scrivici su WhatsApp
            </a>
            {' '}— ti consigliamo la soluzione migliore per la tua attività.
          </p>
        </div>
      </section>

      {/* Request form */}
      <section className="py-28 px-6 bg-gray-50" id="richiesta" ref={formRef}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">Configura il tuo Agente AI</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Compila il modulo con i dati della tua attività. Ti contatteremo entro 24–48 ore per iniziare la configurazione personalizzata.</p>
          </div>
          <AgentRequestForm pricingConfig={pricingConfig} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0e1a] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div className="max-w-xs">
              <VoicyyLogo size="md" className="mb-4" />
              <p className="text-white/50 text-sm leading-relaxed mt-2">Agenti AI vocali e chatbot per la gestione automatizzata di prenotazioni e segreteria virtuale.</p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1daf54] text-white text-sm font-semibold rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Scrivici su WhatsApp
              </a>
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">Navigazione</p>
                <ul className="space-y-3">
                  <li><a href="#servizio" className="text-white/60 hover:text-white text-sm transition-colors">Il Servizio</a></li>
                  <li><a href="#vantaggi" className="text-white/60 hover:text-white text-sm transition-colors">Vantaggi</a></li>
                  <li><a href="#testimonianze" className="text-white/60 hover:text-white text-sm transition-colors">Case Studies</a></li>
                  <li><a href="#prezzi" className="text-white/60 hover:text-white text-sm transition-colors">Prezzi</a></li>
                </ul>
              </div>
              <div>
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">Legale</p>
                <ul className="space-y-3">
                  <li><Link to="/terms" className="text-white/60 hover:text-white text-sm transition-colors">Termini e Condizioni</Link></li>
                  <li><Link to="/privacy" className="text-white/60 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
                </ul>
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4 mt-8">Contatti</p>
                <ul className="space-y-3">
                  <li><a href="mailto:info.voicyy@gmail.com" className="text-white/60 hover:text-white text-sm transition-colors">info.voicyy@gmail.com</a></li>
                  <li><a href="tel:+393921143643" className="text-white/60 hover:text-white text-sm transition-colors">+39 392 114 3643</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-xs">© 2025 Voicyy — Tutti i diritti riservati.</p>
            <p className="text-white/30 text-xs">P.IVA in fase di registrazione</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#1daf54] rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
        aria-label="Contattaci su WhatsApp"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
