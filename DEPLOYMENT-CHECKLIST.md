# MoneyCove v2.5.1 Launch Checklist

Follow this only when moving the commercial build to production. Nile Core database tables and the MoneyCove signup/founder Edge Functions have already been created during development.

## 1. Local verification

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

Test:

- create account
- sign in / sign out
- add a transaction
- log into another account and confirm the first user's data is absent
- sign back into the first account and confirm its transaction returns
- calendar month navigation
- calendar year navigation
- red activity dot on a transaction date
- add a transaction from a selected calendar date
- Free Monthly Expense PDF
- Founder menu hidden from ordinary users

## 2. Vercel project

Create a NEW Vercel project for the commercial version.

Production domain:

`moneycove.nileai.solutions`

Do not replace `pesapilot.titussimplifies.com`.

## 3. Vercel environment variables

Add the values from `.env.example`.

Required public values:

```text
VITE_SUPABASE_URL=https://dpmajonvvhopjnupgfpq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<Nile Core publishable key>
VITE_PUBLIC_SITE_URL=https://moneycove.nileai.solutions
VITE_PRO_PAYMENT_LINK=https://flutterwave.com/pay/xfdll6gpvuzo
```

AI Adviser server variables:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

Optional Vercel server APIs/welcome-email helpers may also use:

```text
SUPABASE_SECRET_KEY=...
MONEYCOVE_FOUNDER_EMAILS=<founder email>
RESEND_API_KEY=...
MONEYCOVE_FROM_EMAIL=MoneyCove <hello@nileai.solutions>
```

Never put server secrets in variables beginning with `VITE_`.

## 4. Payment flow

MoneyCove Pro is currently $5/month.

The Pro button opens the configured Flutterwave payment link. After confirming the payment, open the private Founder page, enter the payment reference and click **Grant 30 days**.

No automatic payment webhook is required for the first launch.

## 5. Password reset

Before public launch, configure password-reset email delivery in Nile Core. Signup itself does not require an email verification step.

## 6. Final production smoke test

On `moneycove.nileai.solutions`, test:

1. signup
2. login persistence
3. cloud transaction persistence
4. calendar activity markers
5. Free PDF
6. Pro lock states
7. Flutterwave payment button
8. Founder page using only the founder account
9. mobile navigation / More menu
10. PWA installability
