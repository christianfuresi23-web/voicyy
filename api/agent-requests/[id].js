import { sql } from "@vercel/postgres";

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

let initPromise;
const ensureDb = async () => {
  initPromise ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS agent_requests (
        id TEXT PRIMARY KEY,
        created_date TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL,
        payment_status TEXT,
        contact_name TEXT,
        contact_email TEXT,
        business_name TEXT,
        phone TEXT,
        minutes NUMERIC,
        total_monthly_cost NUMERIC,
        data JSONB NOT NULL
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS agent_requests_created_date_idx ON agent_requests (created_date DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS agent_requests_status_idx ON agent_requests (status);`;
    await sql`CREATE INDEX IF NOT EXISTS agent_requests_payment_status_idx ON agent_requests (payment_status);`;
  })();
  return initPromise;
};

const okRow = (row) => {
  const data = row?.data && typeof row.data === "object" ? row.data : {};
  return {
    ...data,
    id: row.id,
    created_date: row.created_date,
    status: row.status,
    payment_status: row.payment_status,
    contact_name: row.contact_name,
    contact_email: row.contact_email,
    business_name: row.business_name,
    phone: row.phone,
    minutes: row.minutes != null ? Number(row.minutes) : data.minutes,
    total_monthly_cost: row.total_monthly_cost != null ? Number(row.total_monthly_cost) : data.total_monthly_cost,
  };
};

export default async function handler(req, res) {
  try {
    await ensureDb();
  } catch (e) {
    return res.status(500).json({ error: "DB not configured", details: e?.message });
  }

  const url = new URL(req.url, "http://localhost");
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  if (!id) return res.status(400).json({ error: "Missing id" });

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const patch = await readJsonBody(req);
  if (!patch || typeof patch !== "object") return res.status(400).json({ error: "Invalid JSON body" });

  const existing = await sql`SELECT * FROM agent_requests WHERE id = ${id} LIMIT 1;`;
  const row = existing.rows?.[0];
  if (!row) return res.status(404).json({ error: "Not found" });

  const merged = { ...(row.data || {}), ...patch };
  const status = merged.status || row.status || "nuova";
  const paymentStatus = merged.payment_status ?? row.payment_status ?? null;
  const contactName = merged.contact_name ?? row.contact_name ?? null;
  const contactEmail = merged.contact_email ?? row.contact_email ?? null;
  const businessName = merged.business_name ?? row.business_name ?? null;
  const phone = merged.phone ?? row.phone ?? null;
  const minutes = merged.minutes ?? row.minutes ?? null;
  const totalMonthlyCost = merged.total_monthly_cost ?? row.total_monthly_cost ?? null;

  const dataJson = JSON.stringify(merged);
  const updated = await sql`
    UPDATE agent_requests
    SET
      status = ${status},
      payment_status = ${paymentStatus},
      contact_name = ${contactName},
      contact_email = ${contactEmail},
      business_name = ${businessName},
      phone = ${phone},
      minutes = ${minutes},
      total_monthly_cost = ${totalMonthlyCost},
      data = ${dataJson}::jsonb
    WHERE id = ${id}
    RETURNING *;
  `;

  return res.status(200).json(okRow(updated.rows[0]));
}
