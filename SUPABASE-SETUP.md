# MoneyCove v2.5.3 — Supabase Backend

MoneyCove uses the shared **Nile Core** Supabase project using the existing legacy `pesapilot_*` table names. Those internal names are intentionally retained so current accounts and finance data continue to work through the public MoneyCove rebrand.

The live development backend has already been configured. `supabase/SETUP.sql` is included as the source-of-truth schema for backup/reproduction.

## Tables

- `pesapilot_profiles` — MoneyCove account profile/last-seen records
- `pesapilot_finance_states` — each user's complete finance workspace JSON
- `pesapilot_subscriptions` — Free/Pro access state
- `pesapilot_ai_usage` — AI Adviser usage records
- `pesapilot_manual_payments` — founder-confirmed $5 payment references

## Security

Row Level Security is enabled. Normal authenticated users can only read/write their own MoneyCove finance/profile records and read their own plan. Manual payment records are not exposed to browser policies.

Founder Pro-grant/revoke functions are executable only by the server/service role. The Founder Edge Function separately verifies the authenticated user's email before it can list users or change a plan.

## Signup

MoneyCove signup uses the dedicated `pesapilot-signup` Supabase Edge Function. It creates the account as email-confirmed, initializes the Free plan/workspace, then the browser signs the user in with the password they just entered. This avoids changing the shared Nile Core email-confirmation behavior for other products.

## Founder

MoneyCove founder management uses the dedicated `pesapilot-founder` Edge Function. Ordinary accounts do not receive the Founder navigation item, and the backend rejects non-founder sessions even if somebody manually calls the endpoint.


## AI Adviser

The commercial AI endpoint is the `moneycove-ai-adviser` Edge Function. It requires a signed-in JWT, checks Pro access server-side, loads the user finance state from `pesapilot_finance_states`, and tracks usage in `pesapilot_ai_usage`. Add `OPENAI_API_KEY` as an Edge Function secret before launch.
