import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://moneycove.nileai.solutions",
  "https://pesapilot.nileai.solutions",
  "https://pesapilot.titussimplifies.com",
]);

function cors(origin: string | null) {
  const value = origin && allowedOrigins.has(origin) ? origin : "https://moneycove.nileai.solutions";
  return {
    "Access-Control-Allow-Origin": value,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin not allowed." }, 403, origin);

  try {
    const raw = await req.text();
    if (!raw || raw.length > 4096) return json({ error: "Invalid request." }, 400, origin);
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(raw); } catch { return json({ error: "Invalid request." }, 400, origin); }

    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
    if (name.length < 2 || name.length > 80) return json({ error: "Enter your name." }, 400, origin);
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email address." }, 400, origin);
    if (password.length < 8 || password.length > 128) return json({ error: "Use a password between 8 and 128 characters." }, 400, origin);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
    if (error) {
      const message = String(error.message || "").toLowerCase();
      if (message.includes("already") || message.includes("registered") || error.status === 422) return json({ error: "An account already exists with this email. Sign in instead." }, 409, origin);
      console.error("MoneyCove signup error", error);
      return json({ error: "Unable to create your account right now." }, 500, origin);
    }

    const userId = data.user?.id;
    if (userId) {
      const now = new Date().toISOString();
      const results = await Promise.all([
        admin.from("pesapilot_profiles").upsert({ user_id: userId, full_name: name, last_seen_at: now }, { onConflict: "user_id" }),
        admin.from("pesapilot_subscriptions").upsert({ user_id: userId, plan: "free", status: "free", updated_at: now }, { onConflict: "user_id" }),
        admin.from("pesapilot_finance_states").upsert({ user_id: userId, state: { transactions: [], monthlyBudget: 0, categoryBudgets: [], settings: { currency: "USD", theme: "light" } }, updated_at: now }, { onConflict: "user_id" }),
      ]);
      for (const result of results) if (result.error) console.error("MoneyCove signup initialization error", result.error);
    }
    return json({ ok: true }, 201, origin);
  } catch (error) {
    console.error("MoneyCove signup unexpected error", error);
    return json({ error: "Unable to create your account right now." }, 500, origin);
  }
});
