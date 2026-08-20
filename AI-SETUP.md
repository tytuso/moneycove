# MoneyCove AI Adviser — v2.5.4

MoneyCove AI now runs through the Supabase Edge Function:

`moneycove-ai-adviser`

The OpenAI key is never sent to the browser.

## Model

Default: `gpt-5.6-luna`

The model can be overridden with the Supabase secret `OPENAI_MODEL`.

## Access rules

- Free users: AI Adviser locked.
- Pro users: 40 successful AI requests per calendar month.
- Founder (`opiotitus333@gmail.com`): unlimited AI access.
- Pro status is verified server-side from `pesapilot_subscriptions`.
- Usage is logged in `pesapilot_ai_usage` with token counts where available.
- Failed OpenAI calls remove their temporary usage record so users are not charged a request for provider failures.

## Privacy / prompt safety

The browser sends only the user's question to the Edge Function. The Edge Function loads that user's cloud finance workspace from Supabase and builds the six-month summary server-side. The OpenAI request uses `store: false`.

Transaction descriptions are treated as untrusted data and the model is explicitly instructed not to follow any instructions embedded inside finance fields.

## Required secret before launch

Add this in Supabase Edge Function secrets:

`OPENAI_API_KEY=<your key>`

Optional:

`OPENAI_MODEL=gpt-5.6-luna`

Do not put the OpenAI secret in any `VITE_*` environment variable and do not commit it to GitHub.
