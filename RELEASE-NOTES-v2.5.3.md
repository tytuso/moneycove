# MoneyCove v2.5.3

Final iPhone keyboard and session-resilience patch.

- Prevents iPhone Safari/PWA automatic zoom when focusing description, AI, password, search, budget and other form controls by keeping mobile inputs at the native 16px focus size.
- Locks horizontal layout width so the app no longer remains magnified or appears to float after the iOS keyboard closes.
- Revalidates/refreshes Supabase sessions automatically when a PWA returns to the foreground, regains focus, comes back from the browser cache, or reconnects.
- Pro entitlement automatically refreshes after sign-in, token refresh, password/user updates and app resume.
- Founder access uses the same resume handling and retries once with a refreshed session after a 401.
- AI Adviser retries once after refreshing a stale session instead of immediately showing `Your session is invalid or expired.`
- Password reset refreshes the recovery session immediately after the password is changed.
