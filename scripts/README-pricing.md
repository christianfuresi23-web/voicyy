# Importazione del listino

Il configuratore non inventa prezzi: usa soltanto le combinazioni presenti nel
workbook sorgente verificato.

Il listino attuale è stato importato da
`Retell_Tutte_Combinazioni_Prezzi.xlsx`, foglio `Tutte le Combinazioni`,
verificando queste colonne:

- `LLM`
- `Voce TTS`
- `Telefonia`
- `Costo Totale/min`

Ogni riga deve rappresentare una combinazione e contenere il costo sorgente al
minuto prima del ricarico. L'importazione deve validare i nomi contro le opzioni
mostrate nel sito, rifiutare duplicati incoerenti e generare
`src/data/pricing.generated.json` nella forma:

```json
{
  "gpt 5.5|openai voices|twilio/telnyx": 0.123
}
```

La chiave usa `LLM|TTS|Telephony` in minuscolo e il valore è il costo sorgente
in euro al minuto. L'app applica una maggiorazione totale del 45% (`costo base
× 1,45`) e consente da 0 a 10.000 minuti. Le 192 combinazioni supportate sono
quelle del configuratore; le varianti `GPT 5.4 mini/nano`, non richieste nel
sito, vengono escluse. `Custom LLM` resta senza stima finché non esiste un costo
concordato.
