# MoneyCove v2.5.4 — Commercial Edition

MoneyCove is a modern personal expense tracker, budget planner and financial calendar built with React, TypeScript, Vite, Tailwind CSS and Supabase.

Production target: `https://moneycove.nileai.solutions`

Keep the tutorial/demo deployment on `pesapilot.titussimplifies.com` separate.

## Current commercial features

- Real email/password accounts with remembered sessions
- Immediate signup without a signup-verification step
- Per-account cloud transactions, budgets and preferences in Supabase
- Account data isolation across users
- Dashboard, Transactions, Budget, Reports, AI Adviser, Plan & Billing, Calendar and Settings
- Financial Calendar with month and year navigation
- Red activity dots on dates containing transactions
- Click a date to inspect, edit or delete that day's transactions
- Add a transaction directly to the selected calendar date
- Free and Pro plan model
- Free Monthly Expense PDF
- Pro Transaction Statement PDF
- Pro Budget Performance PDF
- Pro full 3-page Financial Report PDF
- Pro AI Adviser Summary PDF
- Pro AI Money Adviser with monthly usage limits
- Public landing, Features, Pricing, About, Contact, Privacy, Terms and five SEO blog articles
- PWA support
- Founder dashboard restricted to the configured founder account and protected again by the server

## Plans

### Free — $0

- Unlimited income and expense tracking
- Cloud account sync
- Dashboard and charts
- Monthly budget
- Financial calendar
- CSV export
- Monthly Expense PDF
- PWA and dark mode

### Pro — $5/month

Everything in Free, plus:

- AI Money Adviser
- 40 AI adviser requests/month
- Transaction Statement PDF
- Budget Performance PDF
- Full monthly Financial Report PDF
- AI Adviser Summary PDF
- Longer report trend history

The current Pro payment button opens the Flutterwave payment link configured in `VITE_PRO_PAYMENT_LINK`. After payment is confirmed, the founder grants 30 days of Pro from the private Founder page.

## Founder access

The commercial founder account is restricted to the configured founder email. The browser only shows Founder when the email is eligible and the secure Supabase founder function confirms the session. The function performs the same founder check server-side before listing users or changing plans.

## Local setup

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

The Nile Core public Supabase URL and publishable key have safe application fallbacks, but `.env.example` contains the recommended production variables.

## Backend

The live Nile Core database schema includes:

- `pesapilot_profiles`
- `pesapilot_finance_states`
- `pesapilot_subscriptions`
- `pesapilot_ai_usage`
- `pesapilot_manual_payments`

The source-of-truth schema is in `supabase/SETUP.sql`.

The deployed Supabase Edge Functions are represented in this project under:

- `supabase/functions/pesapilot-signup/`
- `supabase/functions/pesapilot-founder/`

## Production deployment

Create a separate Vercel project for the commercial build and connect `moneycove.nileai.solutions` to it. Do not repoint the Titus Simplifies tutorial deployment.

See `DEPLOYMENT-CHECKLIST.md` for the current launch steps.


## AI Adviser backend

MoneyCove v2.5.4 uses the Supabase Edge Function `moneycove-ai-adviser`. Add `OPENAI_API_KEY` as a Supabase Edge Function secret before launch. The browser never receives the API key.
