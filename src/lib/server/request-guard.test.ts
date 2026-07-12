import { describe, expect, it } from "vitest";

import { readJsonBody } from "./request-guard";

function localRequest(body: BodyInit, headers: Record<string, string> = {}) {
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    body,
    duplex: "half",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      host: "localhost:3000",
      ...headers,
    },
  };
  return new Request("http://localhost:3000/api/test", init);
}

describe("readJsonBody", () => {
  it("legge JSON locale valido", async () => {
    await expect(readJsonBody(localRequest('{"ok":true}'), 32)).resolves.toEqual({
      ok: true,
    });
  });

  it("interrompe uno stream oltre il limite anche senza Content-Length", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"value":"'));
        controller.enqueue(encoder.encode("x".repeat(128)));
        controller.enqueue(encoder.encode('"}'));
        controller.close();
      },
    });

    await expect(readJsonBody(localRequest(stream), 32)).rejects.toMatchObject({
      status: 413,
    });
  });

  it("rifiuta esplicitamente le richieste cross-site", async () => {
    await expect(
      readJsonBody(
        localRequest("{}", {
          origin: "https://evil.example",
          "sec-fetch-site": "cross-site",
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
