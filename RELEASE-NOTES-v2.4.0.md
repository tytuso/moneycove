# MoneyCove v2.4.0 — AI Adviser Backend

- Moved AI Adviser from a Vercel `/api` route to a Supabase Edge Function so it works consistently in local development and production.
- Browser sends only the question; finance context is loaded server-side from the signed-in user's cloud workspace.
- Free users remain locked out of AI Adviser.
- Pro users receive 40 successful AI Adviser requests per month.
- Founder account receives unlimited AI access.
- Added live AI allowance status in the Adviser page.
- Added six premium quick-question prompts.
- OpenAI Responses API uses `store: false`.
- Added prompt-injection resistance for transaction descriptions and other finance fields.
- AI usage records now capture provider token counts when available.
- Failed provider calls no longer consume an AI request.
- Rebranded downloaded CSV/PDF filenames from legacy PesaPilot names to MoneyCove.
- Default AI model remains `gpt-5-mini` for a strong cost/quality balance.
