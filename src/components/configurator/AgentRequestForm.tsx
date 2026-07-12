"use client";

import {
  ArrowRight,
  Check,
  CircleHelp,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { calculateMonthlyPrice } from "@/data/pricing";

const LLM_OPTIONS = [
  "GPT 5.5",
  "GPT 5.4",
  "GPT 5.2",
  "GPT 5.1",
  "GPT 5",
  "GPT 5 nano",
  "GPT 5 mini",
  "GPT 4.1",
  "GPT 4.1 mini",
  "GPT 4.1 nano",
  "Claude 4.5 sonnet",
  "Claude 4.6 sonnet",
  "Claude 4.5 haiku",
  "Gemini 3.0 Flash",
  "Gemini 2.5 Flash",
  "Gemini 2.5 Flash Lite",
  "Custom LLM",
] as const;

const TTS_OPTIONS = [
  "Platform Voices",
  "Minimax Voices",
  "Fish Voices",
  "Elevenlabs Voices",
  "Cartesia Voices",
  "OpenAI Voices",
] as const;

const TELEPHONY_OPTIONS = ["Custom Telephony", "Twilio/Telnyx"] as const;

const WORKING_DAYS = [
  { short: "Lun", full: "Lunedì" },
  { short: "Mar", full: "Martedì" },
  { short: "Mer", full: "Mercoledì" },
  { short: "Gio", full: "Giovedì" },
  { short: "Ven", full: "Venerdì" },
  { short: "Sab", full: "Sabato" },
  { short: "Dom", full: "Domenica" },
] as const;

type Service = {
  id: string;
  name: string;
  durationHours: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type OptionSelectProps = {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

function OptionSelect({ id, label, value, options, onChange }: OptionSelectProps) {
  return (
    <label className="field-label" htmlFor={id}>
      <span>{label}</span>
      <span className="select-wrap">
        <select
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field-control field-select"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function rangeDuration(start: string, end: string) {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start));
}

export function AgentRequestForm() {
  const serviceCounter = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);
  const submissionIdRef = useRef<string | null>(null);
  const [services, setServices] = useState<Service[]>([
    { id: "service-1", name: "", durationHours: "1" },
  ]);
  const [workingDays, setWorkingDays] = useState<string[]>([
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
  ]);
  const [firstStart, setFirstStart] = useState("09:00");
  const [firstEnd, setFirstEnd] = useState("18:00");
  const [hasSecondRange, setHasSecondRange] = useState(false);
  const [secondStart, setSecondStart] = useState("14:00");
  const [secondEnd, setSecondEnd] = useState("18:00");
  const [llm, setLlm] = useState<(typeof LLM_OPTIONS)[number]>("GPT 5.5");
  const [textToSpeech, setTextToSpeech] =
    useState<(typeof TTS_OPTIONS)[number]>("Platform Voices");
  const [telephony, setTelephony] =
    useState<(typeof TELEPHONY_OPTIONS)[number]>("Twilio/Telnyx");
  const [minutes, setMinutes] = useState(1000);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const hoursPerDay = useMemo(() => {
    const firstRangeMinutes = rangeDuration(firstStart, firstEnd);
    const secondRangeMinutes = hasSecondRange
      ? rangeDuration(secondStart, secondEnd)
      : 0;
    return (firstRangeMinutes + secondRangeMinutes) / 60;
  }, [firstStart, firstEnd, hasSecondRange, secondStart, secondEnd]);

  const estimatedMonthlyPrice = useMemo(
    () =>
      calculateMonthlyPrice({
        llm,
        textToSpeech,
        telephony,
        minutes,
      }),
    [llm, textToSpeech, telephony, minutes],
  );

  const formattedPrice =
    estimatedMonthlyPrice === null
      ? null
      : new Intl.NumberFormat("it-IT", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 2,
        }).format(estimatedMonthlyPrice);

  function updateService(id: string, key: "name" | "durationHours", value: string) {
    setServices((current) =>
      current.map((service) =>
        service.id === id ? { ...service, [key]: value } : service,
      ),
    );
  }

  function addService() {
    serviceCounter.current += 1;
    setServices((current) => [
      ...current,
      {
        id: `service-${serviceCounter.current}`,
        name: "",
        durationHours: "1",
      },
    ]);
  }

  function removeService(id: string) {
    setServices((current) => current.filter((service) => service.id !== id));
  }

  function toggleWorkingDay(day: string) {
    setWorkingDays((current) =>
      current.includes(day)
        ? current.filter((currentDay) => currentDay !== day)
        : [...current, day],
    );
  }

  function toggleSecondRange() {
    if (hasSecondRange) {
      setHasSecondRange(false);
      if (
        firstEnd === "13:00" &&
        secondStart === "14:00" &&
        secondEnd === "18:00"
      ) {
        setFirstEnd("18:00");
      }
      return;
    }

    // Turn the default continuous day into a useful lunch-break example.
    if (firstStart === "09:00" && firstEnd === "18:00") {
      setFirstEnd("13:00");
      setSecondStart("14:00");
      setSecondEnd("18:00");
    }
    setHasSecondRange(true);
  }

  function resetInteractiveFields() {
    setServices([{ id: "service-1", name: "", durationHours: "1" }]);
    serviceCounter.current = 1;
    setWorkingDays(["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"]);
    setFirstStart("09:00");
    setFirstEnd("18:00");
    setHasSecondRange(false);
    setSecondStart("14:00");
    setSecondEnd("18:00");
    setLlm("GPT 5.5");
    setTextToSpeech("Platform Voices");
    setTelephony("Twilio/Telnyx");
    setMinutes(1000);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ status: "loading" });

    if (workingDays.length === 0) {
      setSubmitState({
        status: "error",
        message: "Seleziona almeno un giorno lavorativo.",
      });
      return;
    }

    if (timeToMinutes(firstEnd) <= timeToMinutes(firstStart)) {
      setSubmitState({
        status: "error",
        message: "Nella prima fascia, l'orario di fine deve essere successivo all'inizio.",
      });
      return;
    }

    if (
      hasSecondRange &&
      (timeToMinutes(secondEnd) <= timeToMinutes(secondStart) ||
        timeToMinutes(secondStart) <= timeToMinutes(firstEnd))
    ) {
      setSubmitState({
        status: "error",
        message:
          "Controlla la seconda fascia: deve iniziare dopo la fine della prima e terminare più tardi.",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const submissionId = submissionIdRef.current ?? crypto.randomUUID();
    submissionIdRef.current = submissionId;
    const payload = {
      submissionId,
      contactName: String(formData.get("contactName") ?? "").trim(),
      businessName: String(formData.get("businessName") ?? "").trim(),
      services: services.map((service) => ({
        name: service.name.trim(),
        durationHours: Number(service.durationHours),
      })),
      workingDays,
      schedule: {
        start: firstStart,
        end: firstEnd,
        ...(hasSecondRange
          ? { secondStart: secondStart, secondEnd: secondEnd }
          : {}),
      },
      hoursPerDay,
      calendarEmail: String(formData.get("calendarEmail") ?? "").trim(),
      driveFolderId: String(formData.get("driveFolderId") ?? "").trim(),
      notificationEmail: String(formData.get("notificationEmail") ?? "").trim(),
      contactEmail: String(formData.get("contactEmail") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      website: String(formData.get("website") ?? "").trim(),
      details: String(formData.get("details") ?? "").trim(),
      configuration: {
        llm,
        textToSpeech,
        telephony,
        minutes,
        estimatedMonthlyPrice,
      },
      termsAccepted: formData.get("termsAccepted") === "on",
      marketingConsent: formData.get("marketingConsent") === "on",
      companyWebsite: String(formData.get("companyWebsite") ?? ""),
    };

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as
        | {
            message?: string;
            error?: string;
            referenceCode?: string;
            confirmationEmailAccepted?: boolean;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Non è stato possibile inviare la richiesta. Riprova tra poco.",
        );
      }

      setSubmitState({
        status: "success",
        message:
          result?.message ??
          `Richiesta ricevuta.${result?.referenceCode ? ` Codice richiesta: ${result.referenceCode}.` : ""}`,
      });
      formRef.current?.reset();
      resetInteractiveFields();
      submissionIdRef.current = null;
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Si è verificato un errore inatteso. Riprova.",
      });
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="request-form">
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="companyWebsite">Sito aziendale di conferma</label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="form-heading">
        <div>
          <span className="eyebrow eyebrow-dark">01 · La tua attività</span>
          <h3>Partiamo da come lavori.</h3>
        </div>
        <p>
          Queste informazioni ci servono per progettare una demo coerente con la tua
          operatività reale.
        </p>
      </div>

      <div className="form-grid">
        <label className="field-label" htmlFor="contactName">
          <span>Nome e cognome del referente *</span>
          <input
            className="field-control"
            id="contactName"
            name="contactName"
            type="text"
            autoComplete="name"
            placeholder="Mario Rossi"
            required
          />
        </label>

        <label className="field-label" htmlFor="businessName">
          <span>Nome dell’attività *</span>
          <input
            className="field-control"
            id="businessName"
            name="businessName"
            type="text"
            autoComplete="organization"
            placeholder="Studio Rossi"
            required
          />
        </label>
      </div>

      <fieldset className="form-block">
        <div className="form-block__title">
          <div>
            <legend>Servizi e durata *</legend>
            <p>Inserisci ogni servizio prenotabile e il tempo medio necessario.</p>
          </div>
          <button type="button" className="button button-soft" onClick={addService}>
            <Plus aria-hidden="true" size={16} />
            Aggiungi servizio
          </button>
        </div>

        <div className="service-list">
          {services.map((service, index) => (
            <div className="service-row" key={service.id}>
              <span className="service-row__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <label className="field-label grow" htmlFor={`${service.id}-name`}>
                <span className="sr-only">Nome servizio {index + 1}</span>
                <input
                  className="field-control"
                  id={`${service.id}-name`}
                  type="text"
                  placeholder="es. Igiene dentale"
                  value={service.name}
                  onChange={(event) =>
                    updateService(service.id, "name", event.target.value)
                  }
                  required
                />
              </label>
              <label className="duration-field" htmlFor={`${service.id}-duration`}>
                <span className="sr-only">Durata in ore del servizio {index + 1}</span>
                <input
                  className="field-control"
                  id={`${service.id}-duration`}
                  type="number"
                  min="0.25"
                  max="24"
                  step="0.25"
                  inputMode="decimal"
                  value={service.durationHours}
                  onChange={(event) =>
                    updateService(service.id, "durationHours", event.target.value)
                  }
                  required
                />
                <span>ore</span>
              </label>
              <button
                type="button"
                className="icon-button"
                onClick={() => removeService(service.id)}
                disabled={services.length === 1}
                aria-label={`Rimuovi servizio ${index + 1}`}
              >
                <Minus aria-hidden="true" size={17} />
              </button>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-block">
        <div className="form-block__title">
          <div>
            <legend>Giorni e orari di lavoro *</legend>
            <p>Seleziona i giorni e definisci quando accettare appuntamenti.</p>
          </div>
          <div className="hours-chip" aria-live="polite">
            {hoursPerDay.toLocaleString("it-IT", { maximumFractionDigits: 2 })} ore/giorno
          </div>
        </div>

        <div className="days-picker" role="group" aria-label="Giorni lavorativi">
          {WORKING_DAYS.map((day) => {
            const isSelected = workingDays.includes(day.full);
            return (
              <button
                type="button"
                key={day.full}
                className="day-toggle"
                aria-pressed={isSelected}
                onClick={() => toggleWorkingDay(day.full)}
              >
                {isSelected && <Check aria-hidden="true" size={14} />}
                {day.short}
              </button>
            );
          })}
        </div>

        <div className="schedule-list">
          <div className="schedule-range">
            <span className="schedule-range__label">Prima fascia</span>
            <label htmlFor="firstStart">
              <span>Inizio</span>
              <input
                id="firstStart"
                className="field-control"
                type="time"
                value={firstStart}
                onChange={(event) => setFirstStart(event.target.value)}
                required
              />
            </label>
            <span className="schedule-range__dash" aria-hidden="true" />
            <label htmlFor="firstEnd">
              <span>Fine</span>
              <input
                id="firstEnd"
                className="field-control"
                type="time"
                value={firstEnd}
                onChange={(event) => setFirstEnd(event.target.value)}
                required
              />
            </label>
          </div>

          {hasSecondRange && (
            <div className="schedule-range">
              <span className="schedule-range__label">Seconda fascia</span>
              <label htmlFor="secondStart">
                <span>Inizio</span>
                <input
                  id="secondStart"
                  className="field-control"
                  type="time"
                  value={secondStart}
                  onChange={(event) => setSecondStart(event.target.value)}
                  required
                />
              </label>
              <span className="schedule-range__dash" aria-hidden="true" />
              <label htmlFor="secondEnd">
                <span>Fine</span>
                <input
                  id="secondEnd"
                  className="field-control"
                  type="time"
                  value={secondEnd}
                  onChange={(event) => setSecondEnd(event.target.value)}
                  required
                />
              </label>
            </div>
          )}

          <button
            type="button"
            className="text-button"
            onClick={toggleSecondRange}
          >
            {hasSecondRange ? (
              <Minus aria-hidden="true" size={16} />
            ) : (
              <Plus aria-hidden="true" size={16} />
            )}
            {hasSecondRange ? "Rimuovi seconda fascia" : "Aggiungi seconda fascia oraria"}
          </button>
        </div>
      </fieldset>

      <div className="form-heading form-heading--spaced">
        <div>
          <span className="eyebrow eyebrow-dark">02 · Integrazioni e contatti</span>
          <h3>Colleghiamo i punti giusti.</h3>
        </div>
        <p>
          Non chiediamo password. Le autorizzazioni definitive vengono configurate in
          sicurezza durante l’onboarding.
        </p>
      </div>

      <div className="form-grid">
        <label className="field-label" htmlFor="calendarEmail">
          <span>Email Google Calendar *</span>
          <input
            className="field-control"
            id="calendarEmail"
            name="calendarEmail"
            type="email"
            autoComplete="email"
            placeholder="agenda@attivita.it"
            required
          />
        </label>

        <label className="field-label" htmlFor="driveFolderId">
          <span className="label-with-help">
            ID cartella Google Drive
            <details className="info-tooltip">
              <summary aria-label="Come trovare l’ID della cartella Google Drive">
                <CircleHelp aria-hidden="true" size={16} />
              </summary>
              <span role="note">
                Apri la cartella su Drive: l’ID è la parte dell’indirizzo che segue
                <code>/folders/</code>. Non inserire l’intero link.
              </span>
            </details>
          </span>
          <input
            className="field-control"
            id="driveFolderId"
            name="driveFolderId"
            type="text"
            placeholder="1AbC…xyz"
          />
        </label>

        <label className="field-label" htmlFor="notificationEmail">
          <span>Email per notifiche prenotazione *</span>
          <input
            className="field-control"
            id="notificationEmail"
            name="notificationEmail"
            type="email"
            autoComplete="email"
            placeholder="notifiche@attivita.it"
            required
          />
        </label>

        <label className="field-label" htmlFor="contactEmail">
          <span>Email referente / cliente *</span>
          <input
            className="field-control"
            id="contactEmail"
            name="contactEmail"
            type="email"
            autoComplete="email"
            placeholder="mario@attivita.it"
            required
          />
        </label>

        <label className="field-label" htmlFor="phone">
          <span>Numero di telefono *</span>
          <input
            className="field-control"
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+39 333 123 4567"
            required
          />
        </label>

        <label className="field-label" htmlFor="website">
          <span>Sito web</span>
          <input
            className="field-control"
            id="website"
            name="website"
            type="url"
            autoComplete="url"
            placeholder="https://www.attivita.it"
          />
        </label>
      </div>

      <label className="field-label" htmlFor="details">
        <span>Dettagli aggiuntivi</span>
        <textarea
          className="field-control field-textarea"
          id="details"
          name="details"
          rows={5}
          placeholder="Raccontaci esigenze particolari, tono di voce, domande frequenti o integrazioni utili…"
        />
      </label>

      <div className="form-heading form-heading--spaced">
        <div>
          <span className="eyebrow eyebrow-dark">03 · Configurazione</span>
          <h3>Scegli le tue opzioni.</h3>
        </div>
        <p>
          La selezione ci aiuta a stimare l’architettura. La configurazione definitiva
          viene validata insieme prima del lavoro.
        </p>
      </div>

      <div className="options-panel">
        <div className="options-grid">
          <OptionSelect
            id="llm"
            label="LLM"
            value={llm}
            options={LLM_OPTIONS}
            onChange={(value) => setLlm(value as (typeof LLM_OPTIONS)[number])}
          />
          <OptionSelect
            id="textToSpeech"
            label="Text To Speech"
            value={textToSpeech}
            options={TTS_OPTIONS}
            onChange={(value) =>
              setTextToSpeech(value as (typeof TTS_OPTIONS)[number])
            }
          />
          <OptionSelect
            id="telephony"
            label="Telephony"
            value={telephony}
            options={TELEPHONY_OPTIONS}
            onChange={(value) =>
              setTelephony(value as (typeof TELEPHONY_OPTIONS)[number])
            }
          />
        </div>

        <div className="minutes-control">
          <div className="minutes-control__header">
            <label htmlFor="minutes">Minuti di chiamata mensili</label>
            <output htmlFor="minutes">
              {minutes.toLocaleString("it-IT")} <small>min</small>
            </output>
          </div>
          <input
            id="minutes"
            name="minutes"
            className="range-control"
            type="range"
            min="0"
            max="10000"
            step="50"
            value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))}
          />
          <div className="range-labels" aria-hidden="true">
            <span>0</span>
            <span>10.000</span>
          </div>
        </div>

        <div className="estimate-card" aria-live="polite">
          <div className="estimate-card__icon">
            <Sparkles aria-hidden="true" size={20} />
          </div>
          <div>
            <span>Stima traffico mensile</span>
            {formattedPrice ? (
              <strong>{formattedPrice}</strong>
            ) : (
              <strong className="estimate-card__pending">
                Listino in attesa di importazione
              </strong>
            )}
            <p>
              Valore indicativo. Il preventivo finale dipende dai requisiti validati e
              non costituisce un’offerta vincolante.
            </p>
          </div>
        </div>
      </div>

      <div className="consents">
        <label className="consent-row">
          <input type="checkbox" name="termsAccepted" required />
          <span className="consent-row__box" aria-hidden="true">
            <Check size={14} />
          </span>
          <span>
            Accetto i <a href="/termini-e-condizioni">Termini e le Condizioni di Vendita</a>
            {" "}e dichiaro di aver preso visione della{" "}
            <a href="/privacy-policy">Privacy Policy</a>. *
          </span>
        </label>

        <label className="consent-row">
          <input type="checkbox" name="marketingConsent" />
          <span className="consent-row__box" aria-hidden="true">
            <Check size={14} />
          </span>
          <span>
            Acconsento al trattamento dei miei dati per finalità di marketing, invio di
            newsletter e offerte commerciali da parte di Voicyy.
          </span>
        </label>
      </div>

      {submitState.status === "error" && (
        <div className="form-alert form-alert--error" role="alert">
          {submitState.message}
        </div>
      )}
      {submitState.status === "success" && (
        <div className="form-alert form-alert--success" role="status">
          <Check aria-hidden="true" size={18} />
          {submitState.message}
        </div>
      )}

      <div className="submit-row">
        <div className="submit-note">
          <ShieldCheck aria-hidden="true" size={18} />
          <span>
            Dati usati per elaborare la richiesta. <strong>Nessun pagamento ora.</strong>
          </span>
        </div>
        <button
          className="button button-lime button-submit"
          type="submit"
          disabled={submitState.status === "loading"}
        >
          {submitState.status === "loading" ? (
            <LoaderCircle className="spinner" aria-hidden="true" size={19} />
          ) : (
            <ArrowRight aria-hidden="true" size={19} />
          )}
          {submitState.status === "loading" ? "Invio in corso…" : "Invia richiesta"}
        </button>
      </div>
    </form>
  );
}
