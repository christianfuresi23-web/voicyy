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

const normalizeDecimal = (value, decimals = 6) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // #region debug-point A:api-entry
  (() => { try { const fs = require("fs"); const p = ".dbg/agent-request-submit.env"; let u = "http://127.0.0.1:7777/event", s = "agent-request-submit"; try { const e = fs.readFileSync(p, "utf8"); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; } catch {} fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: s, runId: "pre", hypothesisId: "A", location: "subscribe-metered.js", msg: "[DEBUG] subscribe-metered entry", data: { hasSecret: Boolean(process.env.STRIPE_SECRET_KEY) }, ts: Date.now() }) }).catch(() => {}); } catch {} })();
  // #endregion

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: "Stripe not configured (missing STRIPE_SECRET_KEY)" });

  const body = await readJsonBody(req);
  const setupIntentId = body?.setup_intent_id;
  const currency = (body?.currency || "eur").toLowerCase();
  const pricePerMinRaw = body?.price_per_min;

  if (!setupIntentId) return res.status(400).json({ error: "Missing setup_intent_id" });
  const pricePerMin = normalizeDecimal(pricePerMinRaw);
  if (!pricePerMin) return res.status(400).json({ error: "Missing or invalid price_per_min" });

  const stripe = new Stripe(secretKey);

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  const customerId = setupIntent.customer;
  const paymentMethodId = setupIntent.payment_method;

  if (!customerId || typeof customerId !== "string") return res.status(400).json({ error: "SetupIntent has no customer" });
  if (!paymentMethodId || typeof paymentMethodId !== "string") return res.status(400).json({ error: "SetupIntent has no payment method" });

  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  } catch {}

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find((p) => p.metadata?.product_key === "voicyy_minutes") || null;
  if (!product) {
    const byName = products.data.find((p) => p.name === "Voicyy - Minuti agente") || null;
    if (byName) {
      product = await stripe.products.update(byName.id, { metadata: { ...byName.metadata, product_key: "voicyy_minutes" } });
    } else {
      product = await stripe.products.create({
        name: "Voicyy - Minuti agente",
        metadata: { product_key: "voicyy_minutes" },
      });
    }
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  let price = prices.data.find((p) => p.metadata?.price_per_min === pricePerMin && p.currency === currency) || null;
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency,
      unit_amount_decimal: pricePerMin,
      recurring: { interval: "month", usage_type: "metered" },
      metadata: { price_per_min: pricePerMin },
    });
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
  });

  const subscriptionItemId = subscription.items?.data?.[0]?.id || "";

  // #region debug-point A:api-ok
  (() => { try { const fs = require("fs"); const p = ".dbg/agent-request-submit.env"; let u = "http://127.0.0.1:7777/event", s = "agent-request-submit"; try { const e = fs.readFileSync(p, "utf8"); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; } catch {} fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: s, runId: "pre", hypothesisId: "A", location: "subscribe-metered.js", msg: "[DEBUG] subscribe-metered ok", data: { customerId, subscriptionId: subscription.id, subscriptionItemId, priceId: price.id, normalizedPricePerMin: pricePerMin }, ts: Date.now() }) }).catch(() => {}); } catch {} })();
  // #endregion

  return res.status(200).json({
    subscriptionId: subscription.id,
    subscriptionItemId,
    priceId: price.id,
    normalizedPricePerMin: pricePerMin,
    customerId,
    paymentMethodId,
  });
}
