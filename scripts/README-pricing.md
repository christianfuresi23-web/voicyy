# Importazione del listino

Il configuratore non inventa prezzi: finché il file Excel sorgente non viene
importato, mostra che il listino è in attesa.

Il workbook sorgente non è incluso in questa copia del progetto. Per completare
il listino, allegarlo nuovamente e importare il primo foglio verificando almeno
queste quattro colonne:

- `LLM`
- `Text To Speech`
- `Telephony`
- `Price per minute`

Ogni riga deve rappresentare una combinazione e contenere il costo sorgente al
minuto prima del ricarico. L'importazione deve validare i nomi contro le opzioni
mostrate nel sito, rifiutare duplicati incoerenti e generare
`src/data/pricing.generated.json` nella forma:

```json
{
  "gpt 5.5|openai voices|twilio/telnyx": 0.123
}
```

La chiave usa `LLM|TTS|Telephony` in minuscolo e il valore è un numero in euro
al minuto. L'app applica poi una maggiorazione totale del 40% (`costo base ×
1,40`) e consente da 0 a 10.000 minuti. Il JSON va generato soltanto dopo aver
letto e verificato il workbook reale; non inserire prezzi dimostrativi.
