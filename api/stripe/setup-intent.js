import Stripe from "stripe";

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

const escapeStripeSearch = (value) => String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: "Stripe not configured" });

  const body = await readJsonBody(req);
  const email = body?.email?.trim();
  const name = body?.name?.trim();
  const businessName = body?.business_name?.trim();

  if (!email) return res.status(400).json({ error: "Missing email" });

  const stripe = new Stripe(secretKey);

  let customer = null;
  try {
    const existing = await stripe.customers.search({
      query: `email:'${escapeStripeSearch(email)}'`,
      limit: 1,
    });
    customer = existing.data?.[0] ?? null;
  } catch {}

  if (!customer) {
    customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: businessName ? { business_name: businessName } : undefined,
    });
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    usage: "off_session",
    payment_method_types: ["card"],
  });

  return res.status(200).json({
    clientSecret: setupIntent.client_secret,
    customerId: customer.id,
  });
}

