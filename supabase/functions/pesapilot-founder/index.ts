import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const FOUNDER_EMAIL = "opiotitus333@gmail.com";
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
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Sign in required." }, 401, origin);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userResult, error: userError } = await admin.auth.getUser(token);
    if (userError || !userResult.user) return json({ error: "Invalid session." }, 401, origin);
    const founder = userResult.user;
    if (String(founder.email || "").trim().toLowerCase() !== FOUNDER_EMAIL) return json({ error: "Founder access required." }, 403, origin);

    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(await req.text() || "{}"); } catch { return json({ error: "Invalid request." }, 400, origin); }
    const action = String(payload.action || "list");

    if (action === "list") {
      const { data: profiles, error: profilesError } = await admin.from("pesapilot_profiles").select("user_id,full_name,joined_at,last_seen_at").order("joined_at", { ascending: false }).limit(1000);
      if (profilesError) throw profilesError;
      const profileRows = profiles || [];
      const profileIds = new Set(profileRows.map((row: any) => row.user_id));
      const profileMap = new Map(profileRows.map((row: any) => [row.user_id, row]));
      const { data: listed, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) throw usersError;
      const users = (listed?.users || []).filter((account: any) => profileIds.has(account.id));
      const userIds = users.map((user: any) => user.id);
      const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
      const [subs, finance, ai, payments] = await Promise.all([
        userIds.length ? admin.from("pesapilot_subscriptions").select("user_id,plan,status,current_period_end,provider,provider_reference,updated_at").in("user_id", userIds) : Promise.resolve({ data: [], error: null }),
        userIds.length ? admin.from("pesapilot_finance_states").select("user_id,updated_at").in("user_id", userIds) : Promise.resolve({ data: [], error: null }),
        userIds.length ? admin.from("pesapilot_ai_usage").select("user_id,created_at").in("user_id", userIds).gte("created_at", monthStart.toISOString()) : Promise.resolve({ data: [], error: null }),
        admin.from("pesapilot_manual_payments").select("user_id,amount,currency,reference,created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      for (const result of [subs, finance, ai, payments]) if (result.error) throw result.error;
      const subscriptions = new Map((subs.data || []).map((row: any) => [row.user_id, row]));
      const financeMap = new Map((finance.data || []).map((row: any) => [row.user_id, row]));
      const aiCounts = new Map<string, number>();
      for (const row of ai.data || []) aiCounts.set(row.user_id, (aiCounts.get(row.user_id) || 0) + 1);
      const paymentsByUser = new Map<string, any>();
      for (const row of payments.data || []) if (!paymentsByUser.has(row.user_id)) paymentsByUser.set(row.user_id, row);
      const rows = users.map((account: any) => {
        const sub: any = subscriptions.get(account.id);
        const expiry = sub?.current_period_end ? new Date(sub.current_period_end) : null;
        const active = sub?.plan === "pro" && sub?.status === "active" && (!expiry || expiry.getTime() > Date.now());
        const profile: any = profileMap.get(account.id);
        return {
          id: account.id,
          email: account.email || "",
          name: String(profile?.full_name || account.user_metadata?.full_name || account.user_metadata?.name || "").trim(),
          createdAt: profile?.joined_at || account.created_at,
          lastSignInAt: account.last_sign_in_at || null,
          plan: active ? "pro" : "free",
          status: active ? "active" : (sub?.status || "free"),
          currentPeriodEnd: active ? sub?.current_period_end || null : null,
          provider: sub?.provider || null,
          financeUpdatedAt: (financeMap.get(account.id) as any)?.updated_at || null,
          aiThisMonth: aiCounts.get(account.id) || 0,
          lastPayment: paymentsByUser.get(account.id) || null,
        };
      }).sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return json({ users: rows, stats: { totalUsers: rows.length, proUsers: rows.filter((row: any) => row.plan === "pro").length, freeUsers: rows.filter((row: any) => row.plan === "free").length, aiRequestsThisMonth: Array.from(aiCounts.values()).reduce((sum, value) => sum + value, 0) } }, 200, origin);
    }

    const userId = String(payload.userId || "");
    if (!userId) return json({ error: "Choose a user." }, 400, origin);
    if (action === "grant_pro") {
      const { data, error } = await admin.rpc("pesapilot_founder_grant_pro", { p_user_id: userId, p_days: Math.max(1, Math.min(365, Number(payload.days) || 30)), p_reference: String(payload.reference || "").trim().slice(0, 160) || null, p_amount: Number(payload.amount) || 5, p_currency: String(payload.currency || "USD").toUpperCase().slice(0, 3), p_founder_id: founder.id, p_note: null });
      if (error) throw error;
      return json({ ok: true, currentPeriodEnd: data }, 200, origin);
    }
    if (action === "revoke_pro") {
      const { error } = await admin.rpc("pesapilot_founder_revoke_pro", { p_user_id: userId, p_founder_id: founder.id });
      if (error) throw error;
      return json({ ok: true }, 200, origin);
    }
    return json({ error: "Unknown founder action." }, 400, origin);
  } catch (error) {
    console.error("MoneyCove founder function error", error);
    return json({ error: error instanceof Error ? error.message : "Founder operation failed." }, 500, origin);
  }
});
