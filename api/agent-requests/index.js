import { sql } from "@vercel/postgres";
import { requireAdminAuth } from "../_adminAuth.js";

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

  if (req.method === "GET") {
    const auth = requireAdminAuth(req, res);
    if (!auth.ok) return;
    const url = new URL(req.url, "http://localhost");
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.max(1, Math.min(200, Number(limitRaw || 100)));
    const rows = await sql`
      SELECT * FROM agent_requests
      ORDER BY created_date DESC
      LIMIT ${limit};
    `;
    return res.status(200).json(rows.rows.map(okRow));
  }

  if (req.method === "POST") {
    const body = await readJsonBody(req);
    if (!body || typeof body !== "object") return res.status(400).json({ error: "Invalid JSON body" });

    const id = body.id || crypto.randomUUID();
    const createdDate = body.created_date || new Date().toISOString();
    const status = body.status || "nuova";
    const paymentStatus = body.payment_status || null;
    const contactName = body.contact_name || null;
    const contactEmail = body.contact_email || null;
    const businessName = body.business_name || null;
    const phone = body.phone || null;
    const minutes = body.minutes ?? null;
    const totalMonthlyCost = body.total_monthly_cost ?? null;

    const dataJson = JSON.stringify(body);
    const inserted = await sql`
      INSERT INTO agent_requests (
        id, created_date, status, payment_status,
        contact_name, contact_email, business_name, phone,
        minutes, total_monthly_cost, data
      )
      VALUES (
        ${id}, ${createdDate}, ${status}, ${paymentStatus},
        ${contactName}, ${contactEmail}, ${businessName}, ${phone},
        ${minutes}, ${totalMonthlyCost}, ${dataJson}::jsonb
      )
      RETURNING *;
    `;

    return res.status(200).json(okRow(inserted.rows[0]));
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method Not Allowed" });
}
