[OPEN] Debug session: agent-request-submit

## Sintomi
- Invio richiesta: mostra "Si è verificato un errore. Riprova o contattaci su WhatsApp."
- Email admin e cliente: non arrivano.

## Ipotesi (falsificabili)
- A) La chiamata a Stripe (/api/stripe/subscribe-metered o /api/stripe/setup-intent) fallisce (400/500) e genera errore nel submit.
- B) Il salvataggio della richiesta (api.entities.AgentRequest.create / localStorage) fallisce (quota/JSON/permessi) e genera errore nel submit.
- C) La chiave Stripe (pubblica o segreta) è assente nell'ambiente effettivo (Preview vs Production) e quindi l’endpoint risponde "Stripe not configured".
- D) Le email non partono perché l'integrazione email è solo un mock/stub lato client (nessun provider reale configurato).
- E) La rewrite SPA / routing (vercel.json) o CORS blocca le chiamate a /api/* in alcuni ambienti.

## Piano evidenze
1) Avviare Debug Server e raccogliere log “pre”.
2) Strumentare (solo log) i punti: click “Invia richiesta”, chiamate Stripe, salvataggio richiesta, “SendEmail”.
3) Riprodurre e analizzare log per confermare/smentire le ipotesi.

## Stato
- Debug server: [ ] running
- Riproduzione: [ ] done
- Fix: [ ] pending

