import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentRequestForm } from "./AgentRequestForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Nome e cognome del referente *"), {
    target: { value: "Mario Rossi" },
  });
  fireEvent.change(screen.getByLabelText("Nome dell’attività *"), {
    target: { value: "Studio Rossi" },
  });
  fireEvent.change(screen.getByLabelText("Nome servizio 1"), {
    target: { value: "Igiene dentale" },
  });
  fireEvent.change(screen.getByLabelText("Email Google Calendar *"), {
    target: { value: "agenda@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Email per notifiche prenotazione *"), {
    target: { value: "notifiche@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Email referente / cliente *"), {
    target: { value: "mario@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Numero di telefono *"), {
    target: { value: "+39 333 123 4567" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: /Accetto i Termini e le Condizioni di Vendita/i,
    }),
  );
}

describe("AgentRequestForm", () => {
  it("updates the quote when the configuration changes", () => {
    render(<AgentRequestForm />);

    expect(screen.getByText("Prezzo al minuto").parentElement).toHaveTextContent(
      "0,35525 €/min",
    );
    expect(screen.getByText("Stima mensile").parentElement).toHaveTextContent(
      "355,25 €",
    );

    fireEvent.change(screen.getByRole("combobox", { name: "LLM" }), {
      target: { value: "Custom LLM" },
    });

    expect(
      screen.getByText("Combinazione senza prezzo disponibile"),
    ).toBeInTheDocument();
  });

  it("submits the validated payload without exposing the old autofill honeypot", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Richiesta ricevuta.",
        referenceCode: "VY-1234567890AB",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AgentRequestForm />);
    fillRequiredFields();

    fireEvent.submit(screen.getByRole("button", { name: "Invia richiesta" }).closest("form")!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(request.body));

    expect(payload).toMatchObject({
      contactName: "Mario Rossi",
      businessName: "Studio Rossi",
      botField: "",
      termsAccepted: true,
      configuration: { minutes: 1000, estimatedMonthlyPrice: 355.25 },
    });
    expect(payload).not.toHaveProperty("companyWebsite");
  });

  it("shows the concrete server validation messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Controlla i dati e riprova.",
          fields: { phone: ["Inserisci un numero di telefono valido"] },
        }),
      }),
    );
    render(<AgentRequestForm />);
    fillRequiredFields();

    fireEvent.submit(screen.getByRole("button", { name: "Invia richiesta" }).closest("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Controlla i dati e riprova. Inserisci un numero di telefono valido",
    );
  });
});
